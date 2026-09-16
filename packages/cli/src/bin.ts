#!/usr/bin/env node
import { runMain } from "./main.js";

/**
 * Wait for one stream to reach the operating system.
 *
 * A zero-length write queues behind everything already written, so its
 * callback is the point at which the earlier chunks have left the process.
 * An error resolves it too — a reader that closed the pipe leaves nothing to
 * save, and failing here would replace the command's own exit status.
 */
function drain(stream: NodeJS.WriteStream): Promise<void> {
  return new Promise((resolve) => {
    stream.write("", () => resolve());
  });
}

/**
 * Exit with `code`, but not before stdout and stderr have drained.
 *
 * `process.exit` discards whatever is still buffered for a pipe, so
 * `apicity commands --json | …` used to be cut off at 64 KB or 128 KB — and
 * cut off with status 0, the one failure a caller cannot detect. Letting node
 * exit on its own would flush, but a keep-alive socket left by an endpoint
 * call can hold the event loop open, so the explicit exit stays and the drain
 * moves in front of it.
 */
async function exitAfterFlush(code: number): Promise<void> {
  await Promise.all([drain(process.stdout), drain(process.stderr)]);
  process.exit(code);
}

runMain(process.argv.slice(2)).then(
  (code) => exitAfterFlush(code),
  (err) => {
    console.error("[apicity] fatal:", err);
    return exitAfterFlush(7);
  }
);
