import { spawn } from "node:child_process";

// ---------------------------------------------------------------------------
// the subprocess seam
// ---------------------------------------------------------------------------
//
// Moved here from `setup.ts` unchanged (review advisory A-4, landed by
// ac-yrwwpi): the seam is generic — `doctor` runs `op --version` and
// `op item list` through it, and `setup` runs `claude plugin …` and the
// `setup 1password` probe — so it lives at its own address rather than inside
// the module that installs plugins.

/**
 * The stdio every subprocess this CLI starts gets: no stdin at all, and pipes
 * for the two output streams.
 *
 * `setup` and `doctor` run inside agent sessions whose own stdin is the
 * transport. A child that inherits it can eat the host's bytes, and a child
 * that inherits a pipe nobody closes blocks until it is killed.
 */
export const SUBPROCESS_STDIO = ["ignore", "pipe", "pipe"] as const;
export type SubprocessStdio = typeof SUBPROCESS_STDIO;

export interface SubprocessOptions {
  /** Hard ceiling; the child is killed when it expires. */
  timeoutMs: number;
  /** Always `SUBPROCESS_STDIO` — carried here so a fake seam records it. */
  stdio: SubprocessStdio;
  /**
   * Variables layered over the inherited environment, for this child alone.
   *
   * The only channel a secret may take into a child: argv is visible to every
   * `ps` on the host, so `setup 1password` and `doctor` hand `op` its
   * service-account token here, as `OP_SERVICE_ACCOUNT_TOKEN`, and a fake
   * seam can assert it arrived nowhere else.
   */
  env?: Record<string, string>;
}

export interface SubprocessResult {
  /** The exit status, or 1 for a failure that produced none (spawn, timeout). */
  code: number;
  stdout: string;
  stderr: string;
  /** True when the child was killed at `timeoutMs`. */
  timedOut: boolean;
  /** True when the binary itself was not found (the spawn failed `ENOENT`). */
  notFound?: boolean;
}

/** How `setup` and `doctor` reach a binary; a test passes a fake. */
export type SubprocessRunner = (
  command: string,
  args: string[],
  options: SubprocessOptions
) => Promise<SubprocessResult>;

/**
 * Run one binary, bounded, with nothing on its stdin.
 *
 * `spawn` rather than the `execFile` the plan named: `execFile` does not
 * forward a `stdio` option to `spawn` at all (Node v24.21.0, probed during
 * this slice — a child reading fd 0 blocked for the full timeout with
 * `stdio: ["ignore", "pipe", "pipe"]` passed and was killed), so `execFile`
 * would have left every child holding an open stdin pipe and met the "nothing
 * reads stdin" requirement only by killing the child at the deadline. The same
 * probe against `spawn` gave fd 0 as `/dev/null` and a 49 ms exit.
 *
 * It never rejects: a missing binary, a non-zero status and a timeout are all
 * results, because both callers report them as a row or a hint rather than a
 * stack.
 */
export function runSubprocess(
  command: string,
  args: string[],
  options: SubprocessOptions
): Promise<SubprocessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: [...options.stdio],
      timeout: options.timeoutMs,
      // Only when asked: a child given no `env` inherits exactly as before.
      ...(options.env === undefined
        ? {}
        : { env: { ...process.env, ...options.env } }),
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString()));

    child.on("error", (err) => {
      const missing = (err as NodeJS.ErrnoException).code === "ENOENT";
      resolve({
        code: 1,
        stdout,
        stderr: stderr || err.message,
        timedOut: false,
        ...(missing ? { notFound: true } : {}),
      });
    });
    child.on("close", (code, signal) => {
      // The deadline is the only signal this CLI ever sends: `timeout` kills
      // with SIGTERM and reports a null status, so a signalled close is it.
      resolve({ code: code ?? 1, stdout, stderr, timedOut: signal !== null });
    });
  });
}
