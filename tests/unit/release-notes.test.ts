import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  isGasCityBead,
  renderNotes,
} from "../../scripts/lib/release-notes.mjs";
import {
  commandMaxBuffer,
  isAdministrativeClosureIssue,
  isInfrastructureIssue,
  isReleaseTrackingIssue,
  shippedInPreviousRelease,
} from "../../scripts/release-notes.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";
import fixture from "../fixtures/release-notes/v0.8.4.json";

/**
 * Regression coverage for the release-notes generator (bead `ac-a17xvp`).
 *
 * The generator used to derive `New`/`Updated` from the beads closed in the
 * release window, which in this rig produced ~400 unpublishable lines
 * ("Implement owned work", "Prepare item worktree", ...). Commits are now the
 * primary source and beads an opt-in enrichment pass that can never contribute
 * a Gas City line. `tests/fixtures/release-notes/v0.8.4.json` pins the window
 * that exposed the defect.
 */

/** Everything between the `# Apicity vX` title and `## Published Packages`. */
function changelogBody(markdown: string): string {
  const packagesAt = markdown.indexOf("## Published Packages");
  expect(packagesAt).toBeGreaterThan(-1);
  const titleEnd = markdown.indexOf("\n\n");
  expect(titleEnd).toBeGreaterThan(-1);
  return markdown.slice(titleEnd + 2, packagesAt).trimEnd();
}

function renderFixture(beadMode: "off" | "enrich") {
  return renderNotes({
    version: fixture.version,
    commits: fixture.commits,
    beads: fixture.beads,
    packages: fixture.packages,
    beadMode,
    range: fixture.range,
  });
}

/**
 * Internal process vocabulary that must never reach a published page (AC-2,
 * REQ-009). `Summary`, `Released Work`, `What's Changed`, and
 * `Release Maintenance` are headings the bead-primary generator used to emit.
 */
const FORBIDDEN_OUTPUT = [
  /ac-/,
  /Implement owned work/,
  /Prepare item worktree/,
  /Finalize workflow/,
  /Step spec/,
  /do-work/,
  /Close owned source anchor/,
  /W[0-9]:/,
  /Slice /,
  /ASK:/,
  /\bP[01]\b/,
  /Summary/,
  /Released Work/,
  /What's Changed/,
  /Release Maintenance/,
];

describe("release-notes rendering (pinned v0.8.4 window)", () => {
  it("AC-1/REQ-010 — reproduces the published 4-line body from the fixture", () => {
    const notes = renderFixture("off");

    expect(changelogBody(notes.markdown)).toBe(fixture.expected.body);
    expect(notes.newItems).toEqual(fixture.expected.new);
    expect(notes.updatedItems).toEqual(fixture.expected.updated);
    // REQ-002: the fixture carries `chore(release): @apicity/* → 0.8.4`, so
    // dropping release commits is exercised rather than assumed.
    expect(fixture.commits).toHaveLength(5);
    expect(notes.newItems.length + notes.updatedItems.length).toBe(4);
  });

  it("AC-2/REQ-009 — emits no process vocabulary on either bead mode", () => {
    for (const beadMode of ["off", "enrich"] as const) {
      const { markdown } = renderFixture(beadMode);
      for (const pattern of FORBIDDEN_OUTPUT) {
        expect(markdown, `${beadMode}: ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("AC-3/REQ-006 — Gas City beads are excluded on the enrichment path", () => {
    const gasCityBeads = fixture.beads.filter((bead) => isGasCityBead(bead));
    const otherBeads = fixture.beads.filter((bead) => !isGasCityBead(bead));

    // One bead per metadata key: gc.root_bead_id, gc.kind, gc.step_ref.
    expect(gasCityBeads.map((bead) => bead.title)).toEqual([
      "Implement owned work",
      "Finalize workflow",
      "Step spec for Implement owned work",
    ]);
    expect(otherBeads.map((bead) => bead.title)).toEqual([
      "W1: add scripts/lib/fast-gate-steps.mjs shared step definition",
    ]);

    const { markdown } = renderFixture("enrich");
    for (const bead of gasCityBeads) {
      expect(markdown).not.toContain(bead.title);
    }
  });

  it("AC-4/REQ-007 — enrichment is reachable and adds the non-gc bead", () => {
    const off = renderFixture("off");
    const enriched = renderFixture("enrich");

    // `humanize()` strips the `W1:` prefix the same way it strips `feat(kie):`,
    // so the work-breakdown bead lands as a plain sentence.
    const addition =
      "add scripts/lib/fast-gate-steps.mjs shared step definition";

    expect(off.updatedItems).not.toContain(addition);
    expect(enriched.updatedItems).toContain(addition);
    expect(enriched.updatedItems).toHaveLength(off.updatedItems.length + 1);
    expect(enriched.newItems).toEqual(off.newItems);
    expect(enriched.markdown).not.toBe(off.markdown);
  });

  it("AC-5/REQ-011 — two renders of the same input are byte-identical", () => {
    // Scoped to the default `--beads=off` path: `--beads=enrich` queries a live
    // bead store whose closure state changes between runs, so byte-identical
    // output is only guaranteed here (plan-review Minor 6).
    expect(renderFixture("off").markdown).toBe(renderFixture("off").markdown);
  });

  it("AC-6/REQ-012 — a release-commit-only range yields no markdown", () => {
    const notes = renderNotes({
      version: fixture.version,
      commits: [fixture.commits[0]],
      packages: fixture.packages,
      range: fixture.range,
    });

    expect(fixture.commits[0].subject).toContain("chore(release):");
    expect(notes.markdown).toBe("");
    expect(notes.diagnostics.length).toBeGreaterThan(0);
    expect(notes.diagnostics[0]).toContain(fixture.range);
  });

  it("REQ-008 — lists every package as `name@version`, sorted by name", () => {
    const sorted = [...fixture.packages].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Guard against a vacuous assertion: the fixture list starts unsorted, so
    // the sort is proven rather than inherited from the input order.
    expect(fixture.packages.map((pkg) => pkg.name)).not.toEqual(
      sorted.map((pkg) => pkg.name)
    );

    const { markdown } = renderFixture("off");
    const section = markdown.slice(markdown.indexOf("## Published Packages"));
    const lines = section.split("\n").filter((line) => line.startsWith("- "));

    expect(lines).toEqual(
      sorted.map((pkg) => `- \`${pkg.name}@${pkg.version}\``)
    );
  });
});

const TAG_GUIDANCE =
  "release tags not fetched — see the tag-fetch step in ci.yml";

function hasTag(tag: string): boolean {
  return (
    spawnSync("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], {
      cwd: repoRoot,
      encoding: "utf8",
    }).status === 0
  );
}

