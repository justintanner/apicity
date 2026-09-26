import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// .claude/CLAUDE.md -> Testing -> "Grep a diff's paths with `--name-only`":
// bare `git diff --stat` elides long paths to fit its width, which in a pipe
// is COLUMNS if exported, else 80, so a grep for a full path prints 0 for a
// criterion that passes (ac-tjei1o). This guard keeps that spelling out of
// the tracked files agents copy commands from. Files come from
// `git ls-files`, so the untracked plans/ tree is never read.

// `git diff ... --stat` with no `=<width>`, piped into grep.
const BARE_STAT_GREP =
  /\bgit\s+(?:-C\s+\S+\s+)?diff\b[^|\n]*?--stat(?![=\w-])[^|\n]*\|\s*(?:command\s+)?[ef]?grep\b/;

// Fixtures are evidence records, not guidance. packages/ is where the
// provider and cli scopes live, so leaving it out keeps provider-scoped diffs
// away from this guard's inputs.
const EXCLUDED_PREFIXES = ["plans/", "tests/fixtures/", "packages/"];

// Regular files only: `-s` prints `<mode> <object> <stage>\t<path>`, and
// scripts/ also tracks symlinks (mode 120000) into a pack checkout that does
// not exist on this host or on CI, so reading them would throw ENOENT.
function scannedFiles(): string[] {
  return execFileSync(
    "git",
    ["ls-files", "-s", "-z", "--", "*.md", "scripts/"],
    { cwd: repoRoot, encoding: "utf8" }
  )
    .split("\0")
    .filter((entry) => entry.startsWith("100"))
    .map((entry) => entry.slice(entry.indexOf("\t") + 1))
    .filter(
      (file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))
    );
}

// 1-based start lines of the offending commands; a trailing `\` joins the
// next line, so a pipeline split across lines is still one command.
function offendingLines(text: string): number[] {
  const lines = text.split("\n");
  const hits: number[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const start = index;
    let command = lines[index];
    while (command.endsWith("\\") && index + 1 < lines.length) {
      index += 1;
      command = `${command.slice(0, -1)} ${lines[index]}`;
    }
    if (BARE_STAT_GREP.test(command)) {
      hits.push(start + 1);
    }
  }
  return hits;
}

describe("diff-grep convention", () => {
  it("flags bare --stat piped into grep, and nothing safer", () => {
    const flagged = [
      "git diff --stat origin/main...HEAD -- tests/fixtures/kie-pricing-evidence | command grep -c 'x'",
      "git diff --stat origin/main...HEAD -- tests/fixtures/kie-pricing-evidence \\\n  | command grep -c 'x'",
      "git diff --stat | grep -c '|'",
      "git -C /tmp/checkout diff --stat HEAD~1 | fgrep -c 'x'",
    ];
    const passed = [
      "git diff --name-only origin/main...HEAD | command grep -c 'x'",
      "git diff --stat=200 origin/main...HEAD | command grep -c 'x'",
      "git diff --stat origin/main...HEAD",
      "never bare `git diff --stat` when grepping a path",
    ];
    for (const text of flagged) {
      expect(offendingLines(text), text).toEqual([1]);
    }
    for (const text of passed) {
      expect(offendingLines(text), text).toEqual([]);
    }
  });

  it("finds no bare --stat grep in tracked guidance or scripts", () => {
    const files = scannedFiles();
    expect(files).toContain(".claude/CLAUDE.md");
    expect(files).toContain("AGENTS.md");
    const offenders = files.flatMap((file) =>
      offendingLines(fs.readFileSync(path.join(repoRoot, file), "utf8")).map(
        (line) => `${file}:${line}`
      )
    );
    expect(offenders).toEqual([]);
  });
});
