#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(PACKAGE_ROOT, 'server.json'), 'utf8'));
const DEFAULT_ENDPOINT = manifest.remotes?.[0]?.url;
const PACKAGE_VERSION = manifest.version;
const PROTOCOL_VERSION = '2025-06-18';
const RESULT_SCHEMA = 'wet.clean-client-proof/v1';
const PUBLIC_TOOLS = [
  'wet_benchmark_value',
  'wet_cross_venue',
  'wet_event_headlines',
  'wet_event_markets',
  'wet_resolve',
  'wet_screen_markets',
  'wet_search_events',
].sort();

function usage() {
  return `Usage: node scripts/verify-live.mjs [--endpoint URL] [--timeout-ms N]

Runs a clean, anonymous MCP client against all seven public W.E.T. tools.
The default endpoint comes from server.json. WET_MCP_ENDPOINT and
WET_MCP_TIMEOUT_MS are supported as environment overrides.

Output is newline-delimited JSON (NDJSON). It includes observed timing,
transport status, bounded semantic summaries, and SHA-256 result digests;
it does not invent or snapshot market values. Typed W.E.T. refusals count as
successful tool results. Exit 1 means a transport, contract, version, or tool
failure; exit 2 means invalid command-line configuration.`;
}

function parseArguments(argv) {
  const parsed = {
    endpoint: process.env.WET_MCP_ENDPOINT || DEFAULT_ENDPOINT,
    timeoutMs: Number(process.env.WET_MCP_TIMEOUT_MS || 30_000),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--endpoint') {
      parsed.endpoint = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--endpoint=')) {
      parsed.endpoint = arg.slice('--endpoint='.length);
      continue;
    }
    if (arg === '--timeout-ms') {
      parsed.timeoutMs = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith('--timeout-ms=')) {
      parsed.timeoutMs = Number(arg.slice('--timeout-ms='.length));
      continue;
    }
    throw new Error(`unknown option ${arg}`);
  }
  return parsed;
}

let options;
try {
  options = parseArguments(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(usage());
  process.exit(2);
}

if (options.help) {
  console.log(usage());
  process.exit(0);
}

if (typeof options.endpoint !== 'string' || options.endpoint.length === 0) {
  console.error('No endpoint was provided and server.json contains no remote URL.');
  process.exit(2);
}

let endpointUrl;
try {
  endpointUrl = new URL(options.endpoint);
} catch {
  console.error(`Invalid endpoint URL: ${options.endpoint}`);
  process.exit(2);
}

const localHttp = endpointUrl.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(endpointUrl.hostname);
if (endpointUrl.protocol !== 'https:' && !localHttp) {
  console.error('The endpoint must use HTTPS, except for an explicit localhost development endpoint.');
  process.exit(2);
}
if (endpointUrl.username || endpointUrl.password || endpointUrl.search || endpointUrl.hash) {
  console.error('The endpoint must not contain credentials, query parameters, or a URL fragment.');
  process.exit(2);
}
if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1_000 || options.timeoutMs > 120_000) {
  console.error('--timeout-ms must be an integer from 1000 through 120000.');
  process.exit(2);
}

const endpoint = endpointUrl.toString();
const runId = randomUUID();
const runStartedAt = new Date().toISOString();
const runStarted = performance.now();
let requestNumber = 0;
let negotiatedProtocol = PROTOCOL_VERSION;
const failures = [];
const toolOutcomes = [];

