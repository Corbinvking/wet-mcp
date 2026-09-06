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
const MODERN_PROTOCOL_VERSION = '2026-07-28';
const RESULT_SCHEMA = 'wet.clean-client-proof/v1';
const SOURCE_RIGHTS_POLICY = 'mcp-source-rights/2026-09-05.phase1';
const SOURCE_RIGHTS_REFUSAL = 'source_rights_pending';
const SOURCE_RIGHTS_FILTERING = 'coarse-all-rights-protected-sources';
const SOURCE_RIGHTS_GATED_TOOLS = [
  'wet_benchmark_value',
  'wet_search_events',
  'wet_screen_markets',
  'wet_event_markets',
  'wet_cross_venue',
  'wet_event_headlines',
].sort();
const EXPECTED_VENUE_RIGHTS_COUNTS = { protected: 9, configured: 9 };
const EXPECTED_HEADLINE_RIGHTS_COUNTS = { protected: 36, configured: 35 };
const PUBLIC_TOOLS = [
  'wet_benchmark_value',
  'wet_cross_venue',
  'wet_event_headlines',
  'wet_event_markets',
  'wet_resolve',
  'wet_screen_markets',
  'wet_search_events',
].sort();
const VALUE_BEARING_KEYS = [
  'probability',
  'yesProbability',
  'value',
  'latest',
  'spread',
  'spreadPoints',
  'change',
  'movement',
  'outcomes',
  'markets',
  'events',
  'groups',
  'moves',
  'items',
  'listings',
  'constituents',
  'rows',
  'contracts',
  'benchmarks',
  'history',
  'index',
  'indexes',
  'title',
];
const MAX_PREFLIGHT_JSON_BYTES = 1024 * 1024;
const MAX_RPC_JSON_BYTES = 4 * 1024 * 1024;
const TRUSTED_BROWSER_ORIGIN = 'https://claude.ai';
const UNTRUSTED_BROWSER_ORIGIN = 'https://mcp-preflight.invalid';
const OAUTH_SCOPES = ['wet.research.read', 'wet.scanners.read', 'wet.scanners.write', 'wet.alerts.write'].sort();
const PREFLIGHT_SURFACES = [
  { id: 'mcp-overview', path: '/mcp', mediaType: 'text/html' },
  { id: 'mcp-machine-guide', path: '/mcp.md', mediaType: 'text/markdown' },
  { id: 'mcp-llms-guide', path: '/mcp/llms.txt', mediaType: 'text/plain' },
  { id: 'site-llms-guide', path: '/llms.txt', mediaType: 'text/plain' },
  { id: 'mcp-server-card', path: '/.well-known/mcp/server-card.json', mediaType: 'application/json' },
  { id: 'security-contact', path: '/.well-known/security.txt', mediaType: 'text/plain' },
  { id: 'mcp-authentication', path: '/mcp/authentication', mediaType: 'text/html' },
  { id: 'security', path: '/security', mediaType: 'text/html' },
  { id: 'privacy', path: '/privacy', mediaType: 'text/html' },
  { id: 'terms', path: '/terms', mediaType: 'text/html' },
  { id: 'support', path: '/support', mediaType: 'text/html' },
  { id: 'changelog', path: '/changelog', mediaType: 'text/html' },
  { id: 'coverage', path: '/coverage', mediaType: 'text/html' },
  { id: 'coverage-json', path: '/coverage.json', mediaType: 'application/json' },
  { id: 'data-sources', path: '/data-sources', mediaType: 'text/html' },
  { id: 'limitations', path: '/limitations', mediaType: 'text/html' },
  { id: 'methodology', path: '/methodology', mediaType: 'text/html' },
  { id: 'governance', path: '/governance', mediaType: 'text/html' },
  { id: 'contract-identity', path: '/methodology/contract-identity', mediaType: 'text/html' },
  { id: 'refusals', path: '/methodology/refusals', mediaType: 'text/html' },
  { id: 'benchmark-status', path: '/status', mediaType: 'text/html' },
  { id: 'public-evals', path: '/mcp/evals', mediaType: 'text/html' },
  { id: 'public-evals-json', path: '/mcp/evals.json', mediaType: 'application/json' },
  { id: 'claude-guide', path: '/mcp/claude', mediaType: 'text/html' },
  { id: 'chatgpt-guide', path: '/mcp/chatgpt', mediaType: 'text/html' },
  { id: 'cursor-guide', path: '/mcp/cursor', mediaType: 'text/html' },
  { id: 'vscode-guide', path: '/mcp/vscode', mediaType: 'text/html' },
  { id: 'cline-guide', path: '/mcp/cline', mediaType: 'text/html' },
  { id: 'windsurf-guide', path: '/mcp/windsurf', mediaType: 'text/html' },
  { id: 'gemini-cli-guide', path: '/mcp/gemini-cli', mediaType: 'text/html' },
  { id: 'goose-guide', path: '/mcp/goose', mediaType: 'text/html' },
  { id: 'mcp-inspector-guide', path: '/mcp/mcp-inspector', mediaType: 'text/html' },
];
const SUMMARY_TOP_LEVEL_KEYS = new Set([
  'refused',
  'refusal',
  'sourceRights',
  'status',
  'policy',
  'counts',
  'benchmarks',
  'confirmedGroupsMatching',
  'marketCount',
  'matched',
  'matchedAttachments',
  'pricedCount',
  'returned',
  'scanned',
  'settledSkipped',
]);
const SUMMARY_COUNT_KEYS = [
  'submitted',
  'resolved',
  'refused',
  'crossVenueGroups',
  'structuralCrossVenueGroups',
  'basisOnlyGroups',
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

function usage() {
  return `Usage: node scripts/verify-live.mjs [--endpoint URL] [--timeout-ms N] [--expected-deployment-sha SHA] [--candidate-allow-source-rights-pending]

Runs Gate 4 trust/health preflight and a clean, anonymous MCP client against
all seven public W.E.T. tools.
The default endpoint comes from server.json. WET_MCP_ENDPOINT and
WET_MCP_TIMEOUT_MS are supported as environment overrides.
WET_MCP_EXPECTED_DEPLOYMENT_SHA may bind the proof to one exact deployed
application source revision; registry publishing always supplies it.

Output is newline-delimited JSON (NDJSON). It includes observed timing,
transport status, bounded semantic summaries, and SHA-256 result digests;
it does not invent or snapshot market values. Protocol-safe responses are
reported separately from useful sourced results. Default launch readiness
also requires the status document, CORS policy, OAuth discovery/challenge,
owned trust/client/eval URLs, and service/feed health contract to pass. It
fails if any required sourced tool is source_rights_pending or otherwise lacks
a useful sourced result.

--candidate-allow-source-rights-pending is an explicit candidate-only mode. It
may exit zero for protocol conformance while still reporting launchReady:false;
health and rights failures remain launch blockers. It is not source-rights,
live-data, coverage, freshness, reliability, or production proof. Exit 1 means
the selected verification mode failed; exit 2 means invalid command-line
configuration.

--self-test-health-normalization runs local envelope fixtures without making
network requests. It is used by the offline package validator.`;
}

function parseArguments(argv) {
  const parsed = {
    endpoint: process.env.WET_MCP_ENDPOINT || DEFAULT_ENDPOINT,
    timeoutMs: Number(process.env.WET_MCP_TIMEOUT_MS || 30_000),
    expectedDeploymentSha: process.env.WET_MCP_EXPECTED_DEPLOYMENT_SHA || null,
    candidateAllowSourceRightsPending: false,
    selfTestHealthNormalization: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--candidate-allow-source-rights-pending') {
      parsed.candidateAllowSourceRightsPending = true;
      continue;
    }
    if (arg === '--self-test-health-normalization') {
      parsed.selfTestHealthNormalization = true;
      continue;
    }
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
    if (arg === '--expected-deployment-sha') {
      parsed.expectedDeploymentSha = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--expected-deployment-sha=')) {
      parsed.expectedDeploymentSha = arg.slice('--expected-deployment-sha='.length);
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

if (options.selfTestHealthNormalization) {
  runHealthNormalizationSelfTest();
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
if (options.expectedDeploymentSha !== null) {
  options.expectedDeploymentSha = String(options.expectedDeploymentSha).trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(options.expectedDeploymentSha)) {
    console.error('--expected-deployment-sha must be a full 40-character hexadecimal git SHA.');
    process.exit(2);
  }
}

const endpoint = endpointUrl.toString();
const canonicalEndpointUrl = new URL(DEFAULT_ENDPOINT);
const permittedOwnedOrigins = new Set([endpointUrl.origin, canonicalEndpointUrl.origin]);
const permittedAdvertisedEndpoints = new Set([endpoint, canonicalEndpointUrl.toString()]);
const verificationMode = options.candidateAllowSourceRightsPending
  ? 'candidate-protocol-with-explicit-rights-hold'
  : 'launch-readiness';
const runId = randomUUID();
const runStartedAt = new Date().toISOString();
const runStarted = performance.now();
let requestNumber = 0;
let negotiatedProtocol = PROTOCOL_VERSION;
const failures = [];
const toolOutcomes = [];
const preflightChecks = [];
const preflightFailures = [];

function emit(type, fields = {}) {
  process.stdout.write(`${JSON.stringify({ schema: RESULT_SCHEMA, type, runId, ...fields })}\n`);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeHealthPayload(payload) {
  if (!isRecord(payload)) return { health: null, envelope: 'invalid' };
  if (isRecord(payload.data) && isRecord(payload.meta)) {
    return { health: payload.data, envelope: 'wet-v1' };
  }
  return { health: payload, envelope: 'legacy-bare' };
}

function runHealthNormalizationSelfTest() {
  const healthFixture = {
    ok: false,
    status: 'degraded',
    checkedAt: '2026-09-06T12:00:00.000Z',
    sources: [
      {
        source: 'kalshi',
        status: 'stale',
        lastMessageAt: '2026-09-06T11:55:00.000Z',
        ageMs: 300_000,
        details: { liveRest: { ok: true } },
      },
    ],
  };
  const fixtures = [
    {
      name: 'wet-v1-envelope',
      payload: {
        data: healthFixture,
        meta: { version: 'v1', servedAt: '2026-09-06T12:00:01.000Z' },
      },
      expectedEnvelope: 'wet-v1',
    },
    {
      name: 'legacy-bare-health',
      payload: healthFixture,
      expectedEnvelope: 'legacy-bare',
    },
  ];

  for (const fixture of fixtures) {
    const normalized = normalizeHealthPayload(fixture.payload);
    if (normalized.envelope !== fixture.expectedEnvelope || JSON.stringify(normalized.health) !== JSON.stringify(healthFixture)) {
      throw new Error(`health normalization fixture failed: ${fixture.name}`);
    }
  }

  const invalid = normalizeHealthPayload(null);
  if (invalid.health !== null || invalid.envelope !== 'invalid') {
    throw new Error('health normalization fixture failed: invalid payload');
  }

  process.stdout.write(`${JSON.stringify({ ok: true, fixtures: fixtures.map((fixture) => fixture.name) })}\n`);
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function boundedMessage(value, maximum = 240) {
  const text = String(value ?? 'unknown failure').replace(/\s+/gu, ' ').trim();
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1)}…`;
}

function mediaType(value) {
  return typeof value === 'string' ? value.split(';', 1)[0].trim().toLowerCase() : null;
}

function splitHeader(value) {
  return typeof value === 'string'
    ? value.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean)
    : [];
}

function sameMembers(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function ownedUrl(pathname) {
  return new URL(pathname, endpointUrl.origin).toString();
}

function safePublicUrl(value, expectedPathname = null) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return (
      permittedOwnedOrigins.has(parsed.origin) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      (expectedPathname === null || parsed.pathname === expectedPathname)
    );
  } catch {
    return false;
  }
}

function permittedEndpoint(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return (
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      permittedAdvertisedEndpoints.has(parsed.toString())
    );
  } catch {
    return false;
  }
}

async function readBoundedText(response, maximumBytes = MAX_PREFLIGHT_JSON_BYTES) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    await response.body?.cancel();
    throw new Error(`response exceeds the ${maximumBytes}-byte preflight limit`);
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) throw new Error(`response exceeds the ${maximumBytes}-byte preflight limit`);
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return Buffer.concat(chunks, total).toString('utf8');
}

async function httpProbe(url, init = {}, { json = false } = {}) {
  const requestStartedAt = new Date().toISOString();
  const started = performance.now();
  let response;
  try {
    response = await fetch(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    return {
      requestStartedAt,
      completedAt: new Date().toISOString(),
      durationMs: roundMs(performance.now() - started),
      transportError: boundedMessage(error instanceof Error ? error.message : error),
    };
  }

  let payload = null;
  let parseError = null;
  let responseBytes = null;
  if (json) {
    try {
      const text = await readBoundedText(response);
      responseBytes = Buffer.byteLength(text);
      payload = JSON.parse(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      parseError = message.startsWith('response exceeds') ? boundedMessage(message) : 'response could not be parsed as JSON';
    }
  } else {
    await response.body?.cancel().catch(() => undefined);
  }

  return {
    requestStartedAt,
    completedAt: new Date().toISOString(),
    durationMs: roundMs(performance.now() - started),
    httpStatus: response.status,
    ...(responseBytes !== null ? { responseBytes } : {}),
    contentType: mediaType(response.headers.get('content-type')),
    headers: response.headers,
    payload,
    parseError,
  };
}

function probeFailure(probe) {
  if (probe.transportError) return probe.transportError;
  if (probe.parseError) return `response was not bounded JSON: ${probe.parseError}`;
  if (typeof probe.httpStatus === 'number' && (probe.httpStatus < 200 || probe.httpStatus >= 300)) {
    return `HTTP ${probe.httpStatus}`;
  }
  return 'response did not match the required contract';
}

function recordPreflight(stage, ok, fields = {}, error = null) {
  const outcome = { stage, ok, ...fields };
  preflightChecks.push(outcome);
  if (!ok) preflightFailures.push(`${stage}: ${boundedMessage(error ?? 'contract mismatch')}`);
  emit('preflight_result', {
    gate: 'gate-4',
    ...outcome,
    ...(!ok ? { error: boundedMessage(error ?? 'contract mismatch') } : {}),
  });
  return ok;
}

async function mapWithConcurrency(values, concurrency, action) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      await action(values[index], index);
    }
  });
  await Promise.all(workers);
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

function collectMatchingKeys(value, keys, found = new Set(), seen = new Set(), depth = 0) {
  if (depth > 24 || value === null || typeof value !== 'object' || seen.has(value)) return found;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (keys.has(key)) found.add(key);
    collectMatchingKeys(child, keys, found, seen, depth + 1);
  }
  return found;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function matchesSchemaType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isRecord(value);
  if (type === 'integer') return typeof value === 'number' && Number.isSafeInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

/** Bounded evaluator for the JSON-Schema vocabulary published by the v0.5 tool contracts. */
function validatesOutputSchema(value, schemaValue) {
  if (schemaValue === true) return true;
  if (schemaValue === false || !isRecord(schemaValue)) return false;
  const schema = schemaValue;

  if (Array.isArray(schema.allOf) && !schema.allOf.every((branch) => validatesOutputSchema(value, branch))) return false;
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((branch) => validatesOutputSchema(value, branch))) return false;
  if (
    Array.isArray(schema.oneOf) &&
    schema.oneOf.filter((branch) => validatesOutputSchema(value, branch)).length !== 1
  ) return false;
  if (schema.not !== undefined && validatesOutputSchema(value, schema.not)) return false;
  if (
    schema.if !== undefined &&
    validatesOutputSchema(value, schema.if) &&
    schema.then !== undefined &&
    !validatesOutputSchema(value, schema.then)
  ) return false;
  if (
    schema.if !== undefined &&
    !validatesOutputSchema(value, schema.if) &&
    schema.else !== undefined &&
    !validatesOutputSchema(value, schema.else)
  ) return false;

  if (Object.hasOwn(schema, 'const') && !sameJson(value, schema.const)) return false;
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => sameJson(value, item))) return false;
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => matchesSchemaType(value, type))) return false;
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) return false;
    if (typeof schema.maximum === 'number' && value > schema.maximum) return false;
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) return false;
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) return false;
    if (schema.items !== undefined && !value.every((item) => validatesOutputSchema(item, schema.items))) return false;
  }
  if (isRecord(value)) {
    const required = Array.isArray(schema.required)
      ? schema.required.filter((key) => typeof key === 'string')
      : [];
    if (!required.every((key) => Object.hasOwn(value, key))) return false;
    const properties = isRecord(schema.properties) ? schema.properties : {};
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        if (!validatesOutputSchema(child, properties[key])) return false;
      } else if (schema.additionalProperties === false) {
        return false;
      } else if (isRecord(schema.additionalProperties) && !validatesOutputSchema(child, schema.additionalProperties)) {
        return false;
      }
    }
  }
  return true;
}

function openObjectSchemaPaths(value, path = '$', found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => openObjectSchemaPaths(item, `${path}[${index}]`, found));
    return found;
  }
  if (!isRecord(value)) return found;
  const permitsObject = value.type === 'object' || (Array.isArray(value.type) && value.type.includes('object'));
  if (permitsObject) {
    const hasProperties = isRecord(value.properties);
    const hasCombinator = Array.isArray(value.oneOf) || Array.isArray(value.anyOf) || Array.isArray(value.allOf);
    const typedDictionary = isRecord(value.additionalProperties);
    if (hasProperties && value.additionalProperties !== false) found.push(path);
    if (!hasProperties && !hasCombinator && !typedDictionary && value.additionalProperties !== false) found.push(path);
  }
  for (const [key, child] of Object.entries(value)) openObjectSchemaPaths(child, `${path}.${key}`, found);
  return found;
}

function sourceRightsContract(structured) {
  const pending = isRecord(structured?.refusal) && structured.refusal.code === SOURCE_RIGHTS_REFUSAL;
  if (!pending) return { pending: false, valid: true, leakedValueKeys: [] };

  const sourceRights = isRecord(structured?.sourceRights) ? structured.sourceRights : null;
  const leakedValueKeys = [...collectMatchingKeys(structured, new Set(VALUE_BEARING_KEYS))].sort();
  const valid =
    structured?.refused === true &&
    validSourceRightsStatus(sourceRights) &&
    sourceRights.excludedSourceCount > 0 &&
    leakedValueKeys.length === 0;
  return { pending: true, valid, leakedValueKeys };
}

function semanticSummary(result) {
  const structured = isRecord(result?.structuredContent) ? result.structuredContent : null;
  const sourceRights = isRecord(structured?.sourceRights) ? structured.sourceRights : null;
  const counts = {};
  if (structured) {
    for (const key of SUMMARY_COUNT_KEYS) {
      const value = structured[key];
      if (typeof value === 'number' && Number.isFinite(value)) counts[key] = value;
      if (key === 'benchmarks' && Array.isArray(value)) counts.benchmarks = value.length;
    }
    if (isRecord(structured.counts)) {
      for (const key of SUMMARY_COUNT_KEYS) {
        const value = structured.counts[key];
        if (typeof value === 'number' && Number.isFinite(value)) counts[key] = value;
      }
    }
  }
  const observedRefusalCodes = structured ? [...collectRefusalCodes(structured)].slice(0, 16) : [];
  const refusalCodes = [
    ...new Set(observedRefusalCodes.map((code) => (code === SOURCE_RIGHTS_REFUSAL ? SOURCE_RIGHTS_REFUSAL : 'other'))),
  ].sort();
  const topLevelKeys = structured
    ? Object.keys(structured).filter((key) => SUMMARY_TOP_LEVEL_KEYS.has(key)).sort()
    : [];
  return {
    hasStructuredContent: structured !== null,
    isError: result?.isError === true,
    contentTypes: Array.isArray(result?.content)
      ? [...new Set(result.content.map((entry) => entry?.type).filter((value) => ['text', 'image', 'audio', 'resource', 'resource_link'].includes(value)))].sort()
      : [],
    topLevelKeyCount: structured ? Object.keys(structured).length : 0,
    topLevelKeys,
    omittedTopLevelKeyCount: structured ? Object.keys(structured).length - topLevelKeys.length : 0,
    ...(structured && typeof structured.refused === 'boolean' ? { refused: structured.refused } : {}),
    ...(structured && typeof structured.status === 'string' ? { hasStatus: true } : {}),
    ...(structured && typeof structured.policy === 'string' ? { hasPolicy: true } : {}),
    ...(sourceRights
      ? {
          sourceRights: {
            policyVersionMatches: sourceRights.policyVersion === SOURCE_RIGHTS_POLICY,
            defaultDeny: sourceRights.enforcement === 'default-deny',
            filteringMatches: sourceRights.filtering === SOURCE_RIGHTS_FILTERING,
            ...(typeof sourceRights.mixedSourceFiltering === 'boolean'
              ? { mixedSourceFiltering: sourceRights.mixedSourceFiltering }
              : {}),
            excludedSourceCount: Number.isInteger(sourceRights.excludedSourceCount)
              ? sourceRights.excludedSourceCount
              : null,
          },
        }
      : {}),
    ...(Object.keys(counts).length > 0 ? { counts } : {}),
    ...(observedRefusalCodes.length > 0 ? { refusalCodeCount: observedRefusalCodes.length } : {}),
    ...(refusalCodes.length > 0 ? { refusalCodes } : {}),
  };
}

async function rpc(method, params, { protocolHeader = true, modern = false } = {}) {
  requestNumber += 1;
  const id = `clean-proof-${requestNumber}`;
  const requestProtocol = modern ? MODERN_PROTOCOL_VERSION : negotiatedProtocol;
  const requestParams = modern
    ? {
        ...params,
        _meta: {
          'io.modelcontextprotocol/protocolVersion': MODERN_PROTOCOL_VERSION,
          'io.modelcontextprotocol/clientInfo': { name: 'wet-clean-client-proof', version: PACKAGE_VERSION },
          'io.modelcontextprotocol/clientCapabilities': {},
        },
      }
    : params;
  const routedName = method === 'resources/read' ? params?.uri : params?.name;
  const requestStartedAt = new Date().toISOString();
  const started = performance.now();
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
        ...(protocolHeader ? { 'mcp-protocol-version': requestProtocol } : {}),
        ...(modern ? { 'mcp-method': method } : {}),
        ...(modern && typeof routedName === 'string' && ['tools/call', 'resources/read', 'prompts/get'].includes(method)
          ? { 'mcp-name': routedName }
          : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params: requestParams }),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    return {
      id,
      requestStartedAt,
      completedAt: new Date().toISOString(),
      durationMs: roundMs(performance.now() - started),
      transportError: boundedMessage(error instanceof Error ? error.message : error),
    };
  }

  let text = '';
  let payload = null;
  let parseError = null;
  try {
    text = await readBoundedText(response, MAX_RPC_JSON_BYTES);
    payload = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    parseError = message.startsWith('response exceeds') ? boundedMessage(message) : 'response could not be parsed as JSON';
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
    mediaType(call.contentType) === 'application/json' &&
    isRecord(call.payload) &&
    call.payload.jsonrpc === '2.0' &&
    call.payload.id === call.id &&
    !call.payload.error &&
    isRecord(call.payload.result)
  );
}

function callFailure(call) {
  if (call.transportError) return boundedMessage(call.transportError);
  if (call.parseError) return boundedMessage(`response was not bounded JSON: ${call.parseError}`);
  if (typeof call.httpStatus === 'number' && (call.httpStatus < 200 || call.httpStatus >= 300)) {
    return `HTTP ${call.httpStatus}`;
  }
  if (mediaType(call.contentType) !== 'application/json') return 'response content type is not application/json';
  if (!isRecord(call.payload) || call.payload.jsonrpc !== '2.0') return 'response is not JSON-RPC 2.0';
  if (call.payload.id !== call.id) return 'JSON-RPC response id does not match the request id';
  if (isRecord(call.payload?.error)) {
    const code = typeof call.payload.error.code === 'number' ? call.payload.error.code : 'unknown';
    return `JSON-RPC ${code}: error response`;
  }
  if (!isRecord(call.payload?.result)) return 'JSON-RPC result is missing';
  return 'unknown failure';
}

async function sendNotification(method, params = {}) {
  const requestStartedAt = new Date().toISOString();
  const started = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'mcp-protocol-version': negotiatedProtocol,
        'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method, params }),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    const text = await readBoundedText(response, MAX_RPC_JSON_BYTES);
    return {
      requestStartedAt,
      completedAt: new Date().toISOString(),
      durationMs: roundMs(performance.now() - started),
      httpStatus: response.status,
      responseBytes: Buffer.byteLength(text),
      contentType: response.headers.get('content-type'),
      responseProtocolVersion: response.headers.get('mcp-protocol-version'),
      text,
    };
  } catch (error) {
    return {
      requestStartedAt,
      completedAt: new Date().toISOString(),
      durationMs: roundMs(performance.now() - started),
      transportError: boundedMessage(error instanceof Error ? error.message : error),
    };
  }
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

function validSourceRightsStatus(value) {
  if (!isRecord(value)) return false;
  const countFields = ['protectedSourceCount', 'configuredSourceCount', 'approvedSourceCount', 'excludedSourceCount'];
  if (!countFields.every((field) => Number.isInteger(value[field]) && value[field] >= 0)) return false;
  if (!isRecord(value.exclusionReasonCounts)) return false;
  const reasonCounts = Object.values(value.exclusionReasonCounts);
  if (!reasonCounts.every((count) => Number.isInteger(count) && count > 0)) return false;
  return (
    value.policyVersion === SOURCE_RIGHTS_POLICY &&
    value.enforcement === 'default-deny' &&
    value.filtering === SOURCE_RIGHTS_FILTERING &&
    value.mixedSourceFiltering === false &&
    value.protectedSourceCount === value.approvedSourceCount + value.excludedSourceCount &&
    value.configuredSourceCount <= value.protectedSourceCount &&
    reasonCounts.reduce((sum, count) => sum + count, 0) === value.excludedSourceCount &&
    typeof value.canServeSourcedTools === 'boolean' &&
    value.canServeSourcedTools === (value.protectedSourceCount > 0 && value.excludedSourceCount === 0)
  );
}

function validIssuer(value) {
  if (!safePublicUrl(value, '/')) return false;
  return permittedOwnedOrigins.has(new URL(value).origin);
}

function probeFields(probe) {
  return {
    durationMs: probe.durationMs,
    ...(typeof probe.httpStatus === 'number' ? { httpStatus: probe.httpStatus } : {}),
    ...(typeof probe.responseBytes === 'number' ? { responseBytes: probe.responseBytes } : {}),
    ...(probe.contentType ? { contentType: boundedMessage(probe.contentType, 80) } : {}),
  };
}

async function runGate4Preflight() {
  const launchBlockers = [];
  let statusVenueSourceRights = null;

  const statusProbe = await httpProbe(
    endpoint,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
      },
    },
    { json: true },
  );
  const statusPayload = isRecord(statusProbe.payload) ? statusProbe.payload : null;
  const statusTools = Array.isArray(statusPayload?.tools)
    ? statusPayload.tools.map((tool) => tool?.name).filter((name) => typeof name === 'string')
    : [];
  const statusRights = isRecord(statusPayload?.sourceRights) ? statusPayload.sourceRights : null;
  const statusDeployment = isRecord(statusPayload?.deployment) ? statusPayload.deployment : null;
  const observedDeploymentSha =
    typeof statusDeployment?.commitSha === 'string' ? statusDeployment.commitSha.toLowerCase() : null;
  const deploymentShaMatches =
    options.expectedDeploymentSha === null || observedDeploymentSha === options.expectedDeploymentSha;
  const venueSourceRights = isRecord(statusRights?.venueSourceRights) ? statusRights.venueSourceRights : null;
  const headlineSourceRights = isRecord(statusRights?.headlineSourceRights) ? statusRights.headlineSourceRights : null;
  const sourceRightsValid =
    validSourceRightsStatus(venueSourceRights) &&
    validSourceRightsStatus(headlineSourceRights) &&
    venueSourceRights.protectedSourceCount === EXPECTED_VENUE_RIGHTS_COUNTS.protected &&
    venueSourceRights.configuredSourceCount === EXPECTED_VENUE_RIGHTS_COUNTS.configured &&
    headlineSourceRights.protectedSourceCount === EXPECTED_HEADLINE_RIGHTS_COUNTS.protected &&
    headlineSourceRights.configuredSourceCount === EXPECTED_HEADLINE_RIGHTS_COUNTS.configured;
  const statusOk =
    !statusProbe.transportError &&
    !statusProbe.parseError &&
    statusProbe.httpStatus === 200 &&
    statusProbe.contentType === 'application/json' &&
    statusPayload?.status === 'ok' &&
    isRecord(statusPayload?.server) &&
    statusPayload.server.name === 'wet' &&
    statusPayload.server.version === PACKAGE_VERSION &&
    permittedEndpoint(statusPayload?.endpoint) &&
    typeof statusPayload?.transport === 'string' &&
    Array.isArray(statusPayload?.protocolVersions) &&
    statusPayload.protocolVersions.includes(PROTOCOL_VERSION) &&
    sameMembers(statusTools, PUBLIC_TOOLS) &&
    sourceRightsValid &&
    deploymentShaMatches;
  if (sourceRightsValid) {
    statusVenueSourceRights = venueSourceRights;
  }
  recordPreflight(
    'mcp-status-get',
    statusOk,
    {
      ...probeFields(statusProbe),
      method: 'GET',
      serverNameMatches: statusPayload?.server?.name === 'wet',
      serverVersionMatches: statusPayload?.server?.version === PACKAGE_VERSION,
      observedDeploymentCommitSha: observedDeploymentSha,
      expectedDeploymentCommitSha: options.expectedDeploymentSha,
      deploymentCommitMatches: deploymentShaMatches,
      anonymousToolCount: statusTools.length,
      advertisedEndpointAccepted: permittedEndpoint(statusPayload?.endpoint),
      sourceRightsPolicy: sourceRightsValid ? venueSourceRights.policyVersion : null,
      venueProtectedSourceCount: sourceRightsValid ? venueSourceRights.protectedSourceCount : null,
      venueConfiguredSourceCount: sourceRightsValid ? venueSourceRights.configuredSourceCount : null,
      venueApprovedSourceCount: sourceRightsValid ? venueSourceRights.approvedSourceCount : null,
      venueExcludedSourceCount: sourceRightsValid ? venueSourceRights.excludedSourceCount : null,
      headlineProtectedSourceCount: sourceRightsValid ? headlineSourceRights.protectedSourceCount : null,
      headlineConfiguredSourceCount: sourceRightsValid ? headlineSourceRights.configuredSourceCount : null,
      headlineApprovedSourceCount: sourceRightsValid ? headlineSourceRights.approvedSourceCount : null,
      headlineExcludedSourceCount: sourceRightsValid ? headlineSourceRights.excludedSourceCount : null,
      ...(statusPayload ? { responseSha256: digest(statusPayload) } : {}),
    },
    statusOk ? null : probeFailure(statusProbe),
  );
  if (sourceRightsValid && venueSourceRights.excludedSourceCount > 0) {
    launchBlockers.push('source rights: venue-source chain is not fully approved');
  }
  if (sourceRightsValid && headlineSourceRights.excludedSourceCount > 0) {
    launchBlockers.push('source rights: combined venue and publisher/feed chain is not fully approved');
  }

  const preflightHeaders = {
    origin: TRUSTED_BROWSER_ORIGIN,
    'access-control-request-method': 'POST',
    'access-control-request-headers': 'authorization, content-type, mcp-protocol-version',
    'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
  };
  const trustedCors = await httpProbe(endpoint, { method: 'OPTIONS', headers: preflightHeaders });
  const trustedAllowedHeaders = splitHeader(trustedCors.headers?.get('access-control-allow-headers'));
  const trustedAllowedMethods = splitHeader(trustedCors.headers?.get('access-control-allow-methods'));
  const trustedVary = splitHeader(trustedCors.headers?.get('vary'));
  const trustedCorsOk =
    !trustedCors.transportError &&
    trustedCors.httpStatus === 204 &&
    trustedCors.headers?.get('access-control-allow-origin') === TRUSTED_BROWSER_ORIGIN &&
    ['authorization', 'content-type', 'mcp-protocol-version'].every((header) => trustedAllowedHeaders.includes(header)) &&
    !trustedAllowedHeaders.includes('x-wet-api-key') &&
    trustedAllowedMethods.includes('post') &&
    trustedVary.includes('origin') &&
    trustedVary.includes('access-control-request-method') &&
    trustedVary.includes('access-control-request-headers');
  recordPreflight(
    'cors-trusted-origin',
    trustedCorsOk,
    {
      ...probeFields(trustedCors),
      originClass: 'approved-browser-origin',
      exactOriginGrant: trustedCors.headers?.get('access-control-allow-origin') === TRUSTED_BROWSER_ORIGIN,
      authorizationAllowed: trustedAllowedHeaders.includes('authorization'),
      apiKeyHeaderAllowed: trustedAllowedHeaders.includes('x-wet-api-key'),
    },
    trustedCorsOk ? null : probeFailure(trustedCors),
  );

  const untrustedCors = await httpProbe(endpoint, {
    method: 'OPTIONS',
    headers: { ...preflightHeaders, origin: UNTRUSTED_BROWSER_ORIGIN },
  });
  const untrustedCorsOk =
    !untrustedCors.transportError &&
    untrustedCors.httpStatus === 403 &&
    untrustedCors.headers?.get('access-control-allow-origin') === null;
  recordPreflight(
    'cors-untrusted-origin',
    untrustedCorsOk,
    {
      ...probeFields(untrustedCors),
      originClass: 'untrusted-invalid-origin',
      originGrantPresent: untrustedCors.headers?.get('access-control-allow-origin') !== null,
    },
    untrustedCorsOk ? null : probeFailure(untrustedCors),
  );

  const challengeProbe = await httpProbe(
    endpoint,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'mcp-protocol-version': PROTOCOL_VERSION,
        'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'gate-4-protected-challenge',
        method: 'tools/call',
        params: { name: 'wet_list_scanners', arguments: {} },
      }),
    },
    { json: true },
  );
  const challenge = challengeProbe.headers?.get('www-authenticate') ?? '';
  const resourceMetadata = challenge.match(/resource_metadata="([^"]+)"/iu)?.[1] ?? null;
  const challengeScope = challenge.match(/scope="([^"]+)"/iu)?.[1]?.split(/\s+/u).filter(Boolean) ?? [];
  const challengeOk =
    !challengeProbe.transportError &&
    !challengeProbe.parseError &&
    challengeProbe.httpStatus === 401 &&
    challengeProbe.contentType === 'application/json' &&
    challengeProbe.payload?.jsonrpc === '2.0' &&
    challengeProbe.payload?.id === 'gate-4-protected-challenge' &&
    isRecord(challengeProbe.payload?.error) &&
    challengeProbe.payload.error.code === -32001 &&
    /^Bearer\b/iu.test(challenge) &&
    safePublicUrl(resourceMetadata, '/.well-known/oauth-protected-resource/api/mcp') &&
    challengeScope.includes('wet.scanners.read');
  recordPreflight(
    'oauth-protected-challenge',
    challengeOk,
    {
      ...probeFields(challengeProbe),
      bearerChallenge: /^Bearer\b/iu.test(challenge),
      resourceMetadataAccepted: safePublicUrl(resourceMetadata, '/.well-known/oauth-protected-resource/api/mcp'),
      requiredScopePresent: challengeScope.includes('wet.scanners.read'),
      jsonRpcErrorCode: challengeProbe.payload?.error?.code ?? null,
    },
    challengeOk ? null : probeFailure(challengeProbe),
  );

  for (const pathname of ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/api/mcp']) {
    const resourceProbe = await httpProbe(
      ownedUrl(pathname),
      { headers: { accept: 'application/json', 'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}` } },
      { json: true },
    );
    const metadata = isRecord(resourceProbe.payload) ? resourceProbe.payload : null;
    const authorizationServers = Array.isArray(metadata?.authorization_servers) ? metadata.authorization_servers : [];
    const resourceOk =
      !resourceProbe.transportError &&
      !resourceProbe.parseError &&
      resourceProbe.httpStatus === 200 &&
      resourceProbe.contentType === 'application/json' &&
      permittedEndpoint(metadata?.resource) &&
      authorizationServers.length > 0 &&
      authorizationServers.every(validIssuer) &&
      sameMembers(Array.isArray(metadata?.scopes_supported) ? metadata.scopes_supported : [], OAUTH_SCOPES) &&
      Array.isArray(metadata?.bearer_methods_supported) &&
      metadata.bearer_methods_supported.includes('header') &&
      safePublicUrl(metadata?.resource_documentation, '/mcp/authentication') &&
      resourceProbe.headers?.get('access-control-allow-origin') === '*';
    recordPreflight(
      pathname.endsWith('/api/mcp') ? 'oauth-resource-discovery-scoped' : 'oauth-resource-discovery-root',
      resourceOk,
      {
        ...probeFields(resourceProbe),
        resourceEndpointAccepted: permittedEndpoint(metadata?.resource),
        authorizationServerCount: authorizationServers.length,
        scopeCount: Array.isArray(metadata?.scopes_supported) ? metadata.scopes_supported.length : 0,
        bearerHeaderAdvertised: metadata?.bearer_methods_supported?.includes?.('header') === true,
        publicCors: resourceProbe.headers?.get('access-control-allow-origin') === '*',
        ...(metadata ? { responseSha256: digest(metadata) } : {}),
      },
      resourceOk ? null : probeFailure(resourceProbe),
    );
  }

  const authorizationProbe = await httpProbe(
    ownedUrl('/.well-known/oauth-authorization-server'),
    { headers: { accept: 'application/json', 'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}` } },
    { json: true },
  );
  const authorization = isRecord(authorizationProbe.payload) ? authorizationProbe.payload : null;
  const issuer = validIssuer(authorization?.issuer) ? new URL(authorization.issuer).origin : null;
  const issuerEndpoint = (value, pathname) =>
    typeof value === 'string' && safePublicUrl(value, pathname) && new URL(value).origin === issuer;
  const authorizationOk =
    !authorizationProbe.transportError &&
    !authorizationProbe.parseError &&
    authorizationProbe.httpStatus === 200 &&
    authorizationProbe.contentType === 'application/json' &&
    issuer !== null &&
    issuerEndpoint(authorization?.authorization_endpoint, '/oauth/authorize') &&
    issuerEndpoint(authorization?.token_endpoint, '/oauth/token') &&
    issuerEndpoint(authorization?.registration_endpoint, '/oauth/register') &&
    issuerEndpoint(authorization?.revocation_endpoint, '/oauth/revoke') &&
    sameMembers(Array.isArray(authorization?.scopes_supported) ? authorization.scopes_supported : [], OAUTH_SCOPES) &&
    authorization?.response_types_supported?.includes?.('code') === true &&
    authorization?.grant_types_supported?.includes?.('authorization_code') === true &&
    authorization?.grant_types_supported?.includes?.('refresh_token') === true &&
    authorization?.token_endpoint_auth_methods_supported?.includes?.('none') === true &&
    authorization?.code_challenge_methods_supported?.includes?.('S256') === true &&
    authorizationProbe.headers?.get('access-control-allow-origin') === '*';
  recordPreflight(
    'oauth-authorization-discovery',
    authorizationOk,
    {
      ...probeFields(authorizationProbe),
      issuerAccepted: issuer !== null,
      scopeCount: Array.isArray(authorization?.scopes_supported) ? authorization.scopes_supported.length : 0,
      authorizationCode: authorization?.grant_types_supported?.includes?.('authorization_code') === true,
      refreshToken: authorization?.grant_types_supported?.includes?.('refresh_token') === true,
      pkceS256: authorization?.code_challenge_methods_supported?.includes?.('S256') === true,
      publicCors: authorizationProbe.headers?.get('access-control-allow-origin') === '*',
      ...(authorization ? { responseSha256: digest(authorization) } : {}),
    },
    authorizationOk ? null : probeFailure(authorizationProbe),
  );

  const surfaceProbes = new Array(PREFLIGHT_SURFACES.length);
  await mapWithConcurrency(PREFLIGHT_SURFACES, 4, async (surface, index) => {
    surfaceProbes[index] = await httpProbe(
      ownedUrl(surface.path),
      {
        method: 'GET',
        headers: {
          accept: surface.mediaType === 'application/json' ? 'application/json' : 'text/html',
          'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}`,
        },
      },
      { json: surface.mediaType === 'application/json' },
    );
  });
  for (let index = 0; index < PREFLIGHT_SURFACES.length; index += 1) {
    const surface = PREFLIGHT_SURFACES[index];
    const probe = surfaceProbes[index];
    const surfaceOk =
      !probe.transportError &&
      !probe.parseError &&
      probe.httpStatus === 200 &&
      probe.contentType === surface.mediaType;
    recordPreflight(
      `owned-url:${surface.id}`,
      surfaceOk,
      {
        ...probeFields(probe),
        path: surface.path,
        expectedContentType: surface.mediaType,
        ...(isRecord(probe.payload) ? { responseSha256: digest(probe.payload) } : {}),
      },
      surfaceOk ? null : probeFailure(probe),
    );
  }

  const healthProbe = await httpProbe(
    ownedUrl('/api/wet/v1/health'),
    { headers: { accept: 'application/json', 'user-agent': `wet-clean-client-proof/${PACKAGE_VERSION}` } },
    { json: true },
  );
  const normalizedHealth = normalizeHealthPayload(healthProbe.payload);
  const health = normalizedHealth.health;
  const healthSources = Array.isArray(health?.sources) ? health.sources : [];
  const freshnessStates = new Set(['fresh', 'stale', 'empty', 'unknown']);
  const healthRowsValid =
    Array.isArray(health?.sources) &&
    healthSources.every(
      (source) =>
        isRecord(source) &&
        typeof source.source === 'string' &&
        freshnessStates.has(source.status) &&
        (source.lastMessageAt === null || typeof source.lastMessageAt === 'string') &&
        (source.ageMs === null || (typeof source.ageMs === 'number' && Number.isFinite(source.ageMs) && source.ageMs >= 0)) &&
        isRecord(source.details),
    );
  const uniqueHealthSources =
    healthRowsValid && new Set(healthSources.map((source) => source.source)).size === healthSources.length;
  const allFresh = healthSources.length > 0 && healthSources.every((source) => source.status === 'fresh');
  const aggregateConsistent =
    typeof health?.ok === 'boolean' &&
    (health.status === 'healthy' || health.status === 'degraded') &&
    health.ok === allFresh &&
    (health.status === 'healthy') === health.ok;
  const checkedAtMs = typeof health?.checkedAt === 'string' ? Date.parse(health.checkedAt) : Number.NaN;
  const checkedAtAgeMs = Date.now() - checkedAtMs;
  const checkedAtValid = Number.isFinite(checkedAtMs) && checkedAtAgeMs >= -60_000;
  const configuredCountMatches =
    statusVenueSourceRights !== null && healthSources.length === statusVenueSourceRights.configuredSourceCount;
  const healthShapeOk =
    !healthProbe.transportError &&
    !healthProbe.parseError &&
    healthProbe.httpStatus === 200 &&
    healthProbe.contentType === 'application/json' &&
    healthRowsValid &&
    uniqueHealthSources &&
    aggregateConsistent &&
    checkedAtValid &&
    configuredCountMatches;
  const healthRightsAligned =
    statusVenueSourceRights !== null &&
    statusVenueSourceRights.excludedSourceCount === 0 &&
    healthSources.length <= statusVenueSourceRights.approvedSourceCount;
  const healthCheckedAtFresh = checkedAtValid && checkedAtAgeMs <= 5 * 60_000;
  const healthLaunchReady = healthShapeOk && health.ok === true && allFresh && healthRightsAligned && healthCheckedAtFresh;
  const stateCounts = Object.fromEntries(
    [...freshnessStates].map((state) => [state, healthSources.filter((source) => source.status === state).length]),
  );
  recordPreflight(
    'service-feed-health',
    healthShapeOk,
    {
      ...probeFields(healthProbe),
      serviceAvailable: healthProbe.httpStatus === 200,
      aggregateStatus: typeof health?.status === 'string' ? health.status : null,
      aggregateOk: typeof health?.ok === 'boolean' ? health.ok : null,
      checkedAtCurrent: healthCheckedAtFresh,
      sourceCount: healthSources.length,
      sourceStateCounts: stateCounts,
      responseEnvelope: normalizedHealth.envelope,
      configuredCountMatches,
      rightsApprovedCountCoversAdvertisedFeeds: healthRightsAligned,
      healthLaunchReady,
      ...(health ? { responseSha256: digest(health) } : {}),
    },
    healthShapeOk ? null : probeFailure(healthProbe),
  );
  if (!healthCheckedAtFresh) launchBlockers.push('health: checkedAt is missing or older than five minutes');
  if (health?.ok !== true || health?.status !== 'healthy' || !allFresh) {
    launchBlockers.push('health: service feed readiness is degraded or includes a non-fresh source');
  }
  if (!healthRightsAligned) {
    launchBlockers.push('health: advertised feed count exceeds the current rights-approved count');
  }

  return {
    launchBlockers,
    healthLaunchReady,
  };
}

async function invokeTool(name, toolArguments, argumentSource) {
  const call = await rpc('tools/call', { name, arguments: toolArguments });
  const result = isRecord(call.payload?.result) ? call.payload.result : null;
  const summary = result ? semanticSummary(result) : null;
  const structured = isRecord(result?.structuredContent) ? result.structuredContent : null;
  const rights = sourceRightsContract(structured);
  const sourcedTool = SOURCE_RIGHTS_GATED_TOOLS.includes(name);
  const listedTool = listedTools.find((tool) => tool?.name === name);
  const advertisedOutputSchema = isRecord(listedTool?.outputSchema) ? listedTool.outputSchema : null;
  const outputContractValid =
    advertisedOutputSchema !== null &&
    structured !== null &&
    validatesOutputSchema(structured, advertisedOutputSchema);
  const unexpectedResolverHold = name === 'wet_resolve' && rights.pending;
  const protocolSafe =
    rpcSucceeded(call) &&
    result?.isError !== true &&
    summary?.hasStructuredContent === true &&
    outputContractValid &&
    rights.valid &&
    !unexpectedResolverHold;
  const sourceRightsPending = sourcedTool && rights.pending;
  const usefulSourcedResult = sourcedTool && protocolSafe && !sourceRightsPending && structured?.refused !== true;
  const usefulCallerSuppliedResult =
    name === 'wet_resolve' &&
    protocolSafe &&
    isRecord(structured?.counts) &&
    typeof structured.counts.resolved === 'number' &&
    structured.counts.resolved > 0;
  let protocolError = null;
  if (!rpcSucceeded(call)) protocolError = callFailure(call);
  else if (result?.isError === true || summary?.hasStructuredContent !== true) {
    protocolError = 'tool returned isError or no structuredContent';
  } else if (!rights.valid) {
    protocolError = `invalid ${SOURCE_RIGHTS_REFUSAL} contract${rights.leakedValueKeys.length > 0 ? `; leaked keys: ${rights.leakedValueKeys.join(', ')}` : ''}`;
  } else if (!outputContractValid) {
    protocolError = 'structuredContent does not match the advertised outputSchema';
  } else if (unexpectedResolverHold) {
    protocolError = 'wet_resolve unexpectedly returned the sourced-tool rights hold';
  }
  if (!protocolSafe) failures.push(`${name}: ${protocolError}`);
  const outcome = {
    tool: name,
    ok: protocolSafe,
    protocolSafe,
    outputContractValid,
    sourcedTool,
    sourceRightsPending,
    ...(sourcedTool ? { usefulSourcedResult } : {}),
    ...(name === 'wet_resolve' ? { usefulCallerSuppliedResult } : {}),
    argumentSource,
    requestStartedAt: call.requestStartedAt,
    completedAt: call.completedAt,
    durationMs: call.durationMs,
    ...(typeof call.httpStatus === 'number' ? { httpStatus: call.httpStatus } : {}),
    ...(typeof call.responseBytes === 'number' ? { responseBytes: call.responseBytes } : {}),
    ...(result ? { resultSha256: digest(result), result: summary } : {}),
    ...(!protocolSafe ? { error: protocolError } : {}),
  };
  toolOutcomes.push(outcome);
  emit('tool_result', outcome);
  return result?.structuredContent;
}

emit('run_start', {
  endpoint,
  targetEnvironment: localHttp
    ? 'localhost'
    : endpointUrl.origin === canonicalEndpointUrl.origin
      ? 'canonical-production-origin'
      : 'preview-or-alternate-origin',
  verificationMode,
  packageVersion: PACKAGE_VERSION,
  protocolVersionRequested: PROTOCOL_VERSION,
  modernProtocolVersionProbed: MODERN_PROTOCOL_VERSION,
  timeoutMs: options.timeoutMs,
  startedAt: runStartedAt,
  access: 'anonymous-no-credentials',
  outputPolicy: 'observed summaries and result digests; no market values copied into proof output',
  sourceRightsPolicy: SOURCE_RIGHTS_POLICY,
  candidateAllowance: options.candidateAllowSourceRightsPending,
});

const gate4Preflight = await runGate4Preflight();
const preflightConformant = preflightFailures.length === 0;
const gate4LaunchReady = preflightConformant && gate4Preflight.launchBlockers.length === 0;

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
    verificationMode,
    verificationPassed: false,
    protocolConformant: false,
    preflightConformant,
    gate4LaunchReady,
    healthLaunchReady: gate4Preflight.healthLaunchReady,
    launchReady: false,
    completedAt: new Date().toISOString(),
    durationMs: roundMs(performance.now() - runStarted),
    toolsAttempted: 0,
    toolsSucceeded: 0,
    protocolSafeTools: 0,
    usefulSourcedToolCount: 0,
    usefulSourcedTools: [],
    sourceRightsPendingToolCount: 0,
    sourceRightsPendingTools: [],
    resolverUsable: false,
    preflightChecksPassed: preflightChecks.filter((check) => check.ok).length,
    preflightChecksTotal: preflightChecks.length,
    preflightFailures,
    protocolFailures: failures,
    gate4LaunchBlockers: gate4Preflight.launchBlockers,
    launchBlockers: [
      ...preflightFailures.map((failure) => `Gate 4: ${failure}`),
      ...gate4Preflight.launchBlockers.map((blocker) => `Gate 4: ${blocker}`),
      'initialize failed before sourced launch readiness could be tested',
    ],
    candidateBlockers: [
      ...preflightFailures.map((failure) => `Gate 4: ${failure}`),
      'initialize failed before candidate protocol conformance could be tested',
    ],
    evidenceBoundary:
      'Evidence applies only to the selected endpoint and run time. Candidate or preview results do not prove production readiness; one run does not prove durable coverage, freshness, reliability, or source-rights clearance.',
  });
  process.exit(1);
}

