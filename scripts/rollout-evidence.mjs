#!/usr/bin/env node

/**
 * Reduce one operator-supplied verify-live NDJSON run to one redacted rollout day.
 *
 * This program never calls the network, schedules work, sleeps, or infers that time passed. The
 * operator runs verify-live separately, once on each observed UTC day, and supplies that artifact.
 * Only a fixed daily record is appended: no endpoint, request, prompt, tool result, or response body
 * is copied into the rollout ledger.
 */
import { createHash } from 'node:crypto';
import { appendFile, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const VERIFY_LIVE_SCHEMA = 'wet.clean-client-proof/v1';
const REQUIRED_DAYS = 7;
const MAX_VERIFY_LIVE_BYTES = 32 * 1024 * 1024;
const MAX_LEDGER_BYTES = 128 * 1024;
const SHA256 = /^[a-f0-9]{64}$/u;
const DEPLOYMENT_SHA = /^[a-f0-9]{40,64}$/u;
const PACKAGE_VERSION = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/u;
const UTC_DATE = /^\d{4}-\d{2}-\d{2}$/u;

const DAILY_KEYS = [
  'utcDate',
  'packageVersion',
  'deploymentSha',
  'evidenceHashes',
  'launchReady',
  'healthState',
  'freshnessState',
];
const EVIDENCE_HASH_KEYS = [
  'verifyLiveNdjsonSha256',
  'runSummarySha256',
  'statusResponseSha256',
  'healthResponseSha256',
];

export class RolloutEvidenceError extends Error {}

function fail(message) {
  throw new RolloutEvidenceError(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, expected, context) {
  if (!isRecord(value)) fail(`${context} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  const missing = wanted.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !wanted.includes(key));
  if (missing.length > 0) fail(`${context} is missing required field names: ${missing.join(', ')}`);
  if (extra.length > 0) fail(`${context} contains forbidden field names: ${extra.join(', ')}`);
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalJson(value[key])]),
  );
}

function canonicalSha256(value) {
  return sha256(JSON.stringify(canonicalJson(value)));
}

function parseJsonLines(text, context) {
  if (typeof text !== 'string' || text.trim().length === 0) fail(`${context} is empty`);
  const records = [];
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    if (line.trim().length === 0) continue;
    let value;
    try {
      value = JSON.parse(line);
    } catch {
      fail(`${context} line ${index + 1} is not valid JSON`);
    }
    if (!isRecord(value)) fail(`${context} line ${index + 1} must be a JSON object`);
    records.push(value);
  }
  if (records.length === 0) fail(`${context} has no JSON records`);
  return records;
}

function exactlyOne(records, predicate, label) {
  const matches = records.filter(predicate);
  if (matches.length !== 1) fail(`verify-live evidence must contain exactly one ${label} record`);
  return matches[0];
}

function emptyArray(value) {
  return Array.isArray(value) && value.length === 0;
}

function validUtcDate(value) {
  if (typeof value !== 'string' || !UTC_DATE.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

function utcDayNumber(value) {
  return Date.parse(`${value}T00:00:00.000Z`) / 86_400_000;
}

function requireSha256(value, label) {
  if (typeof value !== 'string' || !SHA256.test(value)) fail(`${label} must be a lowercase SHA-256 digest`);
  return value;
}

/** Build one fixed, redacted daily record from a single verify-live run. */
export function dailyRecordFromVerifyLive(text) {
  const records = parseJsonLines(text, 'verify-live NDJSON');
  for (const [index, record] of records.entries()) {
    if (record.schema !== VERIFY_LIVE_SCHEMA) {
      fail(`verify-live NDJSON line ${index + 1} has an unexpected schema`);
    }
    if (typeof record.type !== 'string' || typeof record.runId !== 'string' || record.runId.length === 0) {
      fail(`verify-live NDJSON line ${index + 1} lacks a type or run id`);
    }
  }

  const runIds = new Set(records.map((record) => record.runId));
  if (runIds.size !== 1) fail('verify-live evidence contains more than one run id');

  const start = exactlyOne(records, (record) => record.type === 'run_start', 'run_start');
  const summary = exactlyOne(records, (record) => record.type === 'run_summary', 'run_summary');
  const status = exactlyOne(
    records,
    (record) => record.type === 'preflight_result' && record.stage === 'mcp-status-get',
    'mcp-status-get preflight',
  );
  const health = exactlyOne(
    records,
    (record) => record.type === 'preflight_result' && record.stage === 'service-feed-health',
    'service-feed-health preflight',
  );

  if (
    start.targetEnvironment !== 'canonical-production-origin' ||
    start.verificationMode !== 'launch-readiness' ||
    start.candidateAllowance !== false ||
    summary.verificationMode !== 'launch-readiness'
  ) {
    fail('only default launch-readiness evidence from the canonical production origin can count toward the rollout watch');
  }
  if (typeof start.packageVersion !== 'string' || !PACKAGE_VERSION.test(start.packageVersion)) {
    fail('verify-live evidence has an invalid package version');
  }

  const observedSha =
    typeof status.observedDeploymentCommitSha === 'string'
      ? status.observedDeploymentCommitSha.toLowerCase()
      : '';
  const expectedSha =
    typeof status.expectedDeploymentCommitSha === 'string'
      ? status.expectedDeploymentCommitSha.toLowerCase()
      : '';
  if (
    !DEPLOYMENT_SHA.test(observedSha) ||
    !DEPLOYMENT_SHA.test(expectedSha) ||
    observedSha !== expectedSha ||
    status.deploymentCommitMatches !== true ||
    status.serverVersionMatches !== true ||
    status.ok !== true
  ) {
    fail('verify-live evidence is not bound to one matching deployment SHA and package version');
  }

  if (!isRecord(health.sourceStateCounts)) fail('health evidence lacks source freshness counts');
  const counts = health.sourceStateCounts;
  const sourceCount = health.sourceCount;
  const countsAreIntegers = ['fresh', 'stale', 'empty', 'unknown'].every(
    (state) => Number.isSafeInteger(counts[state]) && counts[state] >= 0,
  );
  if (!Number.isSafeInteger(sourceCount) || sourceCount <= 0 || !countsAreIntegers) {
    fail('health evidence has invalid source freshness counts');
  }
  if (
    health.ok !== true ||
    health.aggregateStatus !== 'healthy' ||
    health.aggregateOk !== true ||
    health.checkedAtCurrent !== true ||
    health.healthLaunchReady !== true ||
    health.configuredCountMatches !== true ||
    health.rightsApprovedCountCoversAdvertisedFeeds !== true
  ) {
    fail('degraded or unready health evidence cannot count toward the rollout watch');
  }
  if (
    counts.fresh !== sourceCount ||
    counts.stale !== 0 ||
    counts.empty !== 0 ||
    counts.unknown !== 0
  ) {
    fail('stale, empty, or unknown feed evidence cannot count toward the rollout watch');
  }

  if (
    summary.ok !== true ||
    summary.verificationPassed !== true ||
    summary.protocolConformant !== true ||
    summary.preflightConformant !== true ||
    summary.gate4LaunchReady !== true ||
    summary.healthLaunchReady !== true ||
    summary.launchReady !== true ||
    !emptyArray(summary.preflightFailures) ||
    !emptyArray(summary.protocolFailures) ||
    !emptyArray(summary.gate4LaunchBlockers) ||
    !emptyArray(summary.launchBlockers)
  ) {
    fail('verify-live run is not fully launch ready and blocker-free');
  }

  const completedAt =
    typeof summary.completedAt === 'string' ? Date.parse(summary.completedAt) : Number.NaN;
  if (!Number.isFinite(completedAt)) fail('verify-live summary has no valid completion instant');
  const utcDate = new Date(completedAt).toISOString().slice(0, 10);

  const record = {
    utcDate,
    packageVersion: start.packageVersion,
    deploymentSha: observedSha,
    evidenceHashes: {
      verifyLiveNdjsonSha256: sha256(text),
      runSummarySha256: canonicalSha256(summary),
      statusResponseSha256: requireSha256(status.responseSha256, 'status response evidence'),
      healthResponseSha256: requireSha256(health.responseSha256, 'health response evidence'),
    },
    launchReady: true,
    healthState: 'healthy',
    freshnessState: 'fresh',
  };
  validateDailyRecord(record, 'derived daily record');
  return record;
}

/** Validate the exact persisted shape. Extra fields are rejected, including raw evidence fields. */
export function validateDailyRecord(record, context = 'daily record') {
  exactKeys(record, DAILY_KEYS, context);
  if (!validUtcDate(record.utcDate)) fail(`${context} has an invalid UTC date`);
  if (typeof record.packageVersion !== 'string' || !PACKAGE_VERSION.test(record.packageVersion)) {
    fail(`${context} has an invalid package version`);
  }
  if (typeof record.deploymentSha !== 'string' || !DEPLOYMENT_SHA.test(record.deploymentSha)) {
    fail(`${context} has an invalid deployment SHA`);
  }
  exactKeys(record.evidenceHashes, EVIDENCE_HASH_KEYS, `${context}.evidenceHashes`);
  for (const key of EVIDENCE_HASH_KEYS) requireSha256(record.evidenceHashes[key], `${context}.${key}`);
  if (record.launchReady !== true) fail(`${context} is not launch ready`);
  if (record.healthState !== 'healthy') fail(`${context} health is degraded`);
  if (record.freshnessState !== 'fresh') fail(`${context} freshness is not green`);
  return record;
}

export function parseRolloutLedger(text) {
  if (typeof text !== 'string' || text.trim().length === 0) return [];
  return parseJsonLines(text, 'rollout ledger').map((record, index) =>
    validateDailyRecord(record, `rollout ledger line ${index + 1}`),
  );
}

/** Validate ordering, stable release identity, green state, and optional seven-day completion. */
export function validateRolloutRecords(records, { requireComplete = false } = {}) {
  if (!Array.isArray(records)) fail('rollout records must be an array');
  if (records.length > REQUIRED_DAYS) fail('rollout ledger cannot contain more than seven daily records');
  records.forEach((record, index) => validateDailyRecord(record, `rollout record ${index + 1}`));

  const dates = records.map((record) => record.utcDate);
  if (new Set(dates).size !== dates.length) fail('rollout ledger contains a duplicate UTC date');
  for (let index = 1; index < records.length; index += 1) {
    if (utcDayNumber(records[index].utcDate) - utcDayNumber(records[index - 1].utcDate) !== 1) {
      fail('rollout ledger dates must be consecutive UTC days in append order');
    }
    if (records[index].deploymentSha !== records[0].deploymentSha) {
      fail('deployment SHA changed during the seven-day rollout watch');
    }
    if (records[index].packageVersion !== records[0].packageVersion) {
      fail('package version changed during the seven-day rollout watch');
    }
  }
  if (requireComplete && records.length !== REQUIRED_DAYS) {
    fail('rollout is incomplete: exactly seven consecutive green daily records are required');
  }
  return { complete: records.length === REQUIRED_DAYS, days: records.length };
}

/** Pure record-mode reducer used by the CLI and fixtures. */
export function prepareAppend(verifyLiveText, ledgerText = '') {
  const existing = parseRolloutLedger(ledgerText);
  validateRolloutRecords(existing);
  if (existing.length === REQUIRED_DAYS) fail('rollout ledger is already complete');
  const record = dailyRecordFromVerifyLive(verifyLiveText);
  const records = [...existing, record];
  const status = validateRolloutRecords(records);
  return { record, records, ...status };
}

function usage() {
  return `Usage:
  node scripts/rollout-evidence.mjs record --input VERIFY_LIVE.ndjson --ledger ROLLOUT.ndjson
  node scripts/rollout-evidence.mjs verify --ledger ROLLOUT.ndjson

record reduces exactly one operator-supplied launch-ready verify-live run and appends one redacted
UTC daily record. verify exits successfully only for exactly seven consecutive green days on one
unchanged package version and deployment SHA. Neither mode performs network access or waits.`;
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;
  if (mode === '--help' || mode === '-h') return { help: true };
  if (mode !== 'record' && mode !== 'verify') fail('mode must be record or verify');
  const values = new Map();
  for (let index = 0; index < rest.length; index += 1) {
    const name = rest[index];
    if (name !== '--input' && name !== '--ledger') fail('unknown command-line option');
    if (values.has(name)) fail('duplicate command-line option');
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) fail('command-line option is missing its path');
    values.set(name, value);
    index += 1;
  }
  if (!values.has('--ledger')) fail('--ledger is required');
  if (mode === 'record' && !values.has('--input')) fail('--input is required in record mode');
  if (mode === 'verify' && values.has('--input')) fail('--input is only valid in record mode');
  return { mode, input: values.get('--input') ?? null, ledger: values.get('--ledger') };
}

async function readBounded(filePath, maximumBytes, { missingAsEmpty = false } = {}) {
  let details;
  try {
    details = await stat(filePath);
  } catch (error) {
    if (missingAsEmpty && error && typeof error === 'object' && error.code === 'ENOENT') return '';
    fail('an evidence file could not be opened');
  }
  if (!details.isFile()) fail('an evidence path is not a regular file');
  if (details.size > maximumBytes) fail('an evidence file exceeds its bounded size');
  return readFile(filePath, 'utf8');
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const ledgerPath = path.resolve(options.ledger);
  if (options.mode === 'verify') {
    const ledgerText = await readBounded(ledgerPath, MAX_LEDGER_BYTES);
    const records = parseRolloutLedger(ledgerText);
    validateRolloutRecords(records, { requireComplete: true });
    for (const record of records) process.stdout.write(`${JSON.stringify(record)}\n`);
    process.stderr.write('rollout evidence complete: 7/7 consecutive green UTC days\n');
    return;
  }

  const inputPath = path.resolve(options.input);
  if (inputPath === ledgerPath) fail('verify-live input and rollout ledger must be different files');
  const [verifyLiveText, ledgerText] = await Promise.all([
    readBounded(inputPath, MAX_VERIFY_LIVE_BYTES),
    readBounded(ledgerPath, MAX_LEDGER_BYTES, { missingAsEmpty: true }),
  ]);
  const prepared = prepareAppend(verifyLiveText, ledgerText);
  const separator = ledgerText.length > 0 && !ledgerText.endsWith('\n') ? '\n' : '';
  await appendFile(ledgerPath, `${separator}${JSON.stringify(prepared.record)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(prepared.record)}\n`);
  process.stderr.write(
    prepared.complete
      ? 'rollout evidence complete: 7/7 consecutive green UTC days\n'
      : `rollout evidence recorded: ${prepared.days}/7 consecutive green UTC days; watch incomplete\n`,
  );
}

const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((error) => {
    const message = error instanceof RolloutEvidenceError ? error.message : 'unexpected offline verifier failure';
    process.stderr.write(`rollout evidence rejected: ${message}\n`);
    process.exitCode = 1;
  });
}
