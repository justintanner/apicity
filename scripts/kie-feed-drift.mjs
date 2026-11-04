#!/usr/bin/env node
/**
 * Does PRICING.kie still hold what KIE's public price feed prints today?
 *
 *   pnpm run check:kie-feed-drift                 # pull now, free and keyless
 *   pnpm run check:kie-feed-drift -- --snapshot <file> --metadata <file>
 *   pnpm run check:kie-feed-drift -- --json
 *
 * Exit 0 when every comparable cell agrees, 1 when one differs, 2 when the check
 * could not run. CI replays with no network, so this is a routine to run, not a
 * gate: see "When to repeat" in docs/cost-learning-pass-1.md.
 */
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import { PRICING } from "../packages/provider/cost/src/index.ts";
import { feedDrift } from "./lib/kie-feed-drift.mjs";
import {
  collectPricingPages,
  fetchPricingPage,
  KIE_PRICING_ENDPOINT,
  KIE_PRICING_PAGE_SIZE,
  writePullArtifacts,
} from "./lib/kie-pricing-pull.mjs";
import { buildReconciliationManifest } from "./lib/kie-pricing-reconciliation.mjs";

async function pullFeed() {
  const artifactRoot = await mkdtemp(path.join(tmpdir(), "kie-feed-drift-"));
  const startedAt = new Date().toISOString();
  const collection = await collectPricingPages({
    endpoint: KIE_PRICING_ENDPOINT,
    pageSize: KIE_PRICING_PAGE_SIZE,
    fetchPage: (pageNum, pageSize) =>
      fetchPricingPage({
        endpoint: KIE_PRICING_ENDPOINT,
        pageNum,
        pageSize,
      }),
  });
  const artifacts = await writePullArtifacts({
    collection,
    artifactRoot,
    startedAt,
    completedAt: new Date().toISOString(),
  });
  return {
    snapshotPath: artifacts.snapshotPath,
    metadataPath: artifacts.metadataPath,
  };
}

function describeCell(row) {
  const table = row.tableUsd === null ? "no cell" : row.tableUsd;
  const feed = [...new Set(row.feedUsd)].join(" or ");
  return `${row.description} | ${row.key} ${row.variant} | table ${table} | feed ${feed} (${row.credits} credits ${row.feedUnit})`;
}

async function main() {
  const { values } = parseArgs({
    // `pnpm run <script> -- <flags>` passes the separator through.
    args: process.argv.slice(2).filter((arg) => arg !== "--"),
    options: {
      snapshot: { type: "string" },
      metadata: { type: "string" },
      json: { type: "boolean", default: false },
    },
  });
  if (Boolean(values.snapshot) !== Boolean(values.metadata)) {
    throw new Error("--snapshot and --metadata go together");
  }
  const { snapshotPath, metadataPath } = values.snapshot
    ? { snapshotPath: values.snapshot, metadataPath: values.metadata }
    : await pullFeed();
  const manifest = await buildReconciliationManifest({
    root: process.cwd(),
    snapshotPath,
    metadataPath,
    live: true,
  });
  const report = feedDrift({ manifest, pricing: PRICING.kie });
  if (values.json) {
    console.log(JSON.stringify({ snapshotPath, ...report }, null, 2));
  } else {
    console.log(`Feed: ${snapshotPath}`);
    console.log(
      `Compared ${report.compared} cells: ${report.same} agree, ${report.differ.length} differ. ` +
        `${report.notCompared.length} rows have no comparable cell, and ` +
        `${report.uncoveredKeys.length} of ${Object.keys(PRICING.kie).length} table keys have no feed row.`
    );
    for (const row of report.differ) console.log(`DIFFER ${describeCell(row)}`);
    for (const row of report.notCompared) {
      console.log(`NOT COMPARED ${row.description}: ${row.reason}`);
    }
    if (report.uncoveredKeys.length) {
      console.log(`NO FEED ROW ${report.uncoveredKeys.join(", ")}`);
    }
  }
  return report.differ.length ? 1 : 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  }
);
