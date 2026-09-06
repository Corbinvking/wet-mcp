#!/usr/bin/env node

/** Offline fixtures for rollout-evidence.mjs. No network, scheduler, or real clock is used. */
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  RolloutEvidenceError,
  dailyRecordFromVerifyLive,
  parseRolloutLedger,
  prepareAppend,
  validateRolloutRecords,
} from './rollout-evidence.mjs';

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    process.stdout.write(`  PASS  ${label}${detail ? ` — ${detail}` : ''}\n`);
  } else {
    failed += 1;
    process.stderr.write(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}\n`);
  }
}

function rejects(label, action, messagePart = '') {
  try {
    action();
    check(label, false, 'accepted invalid fixture');
  } catch (error) {
    check(
      label,
      error instanceof RolloutEvidenceError &&
        (messagePart.length === 0 || error.message.includes(messagePart)),
      error instanceof Error ? error.message : 'non-error rejection',
    );
  }
}

function digest(seed) {
  return createHash('sha256').update(seed, 'utf8').digest('hex');
}

function liveFixture({
  date,
  packageVersion = '0.5.0',
  deploymentSha = 'a'.repeat(40),
  aggregateStatus = 'healthy',
  aggregateOk = true,
  fresh = 2,
  stale = 0,
  empty = 0,
  unknown = 0,
  healthLaunchReady = true,
  launchReady = true,
  includeRawFields = false,
  omitExpectedDeploymentSha = false,
  targetEnvironment = 'canonical-production-origin',
}) {
  const runId = `fixture-${date}`;
  const startedAt = `${date}T12:00:00.000Z`;
  const completedAt = `${date}T12:01:00.000Z`;
  const sourceCount = fresh + stale + empty + unknown;
  const records = [
    {
      schema: 'wet.clean-client-proof/v1',
      type: 'run_start',
      runId,
      verificationMode: 'launch-readiness',
      targetEnvironment,
      packageVersion,
      candidateAllowance: false,
      startedAt,
      endpoint: 'https://raw-endpoint.example.invalid/mcp',
    },
    {
      schema: 'wet.clean-client-proof/v1',
      type: 'preflight_result',
      runId,
      stage: 'mcp-status-get',
      ok: true,
      serverVersionMatches: true,
      observedDeploymentCommitSha: deploymentSha,
      expectedDeploymentCommitSha: omitExpectedDeploymentSha ? null : deploymentSha,
      deploymentCommitMatches: true,
      responseSha256: digest(`status:${date}:${deploymentSha}`),
    },
    {
      schema: 'wet.clean-client-proof/v1',
      type: 'preflight_result',
      runId,
      stage: 'service-feed-health',
      ok: true,
      aggregateStatus,
      aggregateOk,
      checkedAtCurrent: true,
      sourceCount,
      sourceStateCounts: { fresh, stale, empty, unknown },
      configuredCountMatches: true,
      rightsApprovedCountCoversAdvertisedFeeds: true,
      healthLaunchReady,
      responseSha256: digest(`health:${date}:${aggregateStatus}:${fresh}:${stale}`),
    },
    ...(includeRawFields
      ? [
          {
            schema: 'wet.clean-client-proof/v1',
            type: 'tool_result',
            runId,
            tool: 'wet_search_events',
            prompt: 'RAW-PROMPT-MUST-NOT-PERSIST',
            result: { raw: 'RAW-RESULT-MUST-NOT-PERSIST' },
          },
        ]
      : []),
    {
      schema: 'wet.clean-client-proof/v1',
      type: 'run_summary',
      runId,
      ok: launchReady,
      verificationMode: 'launch-readiness',
      verificationPassed: launchReady,
      protocolConformant: true,
      preflightConformant: true,
      gate4LaunchReady: launchReady,
      healthLaunchReady,
      launchReady,
      completedAt,
      preflightFailures: [],
      protocolFailures: [],
      gate4LaunchBlockers: [],
      launchBlockers: [],
    },
  ];
  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
}

function datesFrom(startDate, count) {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10),
  );
}

process.stdout.write('\n== Seven-day rollout evidence fixtures ==\n\n');

const dates = datesFrom('2026-09-07', 8);
const sevenGreen = dates.slice(0, 7).map((date) => dailyRecordFromVerifyLive(liveFixture({ date })));
const greenStatus = validateRolloutRecords(sevenGreen, { requireComplete: true });
check('exactly seven consecutive launch-ready days complete the watch', greenStatus.complete && greenStatus.days === 7);

rejects(
  'six green days remain incomplete',
  () => validateRolloutRecords(sevenGreen.slice(0, 6), { requireComplete: true }),
  'exactly seven',
);
rejects(
  'an eighth day is rejected instead of widening an exact seven-day ledger',
  () => validateRolloutRecords([...sevenGreen, dailyRecordFromVerifyLive(liveFixture({ date: dates[7] }))]),
  'more than seven',
);

const gap = [sevenGreen[0], sevenGreen[1], sevenGreen[3]];
rejects('a nonconsecutive UTC-date gap is rejected', () => validateRolloutRecords(gap), 'consecutive');

const duplicate = [sevenGreen[0], sevenGreen[1], sevenGreen[1]];
rejects('a duplicate UTC date is rejected', () => validateRolloutRecords(duplicate), 'duplicate');

rejects(
  'stale feed evidence is rejected',
  () =>
    dailyRecordFromVerifyLive(
      liveFixture({ date: dates[0], fresh: 1, stale: 1, aggregateStatus: 'healthy', aggregateOk: true }),
    ),
  'stale',
);
rejects(
  'degraded aggregate health is rejected',
  () =>
    dailyRecordFromVerifyLive(
      liveFixture({ date: dates[0], aggregateStatus: 'degraded', aggregateOk: false, healthLaunchReady: false }),
    ),
  'degraded',
);
rejects(
  'a verify-live run without an expected deployment SHA is rejected',
  () => dailyRecordFromVerifyLive(liveFixture({ date: dates[0], omitExpectedDeploymentSha: true })),
  'matching deployment SHA',
);
rejects(
  'localhost evidence cannot count toward the production rollout watch',
  () => dailyRecordFromVerifyLive(liveFixture({ date: dates[0], targetEnvironment: 'localhost' })),
  'canonical production origin',
);
rejects(
  'preview or alternate-origin evidence cannot count toward the production rollout watch',
  () =>
    dailyRecordFromVerifyLive(
      liveFixture({ date: dates[0], targetEnvironment: 'preview-or-alternate-origin' }),
    ),
  'canonical production origin',
);

const changedSha = [
  sevenGreen[0],
  dailyRecordFromVerifyLive(liveFixture({ date: dates[1], deploymentSha: 'b'.repeat(40) })),
];
rejects('a deployment SHA change resets/rejects the watch', () => validateRolloutRecords(changedSha), 'SHA changed');

const changedVersion = [
  sevenGreen[0],
  dailyRecordFromVerifyLive(liveFixture({ date: dates[1], packageVersion: '0.5.1' })),
];
rejects('a package version change resets/rejects the watch', () => validateRolloutRecords(changedVersion), 'version changed');

const rawTopLevel = { ...sevenGreen[0], endpoint: 'https://must-not-persist.invalid/mcp' };
rejects('a raw endpoint field in the ledger is rejected', () => validateRolloutRecords([rawTopLevel]), 'forbidden');
const rawNested = {
  ...sevenGreen[0],
  evidenceHashes: { ...sevenGreen[0].evidenceHashes, result: { raw: true } },
};
rejects('a raw result field inside evidence hashes is rejected', () => validateRolloutRecords([rawNested]), 'forbidden');

const redacted = dailyRecordFromVerifyLive(
  liveFixture({ date: dates[0], includeRawFields: true }),
);
const redactedText = JSON.stringify(redacted);
check(
  'raw endpoint, prompt, and result values reduce only to fixed evidence hashes',
  !redactedText.includes('raw-endpoint') &&
    !redactedText.includes('RAW-PROMPT') &&
    !redactedText.includes('RAW-RESULT') &&
    Object.keys(redacted).sort().join(',') ===
      'deploymentSha,evidenceHashes,freshnessState,healthState,launchReady,packageVersion,utcDate',
);

let ledgerText = '';
for (const date of dates.slice(0, 7)) {
  const prepared = prepareAppend(liveFixture({ date, includeRawFields: true }), ledgerText);
  ledgerText += `${JSON.stringify(prepared.record)}\n`;
}
const parsedLedger = parseRolloutLedger(ledgerText);
check(
  'sequential record-mode reduction produces a seven-line redacted NDJSON ledger',
  parsedLedger.length === 7 && validateRolloutRecords(parsedLedger, { requireComplete: true }).complete,
);

const temporary = await mkdtemp(path.join(tmpdir(), 'wet-rollout-evidence-'));
try {
  const ledgerPath = path.join(temporary, 'rollout.ndjson');
  await writeFile(ledgerPath, ledgerText, 'utf8');
  const persisted = await readFile(ledgerPath, 'utf8');
  check(
    'persisted fixture ledger contains no raw endpoint, prompt, or result material',
    !persisted.includes('raw-endpoint') && !persisted.includes('RAW-PROMPT') && !persisted.includes('RAW-RESULT'),
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}

process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;
