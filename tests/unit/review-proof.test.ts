import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("../../scripts/review-proof.mjs", import.meta.url)
);
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function createWorkspace(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "apicity-review-proof-"));
  temporaryDirectories.push(directory);
  writeFileSync(path.join(directory, "watched.txt"), "original\n");
  return directory;
}

function runProof(directory: string, command: string[]) {
  return spawnSync(
    process.execPath,
    [scriptPath, "--", "--watch", "watched.txt", "--", ...command],
    {
      cwd: directory,
      encoding: "utf8",
      timeout: 10_000,
    }
  );
}

describe("review proof command", () => {
  it("preserves a successful command result when watched files stay stable", () => {
    const directory = createWorkspace();
    const result = runProof(directory, [
      process.execPath,
      "-e",
      'console.log("proof command passed")',
    ]);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("proof command passed");
    expect(result.stderr).toContain("review-proof: stable 1 watched file");
    expect(result.stderr).toMatch(/sha256:[a-f0-9]{64} {2}watched\.txt/);
  });

  it("preserves a failed command status when watched files stay stable", () => {
    const directory = createWorkspace();
    const result = runProof(directory, [
      process.execPath,
      "-e",
      "process.exit(7)",
    ]);

    expect(result.status, result.stderr).toBe(7);
    expect(result.stderr).toContain("review-proof: command exit 7");
    expect(result.stderr).toContain("review-proof: stable 1 watched file");
  });

  it("rejects a proof corrupted by an edit that is restored", () => {
    const directory = createWorkspace();
    const mutation = [
      'const fs = require("node:fs");',
      'fs.writeFileSync("watched.txt", "changed\\n");',
      "setTimeout(() => {",
      '  fs.writeFileSync("watched.txt", "original\\n");',
      "}, 150);",
      "setTimeout(() => {}, 300);",
    ].join("\n");
    const result = runProof(directory, [process.execPath, "-e", mutation]);

    expect(result.status, result.stderr).toBe(86);
    expect(result.stderr).toContain("source interference detected");
    expect(result.stderr).toContain("watched.txt");
    expect(result.stderr).toContain("content changed during proof");
    expect(readFileSync(path.join(directory, "watched.txt"), "utf8")).toBe(
      "original\n"
    );
  });

  it("requires an explicit watch set", () => {
    const directory = createWorkspace();
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--", "--", process.execPath, "-e", "process.exit(0)"],
      { cwd: directory, encoding: "utf8", timeout: 10_000 }
    );

    expect(result.status).toBe(64);
    expect(result.stderr).toContain("at least one --watch path is required");
  });

  it("is exposed through the repository command surface", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["gc:review-proof"]).toBe(
      "node scripts/review-proof.mjs"
    );
  });

  it.each(["AGENTS.md", "CLAUDE.md"])(
    "documents the shared-worktree protocol in %s",
    (surface) => {
      const text = readFileSync(path.join(repoRoot, surface), "utf8");

      expect(text).toContain("pnpm run gc:review-proof --");
      expect(text).toContain("exits 86 if it observes interference");
      expect(text).toContain("use an isolated worktree");
    }
  );
});