const initializeResult = initialized.payload.result;
if (typeof initializeResult.protocolVersion === 'string') negotiatedProtocol = initializeResult.protocolVersion;
const initializeNameMatches = initializeResult.serverInfo?.name === 'wet';
const initializeVersionMatches = initializeResult.serverInfo?.version === PACKAGE_VERSION;
if (!initializeNameMatches) failures.push('server name does not match the package implementation name');
if (!initializeVersionMatches) {
  failures.push('server version does not match the package version');
}
emit('protocol_result', {
  stage: 'initialize',
  ok: initializeNameMatches && initializeVersionMatches && negotiatedProtocol === PROTOCOL_VERSION,
  requestStartedAt: initialized.requestStartedAt,
  completedAt: initialized.completedAt,
  durationMs: initialized.durationMs,
  httpStatus: initialized.httpStatus,
  serverNameMatches: initializeNameMatches,
  serverVersionMatches: initializeVersionMatches,
  negotiatedProtocolMatches: negotiatedProtocol === PROTOCOL_VERSION,
});

if (negotiatedProtocol !== PROTOCOL_VERSION) {
  failures.push('negotiated protocol does not match the requested package protocol');
}

const initializedNotification = await sendNotification('notifications/initialized', {});
const initializedNotificationOk =
  !initializedNotification.transportError &&
  initializedNotification.httpStatus === 202 &&
  initializedNotification.responseBytes === 0 &&
  initializedNotification.text === '' &&
  initializedNotification.responseProtocolVersion === negotiatedProtocol;
