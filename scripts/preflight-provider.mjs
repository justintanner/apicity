#!/usr/bin/env node
/**
 * Fast provider-scoped preflight: format + lint + test ONLY the provider in
 * question.
 *
 * The full `dev:preflight` gate runs `prettier --write .` and full-repo
 * checks. This scopes the expensive prettier + eslint passes to just the
 * provider package and its integration tests, then runs the provider's
 * typecheck/replay gate. Use `dev:preflight:fast` for narrow provider work;
 * use `dev:preflight` or `ci:local` when the diff touches shared tooling,
 * package metadata, docs, or test harness code.
 *
 * The provider scope can be a provider name, a path under
 * packages/provider/<provider>, or an integration test path. With no argument,
 * the script tries APICITY_PROVIDER_PATH, pnpm's INIT_CWD, then process.cwd().
 *
 * Steps:
 *   1. prettier --write  on the provider package dir + its integration tests
 *   2. lint:provider     scoped ESLint + provider-relevant repo checks
 *   3. test:provider     typecheck the package + replay its tests
 *   4. cross-cutting     whole-corpus recording-enumeration tests
 *
 * Step 4 runs the cross-cutting integration tests (see
 * scripts/lib/cross-cutting-tests.mjs) that enumerate ALL recordings and assert
 * against a hardcoded allowlist. They are not provider-scoped, so `test:provider`
 * alone skips them and a recording added under one provider can break the
 * allowlist without failing this gate — the gap that let a broken allowlist
 * reach main and go red in full CI (ac-05hrc). They are filesystem-only (~1s).
 *
 * For typecheck-only loops, use `pnpm run typecheck:provider -- <provider>`.
 * This preflight intentionally reuses the provider `tsc` check already run by
 * `test:provider` instead of repeating a standalone typecheck step.
 *
 * Usage: node scripts/preflight-provider.mjs <provider-or-path>
 *        pnpm run dev:preflight:fast -- openai
 *        pnpm run dev:preflight:provider -- packages/provider/openai/src
 */

import { spawnSync } from "node:child_process";
import { listCrossCuttingTests } from "./lib/cross-cutting-tests.mjs";
import { repoRoot, resolveProviderScope } from "./lib/provider-scope.mjs";

const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");

if (rawArgs.includes("-h") || rawArgs.includes("--help")) {
  printUsage();
  process.exit(0);
}

const scopeArg = rawArgs.find((arg) => !arg.startsWith("-"));
const passthrough = rawArgs.filter((arg) => arg !== scopeArg);

let scope;
try {
  scope = resolveProviderScope(scopeArg);
} catch (error) {
  printUsage();
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

const crossCuttingTests = listCrossCuttingTests();

console.error(`Fast provider preflight: ${provider}`);
console.error("Steps:");
console.error("  1. prettier --write (provider package + tests)");
console.error("  2. lint:provider");
console.error("  3. test:provider (provider typecheck + replay)");
console.error("  4. cross-cutting recording-enumeration tests");

function run(title, cmd, args) {
  console.error(`\n▸ ${title}`);
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ${title} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}

function printUsage() {
  console.error(
    "Usage: pnpm run dev:preflight:fast -- <provider-or-path> [-- test args]"
  );
  console.error(
    "       pnpm run dev:preflight:provider -- <provider-or-path> [-- test args]"
  );
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

// 4. Cross-cutting recording-enumeration tests. Not provider-scoped, so
// test:provider skips them — but a recording added under this provider can
// break their whole-corpus allowlist. Run them here so the fast gate cannot
// pass a broken allowlist (ac-05hrc). Filesystem-only, no network/replay.
run("cross-cutting recording tests", "pnpm", [
  "run",
  "test:run",
  ...crossCuttingTests,
  ...passthrough,
]);

console.error(`\n✓ provider preflight green: ${provider}`);
