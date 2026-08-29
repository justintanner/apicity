import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  formatReport,
  main,
  parseArgs,
  resolveBase,
} from "../../scripts/compare-namespace-shapes.mjs";

/**
 * `scripts/compare-namespace-shapes.mjs` is the command that reads several
 * sibling refs at once, and this file is its regression cover: argument
 * handling, base resolution, the two input guards, the 0/1/2 exit contract and
 * the human report.
 *
 * The command exists because a namespace-shape disagreement lives only BETWEEN
 * branches — four slices of `ac-c2cc4j` each declared `fal`'s `geminiOmniFlash`,
 * one as a callable and three as an object, and every slice's own gate was
 * green (`RF-1`, review finding `RR-5`, follow-up `ac-j4z1t1`). Nothing in the
 * repository imports the command, so without this file its own behaviour is
 * unheld.
 *
 * Both input guards it carries were false greens found by review rather than by
 * a gate, which is why they get a case each: a `--ref` that does not resolve
 * used to read as an empty tree and print `0 collision(s)` at exit 0 (`RF-1`),
 * and an explicit `--base` that does not resolve used to degrade into the
 * unbased mode, printing a page of false collisions at exit 1 (`RF-2`).
 *
 * Every case is hermetic. `resolveBase` runs against the injected `runGit`
 * seam, the `--dir` participants are synthetic checkouts under `tmpdir()`
 * carrying a `ghost` provider that no branch of this repository has, and the
 * `--ref` cases name a ref spelling `git check-ref-format` rejects, so no case
 * depends on a real provider's factory shape or on a branch existing. The refs
 * that carry the original defect stay a transcript in the run artifacts, as
 * `tests/unit/provider-namespace-shape.test.ts` already states for itself.
 *
 * It is registered in `scripts/lib/cross-cutting-tests.mjs` because it is named
 * after no provider, so `test:provider` and `test:affected` select it for
 * nobody; without that registration it would run only in full CI.
 */

/** A ref spelling git cannot parse, so no checkout can ever resolve it. */
const UNRESOLVABLE_REF = "apicity-namespace-shapes-test..no-such-ref";
const UNRESOLVABLE_BASE = "apicity-namespace-shapes-test..no-such-base";

/** The endpoint-builder idiom the detector classifies as `callable`. */
const CALLABLE_BODY = [
  '  const sharedFamily = jsonBody<GhostRequest, GhostResponse>("POST", "/x");',
  "  return attachExamples({ sharedFamily });",
].join("\n");

/** The same dot path as an object with one leaf, which `callable` collides with. */
const OBJECT_BODY =
  "  return attachExamples({ sharedFamily: { leafB: () => undefined } });";

interface WriteStream {
  write(chunk: string): void;
}

interface Collector {
  io: { stdout: WriteStream; stderr: WriteStream };
  out: string[];
  err: string[];
  stdoutText(): string;
  stderrLines(): string[];
}

/**
 * An `io` pair that captures both streams, so no case reaches the real process
 * streams and "exactly one line" stays a length assertion.
 */
function collector(): Collector {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: {
      stdout: {
        write(chunk: string) {
          out.push(chunk);
        },
      },
      stderr: {
        write(chunk: string) {
          err.push(chunk);
        },
      },
    },
    out,
    err,
    stdoutText: () => out.join(""),
    stderrLines: () => {
      const lines = err.join("").split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      return lines;
    },
  };
}

interface GitCall {
  repoRoot: string;
  args: string[];
}

/**
 * The `runGit` seam: records every invocation and answers from a per-test table
 * keyed by the git subcommand, so `resolveBase` runs no real `git` at all.
 */
function recordingGit(responses: Record<string, string | null>): {
  run: (repoRoot: string, args: string[]) => string | null;
  calls: GitCall[];
} {
  const calls: GitCall[] = [];
  return {
    calls,
    run: (repoRoot: string, args: string[]) => {
      calls.push({ repoRoot, args });
      return responses[args[0]] ?? null;
    },
  };
}

/** A synthetic checkout carrying one `ghost` factory with the given body. */
function writeGhostCheckout(root: string, body: string): void {
  const srcDir = join(root, "packages", "provider", "ghost", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    join(srcDir, "ghost.ts"),
    `export function createGhost(opts: GhostOptions): GhostProvider {\n` +
      `${body}\n}\n`
  );
}