if (!initializedNotificationOk) {
  failures.push('notifications/initialized was not acknowledged with HTTP 202 and an empty body');
}
emit('protocol_result', {
  stage: 'notifications/initialized',
  ok: initializedNotificationOk,
  requestStartedAt: initializedNotification.requestStartedAt,
  completedAt: initializedNotification.completedAt,
  durationMs: initializedNotification.durationMs,
  ...(typeof initializedNotification.httpStatus === 'number'
    ? { httpStatus: initializedNotification.httpStatus }
    : {}),
  ...(typeof initializedNotification.responseBytes === 'number'
    ? { responseBytes: initializedNotification.responseBytes }
    : {}),
  protocolVersionEchoMatches:
    initializedNotification.responseProtocolVersion === negotiatedProtocol,
  ...(!initializedNotificationOk
    ? { error: initializedNotification.transportError ?? 'notification acknowledgement contract mismatch' }
    : {}),
});

const modernDiscover = await rpc('server/discover', {}, { modern: true });
const modernDiscovery = isRecord(modernDiscover.payload?.result) ? modernDiscover.payload.result : null;
const modernDiscoverOk =
  rpcSucceeded(modernDiscover) &&
  modernDiscover.responseProtocolVersion === MODERN_PROTOCOL_VERSION &&
  modernDiscovery?.resultType === 'complete' &&
  modernDiscovery?.cacheScope === 'public' &&
  modernDiscovery?.ttlMs === 3_600_000 &&
  Array.isArray(modernDiscovery?.supportedVersions) &&
  modernDiscovery.supportedVersions.includes(MODERN_PROTOCOL_VERSION) &&
  modernDiscovery?._meta?.['io.modelcontextprotocol/serverInfo']?.name === 'wet' &&
  modernDiscovery?._meta?.['io.modelcontextprotocol/serverInfo']?.version === PACKAGE_VERSION;
