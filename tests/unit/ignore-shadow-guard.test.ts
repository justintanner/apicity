// Regression guard for the ignore-shadow guard itself (ac-90e8p9).
//
// Proves the deliverable's acceptance: the guard FAILS on a synthetic tracked
// file that an ignore pattern shadows, and passes once that file is covered by
// a documented baseline class. Exercises the pure exported functions from
// scripts/check-ignore-shadow.mjs, so every case runs in-process with no
// subprocess, no network and no keys.
//
// NOTE: this file contains ignore patterns and `git check-ignore` output as
// FIXTURE STRINGS. It is not configuration — nothing here is read by Prettier,
// ESLint or git. Same self-reference hazard as tests/unit/test-timer-guard.test.ts.
import { describe, expect, it } from "vitest";
import {
  evaluateShadowSets,
  matchesGlob,
  parseCheckIgnoreRecords,
  recordsFromCheckIgnore,
} from "../../scripts/check-ignore-shadow.mjs";

const NUL = "\0";

/** Builds a `git check-ignore -z -v` stream from four-field records. */
function checkIgnoreStream(
  records: Array<[source: string, line: string, pattern: string, path: string]>
): string {
  return records.flat().join(NUL) + NUL;
}

function prettierRecord(path: string, line = 48, pattern = "/.agents/") {
  return { path, source: ".prettierignore", line, pattern };
}

function eslintRecord(path: string) {
  return {
    path,
    source: "eslint.config.mjs",
    line: null,
    pattern: null,
  };
}

describe("parseCheckIgnoreRecords", () => {
  it("parses the four NUL-separated fields per record", () => {
    const stdout = checkIgnoreStream([
      [".prettierignore", "8", "packages/provider/*/README.md", "a/README.md"],
      [".gitignore", "159", "CLAUDE.md", "CLAUDE.md"],
    ]);
    expect(parseCheckIgnoreRecords(stdout)).toEqual([
      {
        path: "a/README.md",
        source: ".prettierignore",
        line: 8,
        pattern: "packages/provider/*/README.md",
      },
      {
        path: "CLAUDE.md",
        source: ".gitignore",
        line: 159,
        pattern: "CLAUDE.md",
      },
    ]);
  });

  // `git check-ignore -v` also prints records for paths matched by a NEGATION
  // pattern, and such a path is NOT ignored. On the tree at f6a9798b the plain
  // form prints 99 paths while `-v` prints 100 records; the extra one is this
  // exact record. Trusting the `-v` count would report a deliberately-checked
  // file as shadowed.
  it("drops negation records, which mean the path is NOT ignored", () => {
    const stdout = checkIgnoreStream([
      [
        ".prettierignore",
        "8",
        "packages/provider/*/README.md",
        "packages/provider/openai/README.md",
      ],
      [
        ".prettierignore",
        "9",
        "!packages/provider/cost/README.md",
        "packages/provider/cost/README.md",
      ],
    ]);
    const records = parseCheckIgnoreRecords(stdout);
    expect(records).toHaveLength(1);
    expect(records[0].path).toBe("packages/provider/openai/README.md");
  });

  // The `-z` framing is what makes the parse robust for paths a `\t`-delimited
  // text form would mangle.
  it("keeps fields intact for a path containing a space", () => {
    const stdout = checkIgnoreStream([
      [".prettierignore", "14", ".beads/", ".beads/my notes.md"],
    ]);
    const records = parseCheckIgnoreRecords(stdout);
    expect(records).toEqual([
      {
        path: ".beads/my notes.md",
        source: ".prettierignore",
        line: 14,
        pattern: ".beads/",
      },
    ]);
  });

  it("returns nothing for empty output", () => {
    expect(parseCheckIgnoreRecords("")).toEqual([]);
  });
});

describe("recordsFromCheckIgnore", () => {
  // `git check-ignore` exits 1 when NO path matches. `execFileSync` throws on
  // non-zero exit, so an empty shadow set must not be mistaken for a failure.
  it("treats exit 1 with no output as an empty shadow set, not an error", () => {
    expect(() =>
      recordsFromCheckIgnore({ status: 1, stdout: "", stderr: "" })
    ).not.toThrow();
    expect(
      recordsFromCheckIgnore({ status: 1, stdout: "", stderr: "" })
    ).toEqual([]);
  });

  it("throws with stderr surfaced on a real git failure", () => {
    expect(() =>
      recordsFromCheckIgnore({
        status: 128,
        stdout: "",
        stderr: "fatal: not a git repository",
      })
    ).toThrow(/128.*not a git repository/s);
  });
});

describe("matchesGlob", () => {
  it("matches `*` within a segment only", () => {
    expect(
      matchesGlob(
        "packages/provider/*/src/example.ts",
        "packages/provider/openai/src/example.ts"
      )
    ).toBe(true);
    expect(
      matchesGlob(
        "packages/provider/*/README.md",
        "packages/provider/README.md"
      )
    ).toBe(false);
  });

  it("matches `**` across segments", () => {
    expect(matchesGlob(".beads/**", ".beads/issues.jsonl")).toBe(true);
    expect(matchesGlob(".beads/**", ".beads/formulas/do-work.toml")).toBe(true);
    expect(matchesGlob(".beads/**", ".beadsx/issues.jsonl")).toBe(false);
  });
});

