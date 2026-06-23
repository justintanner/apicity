#!/usr/bin/env node
/**
 * Walk tests/recordings/, join HAR entries against scripts/endpoint-docs.tsv
 * by URL, pick one green-path payload per endpoint, and write per-provider
 * `packages/provider/<name>/src/example.json` files.
 *
 * Usage:
 *   node scripts/extract-har-examples.mjs              # write files
 *   node scripts/extract-har-examples.mjs --check      # exit 1 if files would change
 *   node scripts/extract-har-examples.mjs --report     # print coverage table only
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { findMatchingRow } from "./lib/match-har-to-endpoint.mjs";
import { selectGreenPath } from "./lib/select-green-path.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TSV_PATH = join(ROOT, "scripts/endpoint-docs.tsv");
const RECORDINGS_DIR = join(ROOT, "tests/recordings");
const PROVIDERS_DIR = join(ROOT, "packages/provider");

const args = new Set(process.argv.slice(2));
const MODE = args.has("--check")
  ? "check"
  : args.has("--report")
    ? "report"
    : "write";

// Replace inline base64 data URIs and any string longer than the threshold
// with a short placeholder. HAR recordings often inline binary inputs (image
// or audio bytes) which are useless in copy-paste examples and balloon bundle
// size. Threshold chosen to preserve real-world prompts and pasted text while
// truncating the obvious offenders.
const STRING_TRUNCATE_LIMIT = 256;

const STATIC_EXAMPLES_BY_PROVIDER = {
  thesportsdb: {
    "GET v1.allSports": {
      source: "static:thesportsdb-v1-free-catalog",
      payload: {},
    },
    "GET v1.eventstv": {
      source: "static:thesportsdb-v1-premium-tv-filter",
      payload: { channel: "Peacock_Premium" },
    },
    "GET v1.searchTeams": {
      source: "static:thesportsdb-v1-free-search",
      payload: { team: "Arsenal" },
    },
    "GET v2.livescore.bySport": {
      source: "static:thesportsdb-v2-premium-livescore",
      payload: { sport: "soccer" },
    },
    "GET v2.schedule.next.league": {
      source: "static:thesportsdb-v2-premium-schedule",
      payload: { idLeague: 4328 },
    },
    "GET v2.search.team": {
      source: "static:thesportsdb-v2-premium-search",
      payload: { teamName: "Manchester United" },
    },
  },
};

await main();

async function main() {
  const tsvRows = await loadTsv(TSV_PATH);
  const harFiles = await findHarFiles(RECORDINGS_DIR);
  const candidatesByKey = new Map(); // "provider::METHOD <dotPath>" → candidate[]
  const unmatched = [];

  for (const harPath of harFiles) {
    const har = await readJson(harPath);
    const recordingName = har?.log?._recordingName ?? relative(ROOT, harPath);
    const entries = har?.log?.entries ?? [];
    const providerHint = providerFromHarPath(harPath);
    for (const entry of entries) {
      const method = entry?.request?.method?.toUpperCase();
      if (!method) continue;
      const bodyText = entry?.request?.postData?.text;
      const mime = entry?.request?.postData?.mimeType ?? "";
      const jsonSummary =
        typeof bodyText === "string" &&
        bodyText.length > 0 &&
        (mime.includes("application/json") || isMultipartRelated(mime));
      const row = findMatchingRow(entry, tsvRows, { provider: providerHint });
      let extracted;
      if (jsonSummary) {
        extracted = parseJsonPayload(bodyText);
      } else if (
        providerHint === "fireworks" &&
        !hasRequestBody(entry) &&
        isSuccessfulResponse(entry)
      ) {
        // Fireworks management endpoints are often bodyless reads. Count
        // their successful recordings as coverage without
        // broadening every provider's example surface.
        extracted = {
          payload: {},
          payloadString: "{}",
        };
      } else if (method === "GET" && row) {
        const queryPayload = extractCompleteQueryPayload(entry, row);
        if (!queryPayload) continue;
        extracted = queryPayload;
      } else {
        continue;
      }
      if (!extracted) continue;
      if (!row) {
        unmatched.push({
          recordingName,
          method,
          url: entry.request.url,
        });
        continue;
      }
      const key = `${row.provider}::${row.method.toUpperCase()} ${row.dotPath}`;
      const candidate = {
        recordingName,
        payload: extracted.payload,
        payloadString: extracted.payloadString,
      };
      const list = candidatesByKey.get(key) ?? [];
      list.push(candidate);
      candidatesByKey.set(key, list);
    }
  }

  // Group selected examples by provider.
  const examplesByProvider = new Map();
  const allKeys = new Set(
    tsvRows.map((r) => `${r.provider}::${r.method.toUpperCase()} ${r.dotPath}`)
  );
  for (const key of allKeys) {
    const [provider] = key.split("::");
    if (!examplesByProvider.has(provider)) {
      examplesByProvider.set(provider, {});
    }
  }
  for (const [key, candidates] of candidatesByKey) {
    const [provider, methodAndPath] = key.split("::");
    const chosen = selectGreenPath(candidates);
    if (!chosen) continue;
    examplesByProvider.get(provider)[methodAndPath] = {
      source: chosen.recordingName,
      payload: chosen.payload,
    };
  }
  for (const [provider, examples] of Object.entries(
    STATIC_EXAMPLES_BY_PROVIDER
  )) {
    if (!examplesByProvider.has(provider)) {
      examplesByProvider.set(provider, {});
    }
    const providerExamples = examplesByProvider.get(provider);
    for (const [key, example] of Object.entries(examples)) {
      if (!providerExamples[key]) providerExamples[key] = example;
    }
  }

  // Coverage stats.
  const covered = [];
  const missing = [];
  for (const row of tsvRows) {
    const key = `${row.method.toUpperCase()} ${row.dotPath}`;
    const provider = examplesByProvider.get(row.provider);
    if (provider && provider[key]) {
      covered.push(`${row.provider} ${key}`);
    } else {
      missing.push(`${row.provider} ${key}`);
    }
  }

  if (MODE === "report") {
    printReport(covered, missing, unmatched, candidatesByKey);
    return;
  }

  // Write per-provider example.json (source of truth, read by tools and
  // doc-gen) and example.ts (compiled into dist; imported by the factory at
  // runtime so `.example` is attached to every endpoint function).
  // Exit non-zero in --check mode if any file would change.
  let changed = 0;
  for (const [provider, examples] of examplesByProvider) {
    const srcDir = join(PROVIDERS_DIR, provider, "src");
    if (!existsSync(srcDir)) continue;
    const sorted = sortObjectKeys(examples);
    const jsonOut = join(srcDir, "example.json");
    const tsOut = join(srcDir, "example.ts");
    const jsonNext = JSON.stringify(sorted, null, 2) + "\n";
    const tsNext = renderExamplesTs(sorted, provider);
    for (const [path, next] of [
      [jsonOut, jsonNext],
      [tsOut, tsNext],
    ]) {
      let prev = "";
      try {
        prev = await readFile(path, "utf8");
      } catch {
        /* file doesn't exist yet */
      }
      if (prev === next) continue;
      if (MODE === "check") {
        console.error(`stale: ${relative(ROOT, path)}`);
        changed += 1;
        continue;
      }
      await writeFile(path, next);
      console.log(
        `wrote ${relative(ROOT, path)} (${Object.keys(examples).length} examples)`
      );
    }
  }

  console.error(
    `\nCoverage: ${covered.length}/${tsvRows.length} endpoints have a green-path example` +
      ` (${missing.length} missing)`
  );
  if (unmatched.length > 0) {
    console.error(
      `${unmatched.length} HAR entries did not match any TSV row (run --report to list).`
    );
  }
  if (MODE === "check" && changed > 0) {
    console.error(
      `\n${changed} example.json file(s) are stale — run \`pnpm run gen:examples\` to update.`
    );
    process.exit(1);
  }
}

