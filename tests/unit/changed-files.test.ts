import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectChangedTargets,
  filterEslintTargets,
  formatTargetList,
  formatUsage,
  parseChangedArgs,
} from "../../scripts/lib/changed-files.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

describe("parseChangedArgs", () => {
  const originalBaseRef = process.env.APICITY_BASE_REF;

  afterEach(() => {
    if (originalBaseRef === undefined) {
      delete process.env.APICITY_BASE_REF;
    } else {
      process.env.APICITY_BASE_REF = originalBaseRef;
    }
  });

  it("strips separator args and defaults to origin/main", () => {
    expect(
      parseChangedArgs(["--", "scripts/lib/changed-files.mjs", "--"])
    ).toEqual({
      base: "origin/main",
      help: false,
      paths: ["scripts/lib/changed-files.mjs"],
    });
  });

  it("parses base forms, paths, and help flags", () => {
    process.env.APICITY_BASE_REF = "origin/stable";

    expect(
      parseChangedArgs([
        "--base",
        "origin/main",
        "scripts",
        "--base=HEAD~1",
        "--help",
      ])
    ).toEqual({
      base: "HEAD~1",
      help: true,
      paths: ["scripts"],
    });
  });

  it("requires a value after --base", () => {
    expect(() => parseChangedArgs(["--base"])).toThrow(
      "--base requires a git ref"
    );
  });
});

describe("collectChangedTargets", () => {
  it("normalizes explicit file targets and sorts duplicates", () => {
    const absolute = path.join(repoRoot, "scripts/lib/changed-files.mjs");

    expect(
      collectChangedTargets({
        base: "origin/main",
        paths: ["tests/unit/provider-scope.test.ts", absolute, absolute],
      })
    ).toEqual([
      "scripts/lib/changed-files.mjs",
      "tests/unit/provider-scope.test.ts",
    ]);
  });

  it("expands explicit directory targets through git", () => {
    const targets = collectChangedTargets({
      base: "origin/main",
      paths: ["scripts/lib"],
    });

    expect(targets).toContain("scripts/lib/changed-files.mjs");
    expect(targets).toContain("scripts/lib/provider-scope.mjs");
    expect(targets.every((target) => target.startsWith("scripts/lib/"))).toBe(
      true
    );
  });

  it("rejects explicit targets outside the repository", () => {
    const outsidePath = path.resolve(repoRoot, "..", "outside-apicity.txt");

    expect(() =>
      collectChangedTargets({ base: "origin/main", paths: [outsidePath] })
    ).toThrow(`Path is outside this repository: ${outsidePath}`);
  });
});

describe("filterEslintTargets", () => {
  it("keeps JavaScript and TypeScript targets only", () => {
    expect(
      filterEslintTargets([
        "scripts/lib/changed-files.mjs",
        "scripts/dev.cjs",
        "packages/provider/openai/src/openai.ts",
        "tests/unit/changed-files.test.ts",
        "tests/unit/view.jsx",
        "tests/unit/view.tsx",
        "README.md",
        "package.json",
      ])
    ).toEqual([
      "scripts/lib/changed-files.mjs",
      "scripts/dev.cjs",
      "packages/provider/openai/src/openai.ts",
      "tests/unit/changed-files.test.ts",
      "tests/unit/view.jsx",
      "tests/unit/view.tsx",
    ]);
  });
});

describe("changed-file target formatting", () => {
  it("formats empty and non-empty target lists", () => {
    expect(formatTargetList([])).toBe("  (none)");
    expect(formatTargetList(["a.ts", "b.mjs"])).toBe("  a.ts\n  b.mjs");
  });

  it("formats command-specific usage", () => {
    expect(formatUsage("pnpm run format:changed --")).toContain(
      "Usage: pnpm run format:changed -- [--base <ref>] [path ...]"
    );
  });
});
