#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { TextDecoder } from 'node:util';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://www.worldeventtrading.com/api/mcp';
const SERVER_NAME = 'com.worldeventtrading/prediction-markets';
const RELEASE_TITLE = 'World Event Trading (W.E.T.) — Prediction Market Intelligence';
const RELEASE_DESCRIPTION = 'Agent-safe prediction-market research with live books, verified identity, refusals and benchmarks.';
const RELEASE_TAGLINE = 'Prediction-market intelligence your agent can quote safely.';
const WEBSITE_URL = 'https://www.worldeventtrading.com/mcp';
const REPOSITORY_URL = 'https://github.com/Corbinvking/wet-mcp';
const REPOSITORY_OWNER_LOGIN = new URL(REPOSITORY_URL).pathname.split('/')[1];
const ICON_URL = 'https://www.worldeventtrading.com/icon.png';
const RELEASE_EVIDENCE = 'assets/release-evidence.json';
const RELEASE_EVIDENCE_TEMPLATE = 'assets/release-evidence.template.json';
const EVAL_EVIDENCE = 'evals/latest-release-run.json';
const EVAL_ARTIFACT_SCHEMA = 'wet.eval-raw-artifacts/v2';
const EVAL_ARTIFACT_DIRECTORY = 'evals/release-artifacts';
const RELEASE_EVIDENCE_SCHEMA = 'wet.release-evidence/v3';
const SOURCE_RIGHTS_POLICY = 'mcp-source-rights/2026-09-05.phase1';
const OUTPUT_CONTRACT_VERSION = 'wet-mcp-public-output/0.7.0';
const OUTPUT_CONTRACT_SHA256 = '0ffc504add260ff197cedaca26bff3e11f64f5716293a61f935424892c5fbe82';
const RELEASE_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;
const MIN_SCREENSHOT_BYTES = 16 * 1_024;
const MIN_SCREENSHOT_WIDTH = 800;
const MIN_SCREENSHOT_HEIGHT = 450;
const MIN_DEMO_BYTES = 100 * 1_024;
const MAX_DEMO_SECONDS = 90;
const DEMO_DURATION_TOLERANCE_SECONDS = 0.5;
const MAX_EVAL_ANSWER_BYTES = 256 * 1_024;
const MAX_EVAL_TOOL_RESULT_BYTES = 4 * 1_024 * 1_024;
const SOURCE_RIGHTS_REFUSAL = 'source_rights_pending';
const SOURCE_RIGHTS_FILTERING = 'coarse-all-rights-protected-sources';
const VALUE_BEARING_KEYS = new Set([
  'benchmarks',
  'change',
  'constituents',
  'contracts',
  'events',
  'groups',
  'history',
  'index',
  'indexes',
  'items',
  'latest',
  'listings',
  'markets',
  'movement',
  'moves',
  'outcomes',
  'probability',
  'rows',
  'spread',
  'spreadPoints',
  'title',
  'value',
  'yesProbability',
]);
const SENSITIVE_JSON_KEYS = new Set([
  'accesstoken',
  'authorization',
  'clientsecret',
  'cookie',
  'idtoken',
  'password',
  'passphrase',
  'privatekey',
  'refreshtoken',
  'sessioncookie',
  'setcookie',
  'xwetapikey',
]);
const MAX_PNG_DECODED_BYTES = 512 * 1024 * 1024;
const MAX_DEMO_SAMPLES = 1_000_000;
const SOURCE_RIGHTS_REVIEWER_ROLES = new Set(['legal-counsel', 'source-rights-reviewer']);
const DEMO_DOCUMENTATION = new Set([
  'assets/demo/README.md',
  'assets/demo/negative-refusal-storyboard.md',
  'assets/demo/positive-55s-storyboard.md',
]);
const SCREENSHOT_DOCUMENTATION = new Set(['assets/screenshots/README.md']);
const PUBLIC_TOOLS = [
  'wet_benchmark_value',
  'wet_search_events',
  'wet_screen_markets',
  'wet_event_markets',
  'wet_cross_venue',
  'wet_event_headlines',
  'wet_resolve',
].sort();
const RELEASE_COPY_ROOT_FILES = [
  '.claude-plugin/plugin.json',
  'DATA-SOURCES.md',
  'GEMINI.md',
  'LIMITATIONS.md',
  'README.md',
  'SUPPORT.md',
  'gemini-extension.json',
  'llms-install.md',
  'plugin.json',
  'server.json',
];
const RELEASE_COPY_DIRECTORIES = [
  'assets/demo',
  'assets/screenshots',
  'clients',
  'docker',
  'docs',
  'evals',
  'examples',
  'skills',
];
const RELEASE_COPY_EXTENSIONS = new Set(['.json', '.md', '.yaml', '.yml']);
const DEMO_KINDS = ['positive-index-workflow', 'typed-refusal'];
const SCREENSHOT_KINDS = ['anonymous-tools-list', 'positive-index-workflow', 'typed-refusal'];

const cliArgs = process.argv.slice(2);
const selfTest = cliArgs.includes('--self-test');

if (cliArgs.includes('--help') || cliArgs.includes('-h')) {
  console.log(`Usage: node scripts/release-package-verify.mjs [--self-test]

Without flags, verifies that the package is truthful and complete for an active
release. It is intentionally stricter than scripts/validate.mjs and must fail
while the package or production service is held.

--self-test  Succeeds only when this held release candidate is rejected for its
             explicit hold state as well as its missing release evidence.`);
  process.exit(0);
}

for (const argument of cliArgs) {
  if (argument !== '--self-test') {
    console.error(`Unknown option: ${argument}`);
    console.error('Run with --help for usage.');
    process.exit(2);
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sameMembers(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length &&
    JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function instantMs(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value)) return null;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) return null;
  const canonical = new Date(milliseconds).toISOString();
  if (value !== canonical && value !== canonical.replace('.000Z', 'Z')) return null;
  return milliseconds;
}

function validSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value) && !/^0{64}$/u.test(value);
}

function validGitSha(value) {
  return typeof value === 'string' && /^[a-f0-9]{40}$/u.test(value) && !/^0{40}$/u.test(value);
}

function validReviewerLogin(value) {
  return typeof value === 'string' &&
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/u.test(value) &&
    !value.includes('--');
}

function validEvidenceRef(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 500 || /\s|REPLACE_WITH_/u.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'urn:';
  } catch {
    return false;
  }
}

function normalizedText(value) {
  return value.replace(/\s+/gu, ' ').trim();
}