const roots: string[] = [];
let callableRoot = "";
let objectRoot = "";
let emptyRoot = "";

beforeAll(() => {
  const make = (): string => {
    const root = mkdtempSync(join(tmpdir(), "apicity-namespace-shapes-"));
    roots.push(root);
    return root;
  };
  callableRoot = make();
  objectRoot = make();
  emptyRoot = make();
  writeGhostCheckout(callableRoot, CALLABLE_BODY);
  writeGhostCheckout(objectRoot, OBJECT_BODY);
});

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("parseArgs", () => {
  it("accepts --flag value and --flag=value alike", () => {
    for (const flag of ["--ref", "--dir", "--provider", "--base"]) {
      expect(parseArgs([flag, "value"]), flag).toEqual(
        parseArgs([`${flag}=value`])
      );
    }
  });

  it("drops a bare -- wherever it appears", () => {
    expect(parseArgs(["--", "--provider", "fal"])).toEqual(
      parseArgs(["--provider", "fal"])
    );
    expect(parseArgs(["--ref", "a", "--", "--ref", "b"]).participants).toEqual([
      { kind: "ref", value: "a" },
      { kind: "ref", value: "b" },
    ]);
  });

  it("accumulates repeated --ref and --dir in order, with their kind", () => {
    expect(
      parseArgs(["--ref", "a", "--dir", "/d", "--ref", "b"]).participants
    ).toEqual([
      { kind: "ref", value: "a" },
      { kind: "dir", value: "/d" },
      { kind: "ref", value: "b" },
    ]);
  });

  it("de-duplicates --provider, preserving first-seen order", () => {
    expect(
      parseArgs(["--provider", "kie", "--provider", "fal", "--provider", "kie"])
        .providers
    ).toEqual(["kie", "fal"]);
  });

  it("keeps the last --base when it repeats", () => {
    expect(parseArgs(["--base", "one", "--base", "two"]).base).toBe("two");
  });

  it("throws for an unknown argument, naming it", () => {
    expect(() => parseArgs(["--frobnicate"])).toThrow(
      "Unknown argument --frobnicate."
    );
  });

  it("throws when a value is missing at the end of argv", () => {
    expect(() => parseArgs(["--ref"])).toThrow("--ref needs a value.");
  });

  it("throws when the next token is another flag", () => {
    expect(() => parseArgs(["--ref", "--json"])).toThrow(
      "--ref needs a value."
    );
  });

  it("throws for an empty inline value", () => {
    expect(() => parseArgs(["--ref="])).toThrow("--ref needs a value.");
  });

  it("gives the documented defaults for empty argv", () => {
    expect(parseArgs([])).toEqual({
      participants: [],
      providers: [],
      base: null,
      json: false,
      help: false,
    });
  });

  it("sets the boolean flags without consuming the next token", () => {
    expect(parseArgs(["--json", "--provider", "fal"])).toEqual({
      participants: [],
      providers: ["fal"],
      base: null,
      json: true,
      help: false,
    });
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-h"]).help).toBe(true);
  });
});

