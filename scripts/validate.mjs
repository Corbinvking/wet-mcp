#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://www.worldeventtrading.com/api/mcp';
const SERVER_NAME = 'com.worldeventtrading/prediction-markets';
const PACKAGE_LICENSE = 'LicenseRef-WET-Integration-1.0';
const LEGACY_PROTOCOL_VERSION = '2025-06-18';
const PUBLIC_TOOLS = [
  'wet_benchmark_value',
  'wet_cross_venue',
  'wet_event_headlines',
  'wet_event_markets',
  'wet_resolve',
  'wet_screen_markets',
  'wet_search_events',
].sort();

const REQUIRED_FILES = [
  '.claude-plugin/plugin.json',
  '.github/workflows/publish-registry.yml',
  '.github/workflows/validate.yml',
  '.mcp.json',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'GEMINI.md',
  'LICENSE',
  'PRIVACY.md',
  'README.md',
  'SECURITY.md',
  'SUPPORT.md',
  'TERMS.md',
  'assets/icon.png',
  'assets/demo/README.md',
  'assets/demo/negative-refusal-storyboard.md',
  'assets/demo/positive-55s-storyboard.md',
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
  'evals/cases.json',
  'evals/schema.json',
  'gemini-extension.json',
  'llms-install.md',
  'mcp.json',
  'plugin.json',
  'scripts/validate.mjs',
  'scripts/verify-live.mjs',
  'server.json',
  'skills/wet-research/SKILL.md',
];

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: node scripts/validate.mjs [--live]

Without flags, validates the package offline: inventory, every JSON file,
manifests, evaluation cases, versions, endpoint references, client examples,
demo/proof assets, the local icon, Docker MCP Catalog submission files,
proprietary licensing, and relative Markdown links.

--live  Also makes read-only requests to the configured hosted MCP endpoint and
        verifies its discovery document, version, anonymous tool list, and
        legacy Streamable HTTP initialize/tools-list flow.`);
  process.exit(0);
}

for (const arg of args) {
  if (arg !== '--live') {
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

  const typeMatches =
    schema.type === undefined ||
    (schema.type === 'object' && isRecord(value)) ||
    (schema.type === 'array' && Array.isArray(value)) ||
    (schema.type === 'string' && typeof value === 'string');
  if (!typeMatches) return [`${location} must be ${schema.type}`];

  if (schema.type === 'object') {
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

  if (schema.type === 'array') {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${location} must contain at least ${schema.minItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateWithLocalSchema(item, schema.items, rootSchema, `${location}[${index}]`));
      });
    }
  }

  if (schema.type === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${location} must contain at least ${schema.minLength} characters`);
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
      errors.push(`${location} does not match ${schema.pattern}`);
    }
    if (schema.format === 'date' && !validDate(value)) errors.push(`${location} is not a valid calendar date`);
    if (schema.format === 'uri-reference') {
      try {
        new URL(value, 'https://package.invalid/');
      } catch {
        errors.push(`${location} is not a URI reference`);
      }
    }
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
  assert(manifest.$schema === 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json', 'unexpected MCP Registry schema');
  assert(manifest.name === SERVER_NAME, `unexpected server name ${manifest.name}`);
  assertString(manifest.title, 'server title');
  assertString(manifest.description, 'server description');
  assert(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version), 'server version is not semantic versioning');
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
  const access = manifest._meta?.['io.modelcontextprotocol.registry/publisher-provided']?.access;
  assert(access?.research === 'keyless-read-only', 'research access must remain keyless-read-only');
  assert(access?.account === 'oauth-optional', 'account access must remain oauth-optional');
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
    assertString(manifest.description, `${name} description`);
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
  assert(workflow.includes('node scripts/validate.mjs'), 'standalone CI must run the offline validator');
  assert(workflow.includes('node scripts/validate.mjs --live'), 'standalone CI must expose the live validator');
  assert(workflow.includes('node scripts/verify-live.mjs'), 'standalone CI must expose the seven-tool clean-client proof');
  assert(/workflow_dispatch:[\s\S]*?live:[\s\S]*?type:\s*boolean/mu.test(workflow), 'live validation must be an explicit boolean workflow-dispatch input');
  assert(/workflow_dispatch:[\s\S]*?endpoint:[\s\S]*?type:\s*string/mu.test(workflow), 'clean-client CI must accept a preview endpoint');
  assert(/github\.event_name == 'workflow_dispatch' && inputs\.live/u.test(workflow), 'live CI job must be manually gated');
  assert(/WET_MCP_ENDPOINT:\s*\$\{\{ inputs\.endpoint \}\}/u.test(workflow), 'clean-client CI must pass the selected endpoint as data');
});