function relative(file) {
  return path.relative(PACKAGE_ROOT, file).split(path.sep).join('/');
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

function requireUtcInstant(add, code, label, value, nowMs, { fresh = false, futureAllowed = false } = {}) {
  const milliseconds = instantMs(value);
  if (milliseconds === null) {
    add(code, `${label} must be a strict RFC 3339 UTC timestamp ending in Z.`);
    return null;
  }
  if (!futureAllowed && milliseconds > nowMs) {
    add(code, `${label} cannot be in the future.`);
  }
  if (fresh && milliseconds < nowMs - RELEASE_WINDOW_MS) {
    add(code, `${label} must fall inside the current seven-day release window.`);
  }
  return milliseconds;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function pngPassSize(size, start, step) {
  return size <= start ? 0 : Math.ceil((size - start) / step);
}

function pngDecodedLayout(width, height, bitsPerPixel, interlace) {
  const passes = interlace === 0
    ? [{ width, height }]
    : [
        [0, 0, 8, 8],
        [4, 0, 8, 8],
        [0, 4, 4, 8],
        [2, 0, 4, 4],
        [0, 2, 2, 4],
        [1, 0, 2, 2],
        [0, 1, 1, 2],
      ].map(([x, y, dx, dy]) => ({
        width: pngPassSize(width, x, dx),
        height: pngPassSize(height, y, dy),
      }));
  let decodedBytes = 0;
  for (const pass of passes) {
    if (pass.width === 0 || pass.height === 0) continue;
    const rowBytes = Math.ceil((pass.width * bitsPerPixel) / 8);
    decodedBytes += pass.height * (1 + rowBytes);
  }
  if (!Number.isSafeInteger(decodedBytes) || decodedBytes <= 0 || decodedBytes > MAX_PNG_DECODED_BYTES) {
    throw new Error(`PNG decoded image must be no larger than ${MAX_PNG_DECODED_BYTES} bytes`);
  }
  return { passes, decodedBytes };
}

function validatePngScanlines(decoded, passes, bitsPerPixel) {
  let offset = 0;
  for (const pass of passes) {
    if (pass.width === 0 || pass.height === 0) continue;
    const rowBytes = Math.ceil((pass.width * bitsPerPixel) / 8);
    for (let row = 0; row < pass.height; row += 1) {
      const filter = decoded[offset];
      if (filter === undefined || filter > 4) throw new Error('PNG contains an invalid or missing scanline filter byte');
      offset += 1 + rowBytes;
    }
  }
  if (offset !== decoded.length) throw new Error('PNG decoded scanlines do not match its IHDR dimensions');
}

function validatePngBytes(bytes) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length < MIN_SCREENSHOT_BYTES) throw new Error(`PNG must be at least ${MIN_SCREENSHOT_BYTES} bytes`);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error('PNG signature is invalid');

  let offset = 8;
  let chunkIndex = 0;
  let width = null;
  let height = null;
  let bitDepth = null;
  let colorType = null;
  let interlace = null;
  let paletteEntries = null;
  let sawIdat = false;
  let idatEnded = false;
  let sawIend = false;
  const idatParts = [];
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error('PNG has a truncated chunk header or CRC');
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (!/^[A-Za-z]{4}$/u.test(type) || chunkEnd > bytes.length) throw new Error('PNG chunk bounds are invalid');
    const expectedCrc = bytes.readUInt32BE(dataEnd);
    const actualCrc = crc32(bytes.subarray(offset + 4, dataEnd));
    if (actualCrc !== expectedCrc) throw new Error(`PNG ${type} chunk CRC is invalid`);
    if (chunkIndex === 0 && type !== 'IHDR') throw new Error('PNG first chunk must be IHDR');
    if (!['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type) && type[0] === type[0].toUpperCase()) {
      throw new Error(`PNG contains unsupported critical chunk ${type}`);
    }
    if (type === 'IHDR') {
      if (chunkIndex !== 0 || length !== 13 || width !== null) throw new Error('PNG must contain one 13-byte leading IHDR');
      width = bytes.readUInt32BE(dataStart);
      height = bytes.readUInt32BE(dataStart + 4);
      if (width < MIN_SCREENSHOT_WIDTH || height < MIN_SCREENSHOT_HEIGHT) {
        throw new Error(`PNG dimensions must be at least ${MIN_SCREENSHOT_WIDTH}x${MIN_SCREENSHOT_HEIGHT}`);
      }
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      const validDepths = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (!validDepths[colorType]?.includes(bitDepth)) throw new Error('PNG IHDR color type and bit depth are incompatible');
      if (bytes[dataStart + 10] !== 0 || bytes[dataStart + 11] !== 0) {
        throw new Error('PNG IHDR compression and filter methods must be 0');
      }
      interlace = bytes[dataStart + 12];
      if (interlace !== 0 && interlace !== 1) throw new Error('PNG IHDR interlace method must be 0 or 1');
    }
    if (type === 'PLTE') {
      if (sawIdat || paletteEntries !== null || length === 0 || length % 3 !== 0 || length > 768) {
        throw new Error('PNG PLTE chunk is invalid or out of order');
      }
      if (colorType === 0 || colorType === 4) throw new Error('PNG grayscale images cannot contain a PLTE chunk');
      paletteEntries = length / 3;
      if (colorType === 3 && paletteEntries > 2 ** bitDepth) throw new Error('PNG palette exceeds the indexed bit depth');
    }
    if (sawIdat && type !== 'IDAT') idatEnded = true;
    if (type === 'IDAT') {
      if (idatEnded) throw new Error('PNG IDAT chunks must be consecutive');
      sawIdat = true;
      idatParts.push(bytes.subarray(dataStart, dataEnd));
    }
    if (type === 'IEND') {
      if (length !== 0 || chunkEnd !== bytes.length) throw new Error('PNG IEND must be empty and final');
      sawIend = true;
    }
    offset = chunkEnd;
    chunkIndex += 1;
  }
  if (width === null || height === null || !sawIdat || !sawIend) {
    throw new Error('PNG must contain IHDR, IDAT, and final IEND chunks');
  }
  if (colorType === 3 && paletteEntries === null) throw new Error('PNG indexed-color images require a PLTE chunk');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const bitsPerPixel = channels * bitDepth;
  const layout = pngDecodedLayout(width, height, bitsPerPixel, interlace);
  let decoded;
  try {
    decoded = inflateSync(Buffer.concat(idatParts), { maxOutputLength: layout.decodedBytes + 1 });
  } catch (error) {
    throw new Error(`PNG IDAT stream is not valid zlib data: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (decoded.length !== layout.decodedBytes) throw new Error('PNG decoded byte count does not match its IHDR dimensions');
  validatePngScanlines(decoded, layout.passes, bitsPerPixel);
  return { width, height };
}

function readIsoBoxes(bytes, start = 0, end = bytes.length) {
  const boxes = [];
  let offset = start;
  while (offset < end) {
    if (offset + 8 > end) throw new Error('MP4 contains a truncated box header');
    const size32 = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (!/^[\x20-\x7e]{4}$/u.test(type)) throw new Error('MP4 contains an invalid box type');
    let headerBytes = 8;
    let size;
    if (size32 === 1) {
      if (offset + 16 > end) throw new Error('MP4 contains a truncated extended-size box');
      const extended = bytes.readBigUInt64BE(offset + 8);
      if (extended > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('MP4 box size exceeds the safe parser range');
      size = Number(extended);
      headerBytes = 16;
    } else if (size32 === 0) {
      size = end - offset;
    } else {
      size = size32;
    }
    if (size < headerBytes || offset + size > end) throw new Error(`MP4 ${type} box bounds are invalid`);
    boxes.push({ type, start: offset, dataStart: offset + headerBytes, end: offset + size });
    offset += size;
  }
  if (offset !== end) throw new Error('MP4 box sequence does not consume its container');
  return boxes;
}

function requireIsoChild(bytes, parent, type, label) {
  const matches = readIsoBoxes(bytes, parent.dataStart, parent.end).filter((box) => box.type === type);
  if (matches.length !== 1) throw new Error(`${label} must contain exactly one ${type} box`);
  return matches[0];
}

function validateTrackHeader(bytes, trak) {
  const tkhd = requireIsoChild(bytes, trak, 'tkhd', 'MP4 video trak');
  const version = bytes[tkhd.dataStart];
  let trackIdOffset;
  let widthOffset;
  if (version === 0) {
    if (tkhd.dataStart + 84 > tkhd.end) throw new Error('MP4 version-0 tkhd is truncated');
    trackIdOffset = tkhd.dataStart + 12;
    widthOffset = tkhd.dataStart + 76;
  } else if (version === 1) {
    if (tkhd.dataStart + 96 > tkhd.end) throw new Error('MP4 version-1 tkhd is truncated');
    trackIdOffset = tkhd.dataStart + 20;
    widthOffset = tkhd.dataStart + 88;
  } else {
    throw new Error(`MP4 tkhd version ${version} is unsupported`);
  }
  const trackId = bytes.readUInt32BE(trackIdOffset);
  const width = bytes.readUInt32BE(widthOffset) / 65536;
  const height = bytes.readUInt32BE(widthOffset + 4) / 65536;
  if (trackId === 0 || width <= 0 || height <= 0) {
    throw new Error('MP4 video tkhd must have a nonzero track id and positive display dimensions');
  }
  return { trackId, width, height };
}

function parseVideoSampleDescriptions(bytes, stsd) {
  if (stsd.dataStart + 8 > stsd.end || bytes[stsd.dataStart] !== 0) {
    throw new Error('MP4 video stsd is truncated or uses an unsupported version');
  }
  const entryCount = bytes.readUInt32BE(stsd.dataStart + 4);
  if (entryCount === 0) throw new Error('MP4 video stsd must contain a sample description');
  const entries = readIsoBoxes(bytes, stsd.dataStart + 8, stsd.end);
  if (entries.length !== entryCount) throw new Error('MP4 video stsd entry_count does not match its entries');
  for (const entry of entries) {
    if (entry.end - entry.dataStart < 78) throw new Error(`MP4 video sample entry ${entry.type} is truncated`);
    const dataReferenceIndex = bytes.readUInt16BE(entry.dataStart + 6);
    const width = bytes.readUInt16BE(entry.dataStart + 24);
    const height = bytes.readUInt16BE(entry.dataStart + 26);
    if (dataReferenceIndex === 0 || width === 0 || height === 0) {
      throw new Error(`MP4 video sample entry ${entry.type} lacks a data reference or dimensions`);
    }
  }
  return entryCount;
}

function parseTimeToSample(bytes, stts) {
  if (stts.dataStart + 8 > stts.end || bytes[stts.dataStart] !== 0) {
    throw new Error('MP4 video stts is truncated or uses an unsupported version');
  }
  const entryCount = bytes.readUInt32BE(stts.dataStart + 4);
  if (entryCount === 0 || stts.dataStart + 8 + entryCount * 8 !== stts.end) {
    throw new Error('MP4 video stts must contain a complete timing table');
  }
  let total = 0n;
  for (let index = 0; index < entryCount; index += 1) {
    const offset = stts.dataStart + 8 + index * 8;
    const count = bytes.readUInt32BE(offset);
    const delta = bytes.readUInt32BE(offset + 4);
    if (count === 0 || delta === 0) throw new Error('MP4 video stts entries must have positive sample counts and deltas');
    total += BigInt(count);
  }
  if (total > BigInt(MAX_DEMO_SAMPLES)) throw new Error(`MP4 video sample count exceeds ${MAX_DEMO_SAMPLES}`);
  return Number(total);
}

function parseSampleToChunk(bytes, stsc, descriptionCount) {
  if (stsc.dataStart + 8 > stsc.end || bytes[stsc.dataStart] !== 0) {
    throw new Error('MP4 video stsc is truncated or uses an unsupported version');
  }
  const entryCount = bytes.readUInt32BE(stsc.dataStart + 4);
  if (entryCount === 0 || stsc.dataStart + 8 + entryCount * 12 !== stsc.end) {
    throw new Error('MP4 video stsc must contain a complete sample-to-chunk table');
  }
  const entries = [];
  for (let index = 0; index < entryCount; index += 1) {
    const offset = stsc.dataStart + 8 + index * 12;
    const entry = {
      firstChunk: bytes.readUInt32BE(offset),
      samplesPerChunk: bytes.readUInt32BE(offset + 4),
      sampleDescriptionIndex: bytes.readUInt32BE(offset + 8),
    };
    if (
      entry.firstChunk === 0 ||
      entry.samplesPerChunk === 0 ||
      entry.sampleDescriptionIndex === 0 ||
      entry.sampleDescriptionIndex > descriptionCount ||
      (entries.length > 0 && entry.firstChunk <= entries.at(-1).firstChunk)
    ) {
      throw new Error('MP4 video stsc contains an invalid or non-increasing entry');
    }
    entries.push(entry);
  }
  if (entries[0].firstChunk !== 1) throw new Error('MP4 video stsc must begin at chunk 1');
  return entries;
}

function parseSampleSizes(bytes, stbl) {
  const children = readIsoBoxes(bytes, stbl.dataStart, stbl.end);
  const stsz = children.filter((box) => box.type === 'stsz');
  const stz2 = children.filter((box) => box.type === 'stz2');
  if (stsz.length + stz2.length !== 1) throw new Error('MP4 video sample table must contain exactly one stsz or stz2 box');
  const box = stsz[0] ?? stz2[0];
  if (box.dataStart + 12 > box.end || bytes[box.dataStart] !== 0) {
    throw new Error(`MP4 video ${box.type} is truncated or uses an unsupported version`);
  }
  const sampleCount = bytes.readUInt32BE(box.dataStart + 8);
  if (sampleCount === 0 || sampleCount > MAX_DEMO_SAMPLES) {
    throw new Error(`MP4 video sample count must be between 1 and ${MAX_DEMO_SAMPLES}`);
  }
  const sizes = [];
  if (box.type === 'stsz') {
    const fixedSize = bytes.readUInt32BE(box.dataStart + 4);
    if (fixedSize > 0) {
      if (box.dataStart + 12 !== box.end) throw new Error('MP4 fixed-size stsz has trailing data');
      return { sampleCount, sizes: Array(sampleCount).fill(fixedSize) };
    }
    if (box.dataStart + 12 + sampleCount * 4 !== box.end) throw new Error('MP4 stsz sample table is truncated');
    for (let index = 0; index < sampleCount; index += 1) sizes.push(bytes.readUInt32BE(box.dataStart + 12 + index * 4));
  } else {
    const fieldSize = bytes[box.dataStart + 7];
    const entryBytes = fieldSize === 4 ? Math.ceil(sampleCount / 2) : fieldSize === 8 ? sampleCount : fieldSize === 16 ? sampleCount * 2 : -1;
    if (entryBytes < 0 || box.dataStart + 12 + entryBytes !== box.end) throw new Error('MP4 stz2 field size or sample table is invalid');
    for (let index = 0; index < sampleCount; index += 1) {
      const start = box.dataStart + 12;
      if (fieldSize === 4) {
        const packed = bytes[start + Math.floor(index / 2)];
        sizes.push(index % 2 === 0 ? packed >>> 4 : packed & 0x0f);
      } else if (fieldSize === 8) {
        sizes.push(bytes[start + index]);
      } else {
        sizes.push(bytes.readUInt16BE(start + index * 2));
      }
    }
  }
  if (sizes.some((size) => size === 0)) throw new Error('MP4 video samples must have nonzero byte sizes');
  return { sampleCount, sizes };
}

function parseChunkOffsets(bytes, stbl) {
  const children = readIsoBoxes(bytes, stbl.dataStart, stbl.end);
  const stco = children.filter((box) => box.type === 'stco');
  const co64 = children.filter((box) => box.type === 'co64');
  if (stco.length + co64.length !== 1) throw new Error('MP4 video sample table must contain exactly one stco or co64 box');
  const box = stco[0] ?? co64[0];
  if (box.dataStart + 8 > box.end || bytes[box.dataStart] !== 0) {
    throw new Error(`MP4 video ${box.type} is truncated or uses an unsupported version`);
  }
  const entryCount = bytes.readUInt32BE(box.dataStart + 4);
  const entrySize = box.type === 'stco' ? 4 : 8;
  if (entryCount === 0 || box.dataStart + 8 + entryCount * entrySize !== box.end) {
    throw new Error(`MP4 video ${box.type} must contain a complete nonempty chunk-offset table`);
  }
  const offsets = [];
  for (let index = 0; index < entryCount; index += 1) {
    const offset = box.dataStart + 8 + index * entrySize;
    if (entrySize === 4) {
      offsets.push(bytes.readUInt32BE(offset));
    } else {
      const value = bytes.readBigUInt64BE(offset);
      if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('MP4 co64 offset exceeds the safe parser range');
      offsets.push(Number(value));
    }
  }
  return offsets;
}

function validateVideoTrack(bytes, trak, mdats) {
  const mdia = requireIsoChild(bytes, trak, 'mdia', 'MP4 trak');
  const hdlr = requireIsoChild(bytes, mdia, 'hdlr', 'MP4 trak mdia');
  if (hdlr.dataStart + 12 > hdlr.end || bytes[hdlr.dataStart] !== 0) {
    throw new Error('MP4 hdlr is truncated or uses an unsupported version');
  }
  if (bytes.toString('ascii', hdlr.dataStart + 8, hdlr.dataStart + 12) !== 'vide') return null;

  const track = validateTrackHeader(bytes, trak);
  const minf = requireIsoChild(bytes, mdia, 'minf', 'MP4 video mdia');
  const stbl = requireIsoChild(bytes, minf, 'stbl', 'MP4 video minf');
  const stsd = requireIsoChild(bytes, stbl, 'stsd', 'MP4 video stbl');
  const stts = requireIsoChild(bytes, stbl, 'stts', 'MP4 video stbl');
  const stsc = requireIsoChild(bytes, stbl, 'stsc', 'MP4 video stbl');
  const descriptionCount = parseVideoSampleDescriptions(bytes, stsd);
  const timedSampleCount = parseTimeToSample(bytes, stts);
  const chunkMap = parseSampleToChunk(bytes, stsc, descriptionCount);
  const { sampleCount, sizes } = parseSampleSizes(bytes, stbl);
  const chunkOffsets = parseChunkOffsets(bytes, stbl);
  if (timedSampleCount !== sampleCount) throw new Error('MP4 video timing and size tables disagree on sample count');

  let sampleIndex = 0;
  let mapIndex = 0;
  for (let chunkIndex = 1; chunkIndex <= chunkOffsets.length; chunkIndex += 1) {
    while (chunkMap[mapIndex + 1]?.firstChunk <= chunkIndex) mapIndex += 1;
    const count = chunkMap[mapIndex].samplesPerChunk;
    if (sampleIndex + count > sampleCount) throw new Error('MP4 video chunk map references more samples than stsz/stz2');
    const chunkBytes = sizes.slice(sampleIndex, sampleIndex + count).reduce((sum, size) => sum + size, 0);
    const chunkOffset = chunkOffsets[chunkIndex - 1];
    if (!mdats.some((mdat) => chunkOffset >= mdat.dataStart && chunkOffset + chunkBytes <= mdat.end)) {
      throw new Error('MP4 video chunk offset or sample bytes fall outside populated mdat data');
    }
    sampleIndex += count;
  }
  if (sampleIndex !== sampleCount) throw new Error('MP4 video chunk map does not account for every sample');
  return { ...track, sampleCount };
}

function validateMp4Bytes(bytes, declaredDurationSeconds) {
  if (bytes.length < MIN_DEMO_BYTES) throw new Error(`MP4 must be at least ${MIN_DEMO_BYTES} bytes`);
  const boxes = readIsoBoxes(bytes);
  if (boxes[0]?.type !== 'ftyp' || boxes[0].end - boxes[0].dataStart < 8) {
    throw new Error('MP4 must begin with a populated ftyp box');
  }
  const moovs = boxes.filter((box) => box.type === 'moov');
  const mdats = boxes.filter((box) => box.type === 'mdat' && box.end > box.dataStart);
  if (moovs.length !== 1 || mdats.length === 0) throw new Error('MP4 must contain one moov and at least one populated mdat box');
  const moov = moovs[0];
  const mvhd = requireIsoChild(bytes, moov, 'mvhd', 'MP4 moov');

  const version = bytes[mvhd.dataStart];
  let timescale;
  let duration;
  if (version === 0) {
    if (mvhd.dataStart + 20 > mvhd.end) throw new Error('MP4 version-0 mvhd is truncated');
    timescale = bytes.readUInt32BE(mvhd.dataStart + 12);
    duration = bytes.readUInt32BE(mvhd.dataStart + 16);
    if (duration === 0xffffffff) throw new Error('MP4 mvhd duration cannot be unknown');
  } else if (version === 1) {
    if (mvhd.dataStart + 32 > mvhd.end) throw new Error('MP4 version-1 mvhd is truncated');
    timescale = bytes.readUInt32BE(mvhd.dataStart + 20);
    const duration64 = bytes.readBigUInt64BE(mvhd.dataStart + 24);
    if (duration64 === 0xffffffffffffffffn || duration64 > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('MP4 mvhd duration is unknown or outside the safe parser range');
    }
    duration = Number(duration64);
  } else {
    throw new Error(`MP4 mvhd version ${version} is unsupported`);
  }
  if (timescale <= 0 || duration <= 0) throw new Error('MP4 mvhd timescale and duration must be positive');
  const durationSeconds = duration / timescale;
  if (!Number.isFinite(durationSeconds) || durationSeconds > MAX_DEMO_SECONDS) {
    throw new Error(`MP4 duration must be at most ${MAX_DEMO_SECONDS} seconds`);
  }
  if (!Number.isFinite(declaredDurationSeconds) ||
      Math.abs(durationSeconds - declaredDurationSeconds) > DEMO_DURATION_TOLERANCE_SECONDS) {
    throw new Error(`MP4 mvhd duration ${durationSeconds.toFixed(3)}s does not match the declared duration`);
  }
  const traks = readIsoBoxes(bytes, moov.dataStart, moov.end).filter((box) => box.type === 'trak');
  if (traks.length === 0) throw new Error('MP4 moov must contain a media trak');
  const videoTracks = traks.map((trak) => validateVideoTrack(bytes, trak, mdats)).filter(Boolean);
  if (videoTracks.length === 0) throw new Error('MP4 must contain a video trak with a vide handler');
  return {
    durationSeconds,
    videoTrackCount: videoTracks.length,
    videoSampleCount: videoTracks.reduce((sum, track) => sum + track.sampleCount, 0),
  };
}

function normalizedKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, '');
}

function walkJson(value, visitor, pathParts = []) {
  visitor(value, pathParts);
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) walkJson(item, visitor, [...pathParts, String(index)]);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, item] of Object.entries(value)) walkJson(item, visitor, [...pathParts, key]);
}

function sensitiveArtifactFinding(text, parsed = null) {
  const textPatterns = [
    ['private key', /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/iu],
    ['authorization bearer', /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/iu],
    ['session cookie', /\b(?:Cookie|Set-Cookie)\s*:\s*[^\r\n]{8,}/iu],
    ['provider credential', /\b(?:github_pat_|gh[pousr]_|sk_(?:live|test)_|rk_(?:live|test)_|AKIA|ASIA)[A-Za-z0-9_-]{12,}/u],
    ['named secret', /\b(?:api[_ -]?key|client[_ -]?secret|access[_ -]?token|refresh[_ -]?token|password|passphrase)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}/iu],
    ['email address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu],
    ['US Social Security number', /\b(?!000|666|9\d\d)\d{3}[- ](?!00)\d{2}[- ](?!0000)\d{4}\b/u],
    ['US telephone number', /(?:^|[^\d])(?:\+?1[ .-]?)?\(?[2-9]\d{2}\)?[ .-]\d{3}[ .-]\d{4}(?:$|[^\d])/u],
  ];
  for (const [label, pattern] of textPatterns) {
    if (pattern.test(text)) return label;
  }

  if (parsed !== null) {
    let finding = null;
    walkJson(parsed, (value, pathParts) => {
      if (finding || pathParts.length === 0) return;
      const key = normalizedKey(pathParts.at(-1));
      if (!SENSITIVE_JSON_KEYS.has(key)) return;
      const populated = typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== false;
      if (populated) finding = `sensitive JSON field ${pathParts.join('.')}`;
    });
    if (finding) return finding;
  }
  return null;
}

function collectRefusalCodes(value) {
  const codes = new Set();
  walkJson(value, (candidate, pathParts) => {
    if (typeof candidate !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,79}$/u.test(candidate)) return;
    const key = pathParts.at(-1);
    const parentKey = pathParts.at(-2);
    if (key === 'code' && parentKey === 'refusal') codes.add(candidate);
    if (parentKey === 'refusalCodes') codes.add(candidate);
  });
  return [...codes].sort();
}

function artifactSignals(value) {
  let sourceUrl = false;
  let venue = false;
  let timestamp = false;
  walkJson(value, (candidate, pathParts) => {
    const key = normalizedKey(pathParts.at(-1) ?? '');
    if (typeof candidate === 'string') {
      if (/^https:\/\/[^\s]+$/u.test(candidate)) sourceUrl = true;
      if (/^(?:date|asof|observedat|capturedat|publishedat|checkedat|eventtime|settledat|from|to)$/u.test(key) &&
          /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/u.test(candidate)) {
        timestamp = true;
      }
    }
    if (/^(?:venue|venues|venuename)$/u.test(key)) {
      venue ||= typeof candidate === 'string' ? candidate.trim().length > 0 : Array.isArray(candidate) && candidate.length > 0;
    }
  });
  return { source_url: sourceUrl, venue, timestamp };
}

function answerSignals(text) {
  return {
    source_url: /https:\/\/[^\s)>\]}]+/iu.test(text),
    venue: /\b(?:Kalshi|Polymarket|Gemini)\b/iu.test(text),
    timestamp: /\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?\b/u.test(text),
  };
}

function hasValueBearingKey(value) {
  let found = false;
  walkJson(value, (_candidate, pathParts) => {
    if (VALUE_BEARING_KEYS.has(pathParts.at(-1))) found = true;
  });
  return found;
}

function validSourceRightsPending(structured, refusalCodes) {
  if (!refusalCodes.includes(SOURCE_RIGHTS_REFUSAL)) return true;
  const sourceRights = isRecord(structured.sourceRights) ? structured.sourceRights : null;
  return structured.refused === true &&
    isRecord(structured.refusal) &&
    structured.refusal.code === SOURCE_RIGHTS_REFUSAL &&
    sourceRights?.policyVersion === SOURCE_RIGHTS_POLICY &&
    sourceRights.enforcement === 'default-deny' &&
    sourceRights.filtering === SOURCE_RIGHTS_FILTERING &&
    Number.isInteger(sourceRights.excludedSourceCount) &&
    sourceRights.excludedSourceCount > 0 &&
    !hasValueBearingKey(structured);
}

function usefulToolResult(tool, structured, protocolSafe, sourceRightsPending) {
  if (!protocolSafe || sourceRightsPending || structured.refused === true || structured.ok === false) return false;
  switch (tool) {
    case 'wet_benchmark_value':
      return (Array.isArray(structured.benchmarks) && structured.benchmarks.length > 0) ||
        (isRecord(structured.latest) && structured.latest.refused === false && Number.isFinite(structured.latest.value));
    case 'wet_search_events':
      return Array.isArray(structured.events) && structured.events.length > 0 && Number(structured.returned) > 0;
    case 'wet_screen_markets':
      return Array.isArray(structured.outcomes) && structured.outcomes.length > 0 && Number(structured.returned) > 0;
    case 'wet_event_markets':
      return Array.isArray(structured.markets) && structured.markets.length > 0 && Number(structured.marketCount) > 0;
    case 'wet_cross_venue':
      return (Array.isArray(structured.groups) && structured.groups.length > 0) ||
        (Array.isArray(structured.contracts) && structured.contracts.length >= 2);
    case 'wet_event_headlines':
      return Array.isArray(structured.items) && structured.items.length > 0 && Number(structured.returned) > 0;
    case 'wet_resolve':
      return isRecord(structured.counts) && Number(structured.counts.resolved) > 0 &&
        Array.isArray(structured.listings) && structured.listings.some((listing) => isRecord(listing) && listing.resolved === true);
    default:
      return false;
  }
}

function deriveToolResultClaims(tool, parsed) {
  const result = isRecord(parsed.result) ? parsed.result : null;
  const structured = isRecord(result?.structuredContent) ? result.structuredContent : null;
  const content = Array.isArray(result?.content) ? result.content : [];
  const contentValid = content.length > 0 && content.every((entry) =>
    isRecord(entry) && entry.type === 'text' && typeof entry.text === 'string' && entry.text.trim().length > 0);
  const refusalCodes = structured ? collectRefusalCodes(structured) : [];
  const sourceRightsPending = refusalCodes.includes(SOURCE_RIGHTS_REFUSAL);
  const protocolSafe = parsed.jsonrpc === '2.0' &&
    Object.hasOwn(parsed, 'id') &&
    !Object.hasOwn(parsed, 'error') &&
    result !== null &&
    result.isError !== true &&
    structured !== null &&
    Object.keys(structured).length > 0 &&
    contentValid &&
    validSourceRightsPending(structured, refusalCodes) &&
    !(tool === 'wet_resolve' && sourceRightsPending);

  return {
    protocolSafe,
    usefulResult: structured ? usefulToolResult(tool, structured, protocolSafe, sourceRightsPending) : false,
    sourceRightsPending,
    resultSignals: structured ? artifactSignals(structured) : { source_url: false, venue: false, timestamp: false },
    refusalCodes,
  };
}

function sameSignals(actual, expected) {
  return isRecord(actual) &&
    actual.source_url === expected.source_url &&
    actual.venue === expected.venue &&
    actual.timestamp === expected.timestamp &&
    Object.keys(actual).length === 3;
}

function toolClaimsMatchReport(reportCall, claims) {
  return isRecord(reportCall) &&
    reportCall.protocolSafe === claims.protocolSafe &&
    reportCall.usefulResult === claims.usefulResult &&
    reportCall.sourceRightsPending === claims.sourceRightsPending &&
    sameSignals(reportCall.resultSignals, claims.resultSignals) &&
    sameMembers(reportCall.refusalCodes, claims.refusalCodes);
}

function validateEvaluationArtifactBytes(kind, bytes, tool = null) {
  const maximum = kind === 'answer' ? MAX_EVAL_ANSWER_BYTES : MAX_EVAL_TOOL_RESULT_BYTES;
  if (bytes.length === 0) throw new Error('raw evaluation artifact cannot be empty');
  if (bytes.length > maximum) throw new Error(`raw ${kind} artifact exceeds the ${maximum}-byte limit`);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('raw evaluation artifact must be valid UTF-8');
  }
  if (text.trim().length === 0) throw new Error('raw evaluation artifact cannot be blank');
  if (text.startsWith('version https://git-lfs.github.com/spec/v1')) {
    throw new Error('raw evaluation artifact cannot be a Git LFS pointer');
  }
  let parsed = null;
  if (kind === 'tool-result') {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('raw tool-result artifact must contain valid JSON');
    }
    if (!isRecord(parsed)) throw new Error('raw tool-result artifact must contain one JSON object');
    if (typeof tool !== 'string' || !PUBLIC_TOOLS.includes(tool)) {
      throw new Error('raw tool-result artifact must be checked against one canonical public tool');
    }
    const result = isRecord(parsed.result) ? parsed.result : null;
    const structured = isRecord(result?.structuredContent) ? result.structuredContent : null;
    if (parsed.jsonrpc !== '2.0' || !Object.hasOwn(parsed, 'id') || Object.hasOwn(parsed, 'error') || !result) {
      throw new Error('raw tool-result artifact must be one JSON-RPC 2.0 success envelope');
    }
    if (!Array.isArray(result.content) || result.content.length === 0 || !structured || Object.keys(structured).length === 0) {
      throw new Error('raw tool-result artifact must contain nonempty MCP content and structuredContent');
    }
    const claims = deriveToolResultClaims(tool, parsed);
    const sensitive = sensitiveArtifactFinding(text, parsed);
    if (sensitive) throw new Error(`raw tool-result artifact contains prohibited secret or PII: ${sensitive}`);
    return { text, parsed, claims };
  }
  const sensitive = sensitiveArtifactFinding(text);
  if (sensitive) throw new Error(`raw answer artifact contains prohibited secret or PII: ${sensitive}`);
  return { text, parsed: null, claims: { answerSignals: answerSignals(text) } };
}

function releaseArtifactParserSelfTest() {
  const box = (type, data) => {
    const result = Buffer.alloc(8 + data.length);
    result.writeUInt32BE(result.length, 0);
    result.write(type, 4, 4, 'ascii');
    data.copy(result, 8);
    return result;
  };
  const pngChunk = (type, data) => {
    const result = Buffer.alloc(12 + data.length);
    result.writeUInt32BE(data.length, 0);
    result.write(type, 4, 4, 'ascii');
    data.copy(result, 8);
    result.writeUInt32BE(crc32(result.subarray(4, 8 + data.length)), 8 + data.length);
    return result;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(MIN_SCREENSHOT_WIDTH, 0);
  ihdr.writeUInt32BE(MIN_SCREENSHOT_HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const makePng = (scanlines) => Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', ihdr),
      pngChunk('tEXt', Buffer.concat([Buffer.from('Comment\0'), Buffer.alloc(MIN_SCREENSHOT_BYTES, 0x41)])),
      pngChunk('IDAT', deflateSync(scanlines)),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
  const pngRowBytes = MIN_SCREENSHOT_WIDTH * 4;
  const validPng = makePng(Buffer.alloc(MIN_SCREENSHOT_HEIGHT * (1 + pngRowBytes)));

  const sampleWidth = 320;
  const sampleHeight = 180;
  const videoSample = Buffer.alloc(sampleWidth * sampleHeight * 3, 0x80);
  const ftypData = Buffer.alloc(12);
  ftypData.write('isom', 0, 4, 'ascii');
  ftypData.write('isom', 8, 4, 'ascii');
  const ftyp = box('ftyp', ftypData);
  const buildMoov = (chunkOffset) => {
    const mvhd = Buffer.alloc(100);
    mvhd.writeUInt32BE(1_000, 12);
    mvhd.writeUInt32BE(55_000, 16);
    mvhd.writeUInt32BE(0x00010000, 20);
    mvhd.writeUInt16BE(0x0100, 24);
    mvhd.writeUInt32BE(0x00010000, 36);
    mvhd.writeUInt32BE(0x00010000, 52);
    mvhd.writeUInt32BE(0x40000000, 68);
    mvhd.writeUInt32BE(2, 96);

    const tkhd = Buffer.alloc(84);
    tkhd.writeUInt32BE(7, 0);
    tkhd.writeUInt32BE(1, 12);
    tkhd.writeUInt32BE(55_000, 20);
    tkhd.writeUInt32BE(0x00010000, 40);
    tkhd.writeUInt32BE(0x00010000, 56);
    tkhd.writeUInt32BE(0x40000000, 72);
    tkhd.writeUInt32BE(sampleWidth * 65536, 76);
    tkhd.writeUInt32BE(sampleHeight * 65536, 80);

    const hdlr = Buffer.alloc(24);
    hdlr.write('vide', 8, 4, 'ascii');

    const visual = Buffer.alloc(78);
    visual.writeUInt16BE(1, 6);
    visual.writeUInt16BE(sampleWidth, 24);
    visual.writeUInt16BE(sampleHeight, 26);
    visual.writeUInt32BE(0x00480000, 28);
    visual.writeUInt32BE(0x00480000, 32);
    visual.writeUInt16BE(1, 40);
    visual.writeUInt16BE(24, 74);
    visual.writeUInt16BE(0xffff, 76);
    const stsdHeader = Buffer.alloc(8);
    stsdHeader.writeUInt32BE(1, 4);
    const stsd = box('stsd', Buffer.concat([stsdHeader, box('raw ', visual)]));

    const sttsData = Buffer.alloc(16);
    sttsData.writeUInt32BE(1, 4);
    sttsData.writeUInt32BE(1, 8);
    sttsData.writeUInt32BE(55_000, 12);
    const stscData = Buffer.alloc(20);
    stscData.writeUInt32BE(1, 4);
    stscData.writeUInt32BE(1, 8);
    stscData.writeUInt32BE(1, 12);
    stscData.writeUInt32BE(1, 16);
    const stszData = Buffer.alloc(12);
    stszData.writeUInt32BE(videoSample.length, 4);
    stszData.writeUInt32BE(1, 8);
    const stcoData = Buffer.alloc(12);
    stcoData.writeUInt32BE(1, 4);
    stcoData.writeUInt32BE(chunkOffset, 8);
    const stbl = box('stbl', Buffer.concat([
      stsd,
      box('stts', sttsData),
      box('stsc', stscData),
      box('stsz', stszData),
      box('stco', stcoData),
    ]));
    const minf = box('minf', Buffer.concat([box('vmhd', Buffer.alloc(12)), stbl]));
    const mdia = box('mdia', Buffer.concat([box('hdlr', hdlr), minf]));
    return box('moov', Buffer.concat([box('mvhd', mvhd), box('trak', Buffer.concat([box('tkhd', tkhd), mdia]))]));
  };
  const placeholderMoov = buildMoov(0);
  const mdatDataStart = ftyp.length + placeholderMoov.length + 8;
  const validMp4 = Buffer.concat([ftyp, buildMoov(mdatDataStart), box('mdat', videoSample)]);

  const failures = [];
  try { validatePngBytes(validPng); } catch (error) { failures.push(`valid PNG fixture: ${error.message}`); }
  try { validateMp4Bytes(validMp4, 55); } catch (error) { failures.push(`valid MP4 fixture: ${error.message}`); }
  const validToolResult = Buffer.from(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: {
      content: [{ type: 'text', text: 'Resolved one caller-supplied listing.' }],
      structuredContent: {
        policy: 'fixture',
        counts: { submitted: 1, resolved: 1, refused: 0 },
        listings: [{ venue: 'kalshi', resolved: true, citations: ['https://www.worldeventtrading.com/methodology'], observedAt: '2026-09-06T12:00:00Z' }],
      },
      isError: false,
    },
  })}\n`);
  try {
    const inspected = validateEvaluationArtifactBytes('answer', Buffer.from('Kalshi evidence: https://www.worldeventtrading.com/methodology on 2026-09-06.\n'));
    if (!sameSignals(inspected.claims.answerSignals, { source_url: true, venue: true, timestamp: true })) {
      failures.push('valid answer fixture did not derive its citation signals');
    }
  } catch (error) { failures.push(`valid answer fixture: ${error.message}`); }
  try {
    const inspected = validateEvaluationArtifactBytes('tool-result', validToolResult, 'wet_resolve');
    if (!inspected.claims.protocolSafe || !inspected.claims.usefulResult ||
        !sameSignals(inspected.claims.resultSignals, { source_url: true, venue: true, timestamp: true })) {
      failures.push('valid tool-result fixture did not derive its protocol/useful/signal claims');
    }
    if (toolClaimsMatchReport({
      protocolSafe: false,
      usefulResult: true,
      sourceRightsPending: false,
      resultSignals: inspected.claims.resultSignals,
      refusalCodes: [],
    }, inspected.claims)) {
      failures.push('caller-entered tool claims were accepted instead of the claims derived from raw bytes');
    }
  } catch (error) { failures.push(`valid tool-result fixture: ${error.message}`); }
  try {
    validatePngBytes(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    failures.push('truncated PNG fixture was accepted');
  } catch {}
  try {
    const badCrc = Buffer.from(validPng);
    badCrc[29] ^= 0xff;
    validatePngBytes(badCrc);
    failures.push('bad-CRC PNG fixture was accepted');
  } catch {}
  try {
    validatePngBytes(makePng(Buffer.alloc(MIN_SCREENSHOT_HEIGHT * (1 + pngRowBytes) - 1)));
    failures.push('short-scanline PNG fixture was accepted');
  } catch {}
  try {
    const headerOnly = Buffer.alloc(MIN_DEMO_BYTES);
    headerOnly.writeUInt32BE(MIN_DEMO_BYTES, 0);
    headerOnly.write('ftyp', 4, 4, 'ascii');
    validateMp4Bytes(headerOnly, 55);
    failures.push('header-only MP4 fixture was accepted');
  } catch {}
  try {
    const audioOnly = Buffer.from(validMp4);
    const handler = audioOnly.indexOf(Buffer.from('vide'));
    if (handler < 0) throw new Error('valid MP4 fixture has no vide marker');
    audioOnly.write('soun', handler, 4, 'ascii');
    validateMp4Bytes(audioOnly, 55);
    failures.push('audio-only MP4 fixture was accepted');
  } catch {}
  try {
    const zeroSamples = Buffer.from(validMp4);
    const stszType = zeroSamples.indexOf(Buffer.from('stsz'));
    if (stszType < 0) throw new Error('valid MP4 fixture has no stsz marker');
    zeroSamples.writeUInt32BE(0, stszType + 12);
    validateMp4Bytes(zeroSamples, 55);
    failures.push('zero-sample MP4 fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('answer', Buffer.from('   \n'));
    failures.push('blank answer fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('tool-result', Buffer.from('{not-json}'), 'wet_resolve');
    failures.push('malformed tool-result fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('answer', Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 12\n'));
    failures.push('Git LFS pointer answer fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('tool-result', Buffer.from('{"jsonrpc":"2.0","id":1,"result":{"content":[],"structuredContent":{}}}'), 'wet_resolve');
    failures.push('empty structured tool-result fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('tool-result', Buffer.from('{}'), 'wet_resolve');
    failures.push('empty JSON-object tool-result fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('answer', Buffer.from('Contact private.person@example.com for the token.'));
    failures.push('PII-bearing answer fixture was accepted');
  } catch {}
  try {
    validateEvaluationArtifactBytes('answer', Buffer.alloc(MAX_EVAL_ANSWER_BYTES + 1, 0x61));
    failures.push('oversized answer fixture was accepted');
  } catch {}
  return failures;
}

async function collectReleaseIssues() {
  const issues = [];
  const add = (code, message) => issues.push({ code, message });
  const nowMs = Date.now();

  async function jsonFile(name, code = 'invalid-json', missingCode = code) {
    try {
      return JSON.parse(await readFile(path.join(PACKAGE_ROOT, name), 'utf8'));
    } catch (error) {
      if (isRecord(error) && error.code === 'ENOENT') {
        add(missingCode, `${name} is required but absent.`);
      } else {
        add(code, `${name} could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      return null;
    }
  }

  function rejectHeldListingCopy(label, value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      add('listing-copy', `${label} must be non-empty release copy.`);
      return;
    }
    const copy = normalizedText(value);
    const heldMarkers = [
      /\bmcp_release_held\b/iu,
      /\brelease (?:is )?held\b/iu,
      /\bheld candidate\b/iu,
      /\bunreleased candidate\b/iu,
      /\bdo not (?:install|configure|connect(?: to)?|call|enable|submit)\b/iu,
      /\bpending (?:owner|legal|source[- ]rights)(?: clearance| review)?\b/iu,
    ];
    if (heldMarkers.some((pattern) => pattern.test(copy))) {
      add('listing-hold-copy', `${label} still advertises a held or prohibited-to-use package.`);
    }
  }

  const [server, plugin, claude, gemini, agentMcp, claudeMcp] = await Promise.all([
    jsonFile('server.json', 'manifest-json'),
    jsonFile('plugin.json', 'manifest-json'),
    jsonFile('.claude-plugin/plugin.json', 'manifest-json'),
    jsonFile('gemini-extension.json', 'manifest-json'),
    jsonFile('mcp.json', 'manifest-json'),
    jsonFile('.mcp.json', 'manifest-json'),
  ]);

  const packageVersion = server?.version;
  if (typeof packageVersion !== 'string' || !/^\d+\.\d+\.\d+$/u.test(packageVersion)) {
    add('manifest-version', 'server.json.version must be a stable semantic version without a prerelease suffix.');
  }
  if (server?.name !== SERVER_NAME) add('manifest-identity', `server.json.name must be ${SERVER_NAME}.`);
  if (server?.title !== RELEASE_TITLE || server?.description !== RELEASE_DESCRIPTION) {
    add('release-listing', 'server.json must use the exact approved release title and short description.');
  }
  if (server?.websiteUrl !== WEBSITE_URL || server?.repository?.source !== 'github' ||
      server?.repository?.url !== REPOSITORY_URL) {
    add('release-listing', 'server.json must use the exact approved website and GitHub repository metadata.');
  }
  if (server?.icons?.length !== 1 || server.icons[0]?.src !== ICON_URL ||
      server.icons[0]?.mimeType !== 'image/png' || !sameMembers(server.icons[0]?.sizes, ['512x512'])) {
    add('release-listing', 'server.json must advertise exactly the approved 512x512 PNG icon.');
  }
  if (server?.remotes?.length !== 1 || server.remotes[0]?.type !== 'streamable-http' || server.remotes[0]?.url !== ENDPOINT) {
    add('manifest-endpoint', `server.json must expose exactly one streamable-http remote at ${ENDPOINT}.`);
  }

  for (const [label, manifest] of [
    ['plugin.json', plugin],
    ['.claude-plugin/plugin.json', claude],
    ['gemini-extension.json', gemini],
  ]) {
    if (manifest && manifest.version !== packageVersion) {
      add('manifest-version', `${label}.version must match server.json.version ${packageVersion ?? '(missing)'}.`);
    }
    if (manifest) rejectHeldListingCopy(`${label}.description`, manifest.description);
  }
  if (server) rejectHeldListingCopy('server.json.description', server.description);

  const publisher = server?._meta?.['io.modelcontextprotocol.registry/publisher-provided'];
  if (!isRecord(publisher)) {
    add('release-state', 'server.json must retain registry publisher metadata.');
  } else {
    rejectHeldListingCopy('server.json publisher tagline', publisher.tagline);
    if (publisher.tagline !== RELEASE_TAGLINE) {
      add('release-tagline', `server.json publisher tagline must be exactly "${RELEASE_TAGLINE}".`);
    }
    if (publisher.releaseState !== 'active') {
      add('release-state', 'server.json publisher metadata must declare releaseState: "active".');
    }
    const rights = publisher.sourceRights;
    if (!isRecord(rights)) {
      add('source-rights-state', 'server.json publisher metadata must retain a sourceRights record.');
    } else {
      if (rights.rightsState !== 'cleared') {
        add('source-rights-state', 'server.json sourceRights.rightsState must be "cleared".');
      }
      if (rights.policyVersion !== SOURCE_RIGHTS_POLICY ||
          rights.outputContractVersion !== OUTPUT_CONTRACT_VERSION ||
          rights.outputContractSha256 !== OUTPUT_CONTRACT_SHA256) {
        add('source-rights-evidence', 'server.json source rights must bind the exact reviewed policy and current public output contract.');
      }
      if (!validSha256(rights.grantSetSha256)) {
        add('source-rights-evidence', 'server.json sourceRights.grantSetSha256 must identify the reviewed grant set.');
      }
      if (!Array.isArray(rights.heldTools) || rights.heldTools.length !== 0) {
        add('manifest-held-tools', 'server.json sourceRights.heldTools must be an empty array for release.');
      }
      if (!sameMembers(rights.usableTools, PUBLIC_TOOLS)) {
        add('manifest-usable-tools', 'server.json sourceRights.usableTools must contain all seven public tools exactly once.');
      }
      if (rights.credentialBypass !== false) {
        add('source-rights-state', 'server.json sourceRights.credentialBypass must remain false.');
      }
    }
  }

  const endpointRecords = [
    ['mcp.json', agentMcp?.mcpServers?.wet?.url],
    ['.mcp.json', claudeMcp?.mcpServers?.wet?.url],
    ['gemini-extension.json', gemini?.mcpServers?.wet?.httpUrl],
  ];
  for (const [label, endpoint] of endpointRecords) {
    if (endpoint !== ENDPOINT) add('manifest-endpoint', `${label} must point to ${ENDPOINT}.`);
  }

  try {
    const dockerYaml = await readFile(path.join(PACKAGE_ROOT, 'docker/servers/world-event-trading/server.yaml'), 'utf8');
    rejectHeldListingCopy('Docker Catalog description', dockerYaml.match(/^\s{2}description:\s*["']?(.+?)["']?\s*$/mu)?.[1] ?? '');
  } catch (error) {
    add('listing-copy', `Docker Catalog metadata could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }

  const copyFiles = RELEASE_COPY_ROOT_FILES.map((name) => path.join(PACKAGE_ROOT, name));
  for (const directory of RELEASE_COPY_DIRECTORIES) {
    try {
      const discovered = await walk(path.join(PACKAGE_ROOT, directory));
      copyFiles.push(...discovered.filter((file) => RELEASE_COPY_EXTENSIONS.has(path.extname(file).toLowerCase())));
    } catch (error) {
      add('release-copy-inventory', `${directory} could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const currentHoldPatterns = [
    /\bmcp_release_held\b/iu,
    /\bincident containment and launch hold\b/iu,
    /\brelease candidate only\b/iu,
    /\bpost-clearance (?:connection|installation) reference\b/iu,
    /\bsix sourced(?:\/derived| or derived)? (?:public )?tools (?:return|are held)\b/iu,
    /\b(?:sole|only) public (?:tool-level )?exception\b/iu,
    /\buntil (?:source[- ]?)?rights clearance\b/iu,
    /\bno screenshot is included\b/iu,
    /\bthese assets are recording plans, not claims\b/iu,
  ];
  for (const file of [...new Set(copyFiles)]) {
    try {
      const copy = normalizedText(await readFile(file, 'utf8'));
      if (currentHoldPatterns.some((pattern) => pattern.test(copy))) {
        add('current-hold-copy', `${relative(file)} still contains current release-hold copy.`);
      }
    } catch (error) {
      add('release-copy-inventory', `${relative(file)} could not be read: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const evaluation = await jsonFile(EVAL_EVIDENCE, 'evaluation-evidence');
  let evaluationSha256 = null;
  let evaluationStartedAt = null;
  let evaluationCompletedAt = null;
  let evaluationObservedAt = null;
  if (evaluation) {
    try {
      const evaluationPath = path.join(PACKAGE_ROOT, EVAL_EVIDENCE);
      const metadata = await lstat(evaluationPath);
      if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error('not a regular in-package file');
      evaluationSha256 = createHash('sha256').update(await readFile(evaluationPath)).digest('hex');
    } catch (error) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} bytes could not be hashed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (evaluation.status !== 'completed') add('evaluation-evidence', `${EVAL_EVIDENCE} must have status "completed".`);
    if (evaluation.target?.endpoint !== ENDPOINT || evaluation.target?.environment !== 'production') {
      add('evaluation-evidence', `${EVAL_EVIDENCE} must describe the canonical production endpoint.`);
    }
    if (evaluation.target?.packageVersion !== packageVersion || evaluation.target?.serverVersion !== packageVersion) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} package and server versions must match server.json.`);
    }
    if (!validGitSha(evaluation.target?.candidateCommitSha)) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} must bind the deployed application by full nonzero lowercase commit SHA.`);
    }
    if (evaluation.sourceState?.policyVersion !== SOURCE_RIGHTS_POLICY ||
        evaluation.sourceState?.rightsState !== 'cleared' || evaluation.sourceState?.healthState !== 'ok') {
      add('evaluation-evidence', `${EVAL_EVIDENCE} must record the current policy, cleared source rights, and healthy feeds.`);
    }
    if (!validEvidenceRef(evaluation.sourceState?.evidenceRef)) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} must reference durable source-state evidence by HTTPS URL or URN.`);
    }
    evaluationStartedAt = requireUtcInstant(add, 'evaluation-evidence', `${EVAL_EVIDENCE}.startedAt`, evaluation.startedAt, nowMs, { fresh: true });
    evaluationCompletedAt = requireUtcInstant(add, 'evaluation-evidence', `${EVAL_EVIDENCE}.completedAt`, evaluation.completedAt, nowMs, { fresh: true });
    evaluationObservedAt = requireUtcInstant(add, 'evaluation-evidence', `${EVAL_EVIDENCE}.sourceState.observedAt`, evaluation.sourceState?.observedAt, nowMs, { fresh: true });
    if (evaluationStartedAt !== null && evaluationObservedAt !== null && evaluationObservedAt < evaluationStartedAt) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} source-state observation cannot precede the evaluation start.`);
    }
    if (evaluationObservedAt !== null && evaluationCompletedAt !== null && evaluationObservedAt > evaluationCompletedAt) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} source-state observation cannot follow evaluation completion.`);
    }
    if (evaluationStartedAt !== null && evaluationCompletedAt !== null && evaluationStartedAt > evaluationCompletedAt) {
      add('evaluation-evidence', `${EVAL_EVIDENCE} completion cannot precede its start.`);
    }
    const scoredEvaluation = spawnSync(
      process.execPath,
      [path.join(PACKAGE_ROOT, 'evals/score-run.mjs'), path.join(PACKAGE_ROOT, EVAL_EVIDENCE)],
      { encoding: 'utf8' },
    );
    if (scoredEvaluation.status !== 0) {
      const detail = (scoredEvaluation.stderr || scoredEvaluation.stdout || 'score runner exited without diagnostic output').trim();
      add('evaluation-evidence', `${EVAL_EVIDENCE} did not pass the canonical complete-run scorer: ${detail}`);
    }
  }

  const releaseEvidenceTemplate = await jsonFile(RELEASE_EVIDENCE_TEMPLATE, 'capture-evidence-template');
  if (releaseEvidenceTemplate) {
    if (releaseEvidenceTemplate.templateOnly !== true ||
        releaseEvidenceTemplate.schemaVersion !== RELEASE_EVIDENCE_SCHEMA ||
        releaseEvidenceTemplate.serverName !== SERVER_NAME ||
        releaseEvidenceTemplate.packageVersion !== packageVersion ||
        releaseEvidenceTemplate.releaseTag !== `v${packageVersion}` ||
        releaseEvidenceTemplate.releaseTitle !== RELEASE_TITLE ||
        releaseEvidenceTemplate.releaseDescription !== RELEASE_DESCRIPTION ||
        releaseEvidenceTemplate.releaseTagline !== RELEASE_TAGLINE ||
        releaseEvidenceTemplate.websiteUrl !== WEBSITE_URL ||
        releaseEvidenceTemplate.repositoryUrl !== REPOSITORY_URL ||
        releaseEvidenceTemplate.iconUrl !== ICON_URL ||
        releaseEvidenceTemplate.preparedAt !== 'REPLACE_WITH_UTC_TIMESTAMP' ||
        releaseEvidenceTemplate.deployment?.endpoint !== ENDPOINT ||
        releaseEvidenceTemplate.deployment?.applicationCommitSha !== 'REPLACE_WITH_DEPLOYED_APPLICATION_COMMIT_SHA' ||
        releaseEvidenceTemplate.sourceRights?.policyVersion !== SOURCE_RIGHTS_POLICY ||
        releaseEvidenceTemplate.sourceRights?.outputContractVersion !== OUTPUT_CONTRACT_VERSION ||
        releaseEvidenceTemplate.sourceRights?.outputContractSha256 !== OUTPUT_CONTRACT_SHA256 ||
        releaseEvidenceTemplate.sourceRights?.grantSetSha256 !== 'REPLACE_WITH_LOWERCASE_SHA256' ||
        releaseEvidenceTemplate.sourceRights?.reviewedByRole !== 'REPLACE_WITH_REVIEWER_ROLE' ||
        releaseEvidenceTemplate.sourceRights?.reviewedByLogin !== 'REPLACE_WITH_GITHUB_LOGIN' ||
        releaseEvidenceTemplate.sourceRights?.reviewedAt !== 'REPLACE_WITH_UTC_TIMESTAMP' ||
        releaseEvidenceTemplate.sourceRights?.effectiveAt !== 'REPLACE_WITH_UTC_TIMESTAMP' ||
        releaseEvidenceTemplate.sourceRights?.expiresAt !== null ||
        releaseEvidenceTemplate.sourceRights?.evidenceRef !== 'REPLACE_WITH_DURABLE_EVIDENCE_REF' ||
        releaseEvidenceTemplate.evaluation?.reportPath !== EVAL_EVIDENCE ||
        releaseEvidenceTemplate.evaluation?.reportSha256 !== 'REPLACE_WITH_LOWERCASE_SHA256' ||
        releaseEvidenceTemplate.evaluation?.artifactSchemaVersion !== EVAL_ARTIFACT_SCHEMA ||
        releaseEvidenceTemplate.evaluation?.artifactDirectory !== EVAL_ARTIFACT_DIRECTORY ||
        !Array.isArray(releaseEvidenceTemplate.evaluation?.artifacts) ||
        releaseEvidenceTemplate.evaluation.artifacts.length !== 0 ||
        releaseEvidenceTemplate.review?.status !== 'not-approved' ||
        releaseEvidenceTemplate.review?.reviewedByRole !== 'owner' ||
        releaseEvidenceTemplate.review?.reviewedByLogin !== 'REPLACE_WITH_GITHUB_LOGIN' ||
        releaseEvidenceTemplate.review?.reviewedAt !== 'REPLACE_WITH_UTC_TIMESTAMP' ||
        !sameMembers(releaseEvidenceTemplate.demos?.map((entry) => entry?.kind), DEMO_KINDS) ||
        !sameMembers(releaseEvidenceTemplate.screenshots?.map((entry) => entry?.kind), SCREENSHOT_KINDS) ||
        ![...(releaseEvidenceTemplate.demos ?? []), ...(releaseEvidenceTemplate.screenshots ?? [])].every((entry) =>
          typeof entry?.path === 'string' &&
          entry.sha256 === 'REPLACE_WITH_LOWERCASE_SHA256' &&
          entry.capturedAt === 'REPLACE_WITH_UTC_TIMESTAMP' &&
          entry.publicDisplayApproved === false &&
          entry.redacted === false) ||
        !(releaseEvidenceTemplate.demos ?? []).every((entry) => entry.durationSeconds === 0)) {
      add('capture-evidence-template', `${RELEASE_EVIDENCE_TEMPLATE} must remain a clearly non-evidentiary, structurally complete operator template.`);
    }
  }

  const releaseEvidence = await jsonFile(RELEASE_EVIDENCE, 'capture-evidence', 'capture-evidence-missing');
  if (releaseEvidence) {
    try {
      const metadata = await lstat(path.join(PACKAGE_ROOT, RELEASE_EVIDENCE));
      if (metadata.isSymbolicLink() || !metadata.isFile()) {
        add('capture-evidence', `${RELEASE_EVIDENCE} must be a regular in-package file, not a symlink.`);
      }
    } catch (error) {
      add('capture-evidence', `${RELEASE_EVIDENCE} metadata could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (releaseEvidence.templateOnly !== false) {
      add('capture-evidence', `${RELEASE_EVIDENCE}.templateOnly must be explicitly false.`);
    }
    if (/REPLACE_WITH_|TEMPLATE ONLY/u.test(JSON.stringify(releaseEvidence))) {
      add('capture-evidence', `${RELEASE_EVIDENCE} must not retain template notices or replacement sentinels.`);
    }
    if (releaseEvidence.schemaVersion !== RELEASE_EVIDENCE_SCHEMA) {
      add('capture-evidence', `${RELEASE_EVIDENCE}.schemaVersion must be ${RELEASE_EVIDENCE_SCHEMA}.`);
    }
    if (releaseEvidence.serverName !== SERVER_NAME || server?.name !== releaseEvidence.serverName) {
      add('release-listing', `${RELEASE_EVIDENCE} and server.json must bind the exact canonical server name.`);
    }
    if (releaseEvidence.packageVersion !== packageVersion || releaseEvidence.releaseTag !== `v${packageVersion}`) {
      add('capture-evidence', `${RELEASE_EVIDENCE} must match package version and exact v-prefixed release tag.`);
    }
    if (releaseEvidence.releaseTitle !== RELEASE_TITLE || releaseEvidence.releaseDescription !== RELEASE_DESCRIPTION ||
        server?.title !== releaseEvidence.releaseTitle || server?.description !== releaseEvidence.releaseDescription) {
      add('release-listing', `${RELEASE_EVIDENCE} and server.json must bind the exact approved release title and short description.`);
    }
    if (releaseEvidence.websiteUrl !== WEBSITE_URL || releaseEvidence.repositoryUrl !== REPOSITORY_URL ||
        releaseEvidence.iconUrl !== ICON_URL || server?.websiteUrl !== releaseEvidence.websiteUrl ||
        server?.repository?.url !== releaseEvidence.repositoryUrl || server?.icons?.[0]?.src !== releaseEvidence.iconUrl) {
      add('release-listing', `${RELEASE_EVIDENCE} and server.json must bind the exact website, repository, and icon URLs.`);
    }
    if (releaseEvidence.releaseTagline !== RELEASE_TAGLINE || publisher?.tagline !== releaseEvidence.releaseTagline) {
      add('release-tagline', `${RELEASE_EVIDENCE} and server.json must bind the exact release-only tagline.`);
    }
    if (releaseEvidence.deployment?.endpoint !== ENDPOINT ||
        !validGitSha(releaseEvidence.deployment?.applicationCommitSha)) {
      add('capture-evidence', `${RELEASE_EVIDENCE} must bind the canonical endpoint and deployed application commit SHA.`);
    }
    if (evaluation && releaseEvidence.deployment?.applicationCommitSha !== evaluation.target?.candidateCommitSha) {
      add('capture-evidence', `${RELEASE_EVIDENCE} and ${EVAL_EVIDENCE} must bind the same deployment SHA.`);
    }

    const sourceRightsEvidence = releaseEvidence.sourceRights;
    if (!isRecord(sourceRightsEvidence) ||
        sourceRightsEvidence.policyVersion !== SOURCE_RIGHTS_POLICY ||
        sourceRightsEvidence.outputContractVersion !== OUTPUT_CONTRACT_VERSION ||
        sourceRightsEvidence.outputContractSha256 !== OUTPUT_CONTRACT_SHA256 ||
        !validSha256(sourceRightsEvidence.grantSetSha256) ||
        !SOURCE_RIGHTS_REVIEWER_ROLES.has(sourceRightsEvidence.reviewedByRole) ||
        !validReviewerLogin(sourceRightsEvidence.reviewedByLogin) ||
        !validEvidenceRef(sourceRightsEvidence.evidenceRef)) {
      add('source-rights-evidence', `${RELEASE_EVIDENCE}.sourceRights must bind the policy, current output contract, reviewed grant-set digest, reviewer role/login, and durable evidence reference.`);
    }
    if (isRecord(sourceRightsEvidence)) {
      const manifestRights = publisher?.sourceRights;
      if (!isRecord(manifestRights) ||
          manifestRights.policyVersion !== sourceRightsEvidence.policyVersion ||
          manifestRights.outputContractVersion !== sourceRightsEvidence.outputContractVersion ||
          manifestRights.outputContractSha256 !== sourceRightsEvidence.outputContractSha256 ||
          manifestRights.grantSetSha256 !== sourceRightsEvidence.grantSetSha256) {
        add('source-rights-evidence', 'server.json source-rights metadata must cryptographically match the reviewed release evidence.');
      }
      if (evaluation && evaluation.sourceState?.evidenceRef !== sourceRightsEvidence.evidenceRef) {
        add('evaluation-binding', `${EVAL_EVIDENCE} must cite the same durable source-rights evidence as ${RELEASE_EVIDENCE}.`);
      }
    }

    if (releaseEvidence.evaluation?.reportPath !== EVAL_EVIDENCE ||
        !validSha256(releaseEvidence.evaluation?.reportSha256) ||
        releaseEvidence.evaluation?.reportSha256 !== evaluationSha256) {
      add('evaluation-binding', `${RELEASE_EVIDENCE}.evaluation must bind the exact ${EVAL_EVIDENCE} bytes by SHA-256.`);
    }
    await inspectEvaluationArtifacts({ add, evaluation, evidence: releaseEvidence.evaluation });

    const preparedAt = requireUtcInstant(add, 'release-window', `${RELEASE_EVIDENCE}.preparedAt`, releaseEvidence.preparedAt, nowMs, { fresh: true });
    const sourceReviewedAt = requireUtcInstant(add, 'source-rights-evidence', `${RELEASE_EVIDENCE}.sourceRights.reviewedAt`, sourceRightsEvidence?.reviewedAt, nowMs, { fresh: true });
    const sourceEffectiveAt = requireUtcInstant(add, 'source-rights-evidence', `${RELEASE_EVIDENCE}.sourceRights.effectiveAt`, sourceRightsEvidence?.effectiveAt, nowMs);
    let sourceExpiresAt = null;
    if (sourceRightsEvidence?.expiresAt !== null) {
      sourceExpiresAt = requireUtcInstant(add, 'source-rights-evidence', `${RELEASE_EVIDENCE}.sourceRights.expiresAt`, sourceRightsEvidence?.expiresAt, nowMs, { futureAllowed: true });
    }
    const ownerReviewedAt = requireUtcInstant(add, 'capture-evidence', `${RELEASE_EVIDENCE}.review.reviewedAt`, releaseEvidence.review?.reviewedAt, nowMs, { fresh: true });

    if (releaseEvidence.review?.status !== 'approved' || releaseEvidence.review?.reviewedByRole !== 'owner' ||
        !validReviewerLogin(releaseEvidence.review?.reviewedByLogin) ||
        releaseEvidence.review.reviewedByLogin.toLowerCase() !== REPOSITORY_OWNER_LOGIN.toLowerCase()) {
      add('capture-evidence', `${RELEASE_EVIDENCE} must record approval by the owner of the exact canonical repository.`);
    }
    if (sourceEffectiveAt !== null && sourceReviewedAt !== null && sourceEffectiveAt > sourceReviewedAt) {
      add('source-rights-evidence', 'source-rights review cannot precede the grant-set effective time.');
    }
    if (sourceReviewedAt !== null && evaluationStartedAt !== null && sourceReviewedAt > evaluationStartedAt) {
      add('evaluation-binding', 'the production evaluation cannot start before the source-rights review.');
    }
    if (sourceEffectiveAt !== null && evaluationObservedAt !== null && sourceEffectiveAt > evaluationObservedAt) {
      add('evaluation-binding', 'the evaluated source-state observation must occur after source-rights effectiveness.');
    }
    if (evaluationCompletedAt !== null && ownerReviewedAt !== null && evaluationCompletedAt > ownerReviewedAt) {
      add('release-window', 'owner release review cannot precede evaluation completion.');
    }
    if (sourceReviewedAt !== null && ownerReviewedAt !== null && sourceReviewedAt > ownerReviewedAt) {
      add('release-window', 'owner release review cannot precede the source-rights review.');
    }
    if (ownerReviewedAt !== null && preparedAt !== null && ownerReviewedAt > preparedAt) {
      add('release-window', 'release preparation cannot precede owner approval.');
    }
    if (sourceExpiresAt !== null && preparedAt !== null && sourceExpiresAt <= preparedAt) {
      add('source-rights-evidence', 'the reviewed grant set must remain effective after release preparation.');
    }
    if (sourceExpiresAt !== null && sourceExpiresAt <= nowMs) {
      add('source-rights-evidence', 'the reviewed grant set must not be expired at verification time.');
    }

    const demoPaths = await inspectEvidenceAssets({
      add,
      entries: releaseEvidence.demos,
      expectedKinds: DEMO_KINDS,
      kind: 'demo',
      directory: 'assets/demo/',
      extension: '.mp4',
      ownerReviewedAt,
      earliestCaptureAt: evaluationCompletedAt,
      nowMs,
    });
    const screenshotPaths = await inspectEvidenceAssets({
      add,
      entries: releaseEvidence.screenshots,
      expectedKinds: SCREENSHOT_KINDS,
      kind: 'screenshot',
      directory: 'assets/screenshots/',
      extension: '.png',
      ownerReviewedAt,
      earliestCaptureAt: evaluationCompletedAt,
      nowMs,
    });
    await inspectEvidenceDirectoryInventory({
      add,
      directory: 'assets/demo',
      referencedPaths: demoPaths,
      documentationPaths: DEMO_DOCUMENTATION,
    });
    await inspectEvidenceDirectoryInventory({
      add,
      directory: 'assets/screenshots',
      referencedPaths: screenshotPaths,
      documentationPaths: SCREENSHOT_DOCUMENTATION,
    });
  } else {
    add('evaluation-artifacts', `Raw evaluation artifacts cannot be authenticated without ${RELEASE_EVIDENCE}.`);
  }

  return issues;
}

async function inspectEvidenceAssets({
  add,
  entries,
  expectedKinds,
  kind,
  directory,
  extension,
  ownerReviewedAt,
  earliestCaptureAt,
  nowMs,
}) {
  if (!Array.isArray(entries) || !sameMembers(entries.map((entry) => entry?.kind), expectedKinds)) {
    add('capture-evidence', `${RELEASE_EVIDENCE} must declare exactly these ${kind} kinds: ${expectedKinds.join(', ')}.`);
    return new Set();
  }

  const observedPaths = new Set();
  for (const [index, entry] of entries.entries()) {
    const label = `${RELEASE_EVIDENCE}.${kind}s[${index}]`;
    if (!isRecord(entry)) {
      add('capture-evidence', `${label} must be an object.`);
      continue;
    }
    const assetPath = entry.path;
    const normalized = typeof assetPath === 'string' ? assetPath.replaceAll('\\', '/') : '';
    const safePath = normalized === assetPath && normalized.startsWith(directory) &&
      !path.posix.isAbsolute(normalized) && !normalized.split('/').includes('..') &&
      path.posix.extname(normalized).toLowerCase() === extension;
    if (!safePath) {
      add('capture-evidence', `${label}.path must be a relative ${directory} path ending in ${extension}.`);
      continue;
    }
    if (observedPaths.has(normalized)) add('capture-evidence', `${normalized} is referenced more than once.`);
    observedPaths.add(normalized);
    if (!validSha256(entry.sha256)) add('capture-evidence', `${label}.sha256 must be a nonzero lowercase SHA-256.`);
    const capturedAt = requireUtcInstant(add, 'capture-evidence', `${label}.capturedAt`, entry.capturedAt, nowMs, { fresh: true });
    if (capturedAt !== null && ownerReviewedAt !== null && capturedAt > ownerReviewedAt) {
      add('release-window', `${label} cannot be captured after its owner review.`);
    }
    if (capturedAt !== null && earliestCaptureAt !== null && capturedAt < earliestCaptureAt) {
      add('release-window', `${label} cannot predate the production evaluation.`);
    }
    if (entry.publicDisplayApproved !== true || entry.redacted !== true) {
      add('capture-evidence', `${label} must be redacted and approved for public display.`);
    }
    if (kind === 'demo' && (!Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0 || entry.durationSeconds > MAX_DEMO_SECONDS)) {
      add('capture-evidence', `${label}.durationSeconds must describe a short demo of at most ${MAX_DEMO_SECONDS} seconds.`);
    }

    try {
      const absolute = path.join(PACKAGE_ROOT, ...normalized.split('/'));
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error('not a regular in-package file');
      const bytes = await readFile(absolute);
      const digest = createHash('sha256').update(bytes).digest('hex');
      if (digest !== entry.sha256) add('capture-evidence', `${normalized} does not match its declared SHA-256.`);
      if (kind === 'screenshot') validatePngBytes(bytes);
      else validateMp4Bytes(bytes, entry.durationSeconds);
    } catch (error) {
      add('capture-evidence', `${normalized} could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return observedPaths;
}

async function inspectEvaluationArtifacts({ add, evaluation, evidence }) {
  if (!isRecord(evaluation) || !isRecord(evidence)) {
    add('evaluation-artifacts', 'Release verification requires both the completed evaluation report and its raw-artifact manifest.');
    return;
  }
  if (evidence.artifactSchemaVersion !== EVAL_ARTIFACT_SCHEMA) {
    add('evaluation-artifacts', `${RELEASE_EVIDENCE}.evaluation.artifactSchemaVersion must be ${EVAL_ARTIFACT_SCHEMA}.`);
  }
  if (evidence.artifactDirectory !== EVAL_ARTIFACT_DIRECTORY) {
    add('evaluation-artifacts', `${RELEASE_EVIDENCE}.evaluation.artifactDirectory must be exactly ${EVAL_ARTIFACT_DIRECTORY}.`);
  }

  const expected = new Map();
  const seenCaseIds = new Set();
  if (!Array.isArray(evaluation.cases)) {
    add('evaluation-artifacts', `${EVAL_EVIDENCE}.cases must be an array before raw evidence can be bound.`);
  } else {
    for (const [caseIndex, caseValue] of evaluation.cases.entries()) {
      if (!isRecord(caseValue) || typeof caseValue.id !== 'string' || !/^[a-z0-9-]+$/u.test(caseValue.id)) {
        add('evaluation-artifacts', `${EVAL_EVIDENCE}.cases[${caseIndex}] needs a safe canonical case id.`);
        continue;
      }
      const caseId = caseValue.id;
      if (seenCaseIds.has(caseId)) {
        add('evaluation-artifacts', `${EVAL_EVIDENCE} contains duplicate case id ${caseId}.`);
        continue;
      }
      seenCaseIds.add(caseId);

      const answerPath = `${EVAL_ARTIFACT_DIRECTORY}/${caseId}.answer.txt`;
      const answerKey = `answer:${caseId}`;
      if (!validSha256(caseValue.answerSha256)) {
        add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} must record a nonzero answerSha256 for its raw answer transcript.`);
      }
      expected.set(answerKey, {
        caseId,
        kind: 'answer',
        path: answerPath,
        reportSha256: caseValue.answerSha256,
        reportCase: caseValue,
      });
      const casePaths = new Set([answerPath]);

      if (!Array.isArray(caseValue.toolCalls)) {
        add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} must expose its toolCalls array.`);
      } else {
        for (const [toolCallIndex, callValue] of caseValue.toolCalls.entries()) {
          if (!isRecord(callValue) || typeof callValue.tool !== 'string' || !/^wet_[a-z0-9_]+$/u.test(callValue.tool)) {
            add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} tool call ${toolCallIndex} needs a safe canonical tool name.`);
            continue;
          }
          const toolPath = `${EVAL_ARTIFACT_DIRECTORY}/${caseId}.tool-${String(toolCallIndex).padStart(2, '0')}-${callValue.tool}.json`;
          const toolKey = `tool-result:${caseId}:${toolCallIndex}`;
          if (!validSha256(callValue.resultSha256)) {
            add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} tool call ${toolCallIndex} must record a nonzero resultSha256.`);
          }
          if (callValue.evidenceRef !== toolPath) {
            add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} tool call ${toolCallIndex}.evidenceRef must be ${toolPath}.`);
          }
          expected.set(toolKey, {
            caseId,
            kind: 'tool-result',
            tool: callValue.tool,
            toolCallIndex,
            path: toolPath,
            reportSha256: callValue.resultSha256,
            reportCall: callValue,
          });
          casePaths.add(toolPath);
        }
      }

      if (!Array.isArray(caseValue.assertions)) {
        add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} must expose its assertions array.`);
      } else {
        for (const [assertionIndex, assertionValue] of caseValue.assertions.entries()) {
          if (!isRecord(assertionValue) || !casePaths.has(assertionValue.evidence)) {
            add('evaluation-artifacts', `${EVAL_EVIDENCE} case ${caseId} assertion ${assertionIndex}.evidence must name one raw artifact from that case.`);
          }
        }
      }
    }
  }

  const artifacts = Array.isArray(evidence.artifacts) ? evidence.artifacts : [];
  if (!Array.isArray(evidence.artifacts)) {
    add('evaluation-artifacts', `${RELEASE_EVIDENCE}.evaluation.artifacts must be an array.`);
  }
  if (artifacts.length !== expected.size) {
    add('evaluation-artifacts', `${RELEASE_EVIDENCE}.evaluation.artifacts must contain exactly ${expected.size} report-derived answer/tool-result entries.`);
  }

  const seenKeys = new Set();
  const referencedPaths = new Set();
  const derivedRefusalCodesByCase = new Map([...seenCaseIds].map((caseId) => [caseId, new Set()]));
  for (const [artifactIndex, artifact] of artifacts.entries()) {
    const label = `${RELEASE_EVIDENCE}.evaluation.artifacts[${artifactIndex}]`;
    if (!isRecord(artifact) || (artifact.kind !== 'answer' && artifact.kind !== 'tool-result')) {
      add('evaluation-artifacts', `${label} must be a typed answer or tool-result record.`);
      continue;
    }
    const expectedKeys = artifact.kind === 'answer'
      ? ['caseId', 'kind', 'path', 'publicDisplayApproved', 'redacted', 'sha256']
      : ['caseId', 'kind', 'path', 'publicDisplayApproved', 'redacted', 'sha256', 'tool', 'toolCallIndex'];
    if (JSON.stringify(Object.keys(artifact).sort()) !== JSON.stringify(expectedKeys.sort())) {
      add('evaluation-artifacts', `${label} must contain only its closed raw-artifact fields.`);
    }
    if (artifact.redacted !== true || artifact.publicDisplayApproved !== true) {
      add('evaluation-artifacts', `${label} must be explicitly redacted and approved for public display.`);
    }
    if (artifact.kind === 'tool-result' && (!Number.isInteger(artifact.toolCallIndex) || artifact.toolCallIndex < 0)) {
      add('evaluation-artifacts', `${label}.toolCallIndex must be a nonnegative integer.`);
      continue;
    }
    const key = artifact.kind === 'answer'
      ? `answer:${artifact.caseId}`
      : `tool-result:${artifact.caseId}:${artifact.toolCallIndex}`;
    const expectedArtifact = expected.get(key);
    if (!expectedArtifact) {
      add('evaluation-artifacts', `${label} does not correspond to a reported answer or tool result.`);
      continue;
    }
    if (seenKeys.has(key)) {
      add('evaluation-artifacts', `${label} duplicates raw evidence for ${key}.`);
      continue;
    }
    seenKeys.add(key);
    if (artifact.kind === 'tool-result' && artifact.tool !== expectedArtifact.tool) {
      add('evaluation-artifacts', `${label}.tool does not match the reported tool call.`);
    }
    if (artifact.path !== expectedArtifact.path) {
      add('evaluation-artifacts', `${label}.path must be ${expectedArtifact.path}.`);
      continue;
    }
    referencedPaths.add(artifact.path);
    if (!validSha256(artifact.sha256) || artifact.sha256 !== expectedArtifact.reportSha256) {
      add('evaluation-artifacts', `${label}.sha256 must exactly match the corresponding hash in ${EVAL_EVIDENCE}.`);
    }

    try {
      const absolute = path.join(PACKAGE_ROOT, ...artifact.path.split('/'));
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error('not a regular in-package file');
      const bytes = await readFile(absolute);
      const inspected = validateEvaluationArtifactBytes(artifact.kind, bytes, expectedArtifact.tool);
      const digest = createHash('sha256').update(bytes).digest('hex');
      if (digest !== artifact.sha256 || digest !== expectedArtifact.reportSha256) {
        add('evaluation-artifacts', `${artifact.path} bytes do not reproduce both declared SHA-256 values.`);
      }
      if (artifact.kind === 'answer') {
        if (!sameSignals(expectedArtifact.reportCase?.answerSignals, inspected.claims.answerSignals)) {
          add('evaluation-derived-claims', `${artifact.path} does not reproduce its report answerSignals from the raw answer bytes.`);
        }
      } else {
        const reportCall = expectedArtifact.reportCall;
        const claims = inspected.claims;
        if (!toolClaimsMatchReport(reportCall, claims)) {
          add('evaluation-derived-claims', `${artifact.path} does not reproduce its protocolSafe, usefulResult, sourceRightsPending, resultSignals, and refusalCodes claims from the raw MCP response.`);
        }
        for (const code of claims.refusalCodes) derivedRefusalCodesByCase.get(artifact.caseId)?.add(code);
      }
    } catch (error) {
      add('evaluation-artifacts', `${artifact.path} could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  for (const key of expected.keys()) {
    if (!seenKeys.has(key)) add('evaluation-artifacts', `Missing raw evidence entry for ${key}.`);
  }
  for (const caseValue of Array.isArray(evaluation.cases) ? evaluation.cases : []) {
    if (!isRecord(caseValue) || typeof caseValue.id !== 'string') continue;
    const derivedCodes = [...(derivedRefusalCodesByCase.get(caseValue.id) ?? new Set())].sort();
    if (!sameMembers(caseValue.observedRefusalCodes, derivedCodes)) {
      add('evaluation-derived-claims', `${EVAL_EVIDENCE} case ${caseValue.id}.observedRefusalCodes does not equal the union derived from its raw tool results.`);
    }
  }

  await inspectEvidenceDirectoryInventory({
    add,
    directory: EVAL_ARTIFACT_DIRECTORY,
    referencedPaths,
    documentationPaths: new Set(),
    unexpectedCode: 'evaluation-artifacts',
    missingCode: 'evaluation-artifacts',
  });
}

