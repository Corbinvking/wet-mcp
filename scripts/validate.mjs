#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://www.worldeventtrading.com/api/mcp';
const SERVER_NAME = 'com.worldeventtrading/prediction-markets';
const RELEASE_TITLE = 'World Event Trading (W.E.T.) — Prediction Market Intelligence';
const RELEASE_DESCRIPTION = 'Agent-safe prediction-market research with live books, verified identity, refusals and benchmarks.';
const RELEASE_TAGLINE = 'Prediction-market intelligence your agent can quote safely.';
const WEBSITE_URL = 'https://www.worldeventtrading.com/mcp';
const REPOSITORY_URL = 'https://github.com/Corbinvking/wet-mcp';
const ICON_URL = 'https://www.worldeventtrading.com/icon.png';
const PACKAGE_LICENSE = 'LicenseRef-WET-Integration-1.0';
const LEGACY_PROTOCOL_VERSION = '2025-06-18';
const SOURCE_RIGHTS_POLICY = 'mcp-source-rights/2026-09-05.phase1';
const SOURCE_RIGHTS_REFUSAL = 'source_rights_pending';
const ACCOUNT_OUTPUT_CONTRACT_REFUSAL = 'account_output_contract_pending';
const SOURCE_RIGHTS_FILTERING = 'coarse-all-rights-protected-sources';
const OUTPUT_CONTRACT_VERSION = 'wet-mcp-public-output/0.5.0';
const OUTPUT_CONTRACT_SHA256 = 'bf12adf28281632a32dc1c134ba99b1201ce95b2f9803e2b9004ab64b7c0ca2b';
const MCP_REGISTRY_DESCRIPTION_MAX_LENGTH = 100;
const MCP_REGISTRY_MANIFEST_CORE_SCHEMA = {
  type: 'object',
  required: ['name', 'description', 'version'],
  properties: {
    $schema: { type: 'string', format: 'uri' },
    _meta: { type: 'object' },
    name: {
      type: 'string',
      minLength: 3,
      maxLength: 200,
      pattern: '^[a-zA-Z0-9.-]+/[a-zA-Z0-9._-]+$',
    },
    title: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: MCP_REGISTRY_DESCRIPTION_MAX_LENGTH },
    version: { type: 'string', maxLength: 255 },
    websiteUrl: { type: 'string', format: 'uri' },
    repository: {
      type: 'object',
      required: ['url', 'source'],
      properties: {
        id: { type: 'string' },
        source: { type: 'string' },
        subfolder: { type: 'string' },
        url: { type: 'string', format: 'uri' },
      },
    },
    icons: {
      type: 'array',
      items: {
        type: 'object',
        required: ['src'],
        properties: {
          mimeType: {
            type: 'string',
            enum: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
          },
          sizes: {
            type: 'array',
            items: { type: 'string', pattern: '^(\\d+x\\d+|any)$' },
          },
          src: { type: 'string', format: 'uri', maxLength: 255 },
          theme: { type: 'string', enum: ['light', 'dark'] },
        },
      },
    },
    remotes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'url'],
        properties: {
          type: { type: 'string', enum: ['streamable-http', 'sse'] },
          url: { type: 'string', pattern: '^https?://[^\\s]+$' },
          variables: { type: 'object' },
        },
      },
    },
  },
};
const SOURCE_RIGHTS_GATED_TOOLS = [
  'wet_benchmark_value',
  'wet_search_events',
  'wet_screen_markets',
  'wet_event_markets',
  'wet_cross_venue',
  'wet_event_headlines',
];
const PUBLIC_TOOL_ORDER = [
  'wet_benchmark_value',
  'wet_search_events',
  'wet_screen_markets',
  'wet_event_markets',
  'wet_cross_venue',
  'wet_event_headlines',
  'wet_resolve',
];
const PUBLIC_TOOLS = [...PUBLIC_TOOL_ORDER].sort();

const REQUIRED_FILES = [
  '.claude-plugin/plugin.json',
  '.github/workflows/publish-registry.yml',
  '.github/workflows/validate-mcp.yml',
  '.github/workflows/validate.yml',
  '.mcp.json',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'DATA-SOURCES.md',
  'GEMINI.md',
  'LICENSE',
  'LIMITATIONS.md',
  'PRIVACY.md',
  'README.md',
  'SECURITY.md',
  'SUPPORT.md',
  'TERMS.md',
  'assets/cline-icon-400.png',
  'assets/demo/README.md',
  'assets/demo/negative-refusal-storyboard.md',
  'assets/demo/positive-55s-storyboard.md',
  'assets/icon-512.png',
  'assets/icon.png',
  'assets/release-evidence.template.json',
  'assets/screenshots/README.md',
  'clients/README.md',
  'clients/claude-code.json',
  'clients/cline.json',
  'clients/cursor.json',
  'clients/gemini-cli.json',
  'clients/goose.yaml',
  'clients/vscode.json',
  'clients/windsurf.json',
  'docker/servers/world-event-trading/readme.md',
  'docker/servers/world-event-trading/server.yaml',
  'docker/servers/world-event-trading/tools.json',
  'docs/DIRECTORY-SUBMISSION-WORKSHEET.md',
  'docs/authentication.md',
  'docs/coverage.md',
  'docs/freshness-and-quotes.md',
  'docs/identity-methodology.md',
  'docs/quickstart.md',
  'docs/refusal-contract.md',
  'docs/scanners.md',
  'docs/tools.md',
  'evals/VIEWS.md',
  'evals/cases.json',
  'evals/expected-invariants.md',
  'evals/machine-expectations.json',
  'evals/positive-cases.json',
  'evals/refusal-cases.json',
  'evals/run-result-schema.json',
  'evals/run-result-template.json',
  'evals/schema.json',
  'evals/score-run.mjs',
  'evidence/2026-09-05-release-candidate-offline-conformance.md',
  'examples/chatgpt.md',
  'examples/claude.md',
  'examples/client-configurations.md',
  'examples/cline.md',
  'examples/cursor.md',
  'examples/gemini-cli.md',
  'examples/goose.md',
  'examples/mcp-inspector.md',
  'examples/vscode.md',
  'examples/windsurf.md',
  'gemini-extension.json',
  'llms-install.md',
  'mcp.json',
  'plugin.json',
  'scripts/validate.mjs',
  'scripts/rollout-evidence.mjs',
  'scripts/rollout-evidence-verify.mjs',
  'scripts/release-package-verify.mjs',
  'scripts/verify-live.mjs',
  'server.json',
  'skills/wet-research/SKILL.md',
];

const args = new Set(process.argv.slice(2));
const releaseMode = args.has('--release');
if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: node scripts/validate.mjs [--release] [--live]

Without flags, validates the intentionally held package offline and fails closed
if active-release evidence is present. --release runs the same shared structural
and package checks with active semantics, requires actual release evidence, and
invokes scripts/release-package-verify.mjs.

--live  Also makes read-only requests to the configured hosted MCP endpoint and
        verifies its discovery document, version, anonymous tool list, and
        legacy Streamable HTTP initialize/tools-list flow.`);
  process.exit(0);
}

for (const arg of args) {
  if (arg !== '--live' && arg !== '--release') {
    console.error(`Unknown option: ${arg}`);
    console.error('Run with --help for usage.');
    process.exit(2);
  }
}

let passCount = 0;
let failCount = 0;

async function check(label, action) {
  try {
    await action();
    passCount += 1;
    console.log(`PASS ${label}`);
  } catch (error) {
    failCount += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${label}: ${message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function relative(file) {
  return path.relative(PACKAGE_ROOT, file).split(path.sep).join('/');
}

function valueAt(object, keys, label) {
  let value = object;
  for (const key of keys) {
    assert(isRecord(value) && key in value, `${label} is missing ${keys.join('.')}`);
    value = value[key];
  }
  return value;
}

function assertString(value, label) {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string`);
}

function isValidSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value) && !/^0{64}$/u.test(value);
}

function assertSourceRightsDescription(value, label) {
  assertString(value, label);
  if (releaseMode) {
    assert(!/\bmcp_release_held\b|\brelease (?:is )?held\b|\bdo not (?:install|configure|connect(?: to)?|call)\b/iu.test(value), `${label} must be active release copy`);
    return;
  }
  const normalized = value.toLowerCase();
  for (const marker of ['six', SOURCE_RIGHTS_REFUSAL, 'default-deny', 'wet_resolve']) {
    assert(normalized.includes(marker.toLowerCase()), `${label} must disclose ${marker}`);
  }
  assert(
    /(?:credentials? cannot bypass (?:the )?hold|no credential bypass)/iu.test(value),
    `${label} must reject credential bypass`,
  );
}

function assertSourceRightsRecord(value, label, { requireToolNames = true } = {}) {
  const requiredMarkers = releaseMode
    ? [SOURCE_RIGHTS_POLICY, SOURCE_RIGHTS_REFUSAL, 'default-deny']
    : [SOURCE_RIGHTS_POLICY, SOURCE_RIGHTS_REFUSAL, 'default-deny', 'wet_resolve'];
  for (const marker of requiredMarkers) {
    assert(value.includes(marker), `${label} must disclose ${marker}`);
  }
  assert(/(?:credential|API key|OAuth)/iu.test(value) && /bypass/iu.test(value), `${label} must reject credential bypass`);
  if (requireToolNames && !releaseMode) {
    for (const tool of SOURCE_RIGHTS_GATED_TOOLS) assert(value.includes(tool), `${label} must name held tool ${tool}`);
  }
}

function assertUrl(value, label, { https = true } = {}) {
  assertString(value, label);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid absolute URL: ${value}`);
  }
  if (https) assert(parsed.protocol === 'https:', `${label} must use HTTPS`);
  return parsed;
}

function assertSameMembers(actual, expected, label) {
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  assert(
    JSON.stringify(sortedActual) === JSON.stringify(sortedExpected),
    `${label} mismatch; expected ${sortedExpected.join(', ')}, received ${sortedActual.join(', ')}`,
  );
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

function resolveJsonPointer(rootSchema, ref) {
  assert(ref.startsWith('#/'), `only local JSON Schema references are supported, received ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((value, key) => {
      assert(isRecord(value) && key in value, `unresolved JSON Schema reference ${ref}`);
      return value[key];
    }, rootSchema);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateWithLocalSchema(value, definition, rootSchema, location = '$') {
  const errors = [];
  let schema = definition;
  if (typeof schema?.$ref === 'string') schema = resolveJsonPointer(rootSchema, schema.$ref);

  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  const typeMatches = types.length === 0 || types.some((type) =>
    (type === 'object' && isRecord(value)) ||
    (type === 'array' && Array.isArray(value)) ||
    (type === 'string' && typeof value === 'string') ||
    (type === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
    (type === 'integer' && Number.isInteger(value)) ||
    (type === 'boolean' && typeof value === 'boolean') ||
    (type === 'null' && value === null));
  if (!typeMatches) return [`${location} must be ${types.join(' or ')}`];

  if ('const' in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    errors.push(`${location} must equal the declared constant`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => JSON.stringify(candidate) === JSON.stringify(value))) {
    errors.push(`${location} is not in the declared enum`);
  }

  if (types.includes('object') && isRecord(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${location} is missing required property ${key}`);
    }
    const properties = isRecord(schema.properties) ? schema.properties : {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) errors.push(`${location}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(properties)) {
      if (key in value) errors.push(...validateWithLocalSchema(value[key], child, rootSchema, `${location}.${key}`));
    }
  }

  if (types.includes('array') && Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${location} must contain at least ${schema.minItems} items`);
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      errors.push(`${location} must contain at most ${schema.maxItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateWithLocalSchema(item, schema.items, rootSchema, `${location}[${index}]`));
      });
    }
  }

  if (types.includes('string') && typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${location} must contain at least ${schema.minLength} characters`);
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      errors.push(`${location} must contain at most ${schema.maxLength} characters`);
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
      errors.push(`${location} does not match ${schema.pattern}`);
    }
    if (schema.format === 'date' && !validDate(value)) errors.push(`${location} is not a valid calendar date`);
    if (schema.format === 'date-time' && !Number.isFinite(Date.parse(value))) {
      errors.push(`${location} is not a valid date-time`);
    }
    if (schema.format === 'uri') {
      try {
        new URL(value);
      } catch {
        errors.push(`${location} is not a valid absolute URI`);
      }
    }
    if (schema.format === 'uri-reference') {
      try {
        new URL(value, 'https://package.invalid/');
      } catch {
        errors.push(`${location} is not a URI reference`);
      }
    }
  }

  if ((types.includes('number') || types.includes('integer')) && typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) errors.push(`${location} is below minimum`);
    if (typeof schema.maximum === 'number' && value > schema.maximum) errors.push(`${location} is above maximum`);
  }

  return errors;
}

function markdownDestinations(markdown) {
  const destinations = [];
  const pattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
  for (const match of markdown.matchAll(pattern)) {
    let destination = match[1].trim();
    if (destination.startsWith('<') && destination.endsWith('>')) destination = destination.slice(1, -1);
    else destination = destination.split(/\s+["']/u, 1)[0];
    destinations.push(destination);
  }
  for (const match of markdown.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gmu)) {
    destinations.push(match[1].replace(/^<|>$/gu, ''));
  }
  return destinations;
}

function endpointReferences(text) {
  const urls = [...text.matchAll(/https?:\/\/[^\s<>`"')]+/giu)].map((match) => match[0]);
  return urls.filter((value) => {
    try {
      return new URL(value).pathname === '/api/mcp';
    } catch {
      return false;
    }
  });
}

