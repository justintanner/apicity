#!/usr/bin/env node
/**
 * Changed-file preflight: format/lint only the changed surface, then run the
 * repo-wide correctness checks that still matter for any local change.
 *
 * Use this when work is not scoped cleanly to one provider but the changed
 * files are known. For provider-only work, `dev:preflight:provider` remains
 * faster because it also scopes tests to that provider.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  collectChangedTargets,
  filterEslintTargets,
  formatTargetList,
  formatUsage,
  parseChangedArgs,
} from "./lib/changed-files.mjs";
import { repoRoot } from "./lib/provider-scope.mjs";

const ESLINT_BIN = "./node_modules/eslint/bin/eslint.js";
const ESLINT_CACHE = "node_modules/.cache/eslint/";

export function createPreflightSteps(targets) {
  const eslintTargets = filterEslintTargets(targets);

  return [
    {
      title: "prettier --write (changed files)",
      command: "pnpm",
      args: ["exec", "prettier", "--write", "--ignore-unknown", ...targets],
    },
    {
      title: "typecheck",
      command: "pnpm",
      args: ["run", "typecheck"],
    },
    {
      title: "eslint (changed JS/TS files)",
      command: "node",
      args: [
        "--max-old-space-size=4096",
        ESLINT_BIN,
        ...eslintTargets,
        "--cache",
        "--cache-location",
        ESLINT_CACHE,
      ],
      skip: eslintTargets.length === 0,
      skipMessage: "No JS/TS changed files; skipping scoped ESLint.",
    },
    {
      title: "endpoint comments",
      command: "node",
      args: ["scripts/check-endpoint-comments.mjs"],
    },
    {
      title: "orphan recordings",
      command: "node",
      args: ["scripts/check-orphan-recordings.mjs"],
    },
    {
      title: "test timers",
      command: "node",
      args: ["scripts/check-test-timers.mjs"],
    },
    {
      title: "compare-cost payload schemas",
      command: "pnpm",
      args: ["run", "lint:compare-payloads"],
    },
    {
      title: "test:run",
      command: "pnpm",
      args: ["run", "test:run"],
    },
  ];
}

export function runPreflightSteps(
  steps,
  { execute = executeStep, log = console.error } = {}
) {
  for (const step of steps) {
    log(`\n> ${step.title}`);

    if (step.skip) {
      log(step.skipMessage);
      continue;
    }

    const status = execute(step);
    if (status !== 0) {
      log(`\n${step.title} failed (exit ${status})`);
      return status;
    }
  }

  return 0;
}

export function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseChangedArgs(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("");
    console.error(formatUsage("pnpm run dev:preflight:changed --"));
    return 1;
  }

  if (parsed.help) {
    console.log(formatUsage("pnpm run dev:preflight:changed --"));
    return 0;
  }

  let targets;
  try {
    targets = collectChangedTargets(parsed);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  if (targets.length === 0) {
    console.error(
      "No changed files found; changed-file preflight has no work."
    );
    return 0;
  }

  console.error("Changed-file preflight targets:");
  console.error(formatTargetList(targets));

  const status = runPreflightSteps(createPreflightSteps(targets));
  if (status !== 0) return status;

  console.error("\nChanged-file preflight green.");
  return 0;
}

function executeStep(step) {
  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