async function inspectEvidenceDirectoryInventory({
  add,
  directory,
  referencedPaths,
  documentationPaths,
  unexpectedCode = 'capture-evidence-unreferenced',
  missingCode = 'capture-evidence',
}) {
  const absoluteDirectory = path.join(PACKAGE_ROOT, directory);
  try {
    const directoryMetadata = await lstat(absoluteDirectory);
    if (directoryMetadata.isSymbolicLink() || !directoryMetadata.isDirectory()) {
      add(missingCode, `${directory} must be a real in-package directory, not a symlink.`);
      return;
    }
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = `${directory}/${entry.name}`.replaceAll('\\', '/');
      if (entry.isSymbolicLink() || !entry.isFile()) {
        add(unexpectedCode, `${relativePath} must be a regular file and cannot be a directory or symlink.`);
        continue;
      }
      if (!documentationPaths.has(relativePath) && !referencedPaths.has(relativePath)) {
        add(unexpectedCode, `${relativePath} is shipped without a matching approved release-evidence entry.`);
      }
    }
    for (const referencedPath of referencedPaths) {
      if (!entries.some((entry) => `${directory}/${entry.name}`.replaceAll('\\', '/') === referencedPath)) {
        add(missingCode, `${referencedPath} is referenced but absent from ${directory}.`);
      }
    }
  } catch (error) {
    add(missingCode, `${directory} could not be inventoried: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const issues = await collectReleaseIssues();

if (selfTest) {
  const parserFailures = releaseArtifactParserSelfTest();
  if (parserFailures.length > 0) {
    console.error(`SELF-TEST FAIL: release artifact parser fixtures failed (${parserFailures.join('; ')}).`);
    process.exit(1);
  }
  const requiredRejections = [
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
  ];
  const observedCodes = new Set(issues.map((issue) => issue.code));
  const missing = requiredRejections.filter((code) => !observedCodes.has(code));
  if (issues.length === 0 || missing.length > 0) {
    console.error(`SELF-TEST FAIL: held candidate was not rejected by every required gate${missing.length ? ` (${missing.join(', ')})` : ''}.`);
    process.exit(1);
  }
  console.log(`SELF-TEST PASS: release mode rejected the held candidate with ${issues.length} blocker(s) across all required gates.`);
  process.exit(0);
}

if (issues.length > 0) {
  console.error(`Release-package verification failed with ${issues.length} blocker(s):`);
  for (const issue of issues) console.error(`- [${issue.code}] ${issue.message}`);
  process.exit(1);
}

console.log(`Release-package verification passed for ${SERVER_NAME} v${(await JSON.parse(await readFile(path.join(PACKAGE_ROOT, 'server.json'), 'utf8'))).version}.`);
