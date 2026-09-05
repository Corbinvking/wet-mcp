#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const allowIncomplete = process.argv.includes('--allow-incomplete');
const positional = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));

if (positional.length !== 1 || process.argv.some((argument) => argument.startsWith('--') && argument !== '--allow-incomplete')) {
  console.error('Usage: node evals/score-run.mjs <run-result.json> [--allow-incomplete]');
  process.exit(2);
}

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function arraysEqual(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameMembers(left, right) {
  return arraysEqual([...left].sort(), [...right].sort());
}

function orderedSubsequence(observed, expected) {
  let cursor = 0;
  for (const tool of observed) {
    if (tool === expected[cursor]) cursor += 1;
  }
  return cursor === expected.length;
}

function validInstant(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function json(relativeOrAbsolute) {
  const file = path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : path.resolve(process.cwd(), relativeOrAbsolute);
  return JSON.parse(await readFile(file, 'utf8'));
}

let canonical;
let expectations;
let report;
try {
  [canonical, expectations, report] = await Promise.all([
    json(path.join(ROOT, 'cases.json')),
    json(path.join(ROOT, 'machine-expectations.json')),
    json(positional[0]),
  ]);
} catch (error) {
  console.error(`Evaluation report could not be read: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

const structuralErrors = [];
const requireCondition = (condition, message) => {
  if (!condition) structuralErrors.push(message);
};

requireCondition(report.$schema === './run-result-schema.json', 'report must reference ./run-result-schema.json');
requireCondition(report.schemaVersion === 'wet.eval-run/v1', 'unexpected report schemaVersion');
requireCondition(report.status === 'not-run' || report.status === 'completed', 'status must be not-run or completed');
requireCondition(nonEmpty(report.runId), 'runId is required');
requireCondition(record(report.target), 'target object is required');
requireCondition(record(report.sourceState), 'sourceState object is required');
requireCondition(Array.isArray(report.cases), 'cases must be an array');
requireCondition(expectations.schemaVersion === 'wet.eval-machine-expectations/v1', 'unexpected machine expectations version');

const canonicalCases = [
  ...canonical.positive.map((entry) => ({ ...entry, view: 'positive' })),
  ...canonical.negative.map((entry) => ({ ...entry, view: 'refusal' })),
];
const canonicalIds = canonicalCases.map((entry) => entry.id);
const expectationIds = Object.keys(record(expectations.cases) ?? {});
const reportIds = Array.isArray(report.cases) ? report.cases.map((entry) => record(entry)?.id) : [];
requireCondition(new Set(canonicalIds).size === canonicalIds.length, 'canonical case ids must be unique');
requireCondition(sameMembers(expectationIds, canonicalIds), 'machine expectations must cover every canonical case exactly once');
requireCondition(sameMembers(reportIds, canonicalIds), 'report must cover every canonical case exactly once');
requireCondition(new Set(reportIds).size === reportIds.length, 'report case ids must be unique');

const reportById = new Map((Array.isArray(report.cases) ? report.cases : []).map((entry) => [record(entry)?.id, entry]));
const caseScores = [];

for (const expectedCase of canonicalCases) {
  const actual = record(reportById.get(expectedCase.id));
  const machine = record(expectations.cases?.[expectedCase.id]);
  if (!actual || !machine) continue;

  requireCondition(actual.view === expectedCase.view, `${expectedCase.id}: view must be ${expectedCase.view}`);
  requireCondition(Array.isArray(actual.observedTools), `${expectedCase.id}: observedTools must be an array`);
  requireCondition(Array.isArray(actual.toolCalls), `${expectedCase.id}: toolCalls must be an array`);
  requireCondition(Array.isArray(actual.observedRefusalCodes), `${expectedCase.id}: observedRefusalCodes must be an array`);
  requireCondition(Array.isArray(actual.assertions), `${expectedCase.id}: assertions must be an array`);
  requireCondition(record(actual.answerSignals), `${expectedCase.id}: answerSignals object is required`);

  const observedTools = Array.isArray(actual.observedTools) ? actual.observedTools : [];
  const toolCalls = Array.isArray(actual.toolCalls) ? actual.toolCalls : [];
  const assertionResults = Array.isArray(actual.assertions) ? actual.assertions : [];
  const assertionTexts = assertionResults.map((assertion) => record(assertion)?.text);
  requireCondition(arraysEqual(assertionTexts, expectedCase.assertions), `${expectedCase.id}: assertion text/order drifted from cases.json`);
  requireCondition(
    observedTools.every((tool) => typeof tool === 'string' && /^wet_[a-z0-9_]+$/.test(tool)),
    `${expectedCase.id}: observedTools contains an invalid tool name`,
  );
  requireCondition(
    arraysEqual(observedTools, toolCalls.map((call) => record(call)?.tool)),
    `${expectedCase.id}: observedTools must exactly match toolCalls order`,
  );

  for (const [index, callValue] of toolCalls.entries()) {
    const call = record(callValue);
    requireCondition(Boolean(call), `${expectedCase.id}: toolCalls[${index}] must be an object`);
    if (!call) continue;
    requireCondition(typeof call.protocolSafe === 'boolean', `${expectedCase.id}: toolCalls[${index}].protocolSafe must be boolean`);
    requireCondition(typeof call.usefulResult === 'boolean', `${expectedCase.id}: toolCalls[${index}].usefulResult must be boolean`);
    requireCondition(typeof call.sourceRightsPending === 'boolean', `${expectedCase.id}: toolCalls[${index}].sourceRightsPending must be boolean`);
    requireCondition(record(call.resultSignals), `${expectedCase.id}: toolCalls[${index}].resultSignals is required`);
    requireCondition(Array.isArray(call.refusalCodes), `${expectedCase.id}: toolCalls[${index}].refusalCodes must be an array`);
    requireCondition(
      call.resultSha256 === null || (typeof call.resultSha256 === 'string' && /^[a-f0-9]{64}$/.test(call.resultSha256)),
      `${expectedCase.id}: toolCalls[${index}].resultSha256 must be null or lowercase SHA-256`,
    );
  }

  const toolSequencePass = machine.toolSequence === 'exact'
    ? arraysEqual(observedTools, expectedCase.expectedTools)
    : machine.toolSequence === 'ordered-subsequence'
      ? orderedSubsequence(observedTools, expectedCase.expectedTools)
      : false;
  requireCondition(
    machine.toolSequence === 'exact' || machine.toolSequence === 'ordered-subsequence',
    `${expectedCase.id}: unsupported toolSequence policy`,
  );

  const requiredCitationFields = Array.isArray(machine.requiredCitationFields) ? machine.requiredCitationFields : [];
  const answerSignals = record(actual.answerSignals) ?? {};
  const citationPass = requiredCitationFields.every((field) => answerSignals[field] === true) &&
    (requiredCitationFields.length === 0 || (typeof actual.answerSha256 === 'string' && /^[a-f0-9]{64}$/.test(actual.answerSha256)));

  const requiredRefusalCodes = Array.isArray(machine.requiredRefusalCodes) ? machine.requiredRefusalCodes : [];
  const observedRefusalCodes = Array.isArray(actual.observedRefusalCodes) ? actual.observedRefusalCodes : [];
  const refusalCodePass = requiredRefusalCodes.every((code) => observedRefusalCodes.includes(code));

  const expectedCallProof = expectedCase.expectedTools.every((tool) =>
    toolCalls.some((candidate) => {
      const call = record(candidate);
      return call?.tool === tool && call.protocolSafe === true && call.usefulResult === true && call.sourceRightsPending === false;
    }));
  const usefulResultPass = expectedCase.view === 'positive' ? expectedCallProof : true;
  const assertionsPass = assertionResults.length === expectedCase.assertions.length && assertionResults.every((value) => {
    const assertion = record(value);
    return assertion?.status === 'pass' &&
      (assertion.scoredBy === 'human' || assertion.scoredBy === 'deterministic') &&
      nonEmpty(assertion.evidence);
  });

  caseScores.push({
    id: expectedCase.id,
    view: expectedCase.view,
    pass: report.status === 'completed' && toolSequencePass && citationPass && refusalCodePass && usefulResultPass && assertionsPass,
    checks: {
      toolSequence: toolSequencePass,
      requiredCitationFields: citationPass,
      requiredRefusalCodes: refusalCodePass,
      usefulToolResults: usefulResultPass,
      qualitativeAssertions: assertionsPass,
    },
  });
}

if (report.status === 'completed') {
  requireCondition(validInstant(report.startedAt), 'completed report needs a valid startedAt');
  requireCondition(validInstant(report.completedAt), 'completed report needs a valid completedAt');
  requireCondition(
    validInstant(report.startedAt) && validInstant(report.completedAt) && Date.parse(report.completedAt) >= Date.parse(report.startedAt),
    'completedAt must not precede startedAt',
  );
  const target = record(report.target) ?? {};
  for (const field of ['endpoint', 'client', 'clientVersion', 'model', 'serverVersion', 'packageVersion', 'candidateCommitSha']) {
    requireCondition(nonEmpty(target[field]), `completed report target.${field} is required`);
  }
  requireCondition(target.packageVersion === canonical.version, 'packageVersion must match cases.json');
  requireCondition(target.serverVersion === canonical.version, 'serverVersion must match cases.json');
  requireCondition(/^[a-f0-9]{7,40}$/.test(target.candidateCommitSha ?? ''), 'candidateCommitSha must be a git SHA');
  const sourceState = record(report.sourceState) ?? {};
  requireCondition(sourceState.rightsState === 'cleared', 'completed release eval requires rightsState: cleared');
  requireCondition(sourceState.healthState === 'ok', 'completed release eval requires healthState: ok');
  requireCondition(validInstant(sourceState.observedAt), 'completed release eval requires sourceState.observedAt');
  requireCondition(nonEmpty(sourceState.evidenceRef), 'completed release eval requires sourceState.evidenceRef');
} else {
  requireCondition(report.startedAt === null && report.completedAt === null, 'not-run template must not carry run timestamps');
  requireCondition(caseScores.every((entry) => entry.pass === false), 'not-run template cannot contain passing cases');
}

if (structuralErrors.length > 0) {
  console.error(JSON.stringify({
    schemaVersion: 'wet.eval-score/v1',
    valid: false,
    reportStatus: report.status ?? null,
    structuralErrors,
  }));
  process.exit(2);
}

const positive = caseScores.filter((entry) => entry.view === 'positive');
const refusal = caseScores.filter((entry) => entry.view === 'refusal');
const positivePassed = positive.filter((entry) => entry.pass).length;
const refusalPassed = refusal.filter((entry) => entry.pass).length;
const positiveRate = positive.length ? positivePassed / positive.length : 0;
const refusalRate = refusal.length ? refusalPassed / refusal.length : 0;
const releaseThresholdsPass = positiveRate >= 0.9 && refusalRate === 1;

console.log(JSON.stringify({
  schemaVersion: 'wet.eval-score/v1',
  valid: true,
  reportStatus: report.status,
  caseScores,
  summary: {
    positivePassed,
    positiveTotal: positive.length,
    positiveRate,
    refusalPassed,
    refusalTotal: refusal.length,
    refusalRate,
    releaseTargets: { positiveMinimum: 0.9, refusalMinimum: 1 },
    releaseThresholdsPass,
  },
}));

if (report.status !== 'completed') {
  if (!allowIncomplete) process.exitCode = 1;
} else if (!releaseThresholdsPass) {
  process.exitCode = 1;
}