function emit(type, fields = {}) {
  process.stdout.write(`${JSON.stringify({ schema: RESULT_SCHEMA, type, runId, ...fields })}\n`);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function sameMembers(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function collectRefusalCodes(value, codes = new Set(), seen = new Set(), depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object' || seen.has(value)) return codes;
  seen.add(value);
  if (isRecord(value.refusal) && typeof value.refusal.code === 'string') codes.add(value.refusal.code);
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    collectRefusalCodes(child, codes, seen, depth + 1);
  }
  return codes;
}

function semanticSummary(result) {
  const structured = isRecord(result?.structuredContent) ? result.structuredContent : null;
  const counts = {};
  const countKeys = [
    'benchmarks',
    'confirmedGroupsMatching',
    'marketCount',
    'matched',
    'matchedAttachments',
    'pricedCount',
    'returned',
    'scanned',
    'settledSkipped',
  ];
  if (structured) {
    for (const key of countKeys) {
      const value = structured[key];
      if (typeof value === 'number' && Number.isFinite(value)) counts[key] = value;
      if (key === 'benchmarks' && Array.isArray(value)) counts.benchmarks = value.length;
    }
  }
  const refusalCodes = structured ? [...collectRefusalCodes(structured)].sort() : [];
  return {
    hasStructuredContent: structured !== null,
    isError: result?.isError === true,
    contentTypes: Array.isArray(result?.content)
      ? [...new Set(result.content.map((entry) => entry?.type).filter((value) => typeof value === 'string'))].sort()
      : [],
    topLevelKeys: structured ? Object.keys(structured).sort() : [],
    ...(structured && typeof structured.refused === 'boolean' ? { refused: structured.refused } : {}),
    ...(structured && typeof structured.source === 'string' ? { source: structured.source } : {}),
    ...(structured && typeof structured.status === 'string' ? { status: structured.status } : {}),
    ...(structured && typeof structured.policy === 'string' ? { policy: structured.policy } : {}),
    ...(Object.keys(counts).length > 0 ? { counts } : {}),
    ...(refusalCodes.length > 0 ? { refusalCodes } : {}),
  };
}

async function rpc(method, params, { protocolHeader = true } = {}) {
  requestNumber += 1;
  const id = `clean-proof-${requestNumber}`;
  const requestStartedAt = new Date().toISOString();
  const started = performance.now();
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
        ...(protocolHeader ? { 'mcp-protocol-version': negotiatedProtocol } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    return {
      id,
      requestStartedAt,
      completedAt: new Date().toISOString(),
      durationMs: roundMs(performance.now() - started),
      transportError: error instanceof Error ? error.message : String(error),
    };
  }

  const text = await response.text();
  let payload = null;
  let parseError = null;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  return {
    id,
    requestStartedAt,
    completedAt: new Date().toISOString(),
    durationMs: roundMs(performance.now() - started),
    httpStatus: response.status,
    responseBytes: Buffer.byteLength(text),
    contentType: response.headers.get('content-type'),
    responseProtocolVersion: response.headers.get('mcp-protocol-version'),
    payload,
    parseError,
  };
}

function rpcSucceeded(call) {
  return (
    !call.transportError &&
    !call.parseError &&
    typeof call.httpStatus === 'number' &&
    call.httpStatus >= 200 &&
    call.httpStatus < 300 &&
    isRecord(call.payload) &&
    !call.payload.error &&
    isRecord(call.payload.result)
  );
}

function callFailure(call) {
  if (call.transportError) return call.transportError;
  if (call.parseError) return `response was not JSON: ${call.parseError}`;
  if (typeof call.httpStatus === 'number' && (call.httpStatus < 200 || call.httpStatus >= 300)) {
    return `HTTP ${call.httpStatus}`;
  }
  if (isRecord(call.payload?.error)) return `JSON-RPC ${call.payload.error.code}: ${call.payload.error.message}`;
  if (!isRecord(call.payload?.result)) return 'JSON-RPC result is missing';
  return 'unknown failure';
}

function publicEvent(structured) {
  if (!isRecord(structured) || !Array.isArray(structured.events)) return null;
  return (
    structured.events.find(
      (event) =>
        isRecord(event) &&
        typeof event.id === 'string' &&
        typeof event.title === 'string' &&
        !event.id.startsWith('forecastex--'),
    ) ?? null
  );
}

function eventVenue(eventId) {
  const prefix = eventId.split('--', 1)[0];
  return { kx: 'kalshi', pm: 'polymarket', gm: 'gemini' }[prefix] ?? prefix;
}

async function invokeTool(name, toolArguments, argumentSource) {
  const call = await rpc('tools/call', { name, arguments: toolArguments });
  const result = isRecord(call.payload?.result) ? call.payload.result : null;
  const summary = result ? semanticSummary(result) : null;
  const ok = rpcSucceeded(call) && result?.isError !== true && summary?.hasStructuredContent === true;
  if (!ok) failures.push(`${name}: ${rpcSucceeded(call) ? 'tool returned isError or no structuredContent' : callFailure(call)}`);
  const outcome = {
    tool: name,
    ok,
    argumentSource,
    requestStartedAt: call.requestStartedAt,
    completedAt: call.completedAt,
    durationMs: call.durationMs,
    ...(typeof call.httpStatus === 'number' ? { httpStatus: call.httpStatus } : {}),
    ...(typeof call.responseBytes === 'number' ? { responseBytes: call.responseBytes } : {}),
    ...(result ? { resultSha256: digest(result), result: summary } : {}),
    ...(!ok ? { error: rpcSucceeded(call) ? 'tool returned isError or no structuredContent' : callFailure(call) } : {}),
  };
  toolOutcomes.push(outcome);
  emit('tool_result', outcome);
  return result?.structuredContent;
}

emit('run_start', {
  endpoint,
  packageVersion: PACKAGE_VERSION,
  protocolVersionRequested: PROTOCOL_VERSION,
  timeoutMs: options.timeoutMs,
  startedAt: runStartedAt,
  access: 'anonymous-no-credentials',
  outputPolicy: 'observed summaries and result digests; no market values copied into proof output',
});

const initialized = await rpc(
  'initialize',
  {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'wet-clean-client-proof', version: PACKAGE_VERSION },
  },
  { protocolHeader: false },
);

