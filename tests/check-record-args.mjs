#!/usr/bin/env node
/**
 * Wrapper for `pnpm test:integration:record` that adds a safety rail.
 *
 * Refuses to launch vitest in destructive record mode unless the caller
 * passed at least one .test.{ts,tsx,js,jsx} positional arg, OR set
 * POLLY_FORCE_ALL=1 to explicitly opt into a full-suite re-record.
 *
 * Vitest workers run in tinypool processes that don't inherit the parent's
 * CLI argv, so we can't enforce this check from inside setupPolly. Hence
 * this wrapper runs in the parent shell before vitest is launched, and
 * forwards all positional args to vitest.
 */

import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const hasFilter = argv.some(
  (arg) => !arg.startsWith("-") && /\.test\.(ts|tsx|js|jsx)/.test(arg)
);

if (!hasFilter && process.env.POLLY_FORCE_ALL !== "1") {
  console.error(
    "\n\u001b[31mPOLLY_MODE=record refuses to run without a test file filter.\u001b[0m\n\n" +
      "  Use \u001b[36mpnpm test:integration:record-missing\u001b[0m to record only NEW tests (safe).\n" +
      "  Or pass a specific file:\n" +
      "    \u001b[36mpnpm test:integration:record -- tests/integration/<file>.test.ts\u001b[0m\n\n" +
      "  Override with \u001b[33mPOLLY_FORCE_ALL=1\u001b[0m if you really do want to overwrite ALL recordings.\n"
  );
  process.exit(1);
}

const result = spawnSync(
  "op",
  [
    "run",
    "--env-file=.env.tpl",
    "--",
    "env",
    "POLLY_MODE=record",
    "pnpm",
    "vitest",
    "run",
    "--config",
    "tests/vitest.integration.ts",
    ...argv,
  ],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