async function fetchJson(url, init, label) {
  let response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    throw new Error(`${label} request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`${label} returned HTTP ${response.status} with a non-JSON body`);
  }
  assert(response.ok, `${label} returned HTTP ${response.status}: ${body.slice(0, 300)}`);
  return { response, json };
}

const files = await walk(PACKAGE_ROOT);
const jsonFiles = files.filter((file) => file.endsWith('.json')).sort();
const markdownFiles = files.filter((file) => file.toLowerCase().endsWith('.md')).sort();
const json = new Map();

await check('required package, client, CI, Docker, and asset inventory', async () => {
  const present = new Set(files.map(relative));
  const missing = REQUIRED_FILES.filter((file) => !present.has(file));
  assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  if (releaseMode) {
    assert(present.has('assets/release-evidence.json'), 'release validation requires contemporaneous assets/release-evidence.json');
  } else {
    assert(
      !present.has('assets/release-evidence.json'),
      'held-package validation must reject an actual release-evidence record; use only the explicit template until contemporaneous evidence exists',
    );
  }
  const caseGroups = new Map();
  for (const name of present) {
    const key = name.toLowerCase();
    caseGroups.set(key, [...(caseGroups.get(key) ?? []), name]);
  }
  const collisions = [...caseGroups.values()].filter((names) => names.length > 1);
  assert(collisions.length === 0, `case-colliding paths: ${collisions.map((names) => names.join(' / ')).join(', ')}`);
  for (const legacyCase of ['docs/AUTHENTICATION.md', 'docs/QUICKSTART.md', 'docs/SCANNERS.md', 'docs/TOOLS.md']) {
    assert(!present.has(legacyCase), `${legacyCase} must be represented only by its lowercase canonical path`);
  }
});

for (const file of jsonFiles) {
  await check(`JSON parses: ${relative(file)}`, async () => {
    const source = await readFile(file, 'utf8');
    const parsed = JSON.parse(source);
    json.set(relative(file), parsed);
  });
}

function packageJson(name) {
  const value = json.get(name);
  assert(value !== undefined, `${name} was not parsed`);
  return value;
}

let packageVersion = null;

await check('MCP Registry server manifest', async () => {
  const manifest = packageJson('server.json');
  const schemaErrors = validateWithLocalSchema(
    manifest,
    MCP_REGISTRY_MANIFEST_CORE_SCHEMA,
    MCP_REGISTRY_MANIFEST_CORE_SCHEMA,
  );
  assert(
    schemaErrors.length === 0,
    `server.json violates the official MCP Registry core schema constraints:\n${schemaErrors.join('\n')}`,
  );
  assert(manifest.$schema === 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json', 'unexpected MCP Registry schema');
  assert(manifest.name === SERVER_NAME, `unexpected server name ${manifest.name}`);
  assertString(manifest.title, 'server title');
  assertString(manifest.description, 'server description');
  assert(/^\d+\.\d+\.\d+$/.test(manifest.version), 'server version must be stable semantic versioning; Registry publication forbids prereleases');
  packageVersion = manifest.version;
  assertUrl(manifest.websiteUrl, 'server websiteUrl');
  assert(manifest.repository?.source === 'github', 'server repository source must be github');
  assertUrl(manifest.repository?.url, 'server repository URL');
  assert(Array.isArray(manifest.icons) && manifest.icons.length === 1, 'server manifest must advertise one icon');
  assert(manifest.icons[0].mimeType === 'image/png', 'server icon must be image/png');
  assertSameMembers(manifest.icons[0].sizes ?? [], ['512x512'], 'server icon sizes');
  assertUrl(manifest.icons[0].src, 'server icon URL');
  assert(Array.isArray(manifest.remotes) && manifest.remotes.length === 1, 'server manifest must have one remote');
  assert(manifest.remotes[0].type === 'streamable-http', 'server remote must use streamable-http');
  assert(manifest.remotes[0].url === ENDPOINT, `server remote must be ${ENDPOINT}`);
  assertSourceRightsDescription(manifest.description, 'server description');
  const publisherMeta = manifest._meta?.['io.modelcontextprotocol.registry/publisher-provided'];
  const access = publisherMeta?.access;
  assert(access?.research === 'keyless-read-only', 'research access must remain keyless-read-only');
  assert(access?.account === 'oauth-optional', 'account access must remain oauth-optional');
  const sourceRights = publisherMeta?.sourceRights;
  assert(sourceRights?.policyVersion === SOURCE_RIGHTS_POLICY, 'server source-rights policy mismatch');
  assert(sourceRights?.outputContractVersion === OUTPUT_CONTRACT_VERSION, 'server source-rights output-contract version mismatch');
  assert(sourceRights?.outputContractSha256 === OUTPUT_CONTRACT_SHA256, 'server source-rights output-contract digest mismatch');
  assert(sourceRights?.enforcement === 'default-deny', 'server source-rights enforcement must be default-deny');
  assert(sourceRights?.filtering === SOURCE_RIGHTS_FILTERING, 'server source-rights filtering mismatch');
  assert(sourceRights?.mixedSourceFiltering === false, 'server must disclose that mixed-source filtering is unavailable');
  if (releaseMode) {
    assert(manifest.title === RELEASE_TITLE, `release server title must be exactly ${RELEASE_TITLE}`);
    assert(manifest.description === RELEASE_DESCRIPTION, 'release server description must match the approved canonical copy exactly');
    assert(manifest.websiteUrl === WEBSITE_URL, `release server websiteUrl must be ${WEBSITE_URL}`);
    assert(manifest.repository?.source === 'github' && manifest.repository?.url === REPOSITORY_URL, `release repository must be ${REPOSITORY_URL}`);
    assert(manifest.icons[0]?.src === ICON_URL, `release server icon must be ${ICON_URL}`);
    assert(publisherMeta?.tagline === RELEASE_TAGLINE, 'release publisher tagline must match the approved canonical copy exactly');
    assert(publisherMeta?.releaseState === 'active', 'server releaseState must be active in release mode');
    assert(sourceRights?.rightsState === 'cleared', 'server source-rights state must be cleared in release mode');
    assert(isValidSha256(sourceRights?.grantSetSha256), 'server source-rights grant-set digest must be a nonzero lowercase SHA-256 in release mode');
    assertSameMembers(sourceRights?.heldTools ?? [], [], 'server held source-rights tools');
    assertSameMembers(sourceRights?.usableTools ?? [], PUBLIC_TOOLS, 'server release-usable public tools');
  } else {
    assert(manifest.title !== RELEASE_TITLE, 'held package must not use the approved active-release title');
    assert(manifest.description !== RELEASE_DESCRIPTION, 'held package must not use the approved active-release description');
    assert(publisherMeta?.tagline !== RELEASE_TAGLINE, 'held package must not use the approved active-release tagline');
    assert(publisherMeta?.releaseState === 'held', 'held package must declare exact releaseState: held');
    assert(sourceRights?.rightsState === 'pending', 'held package must declare exact source-rights state: pending');
    assert(sourceRights?.grantSetSha256 === null, 'held package must not claim a reviewed source-rights grant-set digest');
    assertSameMembers(sourceRights?.heldTools ?? [], SOURCE_RIGHTS_GATED_TOOLS, 'server held source-rights tools');
    assertSameMembers(sourceRights?.usableTools ?? [], ['wet_resolve'], 'server source-rights exceptions');
  }
  assert(sourceRights?.refusalCode === SOURCE_RIGHTS_REFUSAL, 'server source-rights refusal code mismatch');
  assert(sourceRights?.credentialBypass === false, 'server must forbid credential bypass');
});

await check('Agent Plugins, Claude, and Gemini manifests', async () => {
  const plugin = packageJson('plugin.json');
  const agentMcp = packageJson('mcp.json');
  const claude = packageJson('.claude-plugin/plugin.json');
  const gemini = packageJson('gemini-extension.json');
  assert(plugin.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'unexpected Agent Plugins plugin schema');
  assert(agentMcp.$schema === 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', 'unexpected Agent Plugins MCP schema');
  assert(claude.$schema === 'https://json.schemastore.org/claude-code-plugin-manifest.json', 'unexpected Claude plugin schema');
  for (const [name, manifest] of [
    ['plugin.json', plugin],
    ['.claude-plugin/plugin.json', claude],
    ['gemini-extension.json', gemini],
  ]) {
    assert(manifest.version === packageVersion, `${name} version must be ${packageVersion}`);
    assertString(manifest.name, `${name} name`);
    assertSourceRightsDescription(manifest.description, `${name} description`);
  }
  assert(plugin.license === PACKAGE_LICENSE, `plugin.json license must be ${PACKAGE_LICENSE}`);
  assert(claude.license === PACKAGE_LICENSE, `.claude-plugin/plugin.json license must be ${PACKAGE_LICENSE}`);
  assert(agentMcp.mcpServers?.wet?.type === 'streamable-http', 'mcp.json must use streamable-http');
  assert(agentMcp.mcpServers?.wet?.url === ENDPOINT, 'mcp.json endpoint mismatch');
  assert(claude.mcpServers === './.mcp.json', 'Claude manifest must reference the package-root .mcp.json');
  assert(gemini.contextFileName === 'GEMINI.md', 'Gemini manifest must reference GEMINI.md');
  await stat(path.join(PACKAGE_ROOT, claude.mcpServers));
  await stat(path.join(PACKAGE_ROOT, gemini.contextFileName));
});

await check('manifest and evaluation versions agree', async () => {
  assert(packageVersion !== null, 'server manifest did not establish a package version');
  const versionedJson = ['server.json', 'plugin.json', '.claude-plugin/plugin.json', 'gemini-extension.json', 'evals/cases.json'];
  for (const name of versionedJson) {
    assert(packageJson(name).version === packageVersion, `${name} version must be ${packageVersion}`);
  }
  const changelog = await readFile(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8');
  const newest = changelog.match(/^##\s+([^\s]+)/mu)?.[1];
  assert(newest === packageVersion, `newest changelog version must be ${packageVersion}, received ${newest ?? 'none'}`);
  const reviewer = await readFile(path.join(PACKAGE_ROOT, 'docs/REVIEWER-GUIDE.md'), 'utf8');
  assert(reviewer.includes(`version \`${packageVersion}\``), 'reviewer guide version does not match package version');
});