function printReport(covered, missing, unmatched, candidatesByKey) {
  console.log(
    `Coverage: ${covered.length} covered, ${missing.length} missing\n`
  );
  console.log("== covered (green-path source per endpoint) ==");
  for (const [key, candidates] of [...candidatesByKey].sort()) {
    const chosen = selectGreenPath(candidates);
    if (!chosen) continue;
    console.log(`  ${key}  →  ${chosen.recordingName}`);
  }
  if (missing.length > 0) {
    console.log(
      "\n== missing (no JSON/bodyless green-path HAR entry matched) =="
    );
    for (const m of missing) console.log(`  ${m}`);
  }
  if (unmatched.length > 0) {
    console.log("\n== HAR entries with no matching TSV row ==");
    for (const u of unmatched)
      console.log(`  ${u.method} ${u.url}  (${u.recordingName})`);
  }
}

async function loadTsv(path) {
  const text = await readFile(path, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const [header, ...rows] = lines;
  const cols = header.split("\t");
  return rows.map((line) => {
    const fields = line.split("\t");
    const obj = {};
    for (let i = 0; i < cols.length; i++) obj[cols[i]] = fields[i] ?? "";
    return obj;
  });
}

async function findHarFiles(root) {
  const out = [];
  async function walk(dir) {
    let dirents;
    try {
      dirents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of dirents) {
      const full = join(dir, d.name);
      if (d.isDirectory()) await walk(full);
      else if (d.isFile() && d.name.endsWith(".har")) out.push(full);
    }
  }
  await walk(root);
  return out.sort();
}

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

function sanitizePayload(value) {
  if (typeof value === "string") {
    if (value.startsWith("data:") && value.includes(";base64,")) {
      const mime = value.slice(5, value.indexOf(";base64,"));
      return `<inline ${mime || "binary"} data URL — replace with a real URL or upload>`;
    }
    if (value.length > STRING_TRUNCATE_LIMIT) {
      return `${value.slice(0, 60)}… <truncated ${value.length} chars>`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizePayload(v);
    return out;
  }
  return value;
}

function parseJsonPayload(bodyText) {
  try {
    return {
      payload: sanitizePayload(JSON.parse(bodyText)),
      payloadString: bodyText,
    };
  } catch {
    return null;
  }
}

function isMultipartRelated(mime) {
  return mime.toLowerCase().startsWith("multipart/related");
}

function hasRequestBody(entry) {
  const postData = entry?.request?.postData;
  if (!postData) return false;
  if (typeof postData.text === "string" && postData.text.length > 0) {
    return true;
  }
  return Array.isArray(postData.params) && postData.params.length > 0;
}

function isSuccessfulResponse(entry) {
  const status = Number(entry?.response?.status);
  return Number.isFinite(status) && status >= 200 && status < 300;
}

function extractCompleteQueryPayload(entry, row) {
  if (!isSuccessfulResponse(entry)) return null;
  const url = new URL(entry.request.url, "https://example.invalid");
  if (hasBareQueryMarker(url.search)) return null;
  const params = url.searchParams;
  if ([...params.keys()].length === 0) return null;

  // Query-string examples are useful only when the query object is the full
  // callable payload. If the concrete HAR path contains extra segments beyond
  // the placeholder-stripped TSV path, the endpoint also needs path arguments
  // (for example `comments.byUser(address, params)`), so a query-only example
  // would be incomplete.
  const harPath = pathSegments(entry.request.url).join("/");
  const tsvPath = pathSegments(row.fullUrl)
    .filter((seg) => !isPlaceholder(seg))
    .join("/");
  if (tsvPath === "") return null;
  if (harPath !== tsvPath) return null;

  const payload = {};
  for (const [key, value] of params) {
    const next = coerceQueryValue(value);
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const prev = payload[key];
      payload[key] = Array.isArray(prev) ? [...prev, next] : [prev, next];
    } else {
      payload[key] = next;
    }
  }
  return {
    payload,
    payloadString: JSON.stringify(payload),
  };
}

function hasBareQueryMarker(search) {
  return search
    .slice(1)
    .split("&")
    .some((part) => part.length > 0 && !part.includes("="));
}

function coerceQueryValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    const n = Number(value);
    if (
      Number.isFinite(n) &&
      (Number.isSafeInteger(n) ||
        (!Number.isInteger(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER))
    ) {
      return n;
    }
  }
  return value;
}