if (!modernDiscoverOk) failures.push(`modern server/discover: ${callFailure(modernDiscover)}`);
emit('protocol_result', {
  stage: 'modern-server/discover',
  ok: modernDiscoverOk,
  requestStartedAt: modernDiscover.requestStartedAt,
  completedAt: modernDiscover.completedAt,
  durationMs: modernDiscover.durationMs,
  ...(typeof modernDiscover.httpStatus === 'number' ? { httpStatus: modernDiscover.httpStatus } : {}),
  responseIdMatches: modernDiscover.payload?.id === modernDiscover.id,
  protocolVersionEchoMatches: modernDiscover.responseProtocolVersion === MODERN_PROTOCOL_VERSION,
  modernVersionAdvertised: modernDiscovery?.supportedVersions?.includes?.(MODERN_PROTOCOL_VERSION) === true,
  ...(!modernDiscoverOk ? { error: callFailure(modernDiscover) } : {}),
});

const unknownMethod = await rpc('wet/unknown-method', {});
const unknownMethodOk =
  !unknownMethod.transportError &&
  !unknownMethod.parseError &&
  unknownMethod.httpStatus === 200 &&
  mediaType(unknownMethod.contentType) === 'application/json' &&
  unknownMethod.payload?.jsonrpc === '2.0' &&
  unknownMethod.payload?.id === unknownMethod.id &&
  unknownMethod.payload?.error?.code === -32601;
