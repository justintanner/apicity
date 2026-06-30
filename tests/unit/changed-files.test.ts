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

  it("uses APICITY_BASE_REF as the default base", () => {
    process.env.APICITY_BASE_REF = "origin/stable";

    expect(
      parseChangedArgs(["-h", "tests/unit/changed-files.test.ts"])
    ).toEqual({
      base: "origin/stable",
      help: true,
      paths: ["tests/unit/changed-files.test.ts"],
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
    expect(() => parseChangedArgs(["--base="])).toThrow(
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
        "tests/unit/changed-files.test.mts",
        "tests/unit/changed-files.test.cts",
        "tests/unit/view.jsx",
        "tests/unit/view.tsx",
        "README.md",
        "package.json",
        "dist/output.js.map",
      ])
    ).toEqual([
      "scripts/lib/changed-files.mjs",
      "scripts/dev.cjs",
      "packages/provider/openai/src/openai.ts",
      "tests/unit/changed-files.test.ts",
      "tests/unit/changed-files.test.mts",
      "tests/unit/changed-files.test.cts",
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

  it("preserves target order while formatting", () => {
    expect(formatTargetList(["z.ts", "a.ts"])).toBe("  z.ts\n  a.ts");
  });

  it("formats command-specific usage", () => {
    const usage = formatUsage("pnpm run format:changed --");

    expect(usage).toContain(
      "Usage: pnpm run format:changed -- [--base <ref>] [path ...]"
    );
    expect(usage).toContain(
      "The default base is APICITY_BASE_REF or origin/main."
    );
  });
});
