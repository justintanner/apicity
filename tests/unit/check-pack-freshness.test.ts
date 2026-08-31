import { describe, expect, it } from "vitest";

import {
  PACK_CONTENT_PATHS,
  PACK_FRESHNESS_VERDICT,
  PACK_IMPORT_NAME,
  REFRESH_COMMAND,
  REGISTER_COMMAND,
  classifyPackFreshness,
  installedComparisonPath,
  renderPackFreshnessMessage,
  selectImport,
} from "../../scripts/lib/check-pack-freshness.mjs";

// The real defect, measured on the live city at 2026-08-31T02:54Z before the
// pack was refreshed. Using the observed values rather than invented ones is
// what makes this file a regression test for `ac-1yyttm` instead of a
// restatement of the implementation.
const STALE_PIN_COMMIT = "097086927d31bb723323492f61011ac7dbc7ccc0";
const MAIN_COMMIT = "bd29eb3830f4da727f5d1184092192d5dec29142";
const CHANGED_PACK_PATH = ".beads/formulas/mol-apicity-release.formula.toml";

const entryPinnedAt = (commit: string): Record<string, unknown> => ({
  name: PACK_IMPORT_NAME,
  source: "file:///gc/apicity",
  constraint: `sha:${commit}`,
  kind: "remote",
  pin: { version: `sha:${commit}`, commit, fetched: "2026-08-21T02:02:47Z" },
});

const STALE_ENTRY = entryPinnedAt(STALE_PIN_COMMIT);
const FRESH_ENTRY = entryPinnedAt(MAIN_COMMIT);

const classify = (overrides: Record<string, unknown>) =>
  classifyPackFreshness({
    gcAvailable: true,
    entry: STALE_ENTRY,
    headCommit: MAIN_COMMIT,
    changedPaths: [CHANGED_PACK_PATH],
    pinReachable: true,
    ...overrides,
  });

const messageOf = (overrides: Record<string, unknown>): string =>
  renderPackFreshnessMessage(classify(overrides));

// `selectImport` returns `Record<string, unknown> | null`, so narrow once here
// rather than asserting non-null at each property access below.
const selectOrThrow = (
  statusJson: unknown,
  name: string
): Record<string, unknown> => {
  const entry = selectImport(statusJson, name);

  if (entry === null) {
    throw new Error(`selectImport found no entry named ${name}`);
  }

  return entry as Record<string, unknown>;
};

describe("PACK_IMPORT_NAME", () => {
  // Three spellings of this pack are live at once and only this one appears in
  // `gc import status`; the bare `apicity-release` yields a permanent
  // `import-missing` against a perfectly healthy city.
  it("is the spelling gc import status actually reports", () => {
    expect(PACK_IMPORT_NAME).toBe("pack:apicity-release");
  });
});

describe("PACK_CONTENT_PATHS", () => {
  // Narrowing this set silently turns `stale-content` into `stale-pin`, which
  // still exits 1 but tells the operator the served content is unchanged when
  // it is not. Pin the whole set, not just its length.
  it("watches every repository path that changes what the pack serves", () => {
    expect([...PACK_CONTENT_PATHS]).toEqual([
      "pack.toml",
      ".beads/formulas/",
      ".beads/hooks/",
      "formulas/",
    ]);
  });

  it("is frozen, so a caller cannot widen or narrow it at runtime", () => {
    expect(Object.isFrozen(PACK_CONTENT_PATHS)).toBe(true);
  });
});

describe("selectImport", () => {
  it("finds the entry in the documented envelope", () => {
    expect(
      selectOrThrow({ imports: [STALE_ENTRY] }, PACK_IMPORT_NAME).name
    ).toBe(PACK_IMPORT_NAME);
  });

  it("finds the entry in a bare array", () => {
    expect(selectOrThrow([STALE_ENTRY], PACK_IMPORT_NAME).name).toBe(
      PACK_IMPORT_NAME
    );
  });

  it("returns null rather than guessing when the name is absent", () => {
    expect(
      selectImport({ imports: [STALE_ENTRY] }, "apicity-release")
    ).toBeNull();
    expect(selectImport({ imports: [] }, PACK_IMPORT_NAME)).toBeNull();
    expect(selectImport(null, PACK_IMPORT_NAME)).toBeNull();
    expect(selectImport({}, PACK_IMPORT_NAME)).toBeNull();
  });
});

