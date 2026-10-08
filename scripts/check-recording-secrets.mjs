#!/usr/bin/env node
/**
 * Recorded-secrets lint (ac-yv3xum), the second check of
 * `pnpm run lint:recordings`.
 *
 * `tests/harness.ts` redacts secrets before Polly persists a recording, so a
 * committed HAR that still holds one was edited by hand or written by a
 * regressed harness. This parses every HAR under `tests/recordings` and fails,
 * naming the file, the entry and the header or field, when
 *
 * - a request header the harness redacts (the table in
 *   `scripts/lib/har-secrets.mjs`), or the guard-only `api-key`, holds anything
 *   but its placeholder, so `authorization` must be exactly `Bearer ***`; or
 * - a fal `checkpoint` in a response body still carries signed material: a
 *   `signature` other than `***`, or a `url` with a query.
 *
 * Response bodies are JSON escaped inside each entry's `content.text`, which
 * is why `grep -rl '"signature"' tests/recordings` listed neither extend-video
 * recording while both stored a live checkpoint signature. Only an object
 * under a `checkpoint` key is held to the signature rule, so the kimicoding
 * thinking-block signatures that those recordings' replays need pass as
 * recorded. A report never prints a stored value.
 *
 * Exit 0 when clean; 1 on any finding, or when there was no recording to
 * check; 2 on a usage error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER,
  findLiveFalCheckpoints,
  findUnredactedRequestSecrets,
} from "./lib/har-secrets.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RECORDINGS_DIR = path.join(root, "tests", "recordings");

const USAGE = `Usage: node scripts/check-recording-secrets.mjs [options]

  --recordings <dir>  Directory to check (default: tests/recordings)
  --help, -h          Show this help`;

/**
 * @param {number} count
 * @returns {string}
 */
function recordingsLabel(count) {
  return `${count} recording${count === 1 ? "" : "s"}`;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listHarFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHarFiles(fullPath);
    return entry.name.endsWith(".har") ? [fullPath] : [];
  });
}

/**
 * Checks every HAR under `recordingsDir` and describes each finding in one
 * line, its file named relative to the working directory.
 *
 * @param {string} recordingsDir
 * @returns {{ recordings: number; problems: string[] }}
 */
export function checkRecordingSecrets(recordingsDir) {
  const files = listHarFiles(recordingsDir).sort();
  /** @type {string[]} */
  const problems = [];

  for (const file of files) {
    const name = path.relative(process.cwd(), file);
    let har;
    try {
      har = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      // The parser's message quotes the text around the fault, which could be
      // the very value this check exists to keep out of logs.
      problems.push(`${name}: not valid JSON`);
      continue;
    }

    for (const secret of findUnredactedRequestSecrets(har)) {
      problems.push(
        `${name}: entry ${secret.entryIndex} request header ${secret.name} ` +
          `is not ${JSON.stringify(secret.placeholder)}`
      );
    }
    for (const live of findLiveFalCheckpoints(har)) {
      const fault =
        live.field === "signature"
          ? `is not ${JSON.stringify(FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER)}`
          : "carries a query string";
      problems.push(
        `${name}: entry ${live.entryIndex} response body ` +
          `${live.path}.${live.field} ${fault}`
      );
    }
  }

  return { recordings: files.length, problems };
}

/**
 * @param {string[]} [argv]
 * @param {{ stdout: { write(chunk: string): unknown }; stderr: { write(chunk: string): unknown } }} [io]
 * @returns {number} the exit code
 */
export function main(argv = process.argv.slice(2), io = process) {
  let recordingsDir = DEFAULT_RECORDINGS_DIR;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      io.stdout.write(`${USAGE}\n`);
      return 0;
    }
    if (arg === "--recordings" && i + 1 < argv.length) {
      recordingsDir = path.resolve(argv[++i]);
      continue;
    }
    io.stderr.write(
      `check-recording-secrets: unknown or incomplete argument ` +
        `${JSON.stringify(arg)}\n${USAGE}\n`
    );
    return 2;
  }

  let result;
  try {
    result = checkRecordingSecrets(recordingsDir);
  } catch (error) {
    io.stderr.write(
      `check-recording-secrets: cannot read ${recordingsDir}: ` +
        `${error instanceof Error ? error.message : String(error)}\n`
    );
    return 2;
  }

  if (result.recordings === 0) {
    io.stderr.write(
      `check-recording-secrets: no .har file under ${recordingsDir}, ` +
        "so nothing was checked\n"
    );
    return 1;
  }
  if (result.problems.length > 0) {
    for (const problem of result.problems) io.stderr.write(`${problem}\n`);
    io.stderr.write(
      `check-recording-secrets: ${result.problems.length} stored secret(s) ` +
        `in ${recordingsLabel(result.recordings)}. Each must hold what ` +
        "tests/harness.ts writes at persist time.\n"
    );
    return 1;
  }

  io.stdout.write(
    `check-recording-secrets: OK (${recordingsLabel(result.recordings)})\n`
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