describe("evaluateShadowSets", () => {
  const AGENTS_CLASS = [
    {
      id: "agents-scratch",
      axis: "prettier",
      globs: [".agents/**"],
      why: "fixture",
    },
  ];

  // AC-7 fail case (REQ-012): the guard must be proven to fail on a synthetic
  // shadowed tracked file, not merely to pass on today's tree.
  it("reports a shadowed tracked file with no baseline class as unexplained", () => {
    const result = evaluateShadowSets(
      { prettier: [prettierRecord(".agents/hooks.json")], eslint: [] },
      [],
      []
    );
    expect(result.unexplained).toHaveLength(1);
    expect(result.unexplained[0]).toMatchObject({
      path: ".agents/hooks.json",
      axis: "prettier",
      source: ".prettierignore",
      line: 48,
      pattern: "/.agents/",
    });
    expect(result.baselined).toEqual([]);
  });

  // AC-7 pass case.
  it("accepts the same file once a baseline class covers it", () => {
    const result = evaluateShadowSets(
      { prettier: [prettierRecord(".agents/hooks.json")], eslint: [] },
      AGENTS_CLASS,
      []
    );
    expect(result.unexplained).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.baselined).toHaveLength(1);
    expect(result.baselined[0].classId).toBe("agents-scratch");
  });

  // AC-5 / REQ-008 / TS-6: the allowlist must not rot the way the ignore list
  // it guards did.
  it("flags a baseline class that matches nothing as stale", () => {
    const result = evaluateShadowSets(
      { prettier: [], eslint: [] },
      AGENTS_CLASS,
      []
    );
    expect(result.stale).toEqual([{ id: "agents-scratch", axis: "prettier" }]);
  });

  // Staleness is per axis, not a union: a `both` class that still matches on
  // one axis must not keep its dead half alive.
  it("flags the dead half of an `axis: both` class", () => {
    const both = [
      {
        id: "generated-examples-ts",
        axis: "both",
        globs: ["packages/provider/*/src/example.ts"],
        why: "fixture",
      },
    ];
    const result = evaluateShadowSets(
      {
        prettier: [
          prettierRecord(
            "packages/provider/openai/src/example.ts",
            5,
            "packages/provider/*/src/example.ts"
          ),
        ],
        eslint: [],
      },
      both,
      []
    );
    expect(result.unexplained).toEqual([]);
    expect(result.stale).toEqual([
      { id: "generated-examples-ts", axis: "eslint" },
    ]);
  });

  it("keeps an `axis: both` class green when both axes match", () => {
    const both = [
      {
        id: "generated-examples-ts",
        axis: "both",
        globs: ["packages/provider/*/src/example.ts"],
        why: "fixture",
      },
    ];
    const result = evaluateShadowSets(
      {
        prettier: [
          prettierRecord(
            "packages/provider/openai/src/example.ts",
            5,
            "packages/provider/*/src/example.ts"
          ),
        ],
        eslint: [eslintRecord("packages/provider/openai/src/example.ts")],
      },
      both,
      []
    );
    expect(result.stale).toEqual([]);
    expect(result.baselined).toHaveLength(2);
  });

  it("scopes a class to its declared axis", () => {
    const result = evaluateShadowSets(
      { prettier: [], eslint: [eslintRecord(".agents/hooks.json")] },
      AGENTS_CLASS,
      []
    );
    expect(result.unexplained).toHaveLength(1);
    expect(result.unexplained[0].axis).toBe("eslint");
  });

  // The generated-README class glob (`packages/provider/*/README.md`) also
  // matches cost/README.md, which is hand-written and stays in `format:check`
  // only because of the negation at `.prettierignore:9`. If that negation is
  // ever deleted, the class must NOT absorb the file and leave the gate green.
  // Runs against the real BASELINE and SENTINELS on purpose.
  it("does not let the generated-README class absorb cost/README.md", () => {
    const record = prettierRecord(
      "packages/provider/cost/README.md",
      8,
      "packages/provider/*/README.md"
    );
    const result = evaluateShadowSets({ prettier: [record], eslint: [] });
    expect(result.baselined).toEqual([]);
    expect(result.sentinelHits).toHaveLength(1);
    expect(result.sentinelHits[0]).toMatchObject({
      path: "packages/provider/cost/README.md",
      axis: "prettier",
    });
    expect(result.sentinelHits[0].why).toMatch(/\.prettierignore:9/);
  });

  it("still baselines the other generated READMEs", () => {
    const result = evaluateShadowSets({
      prettier: [
        prettierRecord(
          "packages/provider/openai/README.md",
          8,
          "packages/provider/*/README.md"
        ),
      ],
      eslint: [],
    });
    expect(result.sentinelHits).toEqual([]);
    expect(result.unexplained).toEqual([]);
    expect(result.baselined[0].classId).toBe("generated-readmes");
  });

  it("does not throw on an empty shadow set", () => {
    expect(() =>
      evaluateShadowSets({ prettier: [], eslint: [] }, [], [])
    ).not.toThrow();
    const result = evaluateShadowSets({ prettier: [], eslint: [] }, [], []);
    expect(result).toMatchObject({
      baselined: [],
      unexplained: [],
      sentinelHits: [],
      stale: [],
    });
  });
});
