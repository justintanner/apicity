#!/usr/bin/env node

/**
 * Run one proof command while guarding the source files that make its result
 * meaningful.
 *
 * Gas City review lanes may execute concurrently against one source-anchor
 * worktree. A before/after hash alone misses an edit that another lane restores
 * before the command exits, so this runner combines SHA-256 snapshots with
 * filesystem events and short-interval hash polling. It never edits or restores
 * a watched file.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { watch } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";

const USAGE_EXIT = 64;
const INTERFERENCE_EXIT = 86;
const POLL_INTERVAL_MS = 20;

const usage = `Usage:
  pnpm run gc:review-proof -- \\
    --watch <repo-relative-file> [--watch <repo-relative-file> ...] \\
    -- <command> [args...]

The command runs only after every watched file has an initial SHA-256 digest.
Exit 86 means a watched file changed while the proof command was running.`;

class UsageError extends Error {}

function parseArguments(rawArgs) {
  // pnpm 10 forwards the separator after a script name. Direct Node execution
  // does not, so accept both `node script --watch ...` and the documented
  // `pnpm run script -- --watch ...` shape.
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { command: [], help: true, watchPaths: [] };
  }

  const separator = args.indexOf("--");
  if (separator === -1) {
    throw new UsageError("missing -- separator before the proof command");
  }

  const optionArgs = args.slice(0, separator);
  const command = args.slice(separator + 1);
  const watchPaths = [];

  for (let index = 0; index < optionArgs.length; index += 1) {
    const option = optionArgs[index];
    if (option !== "--watch") {
      throw new UsageError(`unknown option: ${option}`);
    }

    const watchPath = optionArgs[index + 1];
    if (!watchPath || watchPath === "--watch") {
      throw new UsageError("--watch requires a repo-relative file path");
    }
    watchPaths.push(watchPath);
    index += 1;
  }

  if (watchPaths.length === 0) {
    throw new UsageError("at least one --watch path is required");
  }
  if (command.length === 0) {
    throw new UsageError("a proof command is required after --");
  }

  return { command, help: false, watchPaths };
}

async function resolveWatchFiles(cwd, watchPaths) {
  const files = [];
  const seen = new Set();

  for (const input of watchPaths) {
    if (path.isAbsolute(input)) {
      throw new UsageError(`--watch paths must be repo-relative: ${input}`);
    }

    const absolute = path.resolve(cwd, input);
    const relative = path.relative(cwd, absolute);
    if (
      relative.length === 0 ||
      relative === ".." ||
      relative.startsWith(`..${path.sep}`)
    ) {
      throw new UsageError(`--watch path escapes the working tree: ${input}`);
    }

    let stat;
    try {
      stat = await lstat(absolute);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new UsageError(`cannot watch ${input}: ${detail}`);
    }

    if (!stat.isFile() && !stat.isSymbolicLink()) {
      throw new UsageError(`--watch path is not a file: ${input}`);
    }

    const normalized = relative.split(path.sep).join("/");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    files.push({
      absolute,
      basename: path.basename(absolute),
      directory: path.dirname(absolute),
      relative: normalized,
    });
  }

  files.sort((left, right) => left.relative.localeCompare(right.relative));
  return files;
}

async function digest(file) {
  const bytes = await readFile(file.absolute);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

async function takeSnapshot(files) {
  const snapshot = new Map();
  for (const file of files) {
    snapshot.set(file.relative, await digest(file));
  }
  return snapshot;
}

function printSnapshot(label, files, snapshot) {
  console.error(`review-proof: ${label}`);
  for (const file of files) {
    console.error(`${snapshot.get(file.relative)}  ${file.relative}`);
  }
}

function startWatchers(files, recordInterference) {
  const byDirectory = new Map();
  for (const file of files) {
    const directoryFiles = byDirectory.get(file.directory) ?? new Map();
    directoryFiles.set(file.basename, file.relative);
    byDirectory.set(file.directory, directoryFiles);
  }

  const watchers = [];
  for (const [directory, directoryFiles] of byDirectory) {
    const watcher = watch(directory, (eventType, filename) => {
      if (filename === null) {
        for (const relative of directoryFiles.values()) {
          recordInterference(relative, `filesystem ${eventType} event`);
        }
        return;
      }

      const relative = directoryFiles.get(String(filename));
      if (relative) {
        recordInterference(relative, `filesystem ${eventType} event`);
      }
    });
    watcher.on("error", (error) => {
      for (const relative of directoryFiles.values()) {
        recordInterference(relative, `watcher error: ${error.message}`);
      }
    });
    watchers.push(watcher);
  }
  return watchers;
}

function runCommand(command, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      cwd,
      env: process.env,
      stdio: "inherit",
    });
    let spawnError = null;

    child.on("error", (error) => {
      spawnError = error;
    });
    child.on("close", (code, signal) => {
      resolve({ code, signal, spawnError });
    });
  });
}

function commandExit(result) {
  if (result.spawnError) return 127;
  if (typeof result.code === "number") return result.code;
  return 1;
}

async function main() {
  let parsed;
  try {
    parsed = parseArguments(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`review-proof: ${error.message}`);
    console.error(usage);
    process.exitCode = USAGE_EXIT;
    return;
  }

  if (parsed.help) {
    console.log(usage);
    return;
  }

  const cwd = process.cwd();
  let files;
  try {
    files = await resolveWatchFiles(cwd, parsed.watchPaths);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`review-proof: ${error.message}`);
    console.error(usage);
    process.exitCode = USAGE_EXIT;
    return;
  }

  const interference = new Map();
  const recordInterference = (relative, reason) => {
    const reasons = interference.get(relative) ?? new Set();
    reasons.add(reason);
    interference.set(relative, reasons);
  };

  const baseline = await takeSnapshot(files);
  const watchers = startWatchers(files, recordInterference);
  let pollInFlight = null;

  const poll = async () => {
    if (pollInFlight) return pollInFlight;
    pollInFlight = (async () => {
      for (const file of files) {
        try {
          const current = await digest(file);
          if (current !== baseline.get(file.relative)) {
            recordInterference(file.relative, "hash changed during proof");
          }
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          recordInterference(file.relative, `hash failed: ${detail}`);
        }
      }
    })().finally(() => {
      pollInFlight = null;
    });
    return pollInFlight;
  };

  // Close the baseline-to-spawn race: watchers are active before this second
  // snapshot, and a mismatch prevents the proof command from starting.
  await poll();
  printSnapshot("baseline", files, baseline);

  if (interference.size > 0) {
    for (const watcher of watchers) watcher.close();
    reportInterference(interference);
    process.exitCode = INTERFERENCE_EXIT;
    return;
  }

  const pollTimer = setInterval(() => {
    void poll();
  }, POLL_INTERVAL_MS);

  const result = await runCommand(parsed.command, cwd);
  clearInterval(pollTimer);
  await poll();
  const finalSnapshot = await takeSnapshot(files);
  for (const watcher of watchers) watcher.close();

  for (const file of files) {
    if (finalSnapshot.get(file.relative) !== baseline.get(file.relative)) {
      recordInterference(file.relative, "final hash differs from baseline");
    }
  }

  const exitCode = commandExit(result);
  if (result.spawnError) {
    console.error(
      `review-proof: command failed to start: ${result.spawnError}`
    );
  } else if (result.signal) {
    console.error(`review-proof: command signal ${result.signal}`);
  } else {
    console.error(`review-proof: command exit ${exitCode}`);
  }
  printSnapshot("final", files, finalSnapshot);

  if (interference.size > 0) {
    reportInterference(interference);
    process.exitCode = INTERFERENCE_EXIT;
    return;
  }

  const noun = files.length === 1 ? "file" : "files";
  console.error(`review-proof: stable ${files.length} watched ${noun}`);
  process.exitCode = exitCode;
}

function reportInterference(interference) {
  console.error("review-proof: source interference detected");
  for (const [relative, reasons] of interference) {
    console.error(
      `review-proof: ${relative}: content changed during proof (${[
        ...reasons,
      ].join(", ")})`
    );
  }
}

await main().catch((error) => {
  console.error(
    `review-proof: ${error instanceof Error ? error.stack : String(error)}`
  );
  process.exitCode = 1;
});
