#!/usr/bin/env node

/**
 * Report whether the city's `apicity-release` pack import still points at this
 * repository's current `main`.
 *
 * All of the I/O lives here and none of the classification does: this file
 * collects facts — the `gc import status` document, the current `main` commit,
 * whether the pinned commit is reachable, and which watched pack paths differ
 * across the range — and hands them to `scripts/lib/check-pack-freshness.mjs`,
 * which decides every verdict.
 *
 * The repository root is resolved from this file's own location rather than
 * from `process.cwd()`, so the check reports on the checkout it was invoked
 * from even when the shell's working directory is somewhere else.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  PACK_CONTENT_PATHS,
  PACK_IMPORT_NAME,
  classifyPackFreshness,
  installedComparisonPath,
  renderPackFreshnessMessage,
  selectImport,
} from "./lib/check-pack-freshness.mjs";

const execFileAsync = promisify(execFile);

const COMMAND_TIMEOUT_MS = 30_000;
const COMPARISON_REF = "main";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function git(args) {
  const { stdout } = await execFileAsync("git", ["-C", REPO_ROOT, ...args], {
    timeout: COMMAND_TIMEOUT_MS,
  });

  return stdout;
}

/**
 * A missing `gc` binary is the one failure that means "not applicable" rather
 * than "broken": CI runners have no Gas City install and no `/gc` at all. Every
 * other failure keeps `available: true` so it is reported rather than excused.
 */
async function readImportStatus() {
  try {
    const { stdout } = await execFileAsync(
      "gc",
      ["import", "status", "--json"],
      { timeout: COMMAND_TIMEOUT_MS }
    );

    return { available: true, stdout };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { available: false, stdout: null, failure: null };
    }

    return {
      available: true,
      stdout: null,
      failure: error?.code ?? error?.name ?? "unknown",
    };
  }
}

function parseImportStatus(stdout) {
  if (stdout === null) {
    return null;
  }

  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

async function headCommit() {
  try {
    return (await git(["rev-parse", COMPARISON_REF])).trim();
  } catch {
    return null;
  }
}

async function isReachable(commit) {
  try {
    await git(["cat-file", "-e", `${commit}^{commit}`]);

    return true;
  } catch {
    return false;
  }
}

async function changedPackPaths(pinnedCommit) {
  try {
    const stdout = await git([
      "diff",
      "--name-only",
      `${pinnedCommit}..${COMPARISON_REF}`,
      "--",
      ...PACK_CONTENT_PATHS,
    ]);

    return stdout.split("\n").filter((line) => line.trim() !== "");
  } catch {
    return [];
  }
}

function digestOf(path) {
  try {
    return sha256(readFileSync(path));
  } catch {
    return null;
  }
}

/**
 * The opt-in byte comparison. It is advisory and never changes the exit code:
 * the primary verdict must not depend on the undocumented layout of the city's
 * content-addressed cache, and an operator who passes a path from it is asking
 * a second question, not replacing the first one.
 */
function installedComparisonLines(installedPath) {
  const relative = installedComparisonPath(installedPath);

  if (relative === null) {
    return [
      `advisory: --installed ${installedPath} does not sit under any watched pack`,
      `  path (${PACK_CONTENT_PATHS.join(", ")}), so it was not compared.`,
    ];
  }

  const installedDigest = digestOf(installedPath);
  const workingDigest = digestOf(`${REPO_ROOT}${relative}`);

  if (installedDigest === null || workingDigest === null) {
    return [
      `advisory: could not read both sides of the byte comparison for ${relative}.`,
    ];
  }

  if (installedDigest === workingDigest) {
    return [
      `advisory: the installed copy of ${relative} is byte-identical to this`,
      `  checkout (sha256 ${installedDigest}).`,
    ];
  }

  return [
    `advisory: the installed copy of ${relative} differs from this checkout.`,
    `  installed sha256 ${installedDigest}`,
    `  checkout  sha256 ${workingDigest}`,
    "  This does not change the exit code above; the pin is the primary signal.",
  ];
}

function parseArgs(argv) {
  const installedIndex = argv.indexOf("--installed");

  return {
    installed:
      installedIndex === -1 ? null : (argv[installedIndex + 1] ?? null),
  };
}

async function main() {
  const { installed } = parseArgs(process.argv.slice(2));
  const status = await readImportStatus();

  if (status.failure !== null && status.failure !== undefined) {
    console.log(`gc import status failed (${status.failure}).`);
  }

  const entry = selectImport(
    parseImportStatus(status.stdout),
    PACK_IMPORT_NAME
  );
  const pinnedCommit = entry?.pin?.commit ?? null;

  const head = status.available ? await headCommit() : null;
  const pinReachable =
    pinnedCommit === null ? false : await isReachable(pinnedCommit);
  const changedPaths =
    pinnedCommit !== null && pinReachable
      ? await changedPackPaths(pinnedCommit)
      : [];

  const result = classifyPackFreshness({
    gcAvailable: status.available,
    entry,
    headCommit: head,
    changedPaths,
    pinReachable,
  });

  const lines = [renderPackFreshnessMessage(result)];

  if (installed !== null) {
    lines.push(...installedComparisonLines(installed));
  }

  console.log(lines.join("\n"));
  process.exit(result.exitCode);
}

main().catch((error) => {
  // Code only, never a raw message: an unexpected failure here is still a
  // failure to verify, and must not be mistaken for a clean pin.
  console.error(
    `check:pack-freshness failed unexpectedly (${error?.code ?? error?.name ?? "unknown"})`
  );
  process.exit(2);
});
