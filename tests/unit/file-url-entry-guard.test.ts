import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  findRawFileUrlEntryGuards,
  listTrackedCandidates,
  main,
  parseTrackedPaths,
  scanRepository,
} from "../../scripts/check-file-url-entry-guards.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const guardScriptPath = join(
  repositoryRoot,
  "scripts/check-file-url-entry-guards.mjs"
);
const temporaryDirectories: string[] = [];

const rawPrefix = [["fi", "le"].join(""), ":", "/", "/"].join("");
const interpolationOpen = ["$", "{"].join("");
const argvExpression = ["process", ".", "argv", "[", "1", "]"].join("");
const safeDirectComparison =
  "process.argv[1] === fileURLToPath(import.meta.url)";
const safeInverseComparison =
  "import.meta.url === pathToFileURL(process.argv[1]).href";

interface OutputCapture {
  stream: {
    write(value: string | Uint8Array): boolean;
  };
  text(): string;
}

interface RootPackage {
  scripts: Record<string, string>;
}

function captureOutput(): OutputCapture {
  const chunks: string[] = [];
  return {
    stream: {
      write(value) {
        chunks.push(String(value));
        return true;
      },
    },
    text() {
      return chunks.join("");
    },
  };
}

function templateConstruction(expression = argvExpression): string {
  return ["`", rawPrefix, interpolationOpen, expression, "}", "`"].join("");
}

function concatenationConstruction(
  quote: "'" | '"',
  beforeOperator = " ",
  afterOperator = " "
): string {
  return [
    quote,
    rawPrefix,
    quote,
    beforeOperator,
    "+",
    afterOperator,
    argvExpression,
  ].join("");
}

function makeRepository(prefix = "apicity-file-url-entry-guard-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root, stdio: "pipe" });
  return root;
}

function writeFixture(root: string, filePath: string, source: string): void {
  const absolutePath = join(root, filePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source, "utf8");
}

function track(root: string, filePaths: string[]): void {
  execFileSync("git", ["add", "--", ...filePaths], {
    cwd: root,
    stdio: "pipe",
  });
}

function runMain(options: NonNullable<Parameters<typeof main>[0]> = {}): {
  status: number;
  stdout: string;
  stderr: string;
} {
  const stdout = captureOutput();
  const stderr = captureOutput();
  const status = main({
    argv: [],
    root: repositoryRoot,
    ...options,
    stdout: stdout.stream as typeof process.stdout,
    stderr: stderr.stream as typeof process.stderr,
  });
  return { status, stdout: stdout.text(), stderr: stderr.text() };
}

function runPackageGuard(root: string) {
  return spawnSync(
    "pnpm",
    ["run", "lint:file-url-entry-guards", "--", "--root", root],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    }
  );
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("tracked candidate discovery", () => {
  it("sorts, deduplicates, filters, and rejects unsafe source paths", () => {
    const output = Buffer.from(
      ["z.ts", "a.mjs", "a.mjs", "notes.md", "upper.JS", "middle.js", ""].join(
        "\0"
      )
    );
    expect(parseTrackedPaths(output)).toEqual(["a.mjs", "middle.js", "z.ts"]);
    expect(() => parseTrackedPaths("../escape.ts\0")).toThrow(
      "unsafe tracked path"
    );
  });

  it("scans only tracked lowercase JavaScript and TypeScript candidates", () => {
    const root = makeRepository();
    const seededSource = `const guard = ${templateConstruction()};\n`;
    const trackedSources = [
      "src/tracked.js",
      "src/tracked.mjs",
      "src/tracked.ts",
    ];
    const excluded = ["src/untracked.ts", "notes/tracked.md", "src/tracked.TS"];

    for (const filePath of [...trackedSources, ...excluded]) {
      writeFixture(root, filePath, seededSource);
    }
    track(root, [...trackedSources, "notes/tracked.md", "src/tracked.TS"]);

    expect(listTrackedCandidates(root)).toEqual(trackedSources);
    const result = scanRepository(root);
    expect(result.candidates).toEqual(trackedSources);
    expect(result.findings).toHaveLength(3);
    expect(result.findings.map((finding) => finding.filePath)).toEqual(
      trackedSources
    );
    expect(
      result.findings.every(
        (finding) => finding.kind === "template-interpolation"
      )
    ).toBe(true);
  });
});

