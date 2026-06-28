import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getChangedRecordingsByCommit } from "../har-data";

// Run a git command in the temp repo with stdio suppressed. git writes hints
// ("hint: Using 'master' as the name…") and status lines ("Switched to a new
// branch 'feature'") to stderr/stdout; with inherited stdio those leak into
// the vitest report and pollute every run (three times — once per test).
function git(args: string): void {
  execSync(`git ${args}`, { stdio: "ignore" });
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

describe("getChangedRecordingsByCommit", () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apicity-harness-"));
    process.chdir(tempDir);

    // Initialize git repo. init.defaultBranch=main creates the base branch
    // directly so no rename (and its chatter) is needed.
    git("-c init.defaultBranch=main init");
    git("config user.email 'test@example.com'");
    git("config user.name 'Test User'");

    // Create base directory structure and base commit on main
    const baseFile = path.join("tests", "recordings", "base.txt");
    fs.mkdirSync(path.dirname(baseFile), { recursive: true });
    fs.writeFileSync(baseFile, "base", "utf-8");
    git("add .");
    git("commit -m 'base commit'");

    // Create feature branch
    git("checkout -b feature");
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("groups changed recordings by commit correctly", () => {
    // Commit 1: add openai recording
    const rec1Dir = path.join(
      "tests",
      "recordings",
      "openai_1234567890",
      "chat-completions_1111111111"
    );
    fs.mkdirSync(rec1Dir, { recursive: true });
    fs.writeFileSync(
      path.join(rec1Dir, "recording.har"),
      makeHar("chat-completions"),
      "utf-8"
    );
    git("add .");
    git("commit -m 'Add openai chat recording'");

    // Commit 2: add xai recording
    const rec2Dir = path.join(
      "tests",
      "recordings",
      "xai_9876543210",
      "grok-chat_2222222222"
    );
    fs.mkdirSync(rec2Dir, { recursive: true });
    fs.writeFileSync(
      path.join(rec2Dir, "recording.har"),
      makeHar("grok-chat"),
      "utf-8"
    );
    git("add .");
    git("commit -m 'Add xai grok recording'");

    // Run the function against main
    const changeset = getChangedRecordingsByCommit("main");

    // Should have 2 commits
    expect(changeset.size).toBe(2);

    const shas = Array.from(changeset.keys());
    expect(shas.length).toBe(2);

    // git log returns newest first, so first SHA is the xai commit,
    // second SHA is the openai commit

    // First commit (newest) should have the xai recording
    const firstCommitRecordings = changeset.get(shas[0])!;
    expect(firstCommitRecordings.length).toBe(1);
    expect(firstCommitRecordings[0].provider).toBe("xai");
    expect(firstCommitRecordings[0].recordingName).toBe("grok-chat");
    expect(firstCommitRecordings[0].changeType).toBe("new");
    expect(firstCommitRecordings[0].entries.length).toBe(1);

    // Second commit (older) should have the openai recording
    const secondCommitRecordings = changeset.get(shas[1])!;
    expect(secondCommitRecordings.length).toBe(1);
    expect(secondCommitRecordings[0].provider).toBe("openai");
    expect(secondCommitRecordings[0].recordingName).toBe("chat-completions");
    expect(secondCommitRecordings[0].changeType).toBe("new");
    expect(secondCommitRecordings[0].entries.length).toBe(1);
  });

  it("returns empty map when no commits on branch", () => {
    // No commits on feature branch beyond main
    const changeset = getChangedRecordingsByCommit("main");
    expect(changeset.size).toBe(0);
  });

  it("returns empty arrays for commits that do not touch recordings", () => {
    // Commit that touches a non-recording file
    fs.writeFileSync("README.md", "# Hello", "utf-8");
    git("add .");
    git("commit -m 'Update readme'");

    const changeset = getChangedRecordingsByCommit("main");
    expect(changeset.size).toBe(1);

    const shas = Array.from(changeset.keys());
    expect(changeset.get(shas[0])!.length).toBe(0);
  });
});