if (!rpcSucceeded(initialized)) {
  failures.push(`initialize: ${callFailure(initialized)}`);
  emit('protocol_result', {
    stage: 'initialize',
    ok: false,
    durationMs: initialized.durationMs,
    ...(typeof initialized.httpStatus === 'number' ? { httpStatus: initialized.httpStatus } : {}),
    error: callFailure(initialized),
  });
  emit('run_summary', {
    ok: false,
    completedAt: new Date().toISOString(),
    durationMs: roundMs(performance.now() - runStarted),
    toolsAttempted: 0,
    toolsSucceeded: 0,
    failures,
  });
  process.exit(1);
}

const initializeResult = initialized.payload.result;
if (typeof initializeResult.protocolVersion === 'string') negotiatedProtocol = initializeResult.protocolVersion;
const initializeVersionMatches = initializeResult.serverInfo?.version === PACKAGE_VERSION;
if (!initializeVersionMatches) {
  failures.push(`server version ${initializeResult.serverInfo?.version ?? 'missing'} does not match package ${PACKAGE_VERSION}`);
}
emit('protocol_result', {
  stage: 'initialize',
  ok: initializeVersionMatches && negotiatedProtocol === PROTOCOL_VERSION,
  requestStartedAt: initialized.requestStartedAt,
  completedAt: initialized.completedAt,
  durationMs: initialized.durationMs,
  httpStatus: initialized.httpStatus,
  serverName: initializeResult.serverInfo?.name ?? null,
  serverVersion: initializeResult.serverInfo?.version ?? null,
  negotiatedProtocolVersion: negotiatedProtocol,
});

if (negotiatedProtocol !== PROTOCOL_VERSION) {
  failures.push(`negotiated protocol ${negotiatedProtocol} does not match requested ${PROTOCOL_VERSION}`);
}

