import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FAST_GATE_DOC_SURFACES,
  FAST_GATE_STEPS,
  checkFastGateDocs,
} from "../../scripts/lib/fast-gate-steps.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// The fast-gate step list lived in four places — the script that runs it and
// three prose surfaces — so a step could be added, removed, or reordered in one
// and left stale in the others. That is exactly what happened: at `aa9f6805`
// both README.md and AGENTS.md described four steps while the gate ran five.
// `scripts/lib/fast-gate-steps.mjs` is now the single definition, and this
// guard fails when a documented surface stops matching it in either direction.
//
// Like tests/unit/cross-cutting-tests.test.ts and
// tests/unit/tests-project.test.ts, this is filesystem- and exported-data-only:
// nothing is spawned, no network, no Polly replay.

function readSurface(surface: string): string {
  return fs.readFileSync(path.join(repoRoot, surface), "utf8");
}

describe("fast-gate step definition", () => {
  it("declares required prose for every step on every guarded surface", () => {
    for (const step of FAST_GATE_STEPS) {
      for (const surface of FAST_GATE_DOC_SURFACES) {
        const expected = step.prose[surface];
        expect(typeof expected, `${step.id} / ${surface}`).toBe("string");
        expect(expected.length, `${step.id} / ${surface}`).toBeGreaterThan(0);
      }
    }
  });

  it("uses unique marker-safe step ids", () => {
    const ids = FAST_GATE_STEPS.map((step) => step.id);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// One block per surface, so two drifted files produce two failures rather than
// stopping at the first (REQ-003).
describe.each([...FAST_GATE_DOC_SURFACES])("%s", (surface) => {
  it("documents exactly the steps the fast gate runs", () => {
    const problems = checkFastGateDocs(surface, readSurface(surface));
    // The problem list is the assertion message: the Vitest output alone names
    // the file, the step, and the direction of the drift (REQ-007).
    expect(problems, problems.join("\n")).toEqual([]);
  });
});

// These cases are what turn the acceptance criteria from manual procedures into
// assertions. They perturb the *step list* or a *copy of the text*, never the
// files on disk, and run against the real documentation.
describe("fast-gate documentation guard", () => {
  const surface = "CLAUDE.md";

  it("fails when the gate gains a step the docs do not mention", () => {
    const problems = checkFastGateDocs(surface, readSurface(surface), [
      ...FAST_GATE_STEPS,
      {
        id: "sixth-step",
        title: "a sixth step nobody documented",
        prose: { [surface]: "a sixth step nobody documented" },
      },
    ]);
    expect(problems).toContain(
      `${surface}: step 'sixth-step' is run by the fast gate but not documented here`
    );
  });

  it("fails when the docs describe a step the gate no longer runs", () => {
    const withoutCrossCutting = FAST_GATE_STEPS.filter(
      (step) => step.id !== "cross-cutting"
    );
    const problems = checkFastGateDocs(
      surface,
      readSurface(surface),
      withoutCrossCutting
    );
    expect(problems).toContain(
      `${surface}: step 'cross-cutting' is documented here but the fast gate no longer runs it`
    );
  });

  it("fails on a missing anchor rather than checking nothing", () => {
    const withoutRegion = readSurface(surface)
      .replace("<!-- fast-gate-steps:start -->", "")
      .replace("<!-- fast-gate-steps:end -->", "");
    const problems = checkFastGateDocs(surface, withoutRegion);
    expect(problems).toContain(
      `${surface}: expected exactly one <!-- fast-gate-steps:start --> marker, found 0`
    );
    expect(problems).toContain(
      `${surface}: expected exactly one <!-- fast-gate-steps:end --> marker, found 0`
    );
  });

  it("is region-scoped, not whole-file", () => {
    // `whole tests-project typecheck` appears three times in CLAUDE.md: once
    // inside the guarded region and twice in surrounding prose. Remove only the
    // occurrence inside the region and the guard must still fail — a whole-file
    // substring search would stay green, which is the false pass REQ-004 exists
    // to prevent (AC-6).
    const text = readSurface(surface);
    const inRegion =
      "the whole tests-project typecheck (`tsc --noEmit -p tests/tsconfig.json`)<!-- fast-gate-step:typecheck-tests -->";
    expect(text).toContain(inRegion);

    const gutted = text.replace(
      inRegion,
      "the tests project's own compile<!-- fast-gate-step:typecheck-tests -->"
    );
    const stillElsewhere =
      gutted.split("whole tests-project typecheck").length - 1;
    expect(stillElsewhere).toBeGreaterThan(0);

    const problems = checkFastGateDocs(surface, gutted);
    expect(problems).toContain(
      `${surface}: step 'typecheck-tests' is marked here but its text is missing the expected "whole tests-project typecheck"`
    );
  });
});
