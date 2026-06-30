#!/usr/bin/env node
/**
 * Changed-file preflight: format/lint only the changed surface, then run the
 * repo-wide correctness checks that still matter for any local change.
 *
 * Use this when work is not scoped cleanly to one provider but the changed
 * files are known. For provider-only work, `dev:preflight:provider` remains
 * faster because it also scopes tests to that provider.
 */

import { spawnSync } from "node:child_process";
import {
  collectChangedTargets,
  filterEslintTargets,
  formatTargetList,
  formatUsage,
  parseChangedArgs,
} from "./lib/changed-files.mjs";
import { repoRoot } from "./lib/provider-scope.mjs";

const ESLINT_BIN = "./node_modules/eslint/bin/eslint.js";
const ESLINT_CACHE = "node_modules/.cache/eslint/";

let parsed;
try {
  parsed = parseChangedArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error(formatUsage("pnpm run dev:preflight:changed --"));
  process.exit(1);
}

if (parsed.help) {
  console.log(formatUsage("pnpm run dev:preflight:changed --"));
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
  console.error("No changed files found; changed-file preflight has no work.");
  process.exit(0);
}

console.error("Changed-file preflight targets:");
console.error(formatTargetList(targets));

run("prettier --write (changed files)", "pnpm", [
  "exec",
  "prettier",
  "--write",
  "--ignore-unknown",
  ...targets,
]);

run("typecheck", "pnpm", ["run", "typecheck"]);

const eslintTargets = filterEslintTargets(targets);
if (eslintTargets.length > 0) {
  run("eslint (changed JS/TS files)", "node", [
    "--max-old-space-size=4096",
    ESLINT_BIN,
    ...eslintTargets,
    "--cache",
    "--cache-location",
    ESLINT_CACHE,
  ]);
} else {
  console.error("\n> eslint (changed JS/TS files)");
  console.error("No JS/TS changed files; skipping scoped ESLint.");
}

run("endpoint comments", "node", ["scripts/check-endpoint-comments.mjs"]);
run("orphan recordings", "node", ["scripts/check-orphan-recordings.mjs"]);
run("test timers", "node", ["scripts/check-test-timers.mjs"]);
run("test:run", "pnpm", ["run", "test:run"]);

console.error("\nChanged-file preflight green.");

function run(title, cmd, args) {
  console.error(`\n> ${title}`);
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });

  if (result.status !== 0) {
    console.error(`\n${title} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}