describe("classifyPackFreshness", () => {
  const CASES: Array<[string, Record<string, unknown>, string, number]> = [
    [
      "the live stale city ac-1yyttm reported",
      {},
      PACK_FRESHNESS_VERDICT.STALE_CONTENT,
      1,
    ],
    [
      "a pin equal to main",
      { entry: FRESH_ENTRY },
      PACK_FRESHNESS_VERDICT.FRESH,
      0,
    ],
    [
      "a pin behind main with no watched path changed",
      { changedPaths: [] },
      PACK_FRESHNESS_VERDICT.STALE_PIN,
      1,
    ],
    [
      "no matching import entry",
      { entry: null },
      PACK_FRESHNESS_VERDICT.IMPORT_MISSING,
      1,
    ],
    [
      "an entry carrying no resolved pin commit",
      { entry: { name: PACK_IMPORT_NAME, constraint: "sha:whatever" } },
      PACK_FRESHNESS_VERDICT.IMPORT_MISSING,
      1,
    ],
    [
      "a pin this checkout cannot resolve",
      { pinReachable: false },
      PACK_FRESHNESS_VERDICT.PIN_UNREACHABLE,
      1,
    ],
    // Both fall-through stale branches used to be reachable with no head, and
    // both interpolated the missing commit straight into their repair line.
    [
      "an unresolvable main with watched content changed",
      { headCommit: null },
      PACK_FRESHNESS_VERDICT.HEAD_UNKNOWN,
      1,
    ],
    [
      "an unresolvable main with no watched path changed",
      { headCommit: null, changedPaths: [] },
      PACK_FRESHNESS_VERDICT.HEAD_UNKNOWN,
      1,
    ],
    [
      "gc absent from PATH",
      { gcAvailable: false },
      PACK_FRESHNESS_VERDICT.SKIPPED,
      0,
    ],
  ];

  for (const [label, overrides, verdict, exitCode] of CASES) {
    it(`reports ${verdict} (exit ${exitCode}) for ${label}`, () => {
      const result = classify(overrides);

      expect(result.verdict).toBe(verdict);
      expect(result.exitCode).toBe(exitCode);
    });
  }

  it("decides an unreachable pin before it decides freshness", () => {
    // A comparison that could not be performed must never render as `fresh`.
    expect(classify({ entry: FRESH_ENTRY, pinReachable: false }).verdict).toBe(
      PACK_FRESHNESS_VERDICT.PIN_UNREACHABLE
    );
  });

  it("carries the compared commits back to the caller", () => {
    const result = classify({});

    expect(result.pinnedCommit).toBe(STALE_PIN_COMMIT);
    expect(result.headCommit).toBe(MAIN_COMMIT);
    expect(result.changedPaths).toEqual([CHANGED_PACK_PATH]);
  });
});