const tagsPresent = hasTag(fixture.previousTag) && hasTag(fixture.currentTag);
const AC7_TITLE = "AC-7 — reproduces the same body from live git history";

describe("release-notes rendering (live git history)", () => {
  // Missing tags are a CI regression (ci.yml fetches them explicitly) but an
  // ordinary shallow clone locally, so CI fails hard and local runs skip with
  // the reason visible in the test name.
  it.skipIf(!tagsPresent && !process.env.CI)(
    tagsPresent ? AC7_TITLE : `${AC7_TITLE} [skipped: ${TAG_GUIDANCE}]`,
    () => {
      if (!tagsPresent) throw new Error(TAG_GUIDANCE);

      const log = spawnSync(
        "git",
        ["log", "--format=%h%x09%s", fixture.range],
        { cwd: repoRoot, encoding: "utf8" }
      );
      expect(log.status, log.stderr).toBe(0);

      const commits = log.stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, ...subject] = line.split("\t");
          return { hash, subject: subject.join("\t") };
        });

      expect(commits.map((commit) => commit.subject)).toEqual(
        fixture.commits.map((commit) => commit.subject)
      );

      const { markdown } = renderNotes({
        version: fixture.version,
        commits,
        packages: fixture.packages,
        range: fixture.range,
      });

      expect(changelogBody(markdown)).toBe(fixture.expected.body);
    }
  );
});