const listed = await rpc('tools/list', {});
let listedTools = [];
let listOk = false;
if (rpcSucceeded(listed) && Array.isArray(listed.payload.result.tools)) {
  listedTools = listed.payload.result.tools;
  const listedNames = listedTools.map((tool) => tool?.name).filter((name) => typeof name === 'string');
  const annotationsSafe = listedTools.every(
    (tool) => tool?.annotations?.readOnlyHint === true && tool?.annotations?.destructiveHint === false,
  );
  listOk = sameMembers(listedNames, PUBLIC_TOOLS) && annotationsSafe;
  if (!sameMembers(listedNames, PUBLIC_TOOLS)) failures.push(`anonymous tools/list mismatch: ${listedNames.sort().join(', ')}`);
  if (!annotationsSafe) failures.push('one or more anonymous tools lacks readOnlyHint:true or destructiveHint:false');
  emit('protocol_result', {
    stage: 'tools/list',
    ok: listOk,
    requestStartedAt: listed.requestStartedAt,
    completedAt: listed.completedAt,
    durationMs: listed.durationMs,
    httpStatus: listed.httpStatus,
    anonymousToolCount: listedNames.length,
    anonymousTools: listedNames.sort(),
    annotationsSafe,
  });
} else {
  failures.push(`tools/list: ${callFailure(listed)}`);
  emit('protocol_result', {
    stage: 'tools/list',
    ok: false,
    durationMs: listed.durationMs,
    ...(typeof listed.httpStatus === 'number' ? { httpStatus: listed.httpStatus } : {}),
    error: callFailure(listed),
  });
}

await invokeTool('wet_benchmark_value', {}, 'package-defined bounded listing call');
const search = await invokeTool('wet_search_events', { limit: 10 }, 'package-defined bounded discovery call');
const selectedEvent = publicEvent(search);
await invokeTool('wet_screen_markets', { limit: 1 }, 'package-defined bounded corpus call');
await invokeTool(
  'wet_event_markets',
  selectedEvent ? { eventId: selectedEvent.id } : {},
  selectedEvent ? 'event id observed in this run from wet_search_events' : 'empty fallback because search returned no supported event id',
);
await invokeTool('wet_cross_venue', { limit: 1 }, 'package-defined bounded confirmed-identity call');
await invokeTool(
  'wet_event_headlines',
  selectedEvent ? { eventId: selectedEvent.id, limit: 1 } : { limit: 1 },
  selectedEvent ? 'event id observed in this run from wet_search_events' : 'package-defined bounded headline call',
);

const resolverListing = selectedEvent
  ? {
      marketRef: `${eventVenue(selectedEvent.id)}:validator-observed:${selectedEvent.id}`,
      venue: eventVenue(selectedEvent.id),
      title: selectedEvent.title,
    }
  : {
      marketRef: 'kalshi:validator-fixture-no-temporal',
      venue: 'kalshi',
      title: 'Will the clearly-labelled validation fixture resolve yes?',
    };
await invokeTool(
  'wet_resolve',
  { listings: [resolverListing] },
  selectedEvent
    ? 'title observed in this run; close time deliberately omitted to exercise refusal semantics'
    : 'clearly labelled synthetic fixture with no asserted market value or settlement time',
);

const attemptedNames = toolOutcomes.map((outcome) => outcome.tool);
if (!sameMembers(attemptedNames, PUBLIC_TOOLS)) failures.push('the run did not attempt each public tool exactly once');
const succeeded = toolOutcomes.filter((outcome) => outcome.ok).length;
emit('run_summary', {
  ok: failures.length === 0 && listOk && succeeded === PUBLIC_TOOLS.length,
  completedAt: new Date().toISOString(),
  durationMs: roundMs(performance.now() - runStarted),
  toolsAttempted: toolOutcomes.length,
  toolsSucceeded: succeeded,
  typedRefusalResults: toolOutcomes.filter((outcome) => outcome.result?.refused === true || outcome.result?.refusalCodes?.length > 0).length,
  ...(selectedEvent ? { followupEventIdSource: 'wet_search_events result from this run' } : { followupEventIdSource: 'none observed' }),
  failures,
});

if (failures.length > 0 || !listOk || succeeded !== PUBLIC_TOOLS.length) process.exitCode = 1;
