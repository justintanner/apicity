/**
 * `tests/tsconfig.json` is a whole-tree project: it compiles every `.ts`/`.tsx`
 * file under `tests/` against the `@apicity/<pkg>` →
 * `packages/provider/<pkg>/src` path mapping. No provider package tsconfig
 * covers those files, so the provider-scoped gates can report green while a
 * test file does not compile:
 *
 *   - `typecheck:provider <name>` classifies
 *     `tests/integration/<name>*.test.ts` as a provider-scoped diff and then
 *     checks only `packages/provider/<name>/tsconfig.json`, which excludes it
 *   - `dev:preflight:fast` composes that same provider typecheck with a scoped
 *     lint and a scoped replay, so it inherits the hole
 *
 * A test file with a type error therefore passes both fast gates and only goes
 * red in full CI, where `pnpm run typecheck` runs the tests project.
 *
 * This module is the single source of truth for what the tests project covers
 * and how it is invoked, so the two consumers agree by construction instead of
 * each carrying its own copy of the `tests/tsconfig.json` exclude list — the
 * same reason `scripts/lib/cross-cutting-tests.mjs` exists (ac-05hrc). Keeping
 * the knowledge here also lets the regression test assert on exported data
 * rather than shelling out to a full gate run, so it stays filesystem-only.
 *
 * Dependency-free by design: importing it must not pull in `provider-scope.mjs`
 * or touch the filesystem.
 */

export const TESTS_TSCONFIG = "tests/tsconfig.json";

// Mirrors the "exclude" array in tests/tsconfig.json. Kept in sync by
// tests/unit/tests-project.test.ts, which parses that file and compares.
export const TESTS_PROJECT_EXCLUDES = [
  "recordings",
  "fixtures/harness-generated",
  "fixtures/zod-compat-consumer.ts",
];

// The one way both gates invoke the tests project. Going through the package
// script rather than re-spelling `tsc --noEmit -p tests/tsconfig.json` keeps
// package.json the single definition of the command, and `repro` is printed on
// failure so the output always names a command the reader can paste verbatim.
export const TESTS_TYPECHECK_STEP = Object.freeze({
  title: "typecheck:tests (whole tests/ project)",
  command: "pnpm",
  args: Object.freeze(["run", "typecheck:tests"]),
  repro: "pnpm run typecheck:tests",
});

const TESTS_DIR_PREFIX = "tests/";

/**
 * True when `tests/tsconfig.json` compiles `file` (repo-relative, POSIX
 * slashes). Backslashes are normalized on input the same way
 * `typecheck-provider.mjs`'s `gitDiffNames` already does, so a Windows-style
 * diff path classifies identically.
 *
 * Deliberately narrow: the tests project's `paths` mapping pulls the provider
 * sources under `packages/provider/<pkg>/src` into the program too, but
 * treating those as tests-project files would fire on the most common diff
 * shape in the repo and defeat the fast path entirely. Provider sources are
 * already covered by their own package tsconfig, so only `tests/` is claimed
 * here.
 */
export function isTestsProjectFile(file) {
  if (typeof file !== "string") {
    return false;
  }

  const normalized = file.trim().replace(/\\/g, "/");

  // `include: ["**/*.ts", "**/*.tsx"]`, rooted at tests/.
  if (!normalized.startsWith(TESTS_DIR_PREFIX) || !/\.tsx?$/.test(normalized)) {
    return false;
  }

  const withinTests = normalized.slice(TESTS_DIR_PREFIX.length);

  // Exclude entries are resolved relative to tests/, and exclude the directory
  // itself as well as everything under it.
  return !TESTS_PROJECT_EXCLUDES.some(
    (exclude) =>
      withinTests === exclude || withinTests.startsWith(`${exclude}/`)
  );
}