await check('official registry publishing is pinned and domain-authenticated', async () => {
  const workflow = await readFile(
    path.join(PACKAGE_ROOT, '.github/workflows/publish-registry.yml'),
    'utf8',
  );
  assert(workflow.includes('MCP_PUBLISHER_VERSION: v1.7.9'), 'publisher release must be pinned');
  assert(
    workflow.includes('ab128162b0616090b47cf245afe0a23f3ef08936fdce19074f5ba0a4469281ac'),
    'publisher archive checksum must be pinned',
  );
  assert(workflow.includes('sha256sum --check --strict'), 'publisher archive checksum must be verified');
  assert(
    workflow.includes('login http') && workflow.includes('--domain worldeventtrading.com'),
    'publisher must authenticate the domain namespace over HTTPS',
  );
  assert(
    workflow.includes('secrets.MCP_REGISTRY_PRIVATE_KEY'),
    'publisher must obtain its private key from a GitHub Actions secret',
  );
  assert(workflow.includes('./mcp-publisher publish'), 'publisher workflow must publish server.json');
  assert(
    workflow.includes('registry.modelcontextprotocol.io/v0.1/servers'),
    'publisher workflow must verify the resulting registry record',
  );
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
});

await check('all package endpoint references are canonical', async () => {
  let referenceCount = 0;
  for (const file of files.filter((candidate) => /\.(?:json|md|ya?ml)$/iu.test(candidate))) {
    const source = await readFile(file, 'utf8');
    for (const reference of endpointReferences(source)) {
      referenceCount += 1;
      assert(reference === ENDPOINT, `${relative(file)} contains a non-canonical MCP endpoint: ${reference}`);
    }
  }
  assert(referenceCount >= 10, `expected package-wide endpoint references, found only ${referenceCount}`);
});

await check('evaluation cases conform to evals/schema.json', async () => {
  const schema = packageJson('evals/schema.json');
  const cases = packageJson('evals/cases.json');
  assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', 'evaluation schema must use JSON Schema 2020-12');
  assert(schema.additionalProperties === false, 'evaluation schema must reject unknown top-level properties');
  assert(isRecord(schema.properties?.$schema), 'evaluation schema must allow the cases.json $schema property');
  assert(cases.$schema === './schema.json', 'cases.json must reference ./schema.json');
  const errors = validateWithLocalSchema(cases, schema, schema);
  assert(errors.length === 0, errors.join('; '));

  const allCases = [...cases.positive, ...cases.negative];
  const ids = allCases.map((entry) => entry.id);
  assert(new Set(ids).size === ids.length, 'evaluation case ids must be unique');
  const toolDoc = await readFile(path.join(PACKAGE_ROOT, 'docs/TOOLS.md'), 'utf8');
  const documentedTools = new Set([...toolDoc.matchAll(/`(wet_[a-z0-9_]+)`/gu)].map((match) => match[1]));
  for (const tool of PUBLIC_TOOLS) assert(documentedTools.has(tool), `${tool} is missing from docs/TOOLS.md`);
  for (const entry of allCases) {
    for (const tool of entry.expectedTools) {
      assert(documentedTools.has(tool), `${entry.id} expects undocumented tool ${tool}`);
    }
  }
});

await check('public tool contract remains seven keyless read-only tools', async () => {
  const toolDoc = await readFile(path.join(PACKAGE_ROOT, 'docs/TOOLS.md'), 'utf8');
  const publicSection = toolDoc.split('## W.E.T. Scanners and alerts')[0];
  const listed = [...publicSection.matchAll(/^\|\s*`(wet_[a-z0-9_]+)`\s*\|/gmu)].map((match) => match[1]);
  assertSameMembers(listed, PUBLIC_TOOLS, 'documented public tools');
  assert(publicSection.includes('All seven declare read-only, non-destructive annotations.'), 'public annotation commitment is missing');
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
  assert(!/["'](?:authorization|cookie|x-wet-api-key)["']\s*:/iu.test(proof), 'clean-client proof must not send credentials or cookies');
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

await check('512px PNG brand asset', async () => {
  const icon = await readFile(path.join(PACKAGE_ROOT, 'assets/icon.png'));
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert(icon.length >= 24, 'assets/icon.png is truncated');
  assert(icon.subarray(0, 8).equals(pngSignature), 'assets/icon.png is not a PNG');
  assert(icon.toString('ascii', 12, 16) === 'IHDR', 'assets/icon.png has no PNG IHDR chunk');
  assert(icon.readUInt32BE(16) === 512 && icon.readUInt32BE(20) === 512, 'assets/icon.png must be exactly 512x512');
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
    assert(discovery.endpoint === liveEndpoint, `live discovery endpoint mismatch: ${discovery.endpoint}`);
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
  console.log(`\nValidation passed: ${passCount} checks${args.has('--live') ? ' (including live endpoint checks)' : ''}.`);
}