describe("direct-construction matching", () => {
  it("covers interpolation spacing and both concatenation quote styles", () => {
    const spacedArgv = ["process", " . ", "argv", " [ ", "1", " ]"].join("");
    const source = [
      `  ${templateConstruction()}`,
      `    ${templateConstruction(`  ${spacedArgv}\t`)}`,
      concatenationConstruction("'"),
      `      ${concatenationConstruction('"', "\t ", "  ")}`,
    ].join("\n");

    expect(
      findRawFileUrlEntryGuards(source).map(({ line, column, kind }) => ({
        line,
        column,
        kind,
      }))
    ).toEqual([
      { line: 1, column: 3, kind: "template-interpolation" },
      { line: 2, column: 5, kind: "template-interpolation" },
      { line: 3, column: 1, kind: "quoted-prefix-concatenation" },
      { line: 4, column: 7, kind: "quoted-prefix-concatenation" },
    ]);
  });

  it("keeps both safe comparisons and the real release script clean", () => {
    expect(
      findRawFileUrlEntryGuards(
        [safeDirectComparison, safeInverseComparison].join("\n")
      )
    ).toEqual([]);

    const releaseNotes = readFileSync(
      join(repositoryRoot, "scripts/release-notes.mjs"),
      "utf8"
    );
    expect(findRawFileUrlEntryGuards(releaseNotes)).toEqual([]);
  });

  it("reports every finding with exact, deterministic locations", () => {
    const root = makeRepository();
    const template = templateConstruction();
    const singleQuoted = concatenationConstruction("'");
    const doubleQuoted = concatenationConstruction('"');

    writeFixture(root, "z.ts", `${template}\n      ${singleQuoted}\n`);
    writeFixture(root, "middle.js", `    ${doubleQuoted}\n`);
    writeFixture(root, "a.mjs", `// fixture\n  ${template}\n${singleQuoted}\n`);
    track(root, ["z.ts", "middle.js", "a.mjs"]);

    const result = scanRepository(root);
    expect(result.candidates).toEqual(["a.mjs", "middle.js", "z.ts"]);
    expect(
      result.findings.map(({ filePath, line, column, kind }) => ({
        filePath,
        line,
        column,
        kind,
      }))
    ).toEqual([
      {
        filePath: "a.mjs",
        line: 2,
        column: 3,
        kind: "template-interpolation",
      },
      {
        filePath: "a.mjs",
        line: 3,
        column: 1,
        kind: "quoted-prefix-concatenation",
      },
      {
        filePath: "middle.js",
        line: 1,
        column: 5,
        kind: "quoted-prefix-concatenation",
      },
      {
        filePath: "z.ts",
        line: 1,
        column: 1,
        kind: "template-interpolation",
      },
      {
        filePath: "z.ts",
        line: 2,
        column: 7,
        kind: "quoted-prefix-concatenation",
      },
    ]);
  });
});

