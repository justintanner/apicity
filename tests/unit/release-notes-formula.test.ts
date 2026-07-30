import fs from "node:fs";
import { describe, expect, it } from "vitest";
import fixture from "../fixtures/release-notes/v0.8.4.json";

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

  it("builds release notes by calling the extracted CLI, not a heredoc", () => {
    const formula = readReleaseFormula();

    // Item 3 only ever runs during a real release, so nothing else in the suite
    // touches it. Pinning the call and the abort contract is what keeps the
    // 317-line `node <<'NODE'` generator from creeping back in unnoticed.
    expect(formula).toContain("node scripts/release-notes.mjs --version");
    expect(formula).toContain(
      "release-notes generation failed — do not publish the release page."
    );

    // The retired generator's own identifiers, not `node <<'NODE'` generally:
    // sub-step 4 still bumps package versions from a legitimate heredoc.
    for (const identifier of [
      "isInfrastructureIssue",
      "classifyIssue",
      "humanize",
    ]) {
      expect(formula, identifier).not.toContain(identifier);
    }
  });

  it("keeps the CI tag fetch pinned to the regression fixture's window", () => {
    // `.github/workflows/ci.yml` fetches exactly these two tags at a bounded
    // depth so the AC-7 live-history test can run on a shallow runner. Repinning
    // the fixture window without repinning the fetch would leave AC-7 skipping
    // locally and failing in CI; this assertion turns that silent two-file
    // lockstep edit into a named failure.
    const ci = fs.readFileSync(".github/workflows/ci.yml", "utf8");

    // Scoped to the fetch ref-specs, not the whole file: `ci.yml` names each
    // tag twice — once here, once in the sibling `git rev-parse --verify`
    // guard — so a bare `refs/tags/vX` substring check stays green when only
    // the fetch is left unrepinned.
    expect(ci).toContain(
      `+refs/tags/${fixture.previousTag}:refs/tags/${fixture.previousTag}`
    );
    expect(ci).toContain(
      `+refs/tags/${fixture.currentTag}:refs/tags/${fixture.currentTag}`
    );
    // The depth is the one value in that step that took an experiment to
    // derive: the window plus `previousTag`'s own commit. Unpinned, a stale
    // depth surfaces as an AC-7 commit-subject mismatch pointing at the
    // fixture instead of at `ci.yml`.
    expect(ci).toContain(`--depth=${fixture.commits.length + 1}`);
    expect(ci).toContain(
      `git merge-base --is-ancestor ${fixture.previousTag} ${fixture.currentTag}`
    );
  });
});
