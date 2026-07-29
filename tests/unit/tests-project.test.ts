import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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

    it("prints the tests-project step in its checklist", () => {
      const stepList = [
        ...source.matchAll(
          /console\.error\(\s*(["'`])( {2}\d+\. [^"'`\n]*)\1\s*\)/g
        ),
      ].map((match) =>
        match[2].replace(
          "${TESTS_TYPECHECK_STEP.title}",
          TESTS_TYPECHECK_STEP.title
        )
      );

      expect(stepList).toHaveLength(5);
      expect(
        stepList.filter((entry) => entry.includes("typecheck:tests"))
      ).toHaveLength(1);
    });

    it("runs the step unconditionally, with a repro line on failure", () => {
      expect(source).toContain("TESTS_TYPECHECK_STEP.command");
      expect(source).toContain("repro: TESTS_TYPECHECK_STEP.repro");
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