await check('standalone CI runs offline validation with opt-in live checks', async () => {
  const workflow = await readFile(path.join(PACKAGE_ROOT, '.github/workflows/validate.yml'), 'utf8');
  assert(/node-version:\s*22\s*$/mu.test(workflow), 'standalone CI must use Node.js 22');
  assert(workflow.includes('node --check scripts/verify-live.mjs'), 'standalone CI must syntax-check the clean-client proof');
  assert(workflow.includes('node --check scripts/rollout-evidence.mjs'), 'standalone CI must syntax-check the rollout reducer');
  assert(workflow.includes('node --check scripts/rollout-evidence-verify.mjs'), 'standalone CI must syntax-check rollout fixtures');
  assert(workflow.includes('node --check scripts/release-package-verify.mjs'), 'standalone CI must syntax-check the release verifier');
  assert(workflow.includes('node scripts/rollout-evidence-verify.mjs'), 'standalone CI must run the offline rollout fixtures');
  assert(workflow.includes('node scripts/validate.mjs "${validation_args[@]}"'), 'standalone CI must run the mode-selected validator');
  assert(workflow.includes('validation_args=(--live)'), 'standalone CI must expose the live validator');
  assert(/workflow_dispatch:[\s\S]*?release_readiness:[\s\S]*?type:\s*boolean/mu.test(workflow), 'non-authorizing release-readiness validation must be an explicit boolean workflow-dispatch input');
  assert(workflow.includes('Run non-authorizing active-release readiness validation'), 'release-readiness input must state that it cannot authorize publication');
  assert(/-f assets\/release-evidence\.json[\s\S]*validation_args\+=\(--release\)/u.test(workflow), 'active release evidence must select matching validation semantics on push and pull request');
  assert(/permissions:\s*\r?\n\s{2}contents:\s*read\s*$/mu.test(workflow), 'validation CI must retain read-only repository permissions');
  assert(workflow.includes('persist-credentials: false'), 'validation CI checkout must not persist GitHub credentials');
  assert(!/mcp-publisher publish|id-token:\s*write|contents:\s*write|packages:\s*write|secrets\./u.test(workflow), 'validation CI must have no publication command, write permission, or secret access');
  assert(
    /-f assets\/release-evidence\.json[\s\S]*node evals\/score-run\.mjs evals\/latest-release-run\.json[\s\S]*else[\s\S]*node evals\/score-run\.mjs evals\/run-result-template\.json --allow-incomplete/u.test(workflow),
    'standalone CI must fully score release evidence while keeping the held template explicitly incomplete',
  );
  assert(workflow.includes('node scripts/verify-live.mjs'), 'standalone CI must expose the seven-tool clean-client proof');
  assert(/workflow_dispatch:[\s\S]*?live:[\s\S]*?type:\s*boolean/mu.test(workflow), 'live validation must be an explicit boolean workflow-dispatch input');
  assert(/workflow_dispatch:[\s\S]*?endpoint:[\s\S]*?type:\s*string/mu.test(workflow), 'clean-client CI must accept a preview endpoint');
  assert(/workflow_dispatch:[\s\S]*?candidate_protocol_only:[\s\S]*?type:\s*boolean/mu.test(workflow), 'clean-client CI must expose an explicit candidate-only mode');
  assert(/github\.event_name == 'workflow_dispatch' && inputs\.live/u.test(workflow), 'live CI job must be manually gated');
  assert(/WET_MCP_ENDPOINT:\s*\$\{\{ inputs\.endpoint \}\}/u.test(workflow), 'clean-client CI must pass the selected endpoint as data');
  assert(workflow.includes('node scripts/verify-live.mjs --candidate-allow-source-rights-pending'), 'clean-client CI must keep candidate proof explicit');
  assert(/!inputs\.candidate_protocol_only[\s\S]*node scripts\/verify-live\.mjs/u.test(workflow), 'default live CI must run full launch readiness');

  const compatibilityWorkflow = await readFile(
    path.join(PACKAGE_ROOT, '.github/workflows/validate-mcp.yml'),
    'utf8',
  );
  for (const marker of [
    'node-version: 22',
    'node --check scripts/verify-live.mjs',
    'node --check scripts/rollout-evidence.mjs',
    'node --check scripts/rollout-evidence-verify.mjs',
    'node --check scripts/release-package-verify.mjs',
    'node scripts/rollout-evidence-verify.mjs',
    'node scripts/validate.mjs "${validation_args[@]}"',
    'validation_args=(--live)',
    'node scripts/verify-live.mjs',
    'node scripts/verify-live.mjs --candidate-allow-source-rights-pending',
    'release_readiness:',
    'candidate_protocol_only:',
    '-f assets/release-evidence.json',
    'validation_args+=(--release)',
    'node evals/score-run.mjs evals/latest-release-run.json',
    'node evals/score-run.mjs evals/run-result-template.json --allow-incomplete',
    'WET_MCP_ENDPOINT: ${{ inputs.endpoint }}',
  ]) {
    assert(compatibilityWorkflow.includes(marker), `validate-mcp.yml is missing ${marker}`);
  }
  assert(
    /workflow_dispatch:[\s\S]*?live:[\s\S]*?type:\s*boolean/mu.test(compatibilityWorkflow),
    'validate-mcp.yml must retain the explicit live-check gate',
  );
  assert(
    /workflow_dispatch:[\s\S]*?candidate_protocol_only:[\s\S]*?type:\s*boolean/mu.test(compatibilityWorkflow),
    'validate-mcp.yml must retain the explicit candidate-only gate',
  );
  assert(
    /workflow_dispatch:[\s\S]*?release_readiness:[\s\S]*?type:\s*boolean/mu.test(compatibilityWorkflow),
    'validate-mcp.yml must retain the explicit non-authorizing release-readiness gate',
  );
  assert(
    compatibilityWorkflow.includes('Run non-authorizing active-release readiness validation') &&
      /permissions:\s*\r?\n\s{2}contents:\s*read\s*$/mu.test(compatibilityWorkflow) &&
      compatibilityWorkflow.includes('persist-credentials: false') &&
      !/mcp-publisher publish|id-token:\s*write|contents:\s*write|packages:\s*write|secrets\./u.test(compatibilityWorkflow),
    'validate-mcp.yml release-readiness mode must be explicitly non-authorizing, read-only, credential-free, and unable to publish',
  );
  assert(
    !/^\s*(?:push|pull_request):/mu.test(compatibilityWorkflow),
    'validate-mcp.yml must remain manual so it does not duplicate canonical push or pull-request CI',
  );
});

await check('official registry publishing is pinned and domain-authenticated', async () => {
  const workflow = await readFile(
    path.join(PACKAGE_ROOT, '.github/workflows/publish-registry.yml'),
    'utf8',
  );
  const liveVerifier = await readFile(path.join(PACKAGE_ROOT, 'scripts/verify-live.mjs'), 'utf8');
  assert(
    workflow.includes('actions/checkout@11d5960a326750d5838078e36cf38b85af677262') &&
      workflow.includes('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020'),
    'registry workflow GitHub actions must be pinned to immutable commits',
  );
  assert(
    /environment:\s*mcp-registry-production\s*$/mu.test(workflow),
    'registry publishing must use the owner-protected production environment',
  );
  assert(
    /on:\s*\r?\n\s{2}workflow_dispatch:/u.test(workflow) &&
      !/^\s*push:/mu.test(workflow) &&
      /confirmation:[\s\S]*required:\s*true[\s\S]*type:\s*string/u.test(workflow) &&
      workflow.includes('expected_confirmation="PUBLISH ${manifest_name}@${release_tag}"') &&
      workflow.includes('test "$PUBLISH_CONFIRMATION" = "$expected_confirmation"'),
    'Registry publication must be manual-only and require the exact manifest-bound confirmation phrase',
  );
  assert(
    workflow.includes('test "$GITHUB_EVENT_NAME" = "workflow_dispatch"') &&
      workflow.includes('test "$GITHUB_REF" = "refs/heads/main"') &&
      workflow.includes('process.env.GITHUB_ACTOR.toLowerCase() !== owner') &&
      workflow.includes('process.env.GITHUB_TRIGGERING_ACTOR.toLowerCase() !== owner') &&
      workflow.includes('${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/branches/main') &&
      workflow.includes('branch.protected !== true') &&
      workflow.includes('${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/environments/mcp-registry-production') &&
      workflow.includes("rule?.type === 'required_reviewers'") &&
      workflow.includes('environment.deployment_branch_policy?.protected_branches !== true') &&
      workflow.includes('needs: preflight'),
    'a secret-free preflight must bind owner, main, branch protection, required environment review, and the publish job',
  );
  assert(
    workflow.includes('group: mcp-registry-publish') &&
      !workflow.includes('group: mcp-registry-publish-${{ github.ref }}'),
    'Registry publication must be serialized across every version and rerun',
  );
  assert(
    workflow.includes('test "$(git rev-parse "refs/tags/${release_tag}^{commit}")" = "$GITHUB_SHA"') &&
      workflow.includes('Recheck exact main and tag after environment approval') &&
      workflow.includes('remote_tag_ref="refs/registry-verified-tags/${RELEASE_TAG}"') &&
      workflow.includes('git update-ref -d "$remote_tag_ref" || true') &&
      workflow.includes('git fetch --no-tags origin "+refs/tags/${RELEASE_TAG}:${remote_tag_ref}"') &&
      workflow.includes('test "$(git rev-parse "${remote_tag_ref}^{commit}")" = "$GITHUB_SHA"'),
    'the exact version tag must peel to the dispatched main SHA initially and be freshly fetched from origin after environment approval',
  );
  assert(
    workflow.includes('${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/releases/tags/${RELEASE_TAG}') &&
      workflow.includes('release.tag_name !== expectedTag') &&
      workflow.includes('release.draft !== false') &&
      workflow.includes('release.prerelease !== false') &&
      workflow.includes('Date.parse(release.published_at)') &&
      workflow.includes('Recheck the published GitHub Release after environment approval'),
    'Registry publishing must require and recheck a published, non-draft, non-prerelease GitHub Release for the exact tag',
  );
  assert(
    workflow.includes('run: node scripts/validate.mjs --release') &&
      workflow.includes('run: node scripts/release-package-verify.mjs') &&
      !/^\s*run:\s*node scripts\/validate\.mjs\s*$/mu.test(workflow),
    'registry publishing must use release-mode package validation and retain the explicit active-release verifier',
  );
  assert(
    workflow.includes('test -f evals/latest-release-run.json') &&
      workflow.includes('node evals/score-run.mjs evals/latest-release-run.json') &&
      !workflow.includes('score-run.mjs evals/latest-release-run.json --allow-incomplete') &&
      workflow.includes('WET_EVALUATED_DEPLOYMENT_SHA=%s') &&
      !workflow.includes('test "$evaluated_commit" = "$(git rev-parse HEAD)"'),
    'registry publishing must require completed eval evidence bound to a deployed application revision',
  );
  assert(
    workflow.includes('run: node scripts/verify-live.mjs --expected-deployment-sha "$WET_EVALUATED_DEPLOYMENT_SHA"') &&
      !workflow.includes('verify-live.mjs --candidate-allow-source-rights-pending'),
    'registry publishing must require full canonical production readiness for the evaluated deployment',
  );
  assert(
    liveVerifier.includes("arg === '--expected-deployment-sha'") &&
      liveVerifier.includes('statusPayload?.deployment') &&
      liveVerifier.includes('deploymentShaMatches'),
    'live verifier must compare the evaluated application SHA with the canonical status document',
  );
  assert(workflow.includes('MCP_PUBLISHER_VERSION: v1.8.1'), 'publisher release must be pinned');
  assert(
    workflow.includes('a06c9096dcb9727c13555b6be26c7effa707b01f06a4c561ba7a3635443cf2cc'),
    'publisher archive checksum must be pinned',
  );
  assert(workflow.includes('sha256sum --check --strict'), 'publisher archive checksum must be verified');
  assert(
    workflow.includes('./mcp-publisher validate'),
    'official publisher must validate server.json before registry authentication',
  );
  assert(
    workflow.includes('login dns') &&
      workflow.includes('--domain worldeventtrading.com') &&
      !workflow.includes('login http'),
    'publisher must authenticate the domain namespace with apex DNS proof, not redirect-sensitive HTTP proof',
  );
  assert(
    workflow.includes('secrets.MCP_REGISTRY_ENV_PRIVATE_KEY') &&
      !workflow.includes('secrets.MCP_REGISTRY_PRIVATE_KEY'),
    'publisher must use the environment-only key name and cannot fall back to the repository-level secret name',
  );
  assert(workflow.includes('./mcp-publisher publish'), 'publisher workflow must publish server.json');
  assert(
    workflow.includes('registry.modelcontextprotocol.io/v0.1/servers'),
    'publisher workflow must verify the resulting registry record',
  );
  const orderedGates = [
    'Require owner dispatch, protected main, and a protected release environment',
    'Validate the active-release integration package before approval',
    'Require a published GitHub Release for the exact tagged commit',
    'Recheck exact main and tag after environment approval',
    'Recheck the published GitHub Release after environment approval',
    'Revalidate release closure after environment approval',
    'run: node scripts/release-package-verify.mjs',
    'node evals/score-run.mjs evals/latest-release-run.json',
    'run: node scripts/verify-live.mjs --expected-deployment-sha "$WET_EVALUATED_DEPLOYMENT_SHA"',
    './mcp-publisher validate',
    './mcp-publisher login dns',
    './mcp-publisher publish',
    'registry.modelcontextprotocol.io/v0.1/servers',
  ].map((marker) => workflow.indexOf(marker));
  assert(
    orderedGates.every((position) => position >= 0) &&
      orderedGates.every((position, index) => index === 0 || position > orderedGates[index - 1]),
    'Registry authorization, release closure, tag/Release recheck, eval, live, authentication, publish, and verification gates must stay ordered',
  );
});

