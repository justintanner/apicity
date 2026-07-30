import fs from "node:fs";
import { describe, expect, it } from "vitest";

function readReleaseFormula(): string {
  return fs.readFileSync(
    ".beads/formulas/mol-apicity-release.formula.toml",
    "utf8"
  );
}

function readStepIds(): string[] {
  return readReleaseFormula()
    .split(/\n\[\[steps\]\]\n/)
    .slice(1)
    .map((block) => block.match(/^id = "([^"]+)"/m)?.[1])
    .filter((id): id is string => id !== undefined);
}

describe("mol-apicity-release workflow", () => {
  it("keeps the release graph consolidated into one executable step", () => {
    const formula = readReleaseFormula();

    expect(readStepIds()).toEqual(["release"]);
    expect(formula).toContain(
      'metadata."gc.step_ref" == "mol-apicity-release.release"'
    );
    expect(formula).not.toContain("mol-apicity-release.prepare");
    expect(formula).not.toMatch(/^\s*(needs|condition)\s*=/m);
  });
});
