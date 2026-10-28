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
import { exampleCandidate } from "./lib/example-candidates.mjs";
import {
  exchangeSucceeded,
  responseObject,
} from "./lib/exchange-succeeded.mjs";
import { selectGreenPath } from "./lib/select-green-path.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TSV_PATH = join(ROOT, "scripts/endpoint-docs.tsv");
const COST_TIERS_PATH = join(ROOT, "scripts/endpoint-cost-tiers.tsv");
const RECORDINGS_DIR = join(ROOT, "tests/recordings");
const PROVIDERS_DIR = join(ROOT, "packages/provider");

const args = new Set(process.argv.slice(2));
const MODE = args.has("--check")
  ? "check"
  : args.has("--report")
    ? "report"
    : "write";

// KIE fallbacks use minimal requests from invalid-key probes, with shapes
// proven by successful sibling recordings (ac-9gwcy8, D4). No caller IDs.
const STATIC_EXAMPLES_BY_PROVIDER = {
  kie: {
    "POST api.v1.responses": {
      source: "static:kie-api-responses-minimal",
      payload: {
        model: "gpt-5.1-codex",
        input: "ping",
        stream: false,
      },
    },
    "POST gemini.v1.models.gemini36Flash.streamGenerateContent": {
      source: "static:kie-gemini-36-flash-minimal",
      payload: {
        stream: false,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "ping",
              },
            ],
          },
        ],
      },
    },
    "POST gemini.v1.models.gemini37Flash.streamGenerateContent": {
      source: "static:kie-gemini-37-flash-minimal",
      payload: {
        stream: false,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "ping",
              },
            ],
          },
        ],
      },
    },
    "POST gemini.v1.models.gemini38Flash.streamGenerateContent": {
      source: "static:kie-gemini-38-flash-minimal",
      payload: {
        stream: false,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "ping",
              },
            ],
          },
        ],
      },
    },
    "POST gemini25Pro.v1.chat.completions": {
      source: "static:kie-gemini-25-pro-chat-minimal",
      payload: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "ping",
              },
            ],
          },
        ],
        stream: false,
        include_thoughts: false,
        reasoning_effort: "low",
      },
    },
    "POST gemini3Pro.v1.chat.completions": {
      source: "static:kie-gemini-3-pro-chat-minimal",
      payload: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "ping",
              },
            ],
          },
        ],
        stream: false,
        include_thoughts: false,
      },
    },
    "POST gemini35FlashOpenai.v1.chat.completions": {
      source: "static:kie-gemini-35-flash-openai-chat-minimal",
      payload: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "ping",
              },
            ],
          },
        ],
        stream: false,
        include_thoughts: false,
      },
    },
    "POST gemini36FlashOpenai.v1.chat.completions": {
      source: "static:kie-gemini-36-flash-openai-chat-minimal",
      payload: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "ping",
              },
            ],
          },
        ],
        stream: false,
        include_thoughts: false,
      },
    },
    "POST gemini37FlashOpenai.v1.chat.completions": {
      source: "static:kie-gemini-37-flash-openai-chat-minimal",
      payload: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "ping",
              },
            ],
          },
        ],
        stream: false,
        include_thoughts: false,
      },
    },
    "POST gemini38FlashOpenai.v1.chat.completions": {
      source: "static:kie-gemini-38-flash-openai-chat-minimal",
      payload: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "ping",
              },
            ],
          },
        ],
        stream: false,
        include_thoughts: false,
      },
    },
  },
  xai: {
    "GET v1.files": {
      source: "static:xai-files-public-url-filter",
      payload: { filter: "public_url != null", limit: 10 },
    },
    "POST v1.files.publicUrl": {
      source: "static:xai-files-public-url-create",
      payload: { expires_after: 86400 },
    },
    "POST v1.files.publicUrl.revoke": {
      source: "static:xai-files-public-url-revoke",
      payload: {},
    },
  },
  openligadb: {
    "GET getavailablegroups": {
      source: "static:openligadb-public-catalog",
      payload: { leagueShortcut: "bl1", leagueSeason: 2024 },
    },
    "GET getavailableleagues": {
      source: "static:openligadb-public-catalog",
      payload: {},
    },
    "GET getavailableleagues.bySeason": {
      source: "static:openligadb-public-catalog",
      payload: { season: 2024 },
    },
    "GET getavailablesports": {
      source: "static:openligadb-public-catalog",
      payload: {},
    },
    "GET getavailableteams": {
      source: "static:openligadb-public-catalog",
      payload: { leagueShortcut: "bl1", leagueSeason: 2024 },
    },
    "GET getbltable": {
      source: "static:openligadb-standings",
      payload: { leagueShortcut: "bl1", leagueSeason: 2024 },
    },
    "GET getcurrentgroup": {
      source: "static:openligadb-public-catalog",
      payload: { leagueShortcut: "bl1" },
    },
    "GET getgoalgetters": {
      source: "static:openligadb-scorers",
      payload: { leagueShortcut: "bl1", leagueSeason: 2024 },
    },
    "GET getgrouptable": {
      source: "static:openligadb-standings",
      payload: { leagueShortcut: "bl1", leagueSeason: 2024 },
    },
    "GET getlastchangedate": {
      source: "static:openligadb-public-catalog",
      payload: {
        leagueShortcut: "bl1",
        leagueSeason: 2024,
        groupOrderId: 1,
      },
    },
    "GET getmatchdata.byId": {
      source: "static:openligadb-matchdata",
      payload: { matchId: 68720 },
    },
    "GET getmatchdata.byLeagueSeason": {
      source: "static:openligadb-matchdata",
      payload: { leagueShortcut: "bl1", leagueSeason: 2024 },
    },
    "GET getmatchdata.byLeagueSeasonGroup": {
      source: "static:openligadb-matchdata",
      payload: {
        leagueShortcut: "bl1",
        leagueSeason: 2024,
        groupOrderId: 1,
      },
    },
    "GET getmatchdata.byLeagueSeasonTeam": {
      source: "static:openligadb-matchdata",
      payload: {
        leagueShortcut: "bl1",
        leagueSeason: 2024,
        teamFilterstring: "Bayern",
      },
    },
    "GET getmatchdata.byTeams": {
      source: "static:openligadb-matchdata",
      payload: { teamId1: 16, teamId2: 40 },
    },
    "GET getresultinfos": {
      source: "static:openligadb-public-catalog",
      payload: { leagueId: 4500 },
    },
    "GET swagger.v1.swaggerJson": {
      source: "static:openligadb-openapi-document",
      payload: {},
    },
  },
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
  // Path-parameter-only GETs leave no query or body for a recording to yield;
  // each payload is the region its tests/integration/endless-*.test.ts
  // recording requested.
  endless: {
    "GET social.tiktokTrends.public": {
      source: "static:endless-public-tiktok-trends",
      payload: { region: "thailand" },
    },
    "GET social.trends.public": {
      source: "static:endless-public-trends",
      payload: { region: "worldwide" },
    },
  },
  // The overview takes no input, so its recording yields no payload.
  "tiktok-creative-center": {
    "GET ads.creativeOne.report.getTopContentsOverview": {
      source: "static:tiktok-creative-center-overview",
      payload: {},
    },
  },
};

