#!/usr/bin/env node
/**
 * Provider-scoped lint for the local development loop.
 *
 * This is intentionally narrower than `pnpm run lint`: it lints the provider
 * package and matching integration tests with ESLint, then runs only the
 * repository consistency checks that are relevant to that provider. Use the
 * full `pnpm run lint` gate for shared tooling, cross-provider, or CI work.
 */

import { spawnSync } from "node:child_process";
import {
  hasEndpointDocsRows,
  repoRoot,
  resolveProviderScope,
} from "./lib/provider-scope.mjs";

const ESLINT_BIN = "./node_modules/eslint/bin/eslint.js";
const ESLINT_CACHE = "node_modules/.cache/eslint/";

const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const scopeArg = rawArgs.find((arg) => !arg.startsWith("-"));

let scope;
try {
  scope = resolveProviderScope(scopeArg);
} catch (error) {
  console.error("Usage: pnpm run lint:provider -- <provider-or-path>");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const provider = scope.provider;
const targets = [scope.packageDir, ...scope.tests];

function run(title, cmd, args) {
  console.error(`\n> ${title}`);
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n${title} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}

run("eslint (scoped)", "node", [
  "--max-old-space-size=4096",
  ESLINT_BIN,
  ...targets,
  "--cache",
  "--cache-location",
  ESLINT_CACHE,
]);

if (hasEndpointDocsRows(provider)) {
  run("endpoint comments (provider)", "node", [
    "scripts/check-endpoint-comments.mjs",
    "--provider",
    provider,
  ]);
  run("endpoint signatures (provider)", "node", [
    "scripts/check-endpoint-signatures.mjs",
    "--provider",
    provider,
  ]);
  run("factory signature (provider)", "node", [
    "scripts/check-factory-signatures.mjs",
    "--provider",
    provider,
  ]);
} else {
  console.error(
    `\n> endpoint contract checks (provider)\n` +
      `skipped: ${provider} has no endpoint-docs.tsv rows`
  );
}
run("orphan recordings (provider)", "node", [
  "scripts/check-orphan-recordings.mjs",
  "--provider",
  provider,
]);
run("test timers (provider)", "node", [
  "scripts/check-test-timers.mjs",
  "--provider",
  provider,
]);

console.error(`\nprovider lint green: ${provider}`);