if (!unknownMethodOk) failures.push('unknown JSON-RPC method did not stay in-band as HTTP 200 / -32601');
emit('protocol_result', {
  stage: 'unknown-method-http-semantics',
  ok: unknownMethodOk,
  requestStartedAt: unknownMethod.requestStartedAt,
  completedAt: unknownMethod.completedAt,
  durationMs: unknownMethod.durationMs,
  ...(typeof unknownMethod.httpStatus === 'number' ? { httpStatus: unknownMethod.httpStatus } : {}),
  jsonRpcErrorCode: unknownMethod.payload?.error?.code ?? null,
  responseIdMatches: unknownMethod.payload?.id === unknownMethod.id,
});

const listed = await rpc('tools/list', {});
let listedTools = [];
let listOk = false;
if (rpcSucceeded(listed) && Array.isArray(listed.payload.result.tools)) {
  listedTools = listed.payload.result.tools;
  const listedNames = listedTools.map((tool) => tool?.name).filter((name) => typeof name === 'string');
  const recognizedListedNames = listedNames.filter((name) => PUBLIC_TOOLS.includes(name));
  const annotationsSafe = listedTools.every(
    (tool) => tool?.annotations?.readOnlyHint === true && tool?.annotations?.destructiveHint === false,
  );
  const listWithinBudget = typeof listed.responseBytes === 'number' && listed.responseBytes <= 30 * 1024;
  const sourcedSchemaProblems = listedTools
    .filter((tool) => SOURCE_RIGHTS_GATED_TOOLS.includes(tool?.name))
    .flatMap((tool) =>
      isRecord(tool?.outputSchema)
        ? openObjectSchemaPaths(tool.outputSchema, tool.name)
        : [`${tool?.name ?? 'unknown'}:missing-outputSchema`],
    );
  const sourcedOutputSchemasClosed =
    listedTools.filter((tool) => SOURCE_RIGHTS_GATED_TOOLS.includes(tool?.name)).length ===
      SOURCE_RIGHTS_GATED_TOOLS.length && sourcedSchemaProblems.length === 0;
  listOk =
    sameMembers(listedNames, PUBLIC_TOOLS) &&
    annotationsSafe &&
    listWithinBudget &&
    sourcedOutputSchemasClosed;
  if (!sameMembers(listedNames, PUBLIC_TOOLS)) {
    failures.push(
      `anonymous tools/list mismatch: observed ${listedNames.length} names, ${recognizedListedNames.length} recognized`,
    );
  }
  if (!annotationsSafe) failures.push('one or more anonymous tools lacks readOnlyHint:true or destructiveHint:false');
  if (!listWithinBudget) failures.push(`anonymous tools/list exceeds 30 KiB: ${listed.responseBytes ?? 'unknown'} bytes`);
  if (!sourcedOutputSchemasClosed) {
    failures.push(
      `one or more sourced output contracts is missing or recursively open (${sourcedSchemaProblems.length} path(s))`,
    );
  }
  emit('protocol_result', {
    stage: 'tools/list',
    ok: listOk,
    requestStartedAt: listed.requestStartedAt,
    completedAt: listed.completedAt,
    durationMs: listed.durationMs,
    httpStatus: listed.httpStatus,
    responseBytes: listed.responseBytes,
    anonymousToolCount: listedNames.length,
    recognizedAnonymousTools: recognizedListedNames.sort(),
    unexpectedAnonymousToolCount: listedNames.length - recognizedListedNames.length,
    annotationsSafe,
    listWithinBudget,
    sourcedOutputSchemasClosed,
    sourcedOutputSchemaProblemCount: sourcedSchemaProblems.length,
  });
} else {
  failures.push(`tools/list: ${callFailure(listed)}`);
  emit('protocol_result', {
    stage: 'tools/list',
    ok: false,
    durationMs: listed.durationMs,
    ...(typeof listed.httpStatus === 'number' ? { httpStatus: listed.httpStatus } : {}),
    ...(typeof listed.responseBytes === 'number' ? { responseBytes: listed.responseBytes } : {}),
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

const resolverListings = [
  {
    marketRef: 'kalshi:caller-validation-fixture-a',
    venue: 'kalshi',
    title: 'Will Bitcoin be above $113,000 on Aug 21, 2026 at 5pm EDT?',
    closeTime: '2026-08-21T21:00:00Z',
  },
  {
    marketRef: 'polymarket:caller-validation-fixture-b',
    venue: 'polymarket',
    title: 'Bitcoin above $113,000 on August 21?',
    closeTime: '2026-08-21T23:59:00Z',
  },
];
await invokeTool(
  'wet_resolve',
  { listings: resolverListings },
  'clearly labelled caller-supplied synthetic text; no W.E.T. board, corpus, ledger, venue read, or asserted market value',
);

const attemptedNames = toolOutcomes.map((outcome) => outcome.tool);
if (!sameMembers(attemptedNames, PUBLIC_TOOLS)) failures.push('the run did not attempt each public tool exactly once');
const protocolSafeTools = toolOutcomes.filter((outcome) => outcome.protocolSafe).length;
const sourcedOutcomes = toolOutcomes.filter((outcome) => outcome.sourcedTool);
const sourceRightsPendingTools = sourcedOutcomes
  .filter((outcome) => outcome.sourceRightsPending)
  .map((outcome) => outcome.tool)
  .sort();
const usefulSourcedTools = sourcedOutcomes
  .filter((outcome) => outcome.usefulSourcedResult)
  .map((outcome) => outcome.tool)
  .sort();
const resolverUsable = toolOutcomes.some(
  (outcome) => outcome.tool === 'wet_resolve' && outcome.usefulCallerSuppliedResult === true,
);
const protocolConformant = failures.length === 0 && listOk && protocolSafeTools === PUBLIC_TOOLS.length;
const sourcedLaunchBlockers = SOURCE_RIGHTS_GATED_TOOLS.filter((tool) => !usefulSourcedTools.includes(tool)).map((tool) =>
  sourceRightsPendingTools.includes(tool)
    ? `${tool}: ${SOURCE_RIGHTS_REFUSAL}`
    : `${tool}: no useful sourced result`,
);
if (!resolverUsable) sourcedLaunchBlockers.push('wet_resolve: caller-supplied fixture did not produce a structural result');
const candidateBlockers = SOURCE_RIGHTS_GATED_TOOLS.filter((tool) => {
  const outcome = sourcedOutcomes.find((candidate) => candidate.tool === tool);
  return !outcome || (!outcome.usefulSourcedResult && !outcome.sourceRightsPending);
}).map((tool) => `${tool}: neither a useful sourced result nor the expected typed rights hold`);
if (!resolverUsable) candidateBlockers.push('wet_resolve: caller-supplied fixture did not produce a structural result');
candidateBlockers.push(...preflightFailures.map((failure) => `Gate 4: ${failure}`));
const launchBlockers = [
  ...preflightFailures.map((failure) => `Gate 4: ${failure}`),
  ...gate4Preflight.launchBlockers.map((blocker) => `Gate 4: ${blocker}`),
  ...sourcedLaunchBlockers,
];
const launchReady = protocolConformant && gate4LaunchReady && launchBlockers.length === 0;
const candidateProtocolPassed = protocolConformant && preflightConformant && candidateBlockers.length === 0;
const verificationPassed = options.candidateAllowSourceRightsPending ? candidateProtocolPassed : launchReady;
emit('run_summary', {
  ok: verificationPassed,
  verificationMode,
  verificationPassed,
  protocolConformant,
  preflightConformant,
  gate4LaunchReady,
  healthLaunchReady: gate4Preflight.healthLaunchReady,
  launchReady,
  completedAt: new Date().toISOString(),
  durationMs: roundMs(performance.now() - runStarted),
  toolsAttempted: toolOutcomes.length,
  protocolSafeTools,
  usefulSourcedToolCount: usefulSourcedTools.length,
  usefulSourcedTools,
  sourceRightsPendingToolCount: sourceRightsPendingTools.length,
  sourceRightsPendingTools,
  resolverUsable,
  preflightChecksPassed: preflightChecks.filter((check) => check.ok).length,
  preflightChecksTotal: preflightChecks.length,
  preflightFailures,
  gate4LaunchBlockers: gate4Preflight.launchBlockers,
  typedRefusalResults: toolOutcomes.filter((outcome) => outcome.result?.refused === true || outcome.result?.refusalCodes?.length > 0).length,
  ...(selectedEvent ? { followupEventIdSource: 'wet_search_events result from this run' } : { followupEventIdSource: 'none observed' }),
  protocolFailures: failures,
  launchBlockers,
  candidateBlockers,
  evidenceBoundary:
    'Evidence applies only to the selected endpoint and run time. Candidate or preview results do not prove production readiness; one run does not prove durable coverage, freshness, reliability, or source-rights clearance.',
});

if (!verificationPassed) process.exitCode = 1;
