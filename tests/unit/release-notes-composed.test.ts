import { describe, expect, it, vi } from "vitest";
import { renderNotes } from "../../scripts/lib/release-notes.mjs";
import { readClosedWork } from "../../scripts/release-notes.mjs";
import fixture from "../fixtures/release-notes/v0.8.4.json";

/**
 * Only `execFileSync` is faked, and only so the composed `readClosedWork()`
 * pass can be driven from canned `bd` rows without a live bead store. The fake
 * lives in this file rather than in `release-notes.test.ts` so its scope is the
 * two cases below instead of the whole suite (bead `ac-c27qc1`, SIM-R6). The
 * rest of `node:child_process` stays real — the AC-7 and CLI exit-contract
 * suites in `release-notes.test.ts` drive actual subprocesses through
 * `spawnSync`.
 */
const { execFileSyncMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn<(command: string, args: string[]) => string>(),
}));

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return { ...actual, execFileSync: execFileSyncMock };
});

describe("release-notes composed bead pass", () => {
  /**
   * REQ-006 end to end through the impure half. The predicates are unit-tested
   * individually in `release-notes.test.ts`, but `readClosedWork()` is where
   * they are composed, and composition is what the defect was: the old
   * generator ran a bead query and handed the survivors straight to the
   * renderer. Driving canned `bd` rows through `readClosedWork()` +
   * `renderNotes()` is the assertion that no Gas City title can reach
   * markdown, and it needs no live bead store.
   */
  const closedRows = [
    {
      id: "ac-gcroot",
      title: "Implement owned work",
      issue_type: "task",
      close_reason: "Implemented owned work in the item worktree",
      metadata: { "gc.root_bead_id": "ac-4x14od" },
    },
    {
      id: "ac-gckind",
      title: "Finalize workflow",
      issue_type: "task",
      close_reason: "Workflow finalized",
      metadata: { "gc.kind": "workflow-finalize" },
    },
    {
      id: "ac-gcstep",
      title: "Step spec for Implement owned work",
      issue_type: "task",
      close_reason: "Step spec satisfied",
      metadata: { "gc.step_ref": "do-work.implement" },
    },
    {
      id: "ac-mol1",
      title: "mol: release housekeeping",
      issue_type: "task",
      close_reason: "Molecule complete",
    },
    {
      id: "ac-cancelled",
      title: "Abandoned experiment",
      issue_type: "task",
      close_reason: "closed per user request",
    },
    {
      id: "ac-reltrack",
      title: "Release Apicity 0.8.4",
      issue_type: "task",
      close_reason: "Published Apicity v0.8.4",
    },
    {
      id: "ac-shipped",
      title: "Backfill the v0.8.3 rate table",
      issue_type: "task",
      close_reason: "Shipped in v0.8.3",
    },
    {
      // Deliberately not release-tracking-shaped: only the `--release-bead` id
      // filter can drop this row, so that filter is proven rather than shadowed.
      id: "ac-relbead",
      title: "Coordinate the 0.8.5 release train",
      issue_type: "task",
      close_reason: "Published",
    },
    {
      id: "ac-keep",
      title: "feat(kie): add a second guard decision (ac-keep)",
      issue_type: "task",
      close_reason: "Merged to main",
    },
  ];

  it("REQ-006 — no Gas City bead survives readClosedWork into markdown", () => {
    execFileSyncMock.mockImplementation((command: string) => {
      if (command === "git") return "2026-07-01T00:00:00+00:00\n";
      if (command === "bd") return `${JSON.stringify(closedRows)}\n`;
      throw new Error(`unexpected command: ${command}`);
    });

    const { previousDate, work } = readClosedWork(
      // No previous release bead, so the window opens at the tag date — the
      // `git for-each-ref` leg of the mock.
      null,
      "v0.8.3",
      "2026-07-20T00:00:00+00:00",
      "ac-relbead"
    );

    expect(previousDate).toBe("2026-07-01T00:00:00+00:00");
    // Every other row is dropped by exactly one filter: Gas City metadata,
    // `mol:` title, administrative close reason, release-tracking title, the
    // previous release's own work, and the release bead passed by id.
    expect(work.map((issue) => issue.id)).toEqual(["ac-keep"]);

    const { markdown, newItems, updatedItems } = renderNotes({
      version: "0.8.5",
      commits: [
        { hash: "abc1234", subject: "chore(release): @apicity/* → 0.8.5" },
      ],
      beads: work,
      packages: fixture.packages,
      beadMode: "enrich",
      range: "v0.8.4..v0.8.5",
    });

    expect(newItems).toEqual(["kie: add a second guard decision"]);
    expect(updatedItems).toEqual([]);
    for (const row of closedRows.filter((issue) => issue.metadata)) {
      expect(markdown).not.toContain(row.title);
    }
    expect(markdown).not.toMatch(/ac-/);
  });

  it("treats an unusable bd query as an empty window, not a crash", () => {
    execFileSyncMock.mockImplementation((command: string) => {
      if (command === "git") return "2026-07-01T00:00:00+00:00\n";
      throw new Error("bd: command not found");
    });

    expect(
      readClosedWork(null, "v0.8.3", "2026-07-20T00:00:00+00:00", "").work
    ).toEqual([]);
  });
});