describe("release-notes CLI exit contract", () => {
  // AC-6 at the CLI level. No real tag range in this repository is
  // release-commit-only (v0.8.0..v0.8.1 is 61 commits/2 release, v0.8.1..v0.8.2
  // 15/1, v0.8.2..v0.8.3 41/2, v0.8.3..v0.8.4 5/1), and pointing the CLI at a
  // missing tag proves "missing tag aborts", not REQ-012. A throwaway
  // repository is the only construct that reaches a genuinely
  // release-commit-only range.
  let tempRepo = "";

  const gitEnv = {
    ...process.env,
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00+0000",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00+0000",
  };

  // Identity and signing come from flags, not global git config, so the test
  // is deterministic on any machine.
  const gitConfig = [
    "-c",
    "init.defaultBranch=main",
    "-c",
    "user.email=release-notes@apicity.invalid",
    "-c",
    "user.name=Release Notes Test",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "tag.gpgsign=false",
  ];

  function git(args: string[]): void {
    const result = spawnSync("git", [...gitConfig, ...args], {
      cwd: tempRepo,
      env: gitEnv,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }
  }

  function commit(text: string, message: string): void {
    fs.writeFileSync(path.join(tempRepo, "README.md"), `${text}\n`);
    git(["add", "README.md"]);
    git(["commit", "-m", message]);
  }

  beforeAll(() => {
    tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), "apicity-release-notes-"));
    git(["init", "--quiet"]);
    commit("seed", "chore: seed the throwaway repository");
    git(["tag", "-a", "v9.9.8", "-m", "v9.9.8"]);
    commit("release", "chore(release): @apicity/* → 9.9.9");
    git(["tag", "-a", "v9.9.9", "-m", "v9.9.9"]);
  });

  afterAll(() => {
    if (tempRepo) fs.rmSync(tempRepo, { recursive: true, force: true });
  });

  it("AC-6/REQ-012 — exits 1 with a diagnostic and no stdout", () => {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, "scripts", "release-notes.mjs"),
        "--version",
        "9.9.9",
      ],
      { cwd: tempRepo, env: gitEnv, encoding: "utf8" }
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("no publishable commits in v9.9.8..v9.9.9");
  });
});

describe("release-notes bead predicates", () => {
  // Re-homed from tests/unit/release-notes-formula.test.ts, which asserted
  // these only indirectly through rendered output and whose heredoc half the
  // next bead retires. `expect(notes).toContain("Shipped endpoint")` is
  // deliberately not re-homed: it pins a bead-derived title reaching the
  // output, which is exactly what REQ-001 inverts.

  it("pins every release-notes subprocess to the 64 MiB buffer", () => {
    // `run()` and `runChecked()` are module-private, so the pin is asserted
    // through the exported `commandMaxBuffer` seam plus the source-level
    // pairing that every `execFileSync` call uses it. A third call site added
    // without the pin, or a changed constant, fails here.
    expect(commandMaxBuffer).toBe(64 * 1024 * 1024);

    const source = fs.readFileSync(
      path.join(repoRoot, "scripts", "release-notes.mjs"),
      "utf8"
    );
    const callSites = source.match(/execFileSync\(/g) ?? [];
    const pinned = source.match(/maxBuffer: commandMaxBuffer/g) ?? [];

    expect(callSites.length).toBeGreaterThan(0);
    expect(pinned).toHaveLength(callSites.length);
  });

  it("isAdministrativeClosureIssue excludes a cancelled bead", () => {
    expect(
      isAdministrativeClosureIssue({
        id: "ac-cancel",
        title: "Canceled unstarted bead",
        close_reason: "closed per user request",
      })
    ).toBe(true);
    expect(
      isAdministrativeClosureIssue({
        id: "ac-ship",
        title: "Shipped endpoint",
        close_reason: "Merged to main at abc123",
      })
    ).toBe(false);
  });

  it("isInfrastructureIssue excludes order beads and Gas City beads", () => {
    expect(
      isInfrastructureIssue({
        id: "ac-order",
        title: "Order cleanup",
        issue_type: "order",
      })
    ).toBe(true);
    expect(
      isInfrastructureIssue({
        id: "ac-step",
        title: "Implement owned work",
        issue_type: "task",
        metadata: { "gc.root_bead_id": "ac-4x14od" },
      })
    ).toBe(true);
    expect(
      isInfrastructureIssue({
        id: "ac-ship",
        title: "Shipped endpoint",
        issue_type: "feature",
      })
    ).toBe(false);
  });

  it("shippedInPreviousRelease excludes work already released", () => {
    const issue = {
      id: "ac-prev",
      title: "Already shipped in previous release",
      description: "This shipped in v0.4.1 already.",
      close_reason: "Merged to main at def456",
    };

    expect(shippedInPreviousRelease(issue, "v0.4.1")).toBe(true);
    expect(shippedInPreviousRelease(issue, "v0.4.0")).toBe(false);
    expect(shippedInPreviousRelease(issue, "")).toBe(false);
  });

  it("isReleaseTrackingIssue recognizes the release bead", () => {
    expect(
      isReleaseTrackingIssue({
        id: "ac-release",
        title: "Release Apicity 0.4.1",
        close_reason: "Published Apicity v0.4.1",
      })
    ).toBe(true);
    expect(
      isReleaseTrackingIssue({
        id: "ac-ship",
        title: "Shipped endpoint",
        close_reason: "Merged to main at abc123",
      })
    ).toBe(false);
  });
});