function pathSegments(url) {
  const parsed = new URL(stripQueryMarker(url), "https://example.invalid");
  return parsed.pathname
    .split("/")
    .filter((seg) => seg.length > 0)
    .map((seg) => decodeURIComponent(seg));
}

function isPlaceholder(seg) {
  return seg.startsWith("{") && seg.endsWith("}");
}

function stripQueryMarker(url) {
  return url.replace(/\{query\}/g, "");
}

function providerFromHarPath(harPath) {
  // tests/recordings/<provider>_<hash>/<test>_<hash>/recording.har
  const rel = relative(RECORDINGS_DIR, harPath);
  const firstSeg = rel.split("/")[0];
  if (!firstSeg) return null;
  // Strip trailing _<digits> hash suffix Polly adds (e.g. "openai_3991279299").
  const m = firstSeg.match(/^(.+)_\d+$/);
  return m ? m[1] : firstSeg;
}

function renderExamplesTs(examples, provider) {
  const body = JSON.stringify(examples, null, 2);
  const sourceComment = STATIC_EXAMPLES_BY_PROVIDER[provider]
    ? `// Source: tests/recordings/<provider>_*/<test>_*/recording.har, plus static
// examples for providers that intentionally avoid live-network recordings.
//
// Each entry is a green-path payload for one endpoint. \`attachExamples\`
// walks the provider tree and hangs the matching entry off each endpoint
// function as \`.example\`.`
    : `// Source: tests/recordings/<provider>_*/<test>_*/recording.har
//
// Each entry is the green-path payload for one endpoint, mined from a real
// integration-test recording. \`attachExamples\` walks the provider tree and
// hangs the matching entry off each endpoint function as \`.example\`.`;
  return `// Auto-generated by \`pnpm run gen:examples\` — do not edit by hand.
${sourceComment}

export interface EndpointExample {
  source: string;
  payload: unknown;
}

const EXAMPLES: Record<string, EndpointExample> = ${body};

export default EXAMPLES;

// Walks each "<METHOD> <dotPath>" key onto the provider's tree. Tries the
// standard \`provider.<method>.<dotPath>\` shape first, then a few fallbacks
// to cover providers with non-standard layouts (fal's \`.run.\` namespace,
// kie's sub-providers, \`free\`'s flat root). Returns the same provider for
// drop-in use as \`return attachExamples({ ... });\`.
export function attachExamples<T>(provider: T): T {
  const root = provider as Record<string, unknown>;
  const HTTP_KEYS = new Set(["post", "get", "put", "delete", "patch", "head"]);
  for (const [key, example] of Object.entries(EXAMPLES)) {
    const sp = key.indexOf(" ");
    if (sp < 0) continue;
    const method = key.slice(0, sp).toLowerCase();
    const segs = key.slice(sp + 1).split(".");
    const candidates: Array<unknown> = [
      root[method],
      (root[method] as Record<string, unknown> | undefined)?.run,
      root,
    ];
    if (segs.length > 1) {
      const sub = root[segs[0]];
      if (sub && typeof sub === "object") {
        const subMethod = (sub as Record<string, unknown>)[method];
        if (subMethod) candidates.push({ __nested: subMethod, __segs: segs.slice(1) });
      }
    }
    let attached = false;
    for (const c of candidates) {
      const fn = walkToFn(c, segs);
      if (fn) {
        Object.assign(fn, { example });
        attached = true;
        break;
      }
    }
    if (attached) continue;
    for (const k of Object.keys(root)) {
      if (HTTP_KEYS.has(k)) continue;
      if (!segs.includes(k)) continue;
      const sub = root[k];
      if (!sub || typeof sub !== "object") continue;
      const subMethod = (sub as Record<string, unknown>)[method];
      if (!subMethod) continue;
      const fn = walkToFn(subMethod, segs);
      if (fn) {
        Object.assign(fn, { example });
        break;
      }
    }
  }
  return provider;
}

function walkToFn(start: unknown, segs: string[]): ((...args: unknown[]) => unknown) | null {
  if (start && typeof start === "object" && "__nested" in (start as object)) {
    const wrapper = start as { __nested: unknown; __segs: string[] };
    return walkToFn(wrapper.__nested, wrapper.__segs);
  }
  let cur: unknown = start;
  for (const seg of segs) {
    if (cur === null || cur === undefined) return null;
    const t = typeof cur;
    if (t !== "object" && t !== "function") return null;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === "function"
    ? (cur as (...args: unknown[]) => unknown)
    : null;
}
`;
}

function sortObjectKeys(obj) {
  const out = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = obj[key];
  }
  return out;
}
