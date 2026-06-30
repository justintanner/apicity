#!/usr/bin/env node
/**
 * Format only changed or explicitly supplied files.
 *
 * This is the fast first step for local preflight loops when the changed
 * surface is known. `pnpm run format` remains the full-repository formatter.
 */

import { spawnSync } from "node:child_process";
import {
  collectChangedTargets,
  formatTargetList,
  formatUsage,
  parseChangedArgs,
} from "./lib/changed-files.mjs";
import { repoRoot } from "./lib/provider-scope.mjs";

let parsed;
try {
  parsed = parseChangedArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(formatUsage("pnpm run format:changed --"));
  process.exit(1);
}

if (parsed.help) {
  console.log(formatUsage("pnpm run format:changed --"));
  process.exit(0);
}

let targets;
try {
  targets = collectChangedTargets(parsed);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (targets.length === 0) {
  console.error("No changed files to format.");
  process.exit(0);
}

console.error("Formatting changed files:");
console.error(formatTargetList(targets));

const result = spawnSync(
  "pnpm",
  ["exec", "prettier", "--write", "--ignore-unknown", ...targets],
  { cwd: repoRoot, stdio: "inherit" }
);

process.exit(result.status ?? 1);