describe("main", () => {
  it("returns a clean status and writes only the explicit stdout verdict", () => {
    const root = makeRepository();
    writeFixture(root, "clean.ts", `${safeDirectComparison};\n`);
    track(root, ["clean.ts"]);

    const result = runMain({ argv: ["--root", root] });
    expect(result).toEqual({
      status: 0,
      stdout:
        "✓ check-file-url-entry-guards: completed scan of 1 tracked " +
        "candidate(s); 0 violations.\n",
      stderr: "",
    });
  });

  it("returns failure and writes every ordered diagnostic to stderr", () => {
    const root = makeRepository();
    writeFixture(
      root,
      "b.ts",
      `  ${templateConstruction()}\n${concatenationConstruction("'")}\n`
    );
    writeFixture(root, "a.mjs", `${concatenationConstruction('"')}\n`);
    track(root, ["b.ts", "a.mjs"]);

    const result = runMain({ argv: ["--root", root] });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "3 violation(s) in 2 file(s) among 2 tracked candidate(s)"
    );
    expect(result.stderr).toContain(safeDirectComparison);
    expect(result.stderr).toContain(safeInverseComparison);
    expect(result.stderr).toContain("a.mjs:1:1 [quoted-prefix-concatenation]");
    expect(result.stderr).toContain("b.ts:1:3 [template-interpolation]");
    expect(result.stderr).toContain("b.ts:2:1 [quoted-prefix-concatenation]");
    expect(result.stderr.indexOf("a.mjs:1:1")).toBeLessThan(
      result.stderr.indexOf("b.ts:1:3")
    );
    expect(result.stderr.indexOf("b.ts:1:3")).toBeLessThan(
      result.stderr.indexOf("b.ts:2:1")
    );
  });

  it("fails closed on Git discovery and tracked-file read errors", () => {
    const gitFailure = runMain({
      runGit() {
        throw new Error("seeded Git failure");
      },
    });
    expect(gitFailure.status).toBe(1);
    expect(gitFailure.stdout).toBe("");
    expect(gitFailure.stderr).toContain(
      "Git tracked-file discovery failed: seeded Git failure"
    );

    const readFailure = runMain({
      runGit() {
        return "unreadable.ts\0";
      },
      readFile() {
        throw new Error("seeded read failure");
      },
    });
    expect(readFailure.status).toBe(1);
    expect(readFailure.stdout).toBe("");
    expect(readFailure.stderr).toContain(
      "unreadable.ts: unable to read tracked candidate: seeded read failure"
    );
  });

  it.each([
    { argv: ["--unknown"], message: "Unknown argument: --unknown" },
    { argv: ["--root"], message: "--root requires a path" },
    {
      argv: ["--root", ".", "--root", ".."],
      message: "--root may be specified only once",
    },
  ])("fails closed for malformed arguments: $message", ({ argv, message }) => {
    const result = runMain({
      argv,
      runGit() {
        throw new Error("Git must not run for malformed arguments");
      },
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(`argument error: ${message}`);
    expect(result.stderr).not.toContain("Git must not run");
  });
});

describe("executable and repository integration", () => {
  it("self-applies to the real tracked tree without exclusions", () => {
    const result = scanRepository(repositoryRoot);
    expect(result.candidates).toContain(
      "scripts/check-file-url-entry-guards.mjs"
    );
    expect(result.candidates).toContain(
      "tests/unit/file-url-entry-guard.test.ts"
    );
    expect(result.findings).toEqual([]);
  });

  it("executes directly from an absolute path containing a space", () => {
    const root = makeRepository("apicity file-url-entry-guard ");
    const copiedScript = join(root, "scripts/check-file-url-entry-guards.mjs");
    mkdirSync(dirname(copiedScript), { recursive: true });
    copyFileSync(guardScriptPath, copiedScript);
    writeFixture(root, "clean.ts", `${safeInverseComparison};\n`);
    track(root, ["scripts/check-file-url-entry-guards.mjs", "clean.ts"]);

    expect(root).toContain(" ");
    const result = spawnSync(process.execPath, [copiedScript], {
      cwd: root,
      encoding: "utf8",
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "completed scan of 2 tracked candidate(s); 0 violations"
    );
  });

  it("pins the package wiring exactly once and in sequence", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repositoryRoot, "package.json"), "utf8")
    ) as RootPackage;
    expect(packageJson.scripts["lint:file-url-entry-guards"]).toBe(
      "node scripts/check-file-url-entry-guards.mjs"
    );

    const repositoryCommands = packageJson.scripts["lint:repo"]
      .split("&&")
      .map((command) => command.trim());
    const dedicatedCommand = "pnpm run lint:file-url-entry-guards";
    expect(
      repositoryCommands.filter((command) => command === dedicatedCommand)
    ).toEqual([dedicatedCommand]);
    const guardIndex = repositoryCommands.indexOf(dedicatedCommand);
    expect(repositoryCommands[guardIndex - 1]).toBe("pnpm run lint:timers");
    expect(repositoryCommands[guardIndex + 1]).toBe("pnpm run lint:ignores");
  });

  it("propagates clean and failing results through the package command", () => {
    const cleanRoot = makeRepository();
    writeFixture(cleanRoot, "clean.js", `${safeDirectComparison};\n`);
    track(cleanRoot, ["clean.js"]);

    const failingRoot = makeRepository();
    writeFixture(
      failingRoot,
      "seeded.mjs",
      `${templateConstruction()}\n${concatenationConstruction("'")}\n`
    );
    track(failingRoot, ["seeded.mjs"]);

    const clean = runPackageGuard(cleanRoot);
    expect(clean.error).toBeUndefined();
    expect(clean.status, clean.stderr).toBe(0);
    expect(clean.stderr).toBe("");
    expect(clean.stdout).toContain(
      "completed scan of 1 tracked candidate(s); 0 violations"
    );

    const failing = runPackageGuard(failingRoot);
    expect(failing.error).toBeUndefined();
    expect(failing.status).toBe(1);
    expect(failing.stderr).toContain(
      "2 violation(s) in 1 file(s) among 1 tracked candidate(s)"
    );
    expect(failing.stderr).toContain("seeded.mjs:1:1");
    expect(failing.stderr).toContain("seeded.mjs:2:1");
  });
});