// Curated overrides for accepted submits with unusable media (ac-fevz1c).
// xai/video-edit's poll reports that the old sample URL returned HTTP 404;
// both extension recordings use that same URL (free HEAD confirmed 404).
// Replacement: free HEAD + GET returned video/mp4 on 2026-10-24;
// MP4 metadata: H.264 (avc1), 5 seconds. No paid generation was performed.
// This is explicit example curation, not a generic async job-outcome rule.
const STATIC_EXAMPLE_OVERRIDES_BY_PROVIDER = {
  xai: {
    "POST v1.videos.edits": {
      source: "static:xai-video-edit-reachable-sample",
      payload: {
        model: "grok-imagine-video",
        prompt: "Add a warm cinematic color grade to the scene",
        video: {
          url: "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
        },
      },
    },
    "POST v1.videos.extensions": {
      source: "static:xai-video-extension-reachable-sample",
      payload: {
        model: "grok-imagine-video",
        prompt: "Continue the motion in the scene",
        video: {
          url: "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
        },
        duration: 5,
      },
    },
  },
};

await main();

async function main() {
  const tsvRows = await loadTsv(TSV_PATH);
  const tierMap = buildCostTierMap(await readFile(COST_TIERS_PATH, "utf8"));
  const harFiles = await findHarFiles(RECORDINGS_DIR);
  const candidatesByKey = new Map(); // "provider::METHOD <dotPath>" → candidate[]
  const unmatched = [];
  const failed = [];

  for (const harPath of harFiles) {
    const har = await readJson(harPath);
    const recordingName = har?.log?._recordingName ?? relative(ROOT, harPath);
    const entries = har?.log?.entries ?? [];
    const providerHint = providerFromHarPath(harPath);
    for (const entry of entries) {
      const method = entry?.request?.method?.toUpperCase();
      if (!method) continue;
      const row = findMatchingRow(entry, tsvRows, { provider: providerHint });
      const extracted = exampleCandidate(entry, row, providerHint);
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
      if (!exchangeSucceeded(row.provider, entry)) {
        const body = responseObject(entry);
        const code =
          typeof body?.code === "number"
            ? ", " + row.provider + " code " + body.code
            : "";
        failed.push(
          key +
            " -> " +
            recordingName +
            " (HTTP " +
            entry.response?.status +
            code +
            "): failed exchange"
        );
        continue;
      }
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

  // Unlike static fallbacks, these intentionally replace recorded submits
  // whose example inputs have separately been shown unusable.
  for (const [provider, overrides] of Object.entries(
    STATIC_EXAMPLE_OVERRIDES_BY_PROVIDER
  )) {
    const examples = examplesByProvider.get(provider) ?? {};
    Object.assign(examples, overrides);
    examplesByProvider.set(provider, examples);
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
    printReport(covered, missing, unmatched, candidatesByKey, failed);
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
    annotateWithCostTier(sorted, provider, tierMap);
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

function printReport(covered, missing, unmatched, candidatesByKey, failed) {
  console.log(
    `Coverage: ${covered.length} covered, ${missing.length} missing\n`
  );
  console.log("== covered (green-path source per endpoint) ==");
  for (const [key, candidates] of [...candidatesByKey].sort()) {
    const chosen = selectGreenPath(candidates);
    if (!chosen) continue;
    const [provider, methodAndPath] = key.split("::");
    const override =
      STATIC_EXAMPLE_OVERRIDES_BY_PROVIDER[provider]?.[methodAndPath];
    console.log(`  ${key}  →  ${override?.source ?? chosen.recordingName}`);
  }
  if (failed.length > 0) {
    console.log("\n== demoted sources (failed exchange) ==");
    for (const line of failed.sort()) console.log("  " + line);
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

function providerFromHarPath(harPath) {
  // tests/recordings/<provider>_<hash>/<test>_<hash>/recording.har
  const rel = relative(RECORDINGS_DIR, harPath);
  const firstSeg = rel.split("/")[0];
  if (!firstSeg) return null;
  // Strip trailing _<digits> hash suffix Polly adds (e.g. "openai_3991279299").
  const m = firstSeg.match(/^(.+)_\d+$/);
  let provider = m ? m[1] : firstSeg;
  if (provider === "google-flow") provider = "googleflow";
  return provider;
}

// Parse scripts/endpoint-cost-tiers.tsv (the canonical per-endpoint cost
// classification) into a (provider\tdotPath\tMETHOD) -> tier map.
function buildCostTierMap(text) {
  const map = new Map();
  const lines = text.split("\n").filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const [provider, dotPath, method, tier] = lines[i].split("\t");
    map.set(`${provider}\t${dotPath}\t${method}`, tier);
  }
  return map;
}

// Hang the canonical cost tier and a fail-closed runByDefault flag off each
// example so example runners gate expensive/prohibitive endpoints. Any
// endpoint absent from the classification is treated as prohibitive.
function annotateWithCostTier(examples, provider, tierMap) {
  for (const [key, entry] of Object.entries(examples)) {
    const sp = key.indexOf(" ");
    const method = sp < 0 ? "" : key.slice(0, sp);
    const dotPath = sp < 0 ? key : key.slice(sp + 1);
    const tier =
      tierMap.get(`${provider}\t${dotPath}\t${method}`) ?? "prohibitive";
    entry.tier = tier;
    entry.runByDefault = tier === "cheap";
  }
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
  /** Canonical cost tier of this endpoint (see @apicity/cost). */
  tier: "cheap" | "expensive" | "prohibitive";
  /** Whether an example runner may execute this by default (cheap only). */
  runByDefault: boolean;
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