describe("renderPackFreshnessMessage", () => {
  // Asserting only the exit code would pass for a check that reports stale
  // unconditionally, so the stale messages are asserted on content: an
  // operator who cannot see both commits and the fix cannot act on the report.
  it("names both commits and the refresh command when content is stale", () => {
    const message = messageOf({});

    expect(message).toContain(PACK_FRESHNESS_VERDICT.STALE_CONTENT);
    expect(message).toContain(STALE_PIN_COMMIT);
    expect(message).toContain(MAIN_COMMIT);
    expect(message).toContain(REFRESH_COMMAND);
    expect(message).toContain(`version = "sha:${MAIN_COMMIT}"`);
    expect(message).toContain(CHANGED_PACK_PATH);
  });

  it("names both commits and the refresh command when only the pin is stale", () => {
    const message = messageOf({ changedPaths: [] });

    expect(message).toContain(PACK_FRESHNESS_VERDICT.STALE_PIN);
    expect(message).toContain(STALE_PIN_COMMIT);
    expect(message).toContain(MAIN_COMMIT);
    expect(message).toContain(REFRESH_COMMAND);
    expect(message).toContain(`version = "sha:${MAIN_COMMIT}"`);
    expect(message).toContain("content is unchanged");
    expect(message).not.toContain(CHANGED_PACK_PATH);
  });

  it("says the fresh verdict verified the pin and not the installed bytes", () => {
    const message = messageOf({ entry: FRESH_ENTRY });

    expect(message).toContain(PACK_FRESHNESS_VERDICT.FRESH);
    expect(message).toContain(MAIN_COMMIT);
    expect(message).toContain("not the installed bytes");
    expect(message).toContain("gc import check");
  });

  it("says a skip is not a pass", () => {
    const message = messageOf({ gcAvailable: false });

    expect(message).toContain(PACK_FRESHNESS_VERDICT.SKIPPED);
    expect(message).toContain("NOT verified");
    expect(message).toContain("not a pass");
  });

  it("names the pack and the fix when the import is missing entirely", () => {
    const message = messageOf({ entry: null });

    expect(message).toContain(PACK_IMPORT_NAME);
    // `gc import add` is the right verb here and only here: it refuses an
    // existing import, which is precisely what this branch does not have.
    expect(message).toContain(REGISTER_COMMAND);
  });

  it("names the unresolvable commit when the pin is unreachable", () => {
    const message = messageOf({ pinReachable: false });

    expect(message).toContain(STALE_PIN_COMMIT);
    expect(message).toContain("local history");
  });

  // The whole point of this check is to hand the operator one line to paste
  // into `/gc/pack.toml`. With `main` unresolvable it used to render
  // `version = "sha:null"`, and following that instruction breaks the import.
  // Reachable wherever `RELEASE.md` sends the operator: a release worktree cut
  // from `stable`, a `--single-branch` clone or a shallow checkout can hold the
  // pinned history with no local `main` ref.
  for (const [label, changedPaths] of [
    ["watched content changed", [CHANGED_PACK_PATH]],
    ["no watched path changed", []],
  ] as Array<[string, string[]]>) {
    it(`prints no repair line for an unresolvable main, with ${label}`, () => {
      const message = messageOf({ headCommit: null, changedPaths });

      expect(message).toContain(PACK_FRESHNESS_VERDICT.HEAD_UNKNOWN);
      expect(message).toContain(STALE_PIN_COMMIT);
      expect(message).not.toContain(`version = "sha:null"`);
      // Not just the `sha:null` spelling: no placeholder the operator cannot
      // paste either, and no bare `null` standing in for a commit anywhere.
      expect(message).not.toContain("sha:");
      expect(message).not.toContain("null");
      expect(message).not.toContain(REFRESH_COMMAND);
    });
  }
});

describe("installedComparisonPath", () => {
  it("re-anchors a city cache path onto its repository-relative path", () => {
    expect(
      installedComparisonPath(
        `/root/.gc/cache/repos/c5dea1ea/${CHANGED_PACK_PATH}`
      )
    ).toBe(CHANGED_PACK_PATH);
  });

  it("anchors on the earliest watched entry, not a later one", () => {
    // `.beads/formulas/` contains a second anchor. Anchoring on the later one
    // drops the `.beads/` directory and yields `formulas/...`, which resolves
    // only because `formulas` holds a symlink into `.beads/formulas/` — the
    // comparison would silently read the wrong file for anything else.
    expect(
      installedComparisonPath(
        `/root/.gc/cache/repos/c5dea1ea/${CHANGED_PACK_PATH}`
      )
    ).not.toBe("formulas/mol-apicity-release.formula.toml");
    expect(installedComparisonPath("/tmp/x/.beads/hooks/post-merge")).toBe(
      ".beads/hooks/post-merge"
    );
  });

  it("returns null for a path under no watched entry", () => {
    expect(
      installedComparisonPath("/root/.gc/cache/repos/c5dea1ea/README.md")
    ).toBeNull();
    expect(installedComparisonPath("")).toBeNull();
  });
});
