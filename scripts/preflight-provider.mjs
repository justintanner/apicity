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
 * The checklist itself lives in scripts/lib/fast-gate-steps.mjs — the single
 * definition this script prints from and the documentation guard reads. It is
 * deliberately not restated here: a copy in this docstring is exactly the kind
 * of second list that goes stale.
 *
 * Steps are named by their `FAST_GATE_STEPS` id, never by position: the banner
 * numbers itself from the list, so an ordinal written down here goes stale the
 * moment a step is inserted anywhere but the end.
 *
 * Step `typecheck-tests` is the one step here that is NOT scoped:
 * `tests/tsconfig.json` is a single whole-tree project, so the step runs
 * unconditionally and a type error in any file it compiles fails this gate
 * whichever provider it was invoked for. Why that step exists and what it
 * costs: scripts/lib/tests-project.mjs.
 *
 * Step `cross-cutting` runs the repo-wide guards in
 * scripts/lib/cross-cutting-tests.mjs that provider scopes do not select
 * consistently: recording-corpus allowlists, endpoint-surface inventory, and
 * cross-provider source pins. Without this step, provider-scoped work can leave
 * a whole-repo invariant stale until full CI — the gap behind ac-05hrc,
 * ac-t2gfln, and the `92323c18` hand repair. They are filesystem- and
 * source-parse-only (no Polly, no network) and cost about 5.7s on the reference
 * machine.
 *
 * For typecheck-only loops, use `pnpm run typecheck:provider -- <provider>`.
 *
 * Usage: node scripts/preflight-provider.mjs <provider-or-path>
 *        pnpm run dev:preflight:fast -- openai
 *        pnpm run dev:preflight:provider -- packages/provider/openai/src
 */

import { spawnSync } from "node:child_process";
import { listCrossCuttingTests } from "./lib/cross-cutting-tests.mjs";
import { FAST_GATE_STEPS } from "./lib/fast-gate-steps.mjs";
import { repoRoot, resolveProviderScope } from "./lib/provider-scope.mjs";
import { TESTS_TYPECHECK_STEP } from "./lib/tests-project.mjs";

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

const crossCuttingTests = listCrossCuttingTests({
  alreadySelected: passthrough.length === 0 ? tests : [],
});

console.error(`Fast provider preflight: ${provider}`);
console.error("Steps:");
FAST_GATE_STEPS.forEach((step, index) => {
  console.error(`  ${index + 1}. ${step.title}`);
});

function run(title, cmd, args, { repro } = {}) {
  console.error(`\n▸ ${title}`);
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ${title} failed (exit ${result.status ?? 1})`);
    if (repro) {
      console.error(`  reproduce: ${repro}`);
    }
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

// Step `format`: the provider package + its tests only.
run("prettier --write (scoped)", "pnpm", [
  "exec",
  "prettier",
  "--write",
  ...targets,
]);

// Step `lint`: the same scope, plus provider-relevant repository checks.
run(`lint:provider ${provider}`, "pnpm", [
  "run",
  "lint:provider",
  "--",
  provider,
]);

// Step `typecheck-tests`: the whole tests project. Unconditional and
// provider-independent:
// tests/tsconfig.json is a single whole-tree project, so per-provider or
// per-diff scoping would reopen the gap for shared helpers under tests/
// (ac-6g2rnr). No passthrough — those are Vitest args, not tsc args.
run(
  TESTS_TYPECHECK_STEP.title,
  TESTS_TYPECHECK_STEP.command,
  [...TESTS_TYPECHECK_STEP.args],
  { repro: TESTS_TYPECHECK_STEP.repro }
);

// Step `test-provider`: typecheck the provider package, then replay its tests.
run(`test:provider ${provider}`, "pnpm", [
  "run",
  "test:provider",
  provider,
  ...passthrough,
]);

// Step `cross-cutting`: repo-wide guards that provider scopes do not select
// consistently. De-duplicate files already replayed by the provider unless
// passthrough filters make that unsafe. Provider filters are deliberately not
// forwarded: the guard run must execute every selected test. These tests are
// filesystem/source-parse only; no network or replay.
run("cross-cutting repo-wide guard tests", "pnpm", [
  "run",
  "test:run",
  ...crossCuttingTests,
]);

console.error(`\n✓ provider preflight green: ${provider}`);
