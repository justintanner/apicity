// Regression guard for the ignore-shadow guard itself (ac-90e8p9).
//
// Proves the deliverable's acceptance: the guard FAILS on a synthetic tracked
// file that an ignore pattern shadows, and passes once that file is covered by
// a documented baseline class. Exercises the pure exported functions from
// scripts/check-ignore-shadow.mjs and `main()`, which is not pure but takes its
// shadow sets, baseline and sentinels as injected collaborators, so every case
// runs in-process with no subprocess, no network and no keys.
//
// NOTE: this file contains ignore patterns and `git check-ignore` output as
// FIXTURE STRINGS. It is not configuration — nothing here is read by Prettier,
// ESLint or git. Same self-reference hazard as tests/unit/test-timer-guard.test.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  evaluateShadowSets,
  main,
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

  const BOTH_CLASS = [
    {
      id: "generated-examples-ts",
      axis: "both",
      globs: ["packages/provider/*/src/example.ts"],
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
      BOTH_CLASS,
      []
    );
    expect(result.unexplained).toEqual([]);
    expect(result.stale).toEqual([
      { id: "generated-examples-ts", axis: "eslint" },
    ]);
  });

  it("keeps an `axis: both` class green when both axes match", () => {
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
      BOTH_CLASS,
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
  // only because of the `!packages/provider/cost/README.md` negation. If that
  // negation is ever deleted, the class must NOT absorb the file and leave the
  // gate green.
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
    // Pins the PATTERN TEXT the message must name, not a line number: a
    // citation like `.prettierignore:9` keeps passing this assertion long
    // after an inserted line has made it point somewhere else.
    expect(result.sentinelHits[0].why).toMatch(
      /!packages\/provider\/cost\/README\.md/
    );
  });

  // `except` is the second line of defence behind SENTINELS: in the shipped
  // config the sentinel check runs first and `continue`s, so this branch never
  // fires there. It exists for the day the sentinel is removed — and an
  // untested defence is one refactor from vanishing. Fixture class, EMPTY
  // sentinels, so only the `except` branch can produce the verdict.
  it("does not baseline a path its class excludes", () => {
    const cls = [
      {
        id: "generated-readmes",
        axis: "prettier",
        globs: ["packages/provider/*/README.md"],
        except: ["packages/provider/cost/README.md"],
        why: "fixture",
      },
    ];
    const result = evaluateShadowSets(
      {
        prettier: [
          prettierRecord(
            "packages/provider/cost/README.md",
            8,
            "packages/provider/*/README.md"
          ),
        ],
        eslint: [],
      },
      cls,
      []
    );
    expect(result.baselined).toEqual([]);
    expect(result.unexplained).toHaveLength(1);
    expect(result.unexplained[0].path).toBe("packages/provider/cost/README.md");
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

// `main()` is the guard's entire enforcement mechanism, and the four exports
// above are only the pieces it is assembled from: editing `if (failed) return 1`
// to `return 0` leaves every assertion above green while the guard stops
// guarding. These cases drive `main()` itself through all eight of its exits.
//
// The collaborators are injected, never stubbed at module scope. `baseline` and
// `sentinels` have to be parameters for the clean case to exist at all —
// staleness is derived from classes that matched nothing, so an empty shadow set
// against the real 8-class BASELINE makes every class stale.
describe("main", () => {
  // Only feed the two totals lines; the verdicts come from `shadowed`.
  const TRACKED = ["a.ts", "b.md", "c.mjs"];
  const LINTABLE_FILES = ["a.ts", "c.mjs"];

  const UNMATCHED_CLASS = [
    {
      id: "agents-scratch",
      axis: "prettier",
      globs: [".agents/**"],
      why: "fixture",
    },
  ];

  const COST_README = "packages/provider/cost/README.md";
  const COST_SENTINEL = [
    { path: COST_README, axis: "prettier", why: "fixture" },
  ];

  function collectOf(shadowed: {
    prettier: ReturnType<typeof prettierRecord>[];
    eslint: ReturnType<typeof eslintRecord>[];
  }) {
    return async () => ({
      tracked: TRACKED,
      lintable: LINTABLE_FILES,
      shadowed,
    });
  }

  const EMPTY = collectOf({ prettier: [], eslint: [] });

  // `--help` and `--bogus` return before the collector is reached. Injecting a
  // throwing one is what proves that, and is what keeps the no-subprocess claim
  // in this file's header true for the argv cases.
  const neverCollect = async (): Promise<never> => {
    throw new Error("collect() must not run for an argv-only exit");
  };

  async function runMain(options: Parameters<typeof main>[0]) {
    const out: string[] = [];
    const err: string[] = [];
    const log = vi
      .spyOn(console, "log")
      .mockImplementation((...args: unknown[]) => {
        out.push(args.map(String).join(" "));
      });
    const error = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        err.push(args.map(String).join(" "));
      });
    try {
      const code = await main(options);
      return { code, stdout: out.join("\n"), stderr: err.join("\n") };
    } finally {
      // Restored here so a failing assertion cannot leave `console` stubbed for
      // the next test; `tests/vitest.integration.ts` sets none of
      // `restoreMocks` / `mockReset` / `clearMocks`.
      log.mockRestore();
      error.mockRestore();
    }
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // REQ-001: matched by SHAPE. The real counts moved three times in ~25 minutes
  // during this work; pinning one re-creates the silent-rot risk the comment at
  // scripts/check-ignore-shadow.mjs:92-93 refuses.
  it("exits 0 and prints the success line when nothing is shadowed", async () => {
    const result = await runMain({
      argv: [],
      collect: EMPTY,
      baseline: [],
      sentinels: [],
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(
      /^✓ check-ignore-shadow: \d+ tracked files examined/
    );
    expect(result.stderr).toBe("");
  });

  it("exits 1 when a sentinel file is shadowed", async () => {
    const result = await runMain({
      argv: [],
      collect: collectOf({
        prettier: [prettierRecord(COST_README, 8, "packages/provider/*/*.md")],
        eslint: [],
      }),
      baseline: [],
      sentinels: COST_SENTINEL,
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "a deliberately-checked file is now shadowed"
    );
  });

  it("exits 1 when a shadowed tracked file has no baseline class", async () => {
    const result = await runMain({
      argv: [],
      collect: collectOf({
        prettier: [prettierRecord(".agents/hooks.json")],
        eslint: [],
      }),
      baseline: [],
      sentinels: [],
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("tracked files are hidden from a gate");
  });

  it("exits 1 when a baseline class matches nothing", async () => {
    const result = await runMain({
      argv: [],
      collect: EMPTY,
      baseline: UNMATCHED_CLASS,
      sentinels: [],
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("stale baseline entries");
  });

  // REQ-007: the only case that catches an early-return refactor. `failed` is
  // set by three sequential `if` blocks that all run before `if (failed)`;
  // converting any of them to an early `return 1` keeps the three single-verdict
  // cases above green while silently dropping the later sections.
  it("reports all three verdicts in one run", async () => {
    const result = await runMain({
      argv: [],
      collect: collectOf({
        prettier: [
          prettierRecord(COST_README, 8, "packages/provider/*/*.md"),
          prettierRecord("scripts/orphan.mjs", 3, "scripts/*.mjs"),
        ],
        eslint: [],
      }),
      baseline: UNMATCHED_CLASS,
      sentinels: COST_SENTINEL,
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "a deliberately-checked file is now shadowed"
    );
    expect(result.stderr).toContain("tracked files are hidden from a gate");
    expect(result.stderr).toContain("stale baseline entries");
  });

  it("exits 1 naming an unknown argument", async () => {
    const result = await runMain({
      argv: ["--bogus"],
      collect: neverCollect,
      baseline: [],
      sentinels: [],
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown argument: --bogus");
  });

  it("exits 0 printing usage for --help", async () => {
    const result = await runMain({
      argv: ["--help"],
      collect: neverCollect,
      baseline: [],
      sentinels: [],
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("--list");
    expect(result.stdout).toContain("--help");
  });

  // OQ-3: asserts exit 0 and the PRESENCE of the totals line, not its numbers.
  it("exits 0 listing shadowed files for --list", async () => {
    const result = await runMain({
      argv: ["--list"],
      collect: collectOf({
        prettier: [prettierRecord(".agents/hooks.json")],
        eslint: [eslintRecord("scripts/orphan.mjs")],
      }),
      baseline: [],
      sentinels: [],
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(".agents/hooks.json");
    expect(result.stdout).toMatch(
      /\d+ shadowed on the prettier axis, \d+ on the eslint axis \(\d+ tracked files, \d+ lintable\)\./
    );
  });
});
