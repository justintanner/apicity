#!/usr/bin/env node
/**
 * Generate `packages/provider/cost/src/frontier/data.ts`.
 *
 * The JSON under `scripts/frontier` is the source of truth. This script
 * renders it into the dependency-free registry `@apicity/cost` ships. It
 * never downloads a leaderboard.
 *
 * Usage:
 *   node scripts/gen-frontier.mjs           # write the file
 *   node scripts/gen-frontier.mjs --check   # exit 1 on drift
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  FRONTIER_DATA_PATH,
  renderFrontierModule,
} from "./lib/frontier-models.mjs";

const check = process.argv.slice(2).includes("--check");
const next = await renderFrontierModule();
let current = "";
try {
  current = readFileSync(FRONTIER_DATA_PATH, "utf8");
} catch {
  current = "";
}

if (next === current) {
  if (!check) {
    console.log("frontier registry is up to date");
  }
  process.exit(0);
}

if (check) {
  console.error("stale: packages/provider/cost/src/frontier/data.ts");
  console.error("Run `pnpm run gen:frontier` and commit the result.");
  process.exit(1);
}

writeFileSync(FRONTIER_DATA_PATH, next);
console.log("wrote packages/provider/cost/src/frontier/data.ts");