describe("resolveBase", () => {
  const REPO = "/repo";

  it("accepts an explicit --base the runner resolves", () => {
    const git = recordingGit({ "rev-parse": "9f9f9f9" });
    expect(
      resolveBase(parseArgs(["--base", "release"]), REPO, git.run)
    ).toEqual({ base: "release", source: "--base" });
    expect(git.calls).toEqual([
      {
        repoRoot: REPO,
        args: ["rev-parse", "--verify", "--quiet", "release^{commit}"],
      },
    ]);
  });

  it("refuses an explicit --base it cannot resolve, with no fallback", () => {
    const git = recordingGit({ "rev-parse": null });
    const resolved = resolveBase(
      parseArgs(["--base", UNRESOLVABLE_BASE]),
      REPO,
      git.run
    );
    expect(resolved.base).toBeNull();
    expect(resolved.source).toContain(
      `--base ${UNRESOLVABLE_BASE} does not resolve`
    );
    expect(git.calls).toHaveLength(1);
    expect(git.calls.some((call) => call.args[0] === "merge-base")).toBe(false);
  });

  it("derives the merge-base of the refs, ignoring --dir participants", () => {
    const git = recordingGit({ "merge-base": "abc1234" });
    const options = parseArgs([
      "--ref",
      "left",
      "--dir",
      "/checkout",
      "--ref",
      "right",
    ]);
    expect(resolveBase(options, REPO, git.run)).toEqual({
      base: "abc1234",
      source: "git merge-base of the supplied refs",
    });
    expect(git.calls).toEqual([
      { repoRoot: REPO, args: ["merge-base", "left", "right"] },
    ]);
  });

  it("falls back to main with fewer than two refs", () => {
    const git = recordingGit({ "rev-parse": "1111111" });
    expect(resolveBase(parseArgs(["--ref", "solo"]), REPO, git.run)).toEqual({
      base: "main",
      source: "fallback main",
    });
    expect(git.calls).toEqual([
      {
        repoRoot: REPO,
        args: ["rev-parse", "--verify", "--quiet", "main^{commit}"],
      },
    ]);
  });

  it("takes the same fallback when merge-base yields nothing", () => {
    const git = recordingGit({ "merge-base": null, "rev-parse": "2222222" });
    expect(
      resolveBase(parseArgs(["--ref", "left", "--ref", "right"]), REPO, git.run)
    ).toEqual({ base: "main", source: "fallback main" });
    expect(git.calls).toHaveLength(2);
  });

  it("reports no base when main itself does not resolve", () => {
    const git = recordingGit({ "rev-parse": null });
    const resolved = resolveBase(parseArgs([]), REPO, git.run);
    expect(resolved.base).toBeNull();
    expect(resolved.source).toBe("no base: main does not resolve");
    expect(git.calls).toHaveLength(1);
  });
});

describe("input guards", () => {
  it("rejects an unresolvable --ref instead of reporting on it (RF-1)", () => {
    // Exactly one stderr line is the assertion that the guard ran BEFORE the
    // report: a built report would also have written the "contributed nothing"
    // note for `ghost`, which no participant carries.
    const { io, stdoutText, stderrLines } = collector();
    expect(main(["--ref", UNRESOLVABLE_REF, "--provider", "ghost"], io)).toBe(
      2
    );
    expect(stderrLines()).toEqual([
      `namespace-shapes: --ref ${UNRESOLVABLE_REF} does not resolve.`,
    ]);
    expect(stdoutText()).toBe("");
  });

  it("checks --dir before --ref, so the --dir message wins", () => {
    const { io, stderrLines } = collector();
    expect(main(["--dir", emptyRoot, "--ref", UNRESOLVABLE_REF], io)).toBe(2);
    const lines = stderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("is not a checkout of this repository");
  });

  it("rejects an unresolvable explicit --base instead of degrading (RF-2)", () => {
    // `--provider ghost` keeps the case off `readProviderNames`, which would
    // otherwise parse all 29 real factories before the guard fires.
    const { io, stdoutText, stderrLines } = collector();
    expect(main(["--base", UNRESOLVABLE_BASE, "--provider", "ghost"], io)).toBe(
      2
    );
    const lines = stderrLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain(`--base ${UNRESOLVABLE_BASE}`);
    expect(lines[0].endsWith("does not resolve.")).toBe(true);
    expect(stdoutText()).toBe("");
  });

  it("does not fire the --base guard on the unbased fallback", () => {
    const { io } = collector();
    expect(main(["--dir", callableRoot, "--provider", "ghost"], io)).toBe(0);
  });
});

