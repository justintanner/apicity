#!/usr/bin/env node
/**
 * Provider-scoped preflight: format + lint + test ONLY the provider in question.
 *
 * `dev:preflight` / `dev:preflight:provider` historically ran `prettier --write .`
 * and (via `lint`) `prettier --check .` over the ENTIRE monorepo — ~80s of
 * prettier on directories the change never touched. This scopes the expensive
 * prettier + eslint passes to just the provider package and its integration
 * tests (a couple seconds), and runs provider-filtered repository consistency
 * checks where the check supports scoping. The full mirror
 * (`pnpm run ci:local`) remains CI's job — run it only if you touched shared /
 * test-harness code.
 *
 * The provider scope can be a provider name, a path under
 * packages/provider/<provider>, or an integration test path. With no argument,
 * the script tries APICITY_PROVIDER_PATH, pnpm's INIT_CWD, then process.cwd().
 *
 * Steps:
 *   1. prettier --write  on the provider package dir + its integration tests
 *   2. lint:provider     scoped ESLint + provider-relevant repo checks
 *   3. test:provider     typecheck the package + replay its tests
 *
 * For typecheck-only loops, use `pnpm run typecheck:provider -- <provider>`.
 * This preflight intentionally reuses the provider `tsc` check already run by
 * `test:provider` instead of repeating a standalone typecheck step.
 *
 * Usage: node scripts/preflight-provider.mjs <provider-or-path>
 *        pnpm run dev:preflight:provider -- packages/provider/openai/src
 */

import { spawnSync } from "node:child_process";
import { repoRoot, resolveProviderScope } from "./lib/provider-scope.mjs";

const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const scopeArg = rawArgs.find((arg) => !arg.startsWith("-"));
const passthrough = rawArgs.filter((arg) => arg !== scopeArg);

let scope;
try {
  scope = resolveProviderScope(scopeArg);
} catch (error) {
  console.error("Usage: pnpm run dev:preflight:provider <provider-or-path>");
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const provider = scope.provider;
const pkgDir = scope.packageDir;
const tests = scope.tests;

if (tests.length === 0) {
  console.error(
    `No integration tests match "${provider}" in tests/integration`
  );
  process.exit(1);
}

// Only the provider package + its tests — NOT the whole root tree.
const targets = [pkgDir, ...tests];

function run(title, cmd, args) {
  console.error(`\n▸ ${title}`);
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });
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

// 2. Lint the same scope and provider-relevant repository checks.
run(`lint:provider ${provider}`, "pnpm", [
  "run",
  "lint:provider",
  "--",
  provider,
]);

// 3. Typecheck the provider package, then replay its tests.
run(`test:provider ${provider}`, "pnpm", [
  "run",
  "test:provider",
  provider,
  ...passthrough,
]);

console.error(`\n✓ provider preflight green: ${provider}`);
