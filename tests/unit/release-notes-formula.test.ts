import fs from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: number;
  issue_type: string;
  closed_at?: string;
  close_reason?: string;
  description?: string;
  metadata?: {
    close_reason?: string;
  };
}

interface ExecOptions {
  encoding: string;
  maxBuffer?: number;
  stdio: readonly unknown[];
}

interface ExecCall {
  command: string;
  args: string[];
  options: ExecOptions;
}

interface DirectoryEntry {
  name: string;
  isDirectory(): boolean;
}

function readReleaseNotesScript(): string {
  const formula = readReleaseFormula();
  const match = formula.match(/node <<'NODE' > "\$notes"\n([\s\S]*?)\nNODE\n/);

  if (!match) {
    throw new Error("Could not find GitHub release notes heredoc");
  }

  return match[1];
}

function readReleaseFormula(): string {
  return fs.readFileSync(
    ".beads/formulas/mol-apicity-release.formula.toml",
    "utf8"
  );
}

function readStepIds(): string[] {
  return readReleaseFormula()
    .split(/\n\[\[steps\]\]\n/)
    .slice(1)
    .map((block) => block.match(/^id = "([^"]+)"/m)?.[1])
    .filter((id): id is string => id !== undefined);
}

function issue(overrides: Partial<Issue>): Issue {
  return {
    id: "ac-test",
    title: "Test issue",
    status: "closed",
    priority: 2,
    issue_type: "task",
    ...overrides,
  };
}

describe("mol-apicity-release workflow", () => {
  it("keeps the release graph consolidated into the expected steps", () => {
    expect(readStepIds()).toEqual([
      "load-context",
      "verify-main-gates",
      "sync-stable-and-preflight",
      "prepare-release-commit",
      "publish-dry-run",
      "publish",
      "tag-push-and-github-release",
      "sync-main-and-smoke-install",
      "close",
    ]);
  });
});

describe("mol-apicity-release GitHub release notes", () => {
  it("uses a large bd buffer and filters non-shipped closures", () => {
    const calls: ExecCall[] = [];
    const output: string[] = [];
    const previousRelease = issue({
      id: "ac-release",
      title: "Release Apicity 0.4.1",
      closed_at: "2026-01-01T00:00:00Z",
      close_reason: "Published Apicity v0.4.1",
    });
    const closedWork = [
      issue({
        id: "ac-ship",
        title: "Shipped endpoint",
        issue_type: "feature",
        close_reason: "Merged to main at abc123",
      }),
      issue({
        id: "ac-cancel",
        title: "Canceled unstarted bead",
        close_reason: "closed per user request",
      }),
      issue({
        id: "ac-step",
        title: "Implement the solution",
        issue_type: "step",
        close_reason: "molecule cleanup: subtree force-closed by CloseSubtree",
      }),
      issue({
        id: "ac-order",
        title: "Order cleanup",
        issue_type: "order",
        close_reason: "closed per user request",
      }),
      issue({
        id: "ac-prev",
        title: "Already shipped in previous release",
        description: "This shipped in v0.4.1 already.",
        close_reason: "Merged to main at def456",
      }),
    ];

    const execFileSync = (
      command: string,
      args: string[],
      options: ExecOptions
    ): string => {
      calls.push({ command, args, options });

      if (command === "git") {
        if (args[0] === "describe") return "v0.4.1";
        if (args[0] === "for-each-ref") return "2026-01-02T00:00:00Z";
        if (args[0] === "log") return "abc123\tfeat: add endpoint";
      }

      if (command === "bd") {
        if (args.includes("--title")) {
          return JSON.stringify([previousRelease]);
        }

        return JSON.stringify(closedWork);
      }

      return "";
    };

    const fsMock = {
      readdirSync(): DirectoryEntry[] {
        return [{ name: "openai", isDirectory: () => true }];
      },
      existsSync(): boolean {
        return true;
      },
      readFileSync(file: string): string {
        if (file === "packages/mcp-server/package.json") {
          return JSON.stringify({
            name: "@apicity/mcp-server",
            version: "0.4.2",
          });
        }

        return JSON.stringify({ name: "@apicity/openai", version: "0.4.2" });
      },
    };

    runInNewContext(readReleaseNotesScript(), {
      require(id: string): unknown {
        if (id === "child_process") return { execFileSync };
        if (id === "fs") return fsMock;
        throw new Error(`Unexpected require: ${id}`);
      },
      console: {
        log(...values: unknown[]) {
          output.push(values.join(" "));
        },
      },
    });

    const notes = output.join("\n");
    const bdCalls = calls.filter((call) => call.command === "bd");

    expect(bdCalls.length).toBeGreaterThan(0);
    expect(
      calls.every((call) => call.options.maxBuffer === 64 * 1024 * 1024)
    ).toBe(true);
    expect(notes).toContain("Shipped endpoint");
    expect(notes).not.toContain("Canceled unstarted bead");
    expect(notes).not.toContain("Implement the solution");
    expect(notes).not.toContain("Order cleanup");
    expect(notes).not.toContain("Already shipped in previous release");
  });
});