await check('active-release verifier is fail-closed and its evidence template is non-evidentiary', async () => {
  const verifier = await readFile(path.join(PACKAGE_ROOT, 'scripts/release-package-verify.mjs'), 'utf8');
  const template = packageJson('assets/release-evidence.template.json');
  assert(RELEASE_TITLE.length <= 100, 'approved release title exceeds the official Registry limit');
  assert(RELEASE_DESCRIPTION.length <= MCP_REGISTRY_DESCRIPTION_MAX_LENGTH, 'approved release description exceeds the official Registry limit');
  assert(template.templateOnly === true, 'release-evidence template must remain explicitly template-only');
  assert(template.schemaVersion === 'wet.release-evidence/v3', 'release-evidence template schema version mismatch');
  assert(template.serverName === SERVER_NAME, 'release-evidence template server name mismatch');
  assert(template.releaseTitle === RELEASE_TITLE, 'release-evidence template title mismatch');
  assert(template.releaseDescription === RELEASE_DESCRIPTION, 'release-evidence template description mismatch');
  assert(template.releaseTagline === RELEASE_TAGLINE, 'release-evidence template tagline mismatch');
  assert(template.websiteUrl === WEBSITE_URL, 'release-evidence template website URL mismatch');
  assert(template.repositoryUrl === REPOSITORY_URL, 'release-evidence template repository URL mismatch');
  assert(template.iconUrl === ICON_URL, 'release-evidence template icon URL mismatch');
  assert(template.preparedAt === 'REPLACE_WITH_UTC_TIMESTAMP', 'release-evidence template preparedAt must remain a replacement sentinel');
  assert(template.sourceRights?.policyVersion === SOURCE_RIGHTS_POLICY, 'release-evidence template rights policy mismatch');
  assert(template.sourceRights?.outputContractVersion === OUTPUT_CONTRACT_VERSION, 'release-evidence template output-contract version mismatch');
  assert(template.sourceRights?.outputContractSha256 === OUTPUT_CONTRACT_SHA256, 'release-evidence template output-contract digest mismatch');
  assert(template.sourceRights?.grantSetSha256 === 'REPLACE_WITH_LOWERCASE_SHA256', 'release-evidence template grant-set digest must remain a replacement sentinel');
  assert(template.sourceRights?.reviewedByRole === 'REPLACE_WITH_REVIEWER_ROLE', 'release-evidence template source-rights role must remain a replacement sentinel');
  assert(template.sourceRights?.reviewedByLogin === 'REPLACE_WITH_GITHUB_LOGIN', 'release-evidence template source-rights login must remain a replacement sentinel');
  for (const field of ['reviewedAt', 'effectiveAt']) {
    assert(template.sourceRights?.[field] === 'REPLACE_WITH_UTC_TIMESTAMP', `release-evidence template sourceRights.${field} must remain a replacement sentinel`);
  }
  assert(template.sourceRights?.expiresAt === null, 'release-evidence template sourceRights.expiresAt must default to null for no expiry');
  assert(template.sourceRights?.evidenceRef === 'REPLACE_WITH_DURABLE_EVIDENCE_REF', 'release-evidence template rights reference must remain a replacement sentinel');
  assert(template.evaluation?.reportPath === 'evals/latest-release-run.json', 'release-evidence template eval path mismatch');
  assert(template.evaluation?.reportSha256 === 'REPLACE_WITH_LOWERCASE_SHA256', 'release-evidence template eval digest must remain a replacement sentinel');
  assert(template.evaluation?.artifactSchemaVersion === 'wet.eval-raw-artifacts/v2', 'release-evidence template raw-eval schema mismatch');
  assert(template.evaluation?.artifactDirectory === 'evals/release-artifacts', 'release-evidence template raw-eval directory mismatch');
  assert(Array.isArray(template.evaluation?.artifacts) && template.evaluation.artifacts.length === 0, 'release-evidence template raw-eval artifact list must remain empty and non-evidentiary');
  assert(template.review?.status === 'not-approved', 'release-evidence template must remain not approved');
  assert(template.review?.reviewedByRole === 'owner', 'release-evidence template final reviewer must remain the owner');
  assert(template.review?.reviewedByLogin === 'REPLACE_WITH_GITHUB_LOGIN', 'release-evidence template owner login must remain a replacement sentinel');
  assert(template.review?.reviewedAt === 'REPLACE_WITH_UTC_TIMESTAMP', 'release-evidence template owner timestamp must remain a replacement sentinel');
  assertSameMembers(
    template.demos?.map((entry) => entry.kind),
    ['positive-index-workflow', 'typed-refusal'],
    'release-evidence template demo kinds',
  );
  assertSameMembers(
    template.screenshots?.map((entry) => entry.kind),
    ['anonymous-tools-list', 'positive-index-workflow', 'typed-refusal'],
    'release-evidence template screenshot kinds',
  );
  for (const entry of [...(template.demos ?? []), ...(template.screenshots ?? [])]) {
    assert(entry.publicDisplayApproved === false && entry.redacted === false, `${entry.kind} template flags must remain false`);
    assert(/^REPLACE_WITH_/u.test(entry.sha256), `${entry.kind} template digest must remain a replacement sentinel`);
  }
  assert(
    verifier.includes("const RELEASE_EVIDENCE = 'assets/release-evidence.json'") &&
      verifier.includes("publisher.releaseState !== 'active'") &&
      verifier.includes("rights.rightsState !== 'cleared'") &&
      verifier.includes('rights.outputContractSha256 !== OUTPUT_CONTRACT_SHA256') &&
      verifier.includes('validSha256(rights.grantSetSha256)') &&
      verifier.includes('rights.heldTools.length !== 0') &&
      verifier.includes('sameMembers(rights.usableTools, PUBLIC_TOOLS)') &&
      verifier.includes("evaluation.status !== 'completed'") &&
      verifier.includes("'evals/score-run.mjs'") &&
      verifier.includes('releaseEvidence.evaluation?.reportSha256 !== evaluationSha256') &&
      verifier.includes('inspectEvaluationArtifacts') &&
      verifier.includes('digest !== expectedArtifact.reportSha256') &&
      verifier.includes('callValue.evidenceRef !== toolPath') &&
      verifier.includes('deriveToolResultClaims') &&
      verifier.includes('toolClaimsMatchReport') &&
      verifier.includes('evaluation-derived-claims') &&
      verifier.includes('MAX_EVAL_TOOL_RESULT_BYTES') &&
      verifier.includes('sensitiveArtifactFinding') &&
      verifier.includes('artifact.redacted !== true || artifact.publicDisplayApproved !== true') &&
      verifier.includes('validatePngBytes(bytes)') &&
      verifier.includes('inflateSync(Buffer.concat(idatParts)') &&
      verifier.includes('const actualCrc = crc32(') &&
      verifier.includes('validateMp4Bytes(bytes, entry.durationSeconds)') &&
      verifier.includes('validateVideoTrack(bytes, trak, mdats)') &&
      verifier.includes("!== 'vide'") &&
      verifier.includes('sampleIndex !== sampleCount') &&
      verifier.includes('inspectEvidenceDirectoryInventory') &&
      verifier.includes('REPOSITORY_OWNER_LOGIN.toLowerCase()') &&
      verifier.includes("releaseEvidence.review?.status !== 'approved'"),
    'release verifier must bind canonical listing copy, active metadata, current rights/eval digests, all seven usable tools, structured approved captures, and owner approval',
  );

  const activeAttempt = spawnSync(
    process.execPath,
    [path.join(PACKAGE_ROOT, 'scripts/release-package-verify.mjs')],
    { encoding: 'utf8' },
  );
  if (releaseMode) {
    assert(
      activeAttempt.status === 0 && activeAttempt.stdout.includes('Release-package verification passed'),
      `active release verifier failed: ${activeAttempt.stderr || activeAttempt.stdout}`,
    );
  } else {
    const selfTest = spawnSync(
      process.execPath,
      [path.join(PACKAGE_ROOT, 'scripts/release-package-verify.mjs'), '--self-test'],
      { encoding: 'utf8' },
    );
    assert(
      selfTest.status === 0 && selfTest.stdout.includes('SELF-TEST PASS'),
      `release verifier self-test failed: ${selfTest.stderr || selfTest.stdout}`,
    );
    const activeOutput = `${activeAttempt.stdout}\n${activeAttempt.stderr}`;
    for (const code of [
      'release-listing',
      'release-tagline',
      'release-state',
      'source-rights-evidence',
      'manifest-held-tools',
      'listing-hold-copy',
      'current-hold-copy',
      'evaluation-evidence',
      'evaluation-artifacts',
      'capture-evidence-missing',
    ]) {
      assert(activeOutput.includes(`[${code}]`), `held release-verifier result is missing blocker code: ${code}`);
    }
    assert(activeAttempt.status !== 0, 'default active-release verification must fail against the held candidate');
  }
});

await check('client configurations use the canonical endpoint', async () => {
  const connections = [
    ['.mcp.json', ['mcpServers', 'wet', 'url'], ['mcpServers', 'wet', 'type'], 'http'],
    ['clients/claude-code.json', ['mcpServers', 'wet', 'url'], ['mcpServers', 'wet', 'type'], 'http'],
    ['clients/cline.json', ['mcpServers', 'wet', 'url'], ['mcpServers', 'wet', 'type'], 'streamableHttp'],
    ['clients/cursor.json', ['mcpServers', 'wet', 'url'], null, null],
    ['clients/gemini-cli.json', ['mcpServers', 'wet', 'httpUrl'], null, null],
    ['clients/vscode.json', ['servers', 'wet', 'url'], ['servers', 'wet', 'type'], 'http'],
    ['clients/windsurf.json', ['mcpServers', 'wet', 'serverUrl'], null, null],
    ['gemini-extension.json', ['mcpServers', 'wet', 'httpUrl'], null, null],
    ['mcp.json', ['mcpServers', 'wet', 'url'], ['mcpServers', 'wet', 'type'], 'streamable-http'],
  ];
  for (const [name, endpointPath, typePath, expectedType] of connections) {
    const manifest = packageJson(name);
    assert(valueAt(manifest, endpointPath, name) === ENDPOINT, `${name} endpoint mismatch`);
    if (typePath) assert(valueAt(manifest, typePath, name) === expectedType, `${name} transport mismatch`);
  }

  const goose = await readFile(path.join(PACKAGE_ROOT, 'clients/goose.yaml'), 'utf8');
  assert(/^extensions:\s*$/mu.test(goose), 'Goose config must define extensions');
  assert(/^\s{2}wet:\s*$/mu.test(goose), 'Goose config must define the wet extension');
  assert(/^\s{4}type:\s*streamable_http\s*$/mu.test(goose), 'Goose transport must be streamable_http');
  assert(new RegExp(`^\\s{4}uri:\\s*${ENDPOINT.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*$`, 'mu').test(goose), 'Goose endpoint mismatch');
  assert(/^\s{4}enabled:\s*true\s*$/mu.test(goose), 'Goose extension must be enabled');

  const clientReadme = await readFile(path.join(PACKAGE_ROOT, 'clients/README.md'), 'utf8');
  for (const [client, marker] of [
    ['Claude Code', 'claude-code.json'],
    ['Cline', 'cline.json'],
    ['Cursor', 'cursor.json'],
    ['Gemini CLI', 'gemini-cli.json'],
    ['Goose', 'goose.yaml'],
    ['VS Code', 'vscode.json'],
    ['Windsurf', 'windsurf.json'],
  ]) {
    assert(clientReadme.includes(marker), `clients/README.md does not advertise ${client} via ${marker}`);
  }
  assertSourceRightsRecord(clientReadme, 'clients/README.md', { requireToolNames: false });

  const markdownExamples = [
    ['examples/claude.md', 'clients/claude-code.json'],
    ['examples/chatgpt.md', 'developers.openai.com/plugins/deploy/connect-chatgpt'],
    ['examples/cursor.md', 'clients/cursor.json'],
    ['examples/vscode.md', 'clients/vscode.json'],
    ['examples/cline.md', 'clients/cline.json'],
    ['examples/windsurf.md', 'clients/windsurf.json'],
    ['examples/gemini-cli.md', 'clients/gemini-cli.json'],
    ['examples/goose.md', 'clients/goose.yaml'],
    ['examples/mcp-inspector.md', '@modelcontextprotocol/inspector'],
  ];
  for (const [name, canonicalMarker] of markdownExamples) {
    const source = await readFile(path.join(PACKAGE_ROOT, name), 'utf8');
    assert(source.includes(ENDPOINT), `${name} endpoint mismatch`);
    assert(source.includes(canonicalMarker), `${name} does not delegate to ${canonicalMarker}`);
    assert(/record .*(?:version|UTC)|record the .*version and UTC/iu.test(source), `${name} must require dated client evidence`);
    assertSourceRightsRecord(source, name, { requireToolNames: false });
  }

  const exampleIndex = await readFile(path.join(PACKAGE_ROOT, 'examples/client-configurations.md'), 'utf8');
  assert(exampleIndex.includes(ENDPOINT), 'examples/client-configurations.md endpoint mismatch');
  assertSourceRightsRecord(exampleIndex, 'examples/client-configurations.md', { requireToolNames: false });
  for (const marker of ['claude-code.json', 'cline.json', 'cursor.json', 'gemini-cli.json', 'goose.yaml', 'mcp-inspector.md', 'vscode.json', 'windsurf.json']) {
    assert(exampleIndex.includes(marker), `examples/client-configurations.md is missing ${marker}`);
  }
});

await check('configuration endpoints are canonical and local evidence endpoints are bounded', async () => {
  let referenceCount = 0;
  for (const file of files.filter((candidate) => /\.(?:json|md|ya?ml)$/iu.test(candidate))) {
    const source = await readFile(file, 'utf8');
    const fileName = relative(file);
    for (const reference of endpointReferences(source)) {
      referenceCount += 1;
      const boundedLoopbackEvidence =
        fileName.startsWith('evidence/') &&
        /^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?\/api\/mcp\/?$/iu.test(reference);
      assert(
        reference === ENDPOINT || boundedLoopbackEvidence,
        `${fileName} contains a non-canonical MCP endpoint outside the local-evidence exception: ${reference}`,
      );
      if (boundedLoopbackEvidence) {
        assert(
          /local release-candidate evidence only[\s\S]*does not establish[\s\S]*launch\s+readiness/iu.test(source) &&
            /not the canonical advertised host/iu.test(source),
          `${fileName} must identify a loopback endpoint as non-canonical local evidence`,
        );
      }
    }
  }
  assert(referenceCount >= 10, `expected package-wide endpoint references, found only ${referenceCount}`);
});

