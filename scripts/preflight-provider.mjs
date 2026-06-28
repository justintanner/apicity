#!/usr/bin/env node
/**
 * Provider-scoped preflight: format + lint + test ONLY the provider in question.
 *
 * `dev:preflight` / `dev:preflight:provider` historically ran `prettier --write .`
 * and (via `lint`) `prettier --check .` over the ENTIRE monorepo — ~80s of
 * prettier on directories the change never touched. This scopes the expensive
 * prettier + eslint passes to just the provider package and its integration
 * tests (a couple seconds), and keeps only the fast, state-dependent
 * whole-repo correctness gates. The full mirror (`pnpm run ci:local`) remains
 * CI's job — run it only if you touched shared / test-harness code.
 *
 * Steps:
 *   1. prettier --write  on the provider package dir + its integration tests
 *   2. eslint (cached)   on the same file set
 *   3. whole-repo gates: endpoint comments, orphan recordings, test timers
 *   4. test:provider     typecheck the package + replay its tests
 *
 * Usage: node scripts/preflight-provider.mjs <provider>
 *        pnpm run dev:preflight:provider <provider>
 */

import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";

const INTEGRATION_DIR = "tests/integration";
const ESLINT_BIN = "./node_modules/eslint/bin/eslint.js";
const ESLINT_CACHE = "node_modules/.cache/eslint/";

const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const provider = rawArgs.find((arg) => !arg.startsWith("-"));
const passthrough = rawArgs.filter((arg) => arg !== provider);

if (!provider) {
  console.error("Usage: pnpm run dev:preflight:provider <provider>");
  process.exit(1);
}

const pkgDir = `packages/provider/${provider}`;
if (!existsSync(pkgDir)) {
  console.error(`No provider package at ${pkgDir}`);
  process.exit(1);
}

// This provider's integration tests. `startsWith(provider + "-")` keeps `x`
// distinct from `xai`; the exact match catches single-file providers like `fal`.
// Same predicate as scripts/test-provider.mjs — keep them in sync.
const tests = readdirSync(INTEGRATION_DIR)
  .filter(
    (name) => name === `${provider}.test.ts` || name.startsWith(`${provider}-`)
  )
  .map((name) => `${INTEGRATION_DIR}/${name}`);

if (tests.length === 0) {
  console.error(
    `No integration tests match "${provider}" in ${INTEGRATION_DIR}`
  );
  process.exit(1);
}

// Only the provider package + its tests — NOT the whole root tree.
const targets = [pkgDir, ...tests];

function run(title, cmd, args) {
  console.error(`\n▸ ${title}`);
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ${title} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}

// 1. Format the provider package + its tests only.
run("prettier --write (scoped)", "pnpm", [
  "exec",
  "prettier",
  "--write",
  ...targets,
]);

// 2. Lint the same scope with the shared cache.
run("eslint (scoped)", "node", [
  "--max-old-space-size=4096",
  ESLINT_BIN,
  ...targets,
  "--cache",
  "--cache-location",
  ESLINT_CACHE,
]);

// 3. Fast, whole-repo correctness gates (state-dependent; not worth scoping).
run("endpoint comments", "node", ["scripts/check-endpoint-comments.mjs"]);
run("orphan recordings", "node", ["scripts/check-orphan-recordings.mjs"]);
run("test timers", "node", ["scripts/check-test-timers.mjs"]);

// 4. Typecheck the provider package, then replay its tests.
run(`test:provider ${provider}`, "pnpm", [
  "run",
  "test:provider",
  provider,
  ...passthrough,
]);

console.error(`\n✓ provider preflight green: ${provider}`);
