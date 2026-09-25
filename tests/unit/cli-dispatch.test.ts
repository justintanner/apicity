import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BUILTIN_COMMANDS } from "../../packages/cli/src/commands";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { runMain } from "../../packages/cli/src/main";
import { PROVIDERS } from "../../packages/cli/src/providers";

// The `apicity` dispatcher, W1's half of the move off `@apicity/mcp-server`.
// Everything here is local: no provider is addressed and no network is
// touched, so these run in the same replay-only suite as the rest.

const here = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(here, "../../packages/cli/package.json");
const binPath = join(here, "../../packages/cli/dist/src/bin.js");

const packageVersion = (
  JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version: string }
).version;

interface Capture {
  writer: CliWriter;
  out: string[];
  err: string[];
}

function capture(): Capture {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

describe("apicity dispatcher", () => {
  it("pins the built-in command list", () => {
    expect(BUILTIN_COMMANDS.map((command) => command.name)).toEqual([
      "commands",
      "describe",
      "providers",
      "skill",
      "skill install",
      "setup",
      "setup claude",
      "setup codex",
      "setup agents",
      "setup 1password",
      "doctor",
      "help",
      "version",
    ]);
  });

  // ME-4 (ac-yrwwpi): `dispatch` tries the endpoint form before the built-in
  // parser and keys on the first word, so a provider named like a built-in
  // would be silently unreachable. Nothing collides today; this keeps it so.
  it("shares no first word between a provider and a built-in", () => {
    const builtinWords = new Set(
      BUILTIN_COMMANDS.map((command) => command.name.split(" ")[0])
    );
    const collisions = Object.keys(PROVIDERS).filter((name) =>
      builtinWords.has(name)
    );

    expect(collisions).toEqual([]);
  });

  it("prints the package version for --version", async () => {
    const { writer, out } = capture();

    await expect(runMain(["--version"], writer)).resolves.toBe(0);
    expect(out).toEqual([packageVersion]);
  });

  it("prints usage and succeeds when invoked bare", async () => {
    const { writer, out, err } = capture();

    await expect(runMain([], writer)).resolves.toBe(0);
    expect(err).toEqual([]);
    const usage = out.join("\n");
    // Usage goes to stdout, and names every built-in.
    for (const command of BUILTIN_COMMANDS) {
      expect(usage).toContain(command.name);
    }
  });

  it("answers an unknown command with not_found on stderr", async () => {
    const { writer, out, err } = capture();

    await expect(runMain(["nosuch"], writer)).resolves.toBe(2);
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);

    const envelope = JSON.parse(err[0]) as Record<string, unknown>;
    expect(envelope.ok).toBe(false);
    expect(envelope.code).toBe("not_found");
    expect(envelope.error).toContain("nosuch");
    expect(envelope.hint).toContain("apicity providers");
  });
});

// `dist/` is built by `pnpm run build:cli`, which CI runs before the suite. A
// fresh worktree replaying tests has no `dist/`, so the title carries the
// reason rather than the run silently proving nothing.
const NO_DIST = "run `pnpm run build:cli` first";

// The `apicity` bin itself. Everything above drives `runMain` in-process,
// which never reaches the exit path — so this is the only place the shipped
// entrypoint runs as a process, and the defect it pins (a piped document cut
// off *with status 0*) was invisible to every other test in the suite.
const FLUSH_TITLE = "writes the whole document to a pipe drained slowly";
const hasBin = existsSync(binPath);

describe("apicity bin", () => {
  it.skipIf(!hasBin)(
    hasBin ? FLUSH_TITLE : `${FLUSH_TITLE} [skipped: ${NO_DIST}]`,
    async () => {
      const { stdout, code } = await new Promise<{
        stdout: string;
        code: number | null;
      }>((resolve, reject) => {
        const child = spawn(process.execPath, [binPath, "commands", "--json"], {
          stdio: ["ignore", "pipe", "ignore"],
        });
        const chunks: Buffer[] = [];

        // The slow reader: nothing is consumed until the child has had time to
        // fill the pipe and finish, which is exactly when `process.exit` used
        // to discard the remainder.
        child.stdout.pause();
        setTimeout(() => {
          child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
          child.stdout.resume();
        }, 250);

        child.on("error", reject);
        child.on("close", (status) =>
          resolve({
            stdout: Buffer.concat(chunks).toString("utf8"),
            code: status,
          })
        );
      });

      expect(code).toBe(0);
      // The truncation landed at 64 KB and at 128 KB across runs of the same
      // command, so the byte floor is the assertion that catches it: the whole
      // catalog is an order of magnitude larger, and a short document would
      // parse cleanly either way.
      expect(Buffer.byteLength(stdout, "utf8")).toBeGreaterThan(200_000);
      const { ok, data } = JSON.parse(stdout) as { ok: unknown; data: unknown };
      expect(ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect((data as unknown[]).length).toBeGreaterThan(1_000);
    }
  );
});