await check('evaluation cases conform to evals/schema.json', async () => {
  const schema = packageJson('evals/schema.json');
  const cases = packageJson('evals/cases.json');
  const positiveView = packageJson('evals/positive-cases.json');
  const refusalView = packageJson('evals/refusal-cases.json');
  const machineExpectations = packageJson('evals/machine-expectations.json');
  const runResultSchema = packageJson('evals/run-result-schema.json');
  const runResultTemplate = packageJson('evals/run-result-template.json');
  assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', 'evaluation schema must use JSON Schema 2020-12');
  assert(schema.additionalProperties === false, 'evaluation schema must reject unknown top-level properties');
  assert(isRecord(schema.properties?.$schema), 'evaluation schema must allow the cases.json $schema property');
  assert(cases.$schema === './schema.json', 'cases.json must reference ./schema.json');
  const errors = validateWithLocalSchema(cases, schema, schema);
  assert(errors.length === 0, errors.join('; '));
  assert(
    cases.principles.some(
      (principle) =>
        principle.includes(SOURCE_RIGHTS_POLICY) &&
        principle.includes(SOURCE_RIGHTS_REFUSAL) &&
        principle.includes('wet_resolve') &&
        (releaseMode || principle.includes('post-clearance targets')),
    ),
    releaseMode
      ? 'eval principles must retain the active source-rights and resolver boundaries'
      : 'eval principles must distinguish the production release hold from candidate source-rights behavior and the future resolver exception',
  );
  assert(Array.isArray(positiveView), 'evals/positive-cases.json must be an array');
  assert(Array.isArray(refusalView), 'evals/refusal-cases.json must be an array');
  assert(
    JSON.stringify(positiveView) === JSON.stringify(cases.positive),
    'evals/positive-cases.json must be an exact view of cases.json#/positive',
  );
  assert(
    JSON.stringify(refusalView) === JSON.stringify(cases.negative),
    'evals/refusal-cases.json must be an exact view of cases.json#/negative',
  );

  const allCases = [...cases.positive, ...cases.negative];
  const ids = allCases.map((entry) => entry.id);
  assert(new Set(ids).size === ids.length, 'evaluation case ids must be unique');
  assert(
    machineExpectations.schemaVersion === 'wet.eval-machine-expectations/v1',
    'machine expectations version mismatch',
  );
  assertSameMembers(Object.keys(machineExpectations.cases ?? {}), ids, 'machine expectation case ids');
  for (const entry of allCases) {
    const expectation = machineExpectations.cases?.[entry.id];
    assert(isRecord(expectation), `${entry.id} has no machine expectation`);
    assert(
      expectation.toolSequence === 'exact' || expectation.toolSequence === 'ordered-subsequence',
      `${entry.id} has an invalid toolSequence policy`,
    );
    assert(Array.isArray(expectation.requiredCitationFields), `${entry.id} citation fields must be an array`);
    assert(
      expectation.requiredCitationFields.every((field) => ['source_url', 'venue', 'timestamp'].includes(field)),
      `${entry.id} contains an unsupported citation field`,
    );
    assert(Array.isArray(expectation.requiredRefusalCodes), `${entry.id} refusal codes must be an array`);
  }
  assert(
    runResultSchema.$schema === 'https://json-schema.org/draft/2020-12/schema' &&
      runResultSchema.additionalProperties === false,
    'run-result schema must be a closed JSON Schema 2020-12 document',
  );
  const runTemplateErrors = validateWithLocalSchema(runResultTemplate, runResultSchema, runResultSchema);
  assert(runTemplateErrors.length === 0, runTemplateErrors.join('; '));
  assert(runResultTemplate.status === 'not-run', 'the committed eval template must remain explicitly not-run');
  assertSameMembers(runResultTemplate.cases.map((entry) => entry.id), ids, 'run-result template case ids');
  for (const entry of allCases) {
    const templateCase = runResultTemplate.cases.find((candidate) => candidate.id === entry.id);
    assert(templateCase.view === (cases.positive.includes(entry) ? 'positive' : 'refusal'), `${entry.id} template view mismatch`);
    assert(
      JSON.stringify(templateCase.assertions.map((assertion) => assertion.text)) === JSON.stringify(entry.assertions),
      `${entry.id} template assertions drifted from cases.json`,
    );
  }
  const scoreRunner = await readFile(path.join(PACKAGE_ROOT, 'evals/score-run.mjs'), 'utf8');
  for (const marker of ['orderedSubsequence', 'requiredCitationFields', 'requiredRefusalCodes', 'positiveMinimum: 0.9', 'refusalMinimum: 1']) {
    assert(scoreRunner.includes(marker), `eval score runner is missing deterministic check marker ${marker}`);
  }
  const toolDoc = await readFile(path.join(PACKAGE_ROOT, 'docs/tools.md'), 'utf8');
  const documentedTools = new Set([...toolDoc.matchAll(/`(wet_[a-z0-9_]+)`/gu)].map((match) => match[1]));
  for (const tool of PUBLIC_TOOLS) assert(documentedTools.has(tool), `${tool} is missing from docs/tools.md`);
  for (const entry of allCases) {
    for (const tool of entry.expectedTools) {
      assert(documentedTools.has(tool), `${entry.id} expects undocumented tool ${tool}`);
    }
  }

  const [views, invariants] = await Promise.all([
    readFile(path.join(PACKAGE_ROOT, 'evals/VIEWS.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'evals/expected-invariants.md'), 'utf8'),
  ]);
  for (const marker of ['positive-cases.json', 'refusal-cases.json', 'expected-invariants.md']) {
    assert(views.includes(marker), `evals/VIEWS.md is missing ${marker}`);
  }
  for (const entry of allCases) {
    assert(invariants.includes(`\`${entry.id}\``), `evals/expected-invariants.md is missing ${entry.id}`);
  }
  for (const [label, source] of [
    ['evals/VIEWS.md', views],
    ['evals/expected-invariants.md', invariants],
  ]) {
    for (const marker of [SOURCE_RIGHTS_POLICY, SOURCE_RIGHTS_REFUSAL, 'wet_resolve']) {
      assert(source.includes(marker), `${label} is missing current source-rights marker: ${marker}`);
    }
  }
  assert(
    /90 percent positive[\s\S]*100 percent refusal/iu.test(invariants) &&
      /release targets, not prefilled results/iu.test(invariants),
    'expected-invariants.md must distinguish release targets from achieved scores',
  );
});

await check('public tool contract remains seven keyless read-only tools', async () => {
  const toolDoc = await readFile(path.join(PACKAGE_ROOT, 'docs/tools.md'), 'utf8');
  const publicSection = toolDoc.split('## W.E.T. Scanners and alerts')[0];
  const listed = [...publicSection.matchAll(/^\|\s*`(wet_[a-z0-9_]+)`\s*\|/gmu)].map((match) => match[1]);
  assertSameMembers(listed, PUBLIC_TOOLS, 'documented public tools');
  assert(
    JSON.stringify(listed) === JSON.stringify(PUBLIC_TOOL_ORDER),
    `public tools must remain index-first; received ${listed.join(', ')}`,
  );
  assert(publicSection.includes('All seven declare read-only, non-destructive annotations.'), 'public annotation commitment is missing');
  assertSourceRightsRecord(publicSection, 'docs/tools.md');
  assert(publicSection.includes(SOURCE_RIGHTS_FILTERING), 'tool reference must disclose coarse source-rights filtering');
  if (releaseMode) {
    assert(!/zero market or index value fields|sole public (?:exception|tool)|only `wet_resolve` remains usable/iu.test(publicSection), 'release tool reference must not describe the held six-tool boundary');
  } else {
    assert(/zero market or index value fields/iu.test(publicSection), 'tool reference must disclose the zero-value hold boundary');
  }
});

await check('distribution doctrine, health, routing, and rights copy stay aligned', async () => {
  const [readme, identity, dataSources, freshness, limitations, support, quickstart, reviewer, gemini, skill, authentication, tools, scanners, privacy] = await Promise.all([
    readFile(path.join(PACKAGE_ROOT, 'README.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/CONTRACT-IDENTITY.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/DATA-SOURCES.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/FRESHNESS.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/LIMITATIONS.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'SUPPORT.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/quickstart.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/REVIEWER-GUIDE.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'GEMINI.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'skills/wet-research/SKILL.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/authentication.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/tools.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'docs/scanners.md'), 'utf8'),
    readFile(path.join(PACKAGE_ROOT, 'PRIVACY.md'), 'utf8'),
  ]);

  assert(identity.includes('Human-confirmed same-question identity'), 'identity guide must name the canonical confirmation tier');
  assert(
    /does not mean identical settlement[\s\S]*sources[\s\S]*windows[\s\S]*rules[\s\S]*void terms/iu.test(identity),
    'identity guide must retain the settlement-difference caution',
  );
  assert(!/human-confirmed equivalence|same claim after inspecting/iu.test(identity), 'identity guide must not claim settlement equivalence');

  const healthDocs = [readme, dataSources, freshness, limitations, support, quickstart, reviewer];
  for (const source of healthDocs) {
    assert(source.includes('https://www.worldeventtrading.com/api/wet/v1/health'), 'health guidance must point to the keyless health endpoint');
    if (source.includes('https://www.worldeventtrading.com/status')) {
      assert(/benchmark(?:-| )publication|Benchmark publication/iu.test(source), '/status must be labelled as benchmark publication');
    }
  }

  const dataRow = readme.split(/\r?\n/u).find((line) => line.includes('| W.E.T. Data |')) ?? '';
  assert(/outside this MCP phase-one gate/iu.test(dataRow), 'W.E.T. Data row must disclose the separate rights boundary');
  assert(
    /makes no source-rights, history, SLA, or redistribution claim/iu.test(dataRow),
    'W.E.T. Data entitlement row must not sell uncleared history, SLA, or redistribution rights',
  );
  const scannerRow = readme.split(/\r?\n/u).find((line) => line.includes('| W.E.T. Scanners |')) ?? '';
  assert(
    /preview, create\/resume\/run, and delivery are held/iu.test(scannerRow) && /Pause and two-step deletion/iu.test(scannerRow),
    'W.E.T. Scanners row must distinguish held data actions from rights-safe stop controls',
  );
  assert(
    /commercial-use and redistribution[\s\S]*planned[\s\S]*not currently purchasable[\s\S]*no entitlement/iu.test(readme),
    'README must state that commercial and redistribution rights are planned and create no entitlement',
  );

  for (const [label, source, requireToolNames] of [
    ['README.md', readme, false],
    ['docs/DATA-SOURCES.md', dataSources, true],
    ['docs/quickstart.md', quickstart, true],
    ['docs/REVIEWER-GUIDE.md', reviewer, false],
    ['GEMINI.md', gemini, true],
    ['skills/wet-research/SKILL.md', skill, true],
    ['docs/authentication.md', authentication, false],
    ['docs/tools.md', tools, true],
  ]) {
    assertSourceRightsRecord(source, label, { requireToolNames });
  }
  for (const [label, source] of [
    ['README.md', readme],
    ['docs/DATA-SOURCES.md', dataSources],
    ['GEMINI.md', gemini],
    ['skills/wet-research/SKILL.md', skill],
    ['docs/authentication.md', authentication],
    ['docs/tools.md', tools],
  ]) {
    assert(source.includes(SOURCE_RIGHTS_FILTERING), `${label} must disclose coarse phase-1 filtering`);
    assert(/mixed-source filtering is not implemented/iu.test(source), `${label} must disclose unavailable mixed-source filtering`);
  }
  if (releaseMode) {
    assert(!/sole public (?:exception|tool)|only `wet_resolve` remains usable/iu.test(skill + gemini), 'active agent entry points must not identify wet_resolve as the sole public exception');
  } else {
    assert(/sole public (?:exception|tool)|only `wet_resolve` remains usable/iu.test(skill + gemini), 'agent entry points must identify wet_resolve as the sole public exception');
    assert(/protocol-safe[\s\S]{0,120}not a useful sourced result/iu.test(skill), 'skill must distinguish safe protocol behavior from useful sourced output');
  }
  for (const [label, source] of [
    ['docs/quickstart.md', quickstart],
    ['docs/REVIEWER-GUIDE.md', reviewer],
    ['docs/authentication.md', authentication],
    ['docs/tools.md', tools],
  ]) {
    assert(source.includes(ACCOUNT_OUTPUT_CONTRACT_REFUSAL), `${label} must name the independent account-output-contract refusal`);
    assert(source.includes(SOURCE_RIGHTS_REFUSAL), `${label} must name the separate public source-rights refusal`);
    assert(/headline-source rights|headline rights|publisher\/feed headline rights/iu.test(source), `${label} must disclose the scanner headline-rights chain`);
    assert(/pause[\s\S]{0,240}two-step(?: scanner)? delet/iu.test(source), `${label} must preserve rights-safe scanner stop controls`);
  }
  assert(/current candidate safety review/iu.test(reviewer), 'reviewer guide must separate the current candidate safety review');
  assert(/post-clearance full lifecycle review/iu.test(reviewer), 'reviewer guide must label the full lifecycle review post-clearance');
  assert(/resume (?:is|remains) held/iu.test(reviewer + tools + authentication), 'account guides must keep scanner resume held');
  for (const name of ['wet_pause_alert', 'wet_mark_notifications_read']) {
    assert(tools.includes(name), `tool reference must document source-neutral account control ${name}`);
  }
  assert(!/complete per-run log/iu.test(reviewer), 'reviewer guide must not describe status receipts as the complete run log');
  assert(tools.includes('wet_run_scanner') && /post-clearance behavior|current exception/iu.test(tools), 'tool reference must document persisted runs without implying current execution');
  assert(scanners.includes(SOURCE_RIGHTS_POLICY) && /default-deny/iu.test(scanners), 'scanner guide must disclose the current default-deny source-rights policy');
  assert(/(?:API keys|OAuth credentials)[\s\S]{0,100}cannot bypass (?:either|the) hold/iu.test(scanners), 'scanner guide must reject credential bypass');
  for (const marker of ['0032_scanner_lifecycle', 'schema_pending', 'wet_run_scanner', 'expectedRevision', 'idempotencyKey', 'two-step', 'durable outbox']) {
    assert(scanners.includes(marker), `scanner guide is missing lifecycle boundary: ${marker}`);
  }
  assert(
    /Rights-safe stop controls[\s\S]{0,180}pause[\s\S]{0,180}two-step deletion[\s\S]{0,180}Resume is held/iu.test(scanners),
    'scanner guide must keep pause/delete rights-safe while resume remains held',
  );
  assert(
    !privacy.includes('argument key names/count') &&
      privacy.includes('Caller-defined argument key names') &&
      privacy.includes('are not stored') &&
      /does not measure cross-day keyless retention/iu.test(privacy),
    'package privacy summary must match minimized MCP telemetry',
  );
  assert(
    /four citation-readiness booleans/iu.test(privacy) &&
      /do not copy the URL, venue, timestamp, market title, source text, or value/iu.test(privacy),
    'package privacy summary must disclose citation-presence flags without implying copied citation values',
  );
  assert(
    /non-runnable tombstone[\s\S]{0,240}account erasure/iu.test(privacy) &&
      /durable outbox stores no recipient email address/iu.test(privacy),
    'package privacy summary must disclose scanner retention and address-free outbox behavior',
  );
});

await check('literal compatibility paths delegate to canonical records without claiming proof', async () => {
  const aliases = [
    ['DATA-SOURCES.md', 'docs/DATA-SOURCES.md'],
    ['LIMITATIONS.md', 'docs/LIMITATIONS.md'],
    ['docs/refusal-contract.md', 'REFUSALS.md'],
    ['docs/identity-methodology.md', 'CONTRACT-IDENTITY.md'],
    ['docs/freshness-and-quotes.md', 'FRESHNESS.md'],
  ];
  for (const [name, canonical] of aliases) {
    const source = await readFile(path.join(PACKAGE_ROOT, name), 'utf8');
    assert(source.includes(canonical), `${name} must delegate to ${canonical}`);
    assert(/maintained|canonical/iu.test(source), `${name} must identify its maintained canonical record`);
  }

  for (const name of ['DATA-SOURCES.md', 'LIMITATIONS.md']) {
    const source = await readFile(path.join(PACKAGE_ROOT, name), 'utf8');
    assertSourceRightsRecord(source, name, { requireToolNames: false });
  }

  const coverage = await readFile(path.join(PACKAGE_ROOT, 'docs/coverage.md'), 'utf8');
  for (const marker of [
    'Coverage is runtime state',
    'https://www.worldeventtrading.com/coverage',
    'https://www.worldeventtrading.com/coverage.json',
    'https://www.worldeventtrading.com/api/wet/v1/health',
    '../DATA-SOURCES.md',
    '../LIMITATIONS.md',
    'FRESHNESS.md',
  ]) {
    assert(coverage.includes(marker), `docs/coverage.md is missing ${marker}`);
  }

  const screenshotsDirectory = path.join(PACKAGE_ROOT, 'assets/screenshots');
  const screenshotEntries = (await readdir(screenshotsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const screenshotReadme = await readFile(path.join(screenshotsDirectory, 'README.md'), 'utf8');
  if (releaseMode) {
    assert(screenshotEntries.includes('README.md'), 'release screenshot evidence must retain its handling guidance');
  } else {
    assertSameMembers(screenshotEntries, ['README.md'], 'release-candidate screenshot evidence files');
    for (const marker of ['No screenshot is included', 'reachable deployment', 'written public-output and brand-use clearance', 'redaction']) {
      assert(screenshotReadme.includes(marker), `assets/screenshots/README.md is missing gate: ${marker}`);
    }
  }

  const evidence = await readFile(
    path.join(PACKAGE_ROOT, 'evidence/2026-09-05-release-candidate-offline-conformance.md'),
    'utf8',
  );
  const currentEvidenceRows = [
    '| MCP contract | `npm run mcp:verify` | 283/283 passed |',
    '| Source-rights contract | `npm run mcp:source-rights:verify` | 109/109 passed |',
    '| MCP route | `npm run mcp:route:check` | 97/97 passed |',
    '| OAuth | `npm run oauth:verify` | 72/72 passed |',
    '| Account API | `npm run account:verify` | 90/90 passed |',
    '| Account deletion | `npm run account:delete:verify` | 44/44 passed |',
    '| Alerts | `npm run alerts:verify` | 84/84 passed |',
    '| Scanner contract | `npm run scanners:verify` | 371/371 passed |',
    '| Scanner lifecycle (static) | `npm run scanners:lifecycle:verify` | 223/223 passed |',
    '| Scanner lifecycle (fresh isolated PostgreSQL) | `npm run scanners:lifecycle:db:verify` | 95/95 passed |',
    '| Browser scanner routes (fresh isolated PostgreSQL) | `npm run scanners:browser-route:db:verify` | 53/53 passed |',
    '| Public proof surfaces | `npm run mcp:public-proof:verify` | 24/24 passed |',
    '| Playbook gaps | `npm run mcp:playbook:gaps:verify` | 11/11 passed |',
    '| Output schemas | `npm run mcp:outputschema:verify` | 77/77 passed |',
    '| Public surface | `npm run public:surface:verify` | 194/194 passed |',
    '| Health semantics | `npm run health:semantics:verify` | 38/38 passed |',
    '| Distribution snapshot | `npm run distribution:snapshot:verify` | 38/38 passed |',
    '| Doctrine | `npm run doctrine:verify` | 112/112 passed |',
    '| Market-volume semantics | `npm run market:volume:verify` | 72/72 passed |',
    '| Prediction generator self-check | `npm run predictions:generate -- --self-check` | 17/17 passed |',
    '| Prediction matchup | `npm run predictions:matchup:verify` | 10/10 passed |',
    '| API semantics | `npm run api:semantics:verify` | 160/160 passed |',
    '| Migration runner self-check | `node scripts/apply-migrations.mjs --self-check` | 8/8 passed |',
    '| Billing migration precursor gate | `npm run billing:migration:precursor-verify` | 23/23 passed |',
    '| Billing migration runtime gate | `npm run billing:migration:verify` | 23/23 passed |',
    '| Schema drift | `npm run schema:drift:verify` | 7/7 passed |',
  ];
  for (const row of currentEvidenceRows) {
    assert(evidence.includes(row), `offline conformance evidence is missing current result: ${row}`);
  }
  assert(
    /not production evidence[\s\S]*not.*clean-client[\s\S]*not.*independent audit/iu.test(evidence) ||
      /not production evidence[\s\S]*clean-client run[\s\S]*independent audit/iu.test(evidence),
    'offline conformance evidence must disclaim production, clean-client, and independent proof',
  );
  assert(
    /Historical pre-freeze local browser and MCP Inspector observation[\s\S]{0,600}zero schema warnings[\s\S]{0,600}six[\s\S]{0,600}source_rights_pending[\s\S]{0,600}wet_resolve[\s\S]{0,600}caller-supplied[\s\S]{0,600}predates the final/iu.test(evidence),
    'offline conformance evidence must bound the historical local browser and Inspector result without relabeling it as code-freeze proof',
  );
  assert(
    /Local live verifier[^\r\n]*protocol conformant[^\r\n]*not launch ready[^\r\n]*canonical host[^\r\n]*development health[^\r\n]*source-rights/iu.test(evidence),
    'offline conformance evidence must preserve the local live-verifier launch blockers',
  );
  assert(
    /Eval run template[^\r\n]*not-run[^\r\n]*0\/6 positive[^\r\n]*0\/8 refusal[^\r\n]*release thresholds[^\r\n]*false/iu.test(evidence),
    'offline conformance evidence must keep the unexecuted eval result explicit',
  );
  assert(
    /Public repository parity[^\r\n]*NOT ESTABLISHED/iu.test(evidence) &&
      /Deployed endpoint and manifest parity[^\r\n]*NOT ESTABLISHED/iu.test(evidence),
    'offline conformance evidence must not imply public-repository or deployed parity',
  );
  assert(
    /owner[^\r\n]*legal[^\r\n]*deployment[^\r\n]*remain/iu.test(evidence),
    'offline conformance evidence must retain owner, legal, and deployment gates',
  );
  assert(
    /## Final-sync refresh[\s\S]*Final-sync status:\s*\*\*NOT COMPLETE\*\*/iu.test(evidence),
    'offline conformance evidence must keep final sync explicitly incomplete',
  );
  assert(
    evidence.includes('e9dc1bc194783102b7ea88969d124f62c4cce8a6') &&
      evidence.includes('2026-09-05T12:40:52.679Z') &&
      evidence.includes('ce36522bf240b89617e2db7ec3af991730efd3f90208716ac9bc9af895c5ac38'),
    'offline conformance evidence must bind the local code freeze, UTC observation, and public-output contract',
  );
  assert(
    /Public package[^\r\n]*`node distribution\/wet-mcp\/scripts\/validate\.mjs`[^\r\n]*\d+\/\d+ passed/iu.test(evidence) &&
      !/Public package[^\r\n]*35\/35 passed/iu.test(evidence),
    'offline conformance evidence must record a fresh package-validator observation without the stale 35/35 result',
  );
  assert(
    /validator deliberately does not assert its own pass total/iu.test(evidence),
    'offline conformance evidence must explain the non-circular package-validator boundary',
  );
});

await check('directory worksheet is source-neutral, bounded, and explicitly unsubmitted', async () => {
  const worksheet = await readFile(
    path.join(PACKAGE_ROOT, 'docs/DIRECTORY-SUBMISSION-WORKSHEET.md'),
    'utf8',
  );
  assert(
    /Status: draft only[\s\S]*no submission[\s\S]*is claimed/iu.test(worksheet),
    'directory worksheet must state that it is an unsubmitted draft',
  );
  assert(
    /rights-cleared under the active policy[\s\S]*source-aware filtering[\s\S]*lineage purge\/rebuild[\s\S]*adapter toggle alone/iu.test(worksheet),
    'directory worksheet must keep the grant-or-proven-source-removal release gate explicit',
  );
  assertSourceRightsRecord(worksheet, 'directory worksheet', { requireToolNames: false });
  for (const marker of [
    '| Product name |',
    '| Package identifier |',
    '| Release version |',
    '| Transport |',
    '| MCP endpoint |',
    '| Repository |',
    '| Access |',
    '| Optional authorization |',
    '| Execution boundary |',
    '| License |',
    '| Cline icon |',
    '## Submission-specific mapping',
    '## Destination-specific unsent readiness',
    '## Evidence placeholders',
    '## Submission log',
  ]) {
    assert(worksheet.includes(marker), `directory worksheet is missing field or section: ${marker}`);
  }
  assert(worksheet.includes(ENDPOINT), 'directory worksheet endpoint mismatch');
  assert(
    !/(?:\b(?:Kalshi|Polymarket|ForecastEx|Limitless|Myriad|Futuur|Manifold|Rain)\b|\bGemini\b(?![-_\s]CLI\b))/iu.test(worksheet),
    'directory worksheet must not name an unapproved venue or ambiguous venue brand',
  );
  assert(
    !/world(?:'s|’s)\s+first|\b(?:best|market-leading|real-time)\b|every (?:regulated )?venue|all venues|officially (?:approved|listed)|approved by|guaranteed/iu.test(worksheet),
    'directory worksheet contains an unapproved or unverified listing claim',
  );

  const readinessStart = worksheet.indexOf('## Destination-specific unsent readiness');
  const readinessEnd = worksheet.indexOf('## Channel-specific owned landing links', readinessStart);
  assert(readinessStart >= 0 && readinessEnd > readinessStart, 'directory worksheet readiness section is malformed');
  const readiness = worksheet.slice(readinessStart, readinessEnd);
  const expectedDestinations = new Map([
    ['Official MCP Registry', 'HELD_UNSENT'],
    ['Claude Connector', 'HELD_UNSENT'],
    ['Cline', 'HELD_UNSENT'],
    ['Docker', 'HELD_UNSENT'],
    ['Smithery', 'HELD_UNSENT'],
    ['Glama', 'HELD_UNSENT'],
    ['MCP.Directory', 'HELD_UNSENT'],
    ['MCP Central', 'HELD_UNSENT'],
    ['MCP.so', 'HELD_UNSENT'],
    ['PulseMCP', 'HELD_UNSENT'],
    ['awesome-mcp-servers', 'HELD_UNSENT'],
    ['OpenAI eligibility', 'READY_OWNER_ACTION_TIME_SEND_CONFIRMATION'],
    ['Gemini CLI gallery', 'AUTO_INDEX_MONITOR_ONLY'],
    ['Cursor', 'SKIPPED'],
    ['Claude Plugin', 'SKIPPED'],
  ]);
  const headings = [...readiness.matchAll(/^### ([^\r\n]+)$/gmu)];
  assertSameMembers(
    headings.map((match) => match[1]),
    [...expectedDestinations.keys()],
    'directory readiness destinations',
  );
  const blankReadinessFields = [
    'Deployment SHA',
    'Release version',
    'Canonical endpoint',
    'Owner / publisher identity',
    'Destination terms',
    'Separate action-time authorization',
    'Submitted UTC',
    'Receipt / evidence',
  ];
  for (const [index, heading] of headings.entries()) {
    const destination = heading[1];
    const sectionEnd = headings[index + 1]?.index ?? readiness.length;
    const section = readiness.slice(heading.index, sectionEnd);
    const sectionLines = section.split(/\r?\n/u);
    const expectedStatus = expectedDestinations.get(destination);
    const statusRows = sectionLines.filter((line) => line.startsWith('| Status |'));
    assert(
      statusRows.length === 1 && statusRows[0] === `| Status | — | \`${expectedStatus}\` |`,
      `${destination} readiness status must remain ${expectedStatus}`,
    );
    for (const field of blankReadinessFields) {
      const fieldRows = sectionLines.filter((line) => line.startsWith(`| ${field} |`));
      assert(
        fieldRows.length === 1 && fieldRows[0] === `| ${field} | [ ] | |`,
        `${destination} readiness field must remain unchecked and blank: ${field}`,
      );
    }
  }
  assert(!/\[[xX]\]/u.test(readiness), 'directory readiness must not contain a checked box');
  assert(
    /Completing a global release gate does not authorize any destination action/iu.test(readiness),
    'directory readiness must preserve separate destination action-time authorization',
  );
  assert(
    /\| OpenAI eligibility \|[^\r\n]*READY_OWNER_ACTION_TIME_SEND_CONFIRMATION[^\r\n]*actual listing remains `BLOCKED_ELIGIBILITY`/iu.test(worksheet),
    'OpenAI eligibility may stage only the unsent preflight while the actual listing remains blocked',
  );

  const landingStart = worksheet.indexOf('## Channel-specific owned landing links');
  const landingEnd = worksheet.indexOf('## Evidence placeholders', landingStart);
  assert(landingStart >= 0 && landingEnd > landingStart, 'directory landing-link section is malformed');
  const landingLines = worksheet
    .slice(landingStart, landingEnd)
    .split(/\r?\n/u)
    .filter((line) => /^\| (?!Destination\b)[^|]+ \| `https:\/\//u.test(line));
  const landingRecords = landingLines.map((line) => {
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    return { destination: cells[0], value: cells[1].replace(/^`|`$/gu, '') };
  });
  const expectedLandingSources = new Map([
    ['Official MCP Registry', ['mcp_registry', 'registry']],
    ['Claude', ['claude', 'directory']],
    ['Cursor', ['cursor', 'directory']],
    ['Cline', ['cline', 'directory']],
    ['Docker catalog', ['docker', 'directory']],
    ['CLI extension gallery', ['gemini_cli', 'directory']],
    ['Smithery', ['smithery', 'directory']],
    ['Glama', ['glama', 'directory']],
    ['MCP.Directory', ['mcp_directory', 'directory']],
    ['MCP Central', ['mcp_central', 'directory']],
    ['MCP.so', ['mcp_so', 'directory']],
    ['PulseMCP', ['pulsemcp', 'directory']],
    ['awesome-mcp-servers', ['awesome_mcp_servers', 'repository']],
    ['OpenAI eligibility/submission', ['openai', 'directory']],
    ['GitHub repository/community', ['github', 'repository']],
  ]);
  assertSameMembers(
    landingRecords.map((record) => record.destination),
    [...expectedLandingSources.keys()],
    'directory landing-link destinations',
  );
  assert(
    new Set(landingRecords.map((record) => record.value)).size === landingRecords.length,
    'every directory landing link must be unique',
  );
  for (const record of landingRecords) {
    const expected = expectedLandingSources.get(record.destination);
    assert(expected, `unexpected directory landing-link destination: ${record.destination}`);
    const parsed = new URL(record.value);
    assert(parsed.origin === 'https://www.worldeventtrading.com', `${record.destination} landing link must use the owned HTTPS origin`);
    assert(parsed.searchParams.get('utm_source') === expected[0], `${record.destination} landing link has the wrong utm_source`);
    assert(parsed.searchParams.get('utm_medium') === expected[1], `${record.destination} landing link has the wrong utm_medium`);
    assert(parsed.searchParams.get('utm_campaign') === 'mcp_launch', `${record.destination} landing link has the wrong utm_campaign`);
    assert([...parsed.searchParams.keys()].length === 3, `${record.destination} landing link must contain only the three reviewed UTM keys`);
  }

  const submissionLog = worksheet.slice(worksheet.indexOf('## Submission log'));
  for (const [destination, status] of expectedDestinations) {
    const logLine = submissionLog
      .split(/\r?\n/u)
      .find((line) => line.startsWith(`| ${destination} |`));
    assert(logLine, `directory submission log is missing destination: ${destination}`);
    const logCells = logLine.split('|').slice(1, -1).map((cell) => cell.trim());
    assert(
      logCells.length === 5 && logCells[2] === '—' && logCells[3] === '—',
      `${destination} submission timestamp and receipt must remain blank`,
    );
    assert(logLine.includes(`\`${status}\``), `${destination} submission log must remain ${status}`);
  }
  assert(
    !submissionLog.includes('| All other destinations |'),
    'directory submission log must not collapse destination-specific readiness into a catch-all row',
  );

  const variants = [...worksheet.matchAll(/^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|\r\n]+?)\s*\|\s*$/gmu)].map((match) => ({
    ceiling: Number(match[1]),
    displayed: Number(match[2]),
    copy: match[3].trim(),
  }));
  assertSameMembers(variants.map((entry) => entry.ceiling), [50, 60, 80, 120, 160, 250], 'listing-copy ceilings');
  for (const variant of variants) {
    const actual = [...variant.copy].length;
    assert(actual === variant.displayed, `${variant.ceiling}-character variant count says ${variant.displayed}, actual ${actual}`);
    assert(actual <= variant.ceiling, `${variant.ceiling}-character variant contains ${actual} characters`);
  }
});

await check('truthful demo storyboards and clean-client proof are wired', async () => {
  const demoReadme = await readFile(path.join(PACKAGE_ROOT, 'assets/demo/README.md'), 'utf8');
  const positive = await readFile(path.join(PACKAGE_ROOT, 'assets/demo/positive-55s-storyboard.md'), 'utf8');
  const negative = await readFile(path.join(PACKAGE_ROOT, 'assets/demo/negative-refusal-storyboard.md'), 'utf8');
  const proof = await readFile(path.join(PACKAGE_ROOT, 'scripts/verify-live.mjs'), 'utf8');
  const packageReadme = await readFile(path.join(PACKAGE_ROOT, 'README.md'), 'utf8');

  for (const file of ['positive-55s-storyboard.md', 'negative-refusal-storyboard.md', '../../scripts/verify-live.mjs']) {
    assert(demoReadme.includes(file), `assets/demo/README.md does not link ${file}`);
  }
  assert(packageReadme.includes('assets/demo/'), 'README.md does not advertise the demo package');
  assert(packageReadme.includes('node scripts/verify-live.mjs'), 'README.md does not document the clean-client proof command');
  assert(
    /node scripts\/verify-live\.mjs --expected-deployment-sha [^\r\n]+ > wet-live-proof\.ndjson/u.test(packageReadme),
    'README.md clean-client proof must bind rollout evidence to the expected deployment SHA',
  );

  const positiveWindows = [...positive.matchAll(/\|\s*(\d{2}):(\d{2})[–-](\d{2}):(\d{2})\s*\|/gu)].map((match) => ({
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  }));
  assert(positiveWindows.length >= 5, 'positive storyboard must contain a timed shot list');
  const positiveStart = Math.min(...positiveWindows.map((window) => window.start));
  const positiveEnd = Math.max(...positiveWindows.map((window) => window.end));
  assert(positiveStart === 0 && positiveEnd >= 45 && positiveEnd <= 60, `positive storyboard must run 45-60 seconds, received ${positiveStart}-${positiveEnd}`);
  const transcript = positive.split('## Read-aloud transcript')[1]?.split('## Recording checklist')[0] ?? '';
  const transcriptWords = transcript.match(/[\p{L}\p{N}’'-]+/gu)?.length ?? 0;
  assert(transcriptWords >= 105 && transcriptWords <= 155, `positive transcript must be recordable in 45-60 seconds; found ${transcriptWords} words`);
  assert(!/[$€£]\s*\d|\b\d+(?:\.\d+)?\s*%/u.test(transcript), 'positive transcript must not prewrite a market value');
  for (const guard of ['index leads', 'typed refusal', 'settlement caution', 'not proof of causation']) {
    assert(positive.toLowerCase().includes(guard), `positive storyboard is missing truth guard: ${guard}`);
  }

  for (const guard of ['grouping is not contract identity', 'wet_cross_venue', 'wet_resolve', 'not an executable trade']) {
    assert(negative.toLowerCase().includes(guard.toLowerCase()), `negative storyboard is missing refusal guard: ${guard}`);
  }
  assert(!/[$€£]\s*\d|\b\d+(?:\.\d+)?\s*%/u.test(negative.split('## Read-aloud transcript')[1] ?? ''), 'negative transcript must not prewrite a market value');

  for (const tool of PUBLIC_TOOLS) assert(proof.includes(`'${tool}'`), `clean-client proof does not name ${tool}`);
  assert(proof.includes("access: 'anonymous-no-credentials'"), 'clean-client proof does not declare anonymous access');
  assert(proof.includes('resultSha256'), 'clean-client proof does not emit result hashes');
  assert(proof.includes('durationMs'), 'clean-client proof does not emit timings');
  assert(proof.includes('WET_MCP_ENDPOINT'), 'clean-client proof lacks configurable endpoint support');
  for (const marker of [
    SOURCE_RIGHTS_POLICY,
    SOURCE_RIGHTS_REFUSAL,
    SOURCE_RIGHTS_FILTERING,
    '--candidate-allow-source-rights-pending',
    'protocolConformant',
    'usefulSourcedResult',
    'sourceRightsPendingTools',
    'launchReady',
    'verificationPassed',
    'PREFLIGHT_SURFACES',
    'MAX_PREFLIGHT_JSON_BYTES',
    'MAX_RPC_JSON_BYTES',
    'mcp-status-get',
    'cors-trusted-origin',
    'cors-untrusted-origin',
    'oauth-protected-challenge',
    'oauth-resource-discovery-root',
    'oauth-resource-discovery-scoped',
    'oauth-authorization-discovery',
    'service-feed-health',
    'preflightConformant',
    'gate4LaunchReady',
    'healthLaunchReady',
    'excludedSourceCount',
    'exclusionReasonCounts',
  ]) {
    assert(proof.includes(marker), `clean-client proof is missing source-rights/readiness marker: ${marker}`);
  }
  assert(
    /verificationPassed\s*=\s*options\.candidateAllowSourceRightsPending\s*\?\s*candidateProtocolPassed\s*:\s*launchReady/iu.test(proof),
    'clean-client proof default outcome must be launch readiness, with only explicit candidate opt-in',
  );
  assert(
    /listWithinBudget\s*=\s*typeof listed\.responseBytes[\s\S]{0,160}listed\.responseBytes\s*<=\s*30\s*\*\s*1024/iu.test(proof) &&
      /listOk\s*=[^;]*listWithinBudget/iu.test(proof) &&
      /stage:\s*'tools\/list'[\s\S]{0,260}responseBytes:/iu.test(proof),
    'clean-client proof must enforce and report the 30 KiB anonymous tools/list budget',
  );
  assert(
    /readBoundedText\(response, MAX_RPC_JSON_BYTES\)/u.test(proof) &&
      /readBoundedText\(response, maximumBytes = MAX_PREFLIGHT_JSON_BYTES\)/u.test(proof),
    'clean-client proof must bound both MCP and preflight JSON response bodies',
  );
  assert(
    /const launchReady\s*=\s*protocolConformant\s*&&\s*gate4LaunchReady/iu.test(proof) &&
      /const candidateProtocolPassed\s*=\s*protocolConformant\s*&&\s*preflightConformant/iu.test(proof),
    'Gate 4 must block default launch readiness while candidate mode still requires structural preflight',
  );
  assert(
    /healthLaunchReady\s*=\s*healthShapeOk[\s\S]{0,180}healthRightsAligned[\s\S]{0,80}healthCheckedAtFresh/iu.test(proof),
    'Gate 4 health must require shape, current freshness, healthy sources, and rights-count alignment',
  );
  const healthNormalizationFixtures = spawnSync(
    process.execPath,
    [path.join(PACKAGE_ROOT, 'scripts/verify-live.mjs'), '--self-test-health-normalization'],
    { encoding: 'utf8' },
  );
  assert(
    healthNormalizationFixtures.status === 0,
    `health response envelope fixtures failed: ${healthNormalizationFixtures.stderr || healthNormalizationFixtures.stdout}`,
  );
  assert(
    healthNormalizationFixtures.stdout.includes('"wet-v1-envelope"') &&
      healthNormalizationFixtures.stdout.includes('"legacy-bare-health"'),
    'health response envelope fixtures must cover the WET v1 envelope and the legacy bare shape',
  );
  for (const pathname of [
    '/mcp',
    '/mcp.md',
    '/mcp/llms.txt',
    '/llms.txt',
    '/.well-known/mcp/server-card.json',
    '/.well-known/security.txt',
    '/mcp/authentication',
    '/security',
    '/privacy',
    '/terms',
    '/support',
    '/changelog',
    '/coverage',
    '/coverage.json',
    '/data-sources',
    '/limitations',
    '/methodology',
    '/governance',
    '/methodology/contract-identity',
    '/methodology/refusals',
    '/status',
    '/mcp/evals',
    '/mcp/evals.json',
    '/mcp/claude',
    '/mcp/chatgpt',
    '/mcp/cursor',
    '/mcp/vscode',
    '/mcp/cline',
    '/mcp/windsurf',
    '/mcp/gemini-cli',
    '/mcp/goose',
    '/mcp/mcp-inspector',
    '/api/wet/v1/health',
    '/.well-known/oauth-protected-resource',
    '/.well-known/oauth-protected-resource/api/mcp',
    '/.well-known/oauth-authorization-server',
  ]) {
    assert(proof.includes(`'${pathname}'`), `clean-client Gate 4 preflight is missing ${pathname}`);
  }
  assert(
    !/sourceRights\?\.(?:protectedSources|configuredSources|approvedSources|excludedSources)|sourceRights\.(?:protectedSources|configuredSources|approvedSources|excludedSources)/u.test(proof) &&
      !proof.includes('{ source: structured.source }'),
    'clean-client proof must not emit protected source names',
  );
  assert(/sourceRightsPendingTools[\s\S]*launchBlockers/iu.test(proof), 'clean-client proof must make held sourced tools launch blockers');
  assert(!/["'](?:authorization|cookie|x-wet-api-key)["']\s*:/iu.test(proof), 'clean-client proof must not send credentials or cookies');
  for (const [label, source] of [
    ['assets/demo/README.md', demoReadme],
    ['assets/demo/positive-55s-storyboard.md', positive],
    ['assets/demo/negative-refusal-storyboard.md', negative],
  ]) {
    assert(source.includes(SOURCE_RIGHTS_REFUSAL), `${label} must disclose the current source-rights hold`);
    assert(/protocol-safe[\s\S]{0,120}not (?:a )?useful sourced/iu.test(source), `${label} must distinguish protocol safety from useful sourced evidence`);
  }
});

await check('seven-day rollout evidence reducer is fixture-verified and offline', async () => {
  const reducer = await readFile(path.join(PACKAGE_ROOT, 'scripts/rollout-evidence.mjs'), 'utf8');
  const fixtures = await readFile(path.join(PACKAGE_ROOT, 'scripts/rollout-evidence-verify.mjs'), 'utf8');
  for (const forbidden of ['fetch(', 'setInterval(', 'setTimeout(', 'WET_MCP_ENDPOINT']) {
    assert(!reducer.includes(forbidden), `rollout evidence reducer must remain offline: ${forbidden}`);
  }
  for (const required of [
    'exactly seven consecutive green daily records are required',
    'canonical production origin',
    'deployment SHA changed during the seven-day rollout watch',
    'package version changed during the seven-day rollout watch',
    'contains forbidden field names',
  ]) {
    assert(reducer.includes(required), `rollout evidence reducer is missing gate: ${required}`);
  }
  for (const fixture of [
    'duplicate UTC date',
    'stale feed evidence',
    'degraded aggregate health',
    'without an expected deployment SHA',
    'localhost evidence',
    'preview or alternate-origin evidence',
    'raw endpoint field',
  ]) {
    assert(fixtures.includes(fixture), `rollout evidence fixtures are missing: ${fixture}`);
  }
  const verification = spawnSync(
    process.execPath,
    [path.join(PACKAGE_ROOT, 'scripts/rollout-evidence-verify.mjs')],
    { encoding: 'utf8' },
  );
  assert(
    verification.status === 0 && verification.stdout.includes('17 passed, 0 failed'),
    `rollout evidence fixtures failed: ${verification.stderr || verification.stdout}`,
  );
});

await check('relative Markdown links resolve inside the package', async () => {
  for (const file of markdownFiles) {
    const markdown = await readFile(file, 'utf8');
    for (const destination of markdownDestinations(markdown)) {
      if (!destination || destination.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(destination)) continue;
      const targetText = destination.split('#', 1)[0].split('?', 1)[0];
      if (!targetText) continue;
      let decoded;
      try {
        decoded = decodeURIComponent(targetText);
      } catch {
        throw new Error(`${relative(file)} contains an invalid encoded link: ${destination}`);
      }
      assert(!path.isAbsolute(decoded), `${relative(file)} contains an absolute filesystem link: ${destination}`);
      const target = path.resolve(path.dirname(file), decoded);
      const insidePackage = target === PACKAGE_ROOT || target.startsWith(`${PACKAGE_ROOT}${path.sep}`);
      assert(insidePackage, `${relative(file)} link escapes the package: ${destination}`);
      await stat(target).catch(() => {
        throw new Error(`${relative(file)} has a broken relative link: ${destination}`);
      });
    }
  }
});

await check('PNG brand assets retain required dimensions and canonical source bytes', async () => {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  async function readPng(name, width, height) {
    const asset = await readFile(path.join(PACKAGE_ROOT, name));
    assert(asset.length >= 24, `${name} is truncated`);
    assert(asset.subarray(0, 8).equals(pngSignature), `${name} is not a PNG`);
    assert(asset.toString('ascii', 12, 16) === 'IHDR', `${name} has no PNG IHDR chunk`);
    assert(
      asset.readUInt32BE(16) === width && asset.readUInt32BE(20) === height,
      `${name} must be exactly ${width}x${height}`,
    );
    return asset;
  }

  const icon = await readPng('assets/icon.png', 512, 512);
  const compatibilityIcon = await readPng('assets/icon-512.png', 512, 512);
  await readPng('assets/cline-icon-400.png', 400, 400);
  assert(compatibilityIcon.equals(icon), 'assets/icon-512.png must be byte-identical to assets/icon.png');
});

await check('proprietary package license boundary', async () => {
  const license = await readFile(path.join(PACKAGE_ROOT, 'LICENSE'), 'utf8');
  assert(license.startsWith('W.E.T. MCP INTEGRATION PACKAGE LICENSE 1.0'), 'unexpected package license title');
  assert(license.includes('All Rights Reserved.'), 'proprietary copyright notice is missing');
  assert(license.includes('No open-source license is granted.'), 'open-source exclusion is missing');
  const licenseFiles = files.map(relative).filter((name) => /(^|\/)(?:licen[cs]e|copying)(?:\.[^/]*)?$/iu.test(name));
  assertSameMembers(licenseFiles, ['LICENSE'], 'package license files');
});

await check('Docker MCP Catalog submission artifacts', async () => {
  const directory = path.join(PACKAGE_ROOT, 'docker/servers/world-event-trading');
  const entries = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
  assertSameMembers(entries, ['readme.md', 'server.yaml', 'tools.json'], 'Docker submission files');
  const tools = packageJson('docker/servers/world-event-trading/tools.json');
  assert(Array.isArray(tools) && tools.length === 0, 'Docker remote tools.json must be [] for dynamic discovery');
  const readme = (await readFile(path.join(directory, 'readme.md'), 'utf8')).trim();
  assert(readme === 'Docs: https://www.worldeventtrading.com/mcp', 'Docker readme.md must contain the canonical docs link');
  const yaml = await readFile(path.join(directory, 'server.yaml'), 'utf8');
  assert(!yaml.includes('\t'), 'Docker server.yaml must not contain tabs');
  const topLevelKeys = [...yaml.matchAll(/^([A-Za-z][A-Za-z0-9_-]*):/gmu)].map((match) => match[1]);
  assertSameMembers(topLevelKeys, ['about', 'dynamic', 'meta', 'name', 'remote', 'type'], 'Docker top-level keys');
  const requiredPatterns = [
    [/^name:\s*world-event-trading\s*$/mu, 'name'],
    [/^type:\s*remote\s*$/mu, 'remote type'],
    [/^dynamic:\s*\r?\n\s{2}tools:\s*true\s*$/mu, 'dynamic tool discovery'],
    [/^\s{2}category:\s*analytics\s*$/mu, 'analytics category'],
    [/^\s{2}title:\s*W\.E\.T\. Prediction-Market Intelligence\s*$/mu, 'title'],
    [/^\s{2}transport_type:\s*streamable-http\s*$/mu, 'transport'],
    [new RegExp(`^\\s{2}url:\\s*${ENDPOINT.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}\\s*$`, 'mu'), 'endpoint'],
  ];
  for (const [pattern, label] of requiredPatterns) assert(pattern.test(yaml), `Docker server.yaml is missing ${label}`);
  assertSourceRightsDescription(yaml, 'Docker server description');
  assert(/^\s{2}icon:\s*https:\/\//mu.test(yaml), 'Docker icon must be an HTTPS URL');
  assert(!/^(?:oauth|config|image|source):/mu.test(yaml), 'Docker entry must not imply required credentials or a local image/source');
});

if (args.has('--live')) {
  const configuredLiveEndpoint = process.env.WET_MCP_ENDPOINT || ENDPOINT;
  let liveEndpoint = configuredLiveEndpoint;
  await check('configured live endpoint is safe', async () => {
    const parsed = assertUrl(configuredLiveEndpoint, 'live endpoint', {
      https: !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//iu.test(configuredLiveEndpoint),
    });
    assert(!parsed.username && !parsed.password && !parsed.search && !parsed.hash, 'live endpoint must not contain credentials, query parameters, or a fragment');
    liveEndpoint = parsed.toString();
  });

  await check('live discovery document matches package', async () => {
    const { json: discovery } = await fetchJson(
      liveEndpoint,
      { headers: { accept: 'application/json', 'user-agent': `wet-package-validator/${packageVersion}` } },
      'MCP discovery',
    );
    assert(discovery.status === 'ok', `unexpected discovery status ${discovery.status}`);
    const advertisedEndpoint = assertUrl(discovery.endpoint, 'live discovery endpoint', {
      https: !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//iu.test(discovery.endpoint),
    }).toString();
    const permittedAdvertisedEndpoints = new Set([liveEndpoint, new URL(ENDPOINT).toString()]);
    assert(
      permittedAdvertisedEndpoints.has(advertisedEndpoint),
      `live discovery endpoint mismatch: ${discovery.endpoint}; expected requested preview or canonical production endpoint`,
    );
    assert(discovery.server?.version === packageVersion, `live server version ${discovery.server?.version ?? 'missing'} does not match package ${packageVersion}`);
    const names = Array.isArray(discovery.tools) ? discovery.tools.map((tool) => tool?.name) : [];
    assert(names.every((name) => typeof name === 'string'), 'live discovery contains an unnamed tool');
    assertSameMembers(names, PUBLIC_TOOLS, 'live anonymous discovery tools');
  });

  await check('live legacy initialize and tools/list match package', async () => {
    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': `wet-package-validator/${packageVersion}`,
    };
    const { json: initialize } = await fetchJson(
      liveEndpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'validate-initialize',
          method: 'initialize',
          params: {
            protocolVersion: LEGACY_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: 'wet-package-validator', version: packageVersion },
          },
        }),
      },
      'MCP initialize',
    );
    assert(!initialize.error, `initialize failed: ${JSON.stringify(initialize.error)}`);
    assert(initialize.result?.protocolVersion === LEGACY_PROTOCOL_VERSION, `unexpected negotiated protocol ${initialize.result?.protocolVersion}`);
    assert(initialize.result?.serverInfo?.version === packageVersion, `initialize server version ${initialize.result?.serverInfo?.version ?? 'missing'} does not match package ${packageVersion}`);

    const { json: listed } = await fetchJson(
      liveEndpoint,
      {
        method: 'POST',
        headers: { ...headers, 'mcp-protocol-version': LEGACY_PROTOCOL_VERSION },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'validate-tools', method: 'tools/list', params: {} }),
      },
      'MCP tools/list',
    );
    assert(!listed.error, `tools/list failed: ${JSON.stringify(listed.error)}`);
    const tools = listed.result?.tools;
    assert(Array.isArray(tools), 'tools/list did not return an array');
    assertSameMembers(tools.map((tool) => tool.name), PUBLIC_TOOLS, 'live anonymous tools/list');
    for (const tool of tools) {
      assert(tool.annotations?.readOnlyHint === true, `${tool.name} must declare readOnlyHint: true`);
      assert(tool.annotations?.destructiveHint === false, `${tool.name} must declare destructiveHint: false`);
    }
  });
}

const total = passCount + failCount;
if (failCount > 0) {
  console.error(`\nValidation failed: ${failCount} of ${total} checks failed.`);
  process.exitCode = 1;
} else {
  const mode = releaseMode ? 'release' : 'held';
  console.log(`\nValidation passed: ${passCount} checks (${mode} mode${args.has('--live') ? ', including live endpoint checks' : ''}).`);
}
