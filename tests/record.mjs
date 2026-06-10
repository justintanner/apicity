#!/usr/bin/env node
/**
 * Recording launcher for the Polly integration suite.
 *
 * Modes:
 *   --mode=record-missing  Record HARs only for tests with no recording (safe).
 *   --mode=record          Destructive re-record. Requires an existing
 *                          .test.* file filter, or POLLY_FORCE_ALL=1 to
 *                          explicitly opt into a full-suite re-record.
 *
 * pnpm inserts a literal "--" when forwarding script args, at every
 * `pnpm run` nesting level. If that "--" reaches an inner `pnpm vitest`
 * invocation, everything after it is silently swallowed and vitest runs the
 * FULL suite — in record mode that clobbers every HAR on disk. So this
 * wrapper strips "--" tokens, verifies filter files exist on disk, and
 * spawns vitest via npx with no pnpm layer in between.
 *
 * Vitest workers run in tinypool processes that don't inherit the parent's
 * CLI argv, so this guard can't live inside setupPolly; it must run in the
 * parent shell before vitest launches.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const rawArgs = process.argv.slice(2);
const modeArg = rawArgs.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.slice("--mode=".length);

if (mode !== "record" && mode !== "record-missing") {
  console.error(
    "Usage: node tests/record.mjs --mode=record|record-missing [test files...]"
  );
  process.exit(1);
}

const args = rawArgs.filter((arg) => arg !== "--" && arg !== modeArg);
const testFiles = args.filter(
  (arg) => !arg.startsWith("-") && /\.test\.(ts|tsx|js|jsx)/.test(arg)
);
const missingFiles = testFiles.filter((file) => !existsSync(file));

if (missingFiles.length > 0) {
  console.error(
    "\n\u001b[31mTest file filter does not exist on disk:\u001b[0m\n" +
      missingFiles.map((file) => `    ${file}`).join("\n") +
      "\n\n  Pass paths relative to the repo root, e.g.\n" +
      "    \u001b[36mtests/integration/openai-chat.test.ts\u001b[0m\n"
  );
  process.exit(1);
}

if (
  mode === "record" &&
  testFiles.length === 0 &&
  process.env.POLLY_FORCE_ALL !== "1"
) {
  console.error(
    "\n\u001b[31mPOLLY_MODE=record refuses to run without a test file filter.\u001b[0m\n\n" +
      "  Use \u001b[36mpnpm run dev:record\u001b[0m to record only NEW tests (safe).\n" +
      "  Or pass a specific file:\n" +
      "    \u001b[36mpnpm run dev:rerecord -- tests/integration/<file>.test.ts\u001b[0m\n\n" +
      "  Override with \u001b[33mPOLLY_FORCE_ALL=1\u001b[0m if you really do want to overwrite ALL recordings.\n"
  );
  process.exit(1);
}

const result = spawnSync(
  "op",
  [
    "run",
    "--env-file=.env",
    "--",
    "env",
    `POLLY_MODE=${mode}`,
    "npx",
    "vitest",
    "run",
    "--config",
    "tests/vitest.integration.ts",
    ...args,
  ],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
