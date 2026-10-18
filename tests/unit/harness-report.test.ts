import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const reportScript = path.join(repoRoot, "tests", "harness-report.ts");
const tsxBin = path.join(repoRoot, "node_modules", ".bin", "tsx");

function git(cwd: string, args: string[]): void {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`
    );
  }
}

function makeHar(recordingName: string): string {
  return JSON.stringify({
    log: {
      _recordingName: recordingName,
      entries: [
        {
          request: {
            method: "POST",
            url: "https://example.com/test",
            headers: [],
            postData: { mimeType: "application/json", text: "{}" },
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [],
            content: { mimeType: "application/json", text: "{}" },
          },
        },
      ],
    },
  });
}

function runReport(cwd: string, outDir: string) {
  const env = { ...process.env };
  delete env.GITHUB_BASE_REF;
  return spawnSync(tsxBin, [reportScript, "--out-dir", outDir], {
    cwd,
    encoding: "utf8",
    env,
  });
}

describe("harness-report --out-dir", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apicity-harness-report-"));
    git(tempDir, ["-c", "init.defaultBranch=main", "init"]);
    git(tempDir, ["config", "user.email", "test@example.com"]);
    git(tempDir, ["config", "user.name", "Test User"]);
    git(tempDir, ["config", "commit.gpgsign", "false"]);
    const baseFile = path.join(tempDir, "tests", "recordings", "base.txt");
    fs.mkdirSync(path.dirname(baseFile), { recursive: true });
    fs.writeFileSync(baseFile, "base", "utf-8");
    git(tempDir, ["add", "."]);
    git(tempDir, ["commit", "-m", "base commit"]);
    // getBaseBranch() diffs origin/main unless GITHUB_BASE_REF is set.
    git(tempDir, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
    git(tempDir, ["checkout", "-b", "feature"]);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a missing --out-dir before writing per-commit JSON", () => {
    const recDir = path.join(
      tempDir,
      "tests",
      "recordings",
      "openai_1234567890",
      "chat-completions_1111111111"
    );
    fs.mkdirSync(recDir, { recursive: true });
    fs.writeFileSync(
      path.join(recDir, "recording.har"),
      makeHar("chat-completions"),
      "utf-8"
    );
    git(tempDir, ["add", "."]);
    git(tempDir, ["commit", "-m", "Add openai chat recording"]);

    const outDir = path.join(tempDir, "does-not-exist", "report");
    expect(fs.existsSync(outDir)).toBe(false);

    const result = runReport(tempDir, outDir);
    expect(result.status, result.stderr).toBe(0);

    expect(fs.existsSync(path.join(outDir, "harness-report.html"))).toBe(true);
    const jsonFiles = fs
      .readdirSync(outDir)
      .filter((name) => name.startsWith("har-data-") && name.endsWith(".json"));
    expect(jsonFiles).toHaveLength(1);
    const jsonFile = jsonFiles[0];
    if (jsonFile === undefined) {
      throw new Error("expected one har-data json file");
    }
    const written = JSON.parse(
      fs.readFileSync(path.join(outDir, jsonFile), "utf-8")
    ) as { name: string }[];
    expect(written[0]?.name).toBe("openai/chat-completions");
  });

  it("creates a missing --out-dir when the branch has no extra commits", () => {
    const outDir = path.join(tempDir, "empty-out");
    expect(fs.existsSync(outDir)).toBe(false);

    const result = runReport(tempDir, outDir);
    expect(result.status, result.stderr).toBe(0);

    const html = fs.readFileSync(
      path.join(outDir, "harness-report.html"),
      "utf-8"
    );
    expect(html).toContain("No recording changes in this PR.");
    expect(
      fs.readdirSync(outDir).some((name) => name.startsWith("har-data-"))
    ).toBe(false);
  });
});
