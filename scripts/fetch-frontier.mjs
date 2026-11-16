#!/usr/bin/env node
/**
 * Refresh the frontier snapshots from their leaderboard pages.
 *
 *   pnpm run fetch:frontier                    # every type
 *   pnpm run fetch:frontier -- i2v v2v         # only these types
 *   pnpm run fetch:frontier -- --dry-run       # print the changes, write nothing
 *
 * For each requested type this downloads the `sourceUrl` that
 * `scripts/frontier/catalog.json` gives it, reads the overall top 10, and
 * rewrites `scripts/frontier/<type>/leaderboard.json` and `endpoints.json`.
 * A model new to the board gets an empty endpoint list to fill in by hand; a
 * model that left takes its endpoints with it. `r2v` has no page: it is
 * re-derived from the `t2v` and `i2v` snapshots whenever either is refreshed
 * or when it is requested by name.
 *
 * This is a routine a person runs. The build, the tests and CI never download
 * a leaderboard. Afterwards run `pnpm run gen:frontier` and `pnpm run doc-gen`.
 *
 * Exit 0 on success, 1 when a page could not be fetched, parsed or validated
 * (nothing is written for that run), 2 on a usage error.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import prettier from "prettier";

import {
  deriveEntries,
  pageLeaderboardIds,
  parseLeaderboardEntries,
  reconcileEndpointMap,
  refreshedSnapshot,
} from "./lib/frontier-leaderboard-parse.mjs";
import {
  endpointMapProblems,
  FRONTIER_DIR,
  loadCatalog,
  snapshotProblems,
} from "./lib/frontier-models.mjs";

const USER_AGENT = "Mozilla/5.0 (compatible; frontier-leaderboard-refresh)";
const TIMEOUT_MS = 60_000;

class UsageError extends Error {}

function typePath(type, file) {
  return path.join(FRONTIER_DIR, type, file);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readType(type) {
  return {
    snapshot: readJson(typePath(type, "leaderboard.json")),
    endpointMap: readJson(typePath(type, "endpoints.json")),
  };
}

async function downloadPage(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  return response.text();
}

function assertIdentity(item, html) {
  if (html.includes(item.leaderboardId)) return;
  const found = pageLeaderboardIds(html).join(", ") || "none";
  throw new Error(
    `${item.type}: ${item.sourceUrl} no longer names ${item.leaderboardId} (found: ${found}). Update scripts/frontier/catalog.json and the snapshot's leaderboardId, then rerun.`
  );
}

function assertValid(type, snapshot, endpointMap) {
  const problems = [
    ...snapshotProblems(snapshot),
    ...endpointMapProblems(snapshot, endpointMap),
  ];
  if (problems.length > 0) {
    throw new Error(`${type}: ${problems.join("; ")}`);
  }
}

function buildUpdate(type, previous, entries, capturedOn, notes = []) {
  const snapshot = refreshedSnapshot(previous.snapshot, entries, capturedOn);
  const { map, added, dropped } = reconcileEndpointMap(
    previous.endpointMap,
    entries
  );
  assertValid(type, snapshot, map);
  return { type, previous, snapshot, endpointMap: map, added, dropped, notes };
}

async function fetchUpdate(item, capturedOn) {
  const html = await downloadPage(item.sourceUrl);
  assertIdentity(item, html);
  const entries = parseLeaderboardEntries(html);
  return buildUpdate(item.type, readType(item.type), entries, capturedOn);
}

function sourceEntries(leaderboardId, catalog, updates) {
  const item = catalog.find((entry) => entry.leaderboardId === leaderboardId);
  if (item === undefined) {
    throw new Error(`derived source ${leaderboardId} is not in the catalog`);
  }
  const update = updates.find((candidate) => candidate.type === item.type);
  return (update ?? readType(item.type)).snapshot.entries;
}

function deriveUpdate(item, catalog, updates, capturedOn) {
  const previous = readType(item.type);
  const sources = previous.snapshot.sources.map((leaderboardId) =>
    sourceEntries(leaderboardId, catalog, updates)
  );
  const { entries, unmapped } = deriveEntries(sources, previous.endpointMap);
  const notes =
    unmapped.length > 0
      ? [
          `source models with no ${item.type} endpoint mapped (add one to endpoints.json and rerun \`fetch:frontier -- ${item.type}\` if apicity serves it): ${unmapped.join(", ")}`,
        ]
      : [];
  return buildUpdate(item.type, previous, entries, capturedOn, notes);
}

function entryLine(entry) {
  return `${entry.rank}. ${entry.model} (${entry.creator}) ${entry.elo}`;
}

function describeUpdate(update) {
  const before = new Map(
    update.previous.snapshot.entries.map((entry) => [entry.model, entry])
  );
  const rows = update.snapshot.entries.map((entry) => {
    const old = before.get(entry.model);
    if (old === undefined) return `  ${entryLine(entry)}  [new]`;
    const moved = old.rank === entry.rank ? "" : `  [was #${old.rank}]`;
    const elo = old.elo === entry.elo ? "" : `  [Elo was ${old.elo}]`;
    return `  ${entryLine(entry)}${moved}${elo}`;
  });
  const lines = [`${update.type} (${update.snapshot.capturedOn})`, ...rows];
  if (update.added.length > 0) {
    lines.push(`  needs endpoints: ${update.added.join(", ")}`);
  }
  if (update.dropped.length > 0) {
    lines.push(`  left the board: ${update.dropped.join(", ")}`);
  }
  return [...lines, ...update.notes.map((note) => `  note: ${note}`)].join(
    "\n"
  );
}

async function writeJson(filePath, value) {
  const options = await prettier.resolveConfig(filePath);
  const text = await prettier.format(JSON.stringify(value, null, 2), {
    ...options,
    filepath: filePath,
  });
  writeFileSync(filePath, text);
}

async function writeUpdate(update) {
  await writeJson(typePath(update.type, "leaderboard.json"), update.snapshot);
  await writeJson(typePath(update.type, "endpoints.json"), update.endpointMap);
}

function selectTypes(requested, catalog) {
  const known = catalog.map((item) => item.type);
  const unknown = requested.filter((type) => !known.includes(type));
  if (unknown.length > 0) {
    throw new UsageError(
      `unknown type ${unknown.join(", ")}; choose from ${known.join(", ")}`
    );
  }
  return requested.length === 0 ? known : requested;
}

function needsDerive(item, selected, catalog) {
  if (selected.includes(item.type)) return true;
  const sources = readType(item.type).snapshot.sources;
  return catalog.some(
    (entry) =>
      selected.includes(entry.type) && sources.includes(entry.leaderboardId)
  );
}

async function collectUpdates(selected, catalog, capturedOn) {
  const fetched = [];
  for (const item of catalog) {
    if (item.derived || !selected.includes(item.type)) continue;
    console.error(`fetching ${item.type} ${item.sourceUrl}`);
    fetched.push(await fetchUpdate(item, capturedOn));
  }
  const derived = catalog
    .filter((item) => item.derived && needsDerive(item, selected, catalog))
    .map((item) => deriveUpdate(item, catalog, fetched, capturedOn));
  return [...fetched, ...derived];
}

async function main() {
  const { values, positionals } = parseArgs({
    options: { "dry-run": { type: "boolean", default: false } },
    allowPositionals: true,
  });
  const catalog = loadCatalog();
  const selected = selectTypes(positionals, catalog);
  const capturedOn = new Date().toISOString().slice(0, 10);
  const updates = await collectUpdates(selected, catalog, capturedOn);
  console.log(updates.map(describeUpdate).join("\n\n"));
  if (values["dry-run"]) {
    console.log("\ndry run: nothing written");
    return;
  }
  for (const update of updates) {
    await writeUpdate(update);
  }
  console.log(
    "\nwrote scripts/frontier. Fill in any empty endpoint lists, then run `pnpm run gen:frontier` and `pnpm run doc-gen`."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(error instanceof UsageError ? 2 : 1);
});