describe("exit contract", () => {
  it("returns 2 for an unknown argument, printing the usage", () => {
    const { io, stdoutText, stderrLines } = collector();
    expect(main(["--frobnicate"], io)).toBe(2);
    const lines = stderrLines();
    expect(lines[0]).toContain("Unknown argument --frobnicate.");
    expect(lines.join("\n")).toContain("Usage: pnpm run namespace-shapes");
    expect(stdoutText()).toBe("");
  });

  it("returns 2 for a --dir that is not a checkout of this repository", () => {
    const { io, stdoutText, stderrLines } = collector();
    expect(main(["--dir", emptyRoot], io)).toBe(2);
    expect(stderrLines()[0]).toContain("is not a checkout of this repository");
    expect(stdoutText()).toBe("");
  });

  it("returns 0 for --help, with the usage on stdout", () => {
    const { io, stdoutText, stderrLines } = collector();
    expect(main(["--help"], io)).toBe(0);
    expect(stdoutText()).toContain("Usage: pnpm run namespace-shapes");
    expect(stderrLines()).toEqual([]);
  });

  it("returns 0 for a single participant with nothing to compare", () => {
    // Not `$`-anchored on the count line: `formatReport` emits the
    // two-participants note after it, so stdout does not end with the count.
    const { io, stdoutText } = collector();
    expect(main(["--dir", callableRoot, "--provider", "ghost"], io)).toBe(0);
    expect(stdoutText()).toContain("0 collision(s), 0 shared namespace(s).");
    expect(stdoutText()).toContain(
      "A comparison needs two or more participants."
    );
  });

  it("returns 1 when two checkouts declare one path with clashing shapes", () => {
    const { io, stdoutText } = collector();
    expect(
      main(
        ["--dir", callableRoot, "--dir", objectRoot, "--provider", "ghost"],
        io
      )
    ).toBe(1);
    const text = stdoutText();
    expect(text).toContain("COLLISION  ghost  sharedFamily");
    expect(text).toContain(callableRoot);
    expect(text).toContain(objectRoot);
  });

  it("prints the raw report under --json", () => {
    const { io, stdoutText } = collector();
    expect(
      main(["--json", "--dir", callableRoot, "--provider", "ghost"], io)
    ).toBe(0);
    const report: Record<string, unknown> = JSON.parse(stdoutText());
    expect(Object.keys(report)).toEqual(
      expect.arrayContaining([
        "base",
        "baseSource",
        "providers",
        "participants",
        "inventories",
        "collisions",
        "shared",
      ])
    );
  });

  it("writes nothing to the real process streams", () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write");
    const stderrSpy = vi.spyOn(process.stderr, "write");
    try {
      const { io } = collector();
      main(["--dir", callableRoot, "--provider", "ghost"], io);
    } finally {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    }
    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});

describe("formatReport", () => {
  const GHOST_FILE = "packages/provider/ghost/src/ghost.ts";

  const collidingReport = {
    base: "abc1234",
    baseSource: "git merge-base of the supplied refs",
    providers: ["ghost"],
    participants: [
      { kind: "ref", value: "ref-a" },
      { kind: "ref", value: "ref-b" },
    ],
    inventories: [],
    collisions: [
      {
        provider: "ghost",
        dotPath: "sharedFamily",
        refs: [
          {
            ref: "ref-a",
            shape: "callable",
            line: 3,
            filePath: GHOST_FILE,
          },
          { ref: "ref-b", shape: "object", line: null, filePath: null },
        ],
      },
    ],
    shared: [
      {
        provider: "ghost",
        dotPath: "sharedFamily",
        shape: "mixed",
        refs: ["ref-a", "ref-b"],
      },
    ],
  };

  it("renders the header, the collision block and the shared section", () => {
    const text = formatReport(collidingReport);
    expect(text.split("\n")[0]).toBe(
      "2 participant(s), ghost, base abc1234 - " +
        "git merge-base of the supplied refs"
    );
    expect(text).toContain("COLLISION  ghost  sharedFamily");
    expect(text).toMatch(/^ {2}ref-a {2}callable +packages\S+ghost\.ts:3$/m);
    expect(text).toMatch(/^ {2}ref-b {2}object +<no factory file>$/m);
    expect(text).toContain("Shared namespaces - 1");
    expect(text).toContain(
      "  ghost  sharedFamily  [mixed]  2 refs  (collision)"
    );
    expect(text).toMatch(/^ {4}ref-a$/m);
    expect(text).toMatch(/^ {4}ref-b$/m);
    expect(text).toContain("1 collision(s), 1 shared namespace(s).");
    expect(text).not.toContain("A comparison needs two or more participants.");
  });

  it("names the provider count when the scope is more than one provider", () => {
    const text = formatReport({
      ...collidingReport,
      providers: ["ghost", "phantom"],
    });
    expect(text.split("\n")[0]).toContain("2 participant(s), 2 providers,");
  });

  it("adds the two-participant note for a single participant", () => {
    const text = formatReport({
      ...collidingReport,
      participants: [{ kind: "dir", value: "/checkout" }],
      collisions: [],
      shared: [],
    });
    expect(text).toContain("0 collision(s), 0 shared namespace(s).");
    expect(text).toContain("A comparison needs two or more participants.");
    expect(text).not.toContain("COLLISION");
    expect(text).not.toContain("Shared namespaces");
  });
});
