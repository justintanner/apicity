import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAST_GATE_STEPS } from "../../scripts/lib/fast-gate-steps.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";
import {
  TESTS_PROJECT_EXCLUDES,
  TESTS_TSCONFIG,
  TESTS_TYPECHECK_STEP,
  isTestsProjectFile,
} from "../../scripts/lib/tests-project.mjs";

// Regression coverage for ac-6g2rnr: `tests/tsconfig.json` is the only project
// that compiles `tests/**`, and neither provider-scoped gate used to run it, so
// a test file with a type error passed `dev:preflight:fast` and
// `typecheck:provider` and only went red in full CI. These assertions fail if
// either wiring is reverted.
//
// Like tests/unit/cross-cutting-tests.test.ts, this is filesystem- and
// exported-data-only: no gate is invoked, nothing is spawned, no network.

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

// tests/tsconfig.json is JSONC — it carries a `//` comment above `exclude`.
// Only whole-line comments are stripped: that is the shape the file uses, and
// it cannot corrupt a string value that happens to contain `//`.
function stripWholeLineComments(source: string): string {
  return source
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}

// Block comments only, so the "no bare quoted typecheck argument" scan below
// reads code rather than prose. W2 rewrote the preflight docstring in the same
// change that added the step, and that docstring quotes the word `typecheck`;
// matching the raw file would let the prose trip an assertion about call sites.
// Whole-line `//` comments are dropped too — the script has no regex literal
// whose source contains `//`, so no code is lost.
function stripComments(source: string): string {
  return stripWholeLineComments(source.replace(/\/\*[\s\S]*?\*\//g, ""));
}

describe("tests-project helper", () => {
  describe("exclude-list drift", () => {
    it("mirrors the exclude array in tests/tsconfig.json", () => {
      const tsconfig = JSON.parse(
        stripWholeLineComments(readRepoFile(TESTS_TSCONFIG))
      );

      // The helper duplicates this list so both gates can classify a path
      // without reading (or parsing) the tsconfig. This is the assertion that
      // keeps the copy honest.
      expect(tsconfig.exclude).toEqual(TESTS_PROJECT_EXCLUDES);
    });

    it("pins the include globs isTestsProjectFile encodes", () => {
      const tsconfig = JSON.parse(
        stripWholeLineComments(readRepoFile(TESTS_TSCONFIG))
      );

      expect(tsconfig.include).toEqual(["**/*.ts", "**/*.tsx"]);
    });

    it("points at a tsconfig that exists", () => {
      expect(TESTS_TSCONFIG).toBe("tests/tsconfig.json");
      expect(fs.existsSync(path.join(repoRoot, TESTS_TSCONFIG))).toBe(true);
    });
  });

  describe("isTestsProjectFile", () => {
    const cases: Array<[string, boolean, string]> = [
      // Included: `.ts`/`.tsx` under tests/, outside every exclude entry.
      ["tests/integration/xai-video.test.ts", true, "scoped integration test"],
      ["tests/unit/tests-project.test.ts", true, "unit test"],
      ["tests/functional/middleware.test.ts", true, "functional test"],
      ["tests/harness.ts", true, "shared test helper, not a *.test.ts"],
      ["tests/fixtures/example.tsx", true, ".tsx is in the include globs"],
      [
        "tests/fixtures/harness-generated-extra/thing.ts",
        true,
        "sibling of an excluded dir, not inside it",
      ],
      [
        "tests/recordings.ts",
        true,
        "exclude entry names a directory, not a filename stem",
      ],
      // Excluded by tests/tsconfig.json — REQ-003's "must not trigger" clause.
      ["tests/recordings/xai/video.ts", false, "inside excluded recordings/"],
      [
        "tests/fixtures/harness-generated/report.ts",
        false,
        "inside excluded fixtures/harness-generated/",
      ],
      [
        "tests/fixtures/zod-compat-consumer.ts",
        false,
        "excluded file, compiled by its own tsc invocation",
      ],
      // Outside the project's include globs entirely.
      ["tests/tsconfig.json", false, "not a .ts/.tsx source file"],
      ["tests/recordings/xai-video.har", false, "recording, not source"],
      [
        "packages/provider/xai/src/xai.ts",
        false,
        "provider source is covered by its own package tsconfig",
      ],
      ["scripts/lib/tests-project.mjs", false, "repo script, not tests/"],
      ["testsuite/helper.ts", false, "tests/ prefix must end at the slash"],
    ];

    for (const [file, expected, why] of cases) {
      it(`${expected ? "claims" : "ignores"} ${file} (${why})`, () => {
        expect(isTestsProjectFile(file)).toBe(expected);
      });
    }

    it("normalizes backslash diff paths", () => {
      expect(isTestsProjectFile("tests\\integration\\xai-video.test.ts")).toBe(
        true
      );
      expect(isTestsProjectFile("tests\\recordings\\xai\\video.ts")).toBe(
        false
      );
    });

    it("rejects non-string input", () => {
      expect(isTestsProjectFile(undefined)).toBe(false);
      expect(isTestsProjectFile(null)).toBe(false);
    });
  });

  describe("TESTS_TYPECHECK_STEP", () => {
    it("invokes the tests project through the package script", () => {
      expect(TESTS_TYPECHECK_STEP.command).toBe("pnpm");
      expect([...TESTS_TYPECHECK_STEP.args]).toEqual([
        "run",
        "typecheck:tests",
      ]);
      expect(TESTS_TYPECHECK_STEP.repro).toBe("pnpm run typecheck:tests");
      expect(TESTS_TYPECHECK_STEP.title).toContain("typecheck:tests");
    });

    it("resolves to the tests tsconfig, not the full monorepo typecheck", () => {
      // Going through `pnpm run typecheck:tests` keeps package.json the single
      // definition of the command; this pins the indirection so it cannot
      // silently become `pnpm run typecheck` (~105s) or a different project.
      const pkg = JSON.parse(readRepoFile("package.json"));

      expect(pkg.scripts["typecheck:tests"]).toBe(
        `tsc --noEmit -p ${TESTS_TSCONFIG}`
      );
    });
  });

  describe("dev:preflight:fast wiring (scripts/preflight-provider.mjs)", () => {
    const relativePath = "scripts/preflight-provider.mjs";
    const source = readRepoFile(relativePath);

    it("imports the shared tests-project step", () => {
      expect(source).toContain("./lib/tests-project.mjs");
      expect(source).toContain("TESTS_TYPECHECK_STEP");
    });

    // Replaces the former `prints the tests-project step in its checklist`,
    // which scraped the five literal `console.error("  N. ...")` calls out of
    // the source. Those literals are gone: the script now prints from
    // FAST_GATE_STEPS (REQ-001), so that regex matches nothing and its
    // `toHaveLength(5)` could only fail. The same three properties it proved —
    // the step is in the checklist, the checklist has five entries, and the
    // printed list is the one the gate runs — are asserted below against the
    // shared export instead of against a rendering of it, which is the
    // precedent both meta-tests in this file already state.
    it("carries the tests-project step exactly once in the shared list", () => {
      expect(
        FAST_GATE_STEPS.filter(
          (step) => step.title === TESTS_TYPECHECK_STEP.title
        )
      ).toHaveLength(1);
    });

    it("prints its checklist from the shared step list", () => {
      expect(source).toContain("./lib/fast-gate-steps.mjs");
      expect(source).toContain("FAST_GATE_STEPS");
    });

    it("keeps no literal numbered step line of its own", () => {
      // AC-1's no-duplicate clause. A reintroduced `console.error("  6. ...")`
      // would be a second list that FAST_GATE_STEPS cannot keep honest.
      expect(source).not.toMatch(/console\.error\(\s*(["'`])\s{2}\d+\. /);
    });

    it("runs one step per printed entry", () => {
      // Print and run are separate by design — each `run(...)` needs runtime
      // context (targets, provider, passthrough, crossCuttingTests) and its own
      // repro, and keeping them unindented statements is what the guard-check
      // below relies on. This count is what pins the two halves together, so a
      // step added to the list without a call site is red.
      //
      // `function run(` does not match: the line starts with `function`.
      const invocations = source.match(/^run\(/gm) ?? [];

      expect(invocations).toHaveLength(FAST_GATE_STEPS.length);
    });

    it("runs the steps in the order the banner prints them", () => {
      // The count above pins how many call sites exist, not which is which.
      // Reorder two FAST_GATE_STEPS entries, or swap two `run(...)`
      // statements, and the count is unchanged, every title still resolves,
      // and the docs guard does not assert order by design — so the banner
      // would misdescribe the order the gate actually runs. That is the same
      // "documentation that lies about the gate" defect this change exists to
      // close, displaced from prose into the banner.
      //
      // The label a call site passes is deliberately not the step's `title`
      // (it carries runtime context: the provider name, the scope), so the
      // binding cannot be derived — it is written out here, in order, and the
      // first assertion is what keeps this table honest against the list.
      const callSiteLabels: ReadonlyArray<readonly [string, string]> = [
        ["format", "prettier --write"],
        ["lint", "lint:provider"],
        ["typecheck-tests", "TESTS_TYPECHECK_STEP.title"],
        ["test-provider", "test:provider"],
        ["cross-cutting", "cross-cutting recording tests"],
      ];

      expect(callSiteLabels.map(([id]) => id)).toEqual(
        FAST_GATE_STEPS.map((step) => step.id)
      );

      // First argument of each top-level `run(` call, in source order. `[^,]+`
      // crosses the newline of the one call whose label sits on its own line
      // but cannot cross into the second argument.
      const labels = [...source.matchAll(/^run\(\s*([^,]+),/gm)].map((match) =>
        match[1].trim()
      );

      expect(labels).toHaveLength(callSiteLabels.length);
      for (const [index, [id, expected]] of callSiteLabels.entries()) {
        expect(
          labels[index],
          `call site ${index + 1} should be '${id}'`
        ).toContain(expected);
      }
    });

    it("runs the step as an unguarded statement, with a repro line", () => {
      // REQ-002: this step "must not be skipped". Asserting only that the
      // source mentions TESTS_TYPECHECK_STEP.command does not enforce that —
      // wrapping the call in `if (process.env.SKIP_TESTS_TYPECHECK !== "1")`
      // leaves such an assertion green. So pin the call's *position*: every
      // step in this gate is a bare `run(...)` statement at column 0, and
      // Prettier indents anything nested inside a guard block, so an
      // unindented `run(` is the check that a guard cannot survive.
      //
      // `[^;]*` cannot cross a statement boundary, so the arguments matched
      // here belong to this one call. Comments are stripped first, so a
      // commented-out example cannot satisfy the assertion.
      const invocation = stripComments(source).match(
        /^run\([^;]*TESTS_TYPECHECK_STEP\.command[^;]*\);$/m
      );

      expect(invocation).not.toBeNull();
      expect(invocation?.[0]).toContain("repro: TESTS_TYPECHECK_STEP.repro");
    });

    it("never invokes the full monorepo typecheck", () => {
      // AC-3: `pnpm run typecheck` appears nowhere in the fast gate. Every
      // command here is spawned as an argument array, so a bare quoted
      // `typecheck` token would be the full ~105s run; `"typecheck:tests"`
      // and `"lint:provider"` do not match this pattern.
      expect(stripComments(source)).not.toMatch(/["'`]typecheck["'`]/);
    });
  });

  describe("typecheck:provider wiring (scripts/typecheck-provider.mjs)", () => {
    const relativePath = "scripts/typecheck-provider.mjs";
    const source = readRepoFile(relativePath);

    it("imports the shared classifier and step", () => {
      expect(source).toContain("./lib/tests-project.mjs");
      expect(source).toContain("isTestsProjectFile");
      expect(source).toContain("TESTS_TYPECHECK_STEP");
    });

    it("selects the tests project from the diff", () => {
      // The defect this closes: a changed test file was classified
      // "provider-scoped" and then checked against a tsconfig that excludes
      // it. The fix filters the diff through isTestsProjectFile.
      expect(source).toMatch(/diff\.files\.filter\(isTestsProjectFile\)/);
      expect(source).toContain("TESTS_TYPECHECK_STEP.command");
    });
  });
});
