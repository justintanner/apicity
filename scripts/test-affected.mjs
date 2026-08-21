#!/usr/bin/env node
/**
 * Run the smallest trustworthy replay test set for the current diff.
 *
 * Provider-only diffs map to one or more `test:provider` runs. Anything that
 * touches shared code, harness/config, unit/functional tests, docs, or an
 * otherwise ambiguous path falls back to the full `test:run` gate.
 */

import { spawnSync } from "node:child_process";
import { classifyChangedFiles } from "./lib/affected-provider-tests.mjs";
import { listCrossCuttingTests } from "./lib/cross-cutting-tests.mjs";
import { listProviderTests, repoRoot } from "./lib/provider-scope.mjs";

const DEFAULT_BASE = process.env.APICITY_TEST_BASE || "origin/main";

const options = parseArgs(normalizeRunArgs(process.argv.slice(2)));

if (options.help) {
  printUsage();
  process.exit(0);
}

if (options.forceFull) {
  console.error("test:affected --full: running pnpm run test:run");
  run("pnpm", ["run", "test:run", ...options.passthrough]);
  process.exit(0);
}

const changedFiles = collectChangedFiles(options.base);
const decision = classifyChangedFiles(changedFiles);

console.error(`test:affected base=${options.base}`);

if (changedFiles.length === 0) {
  console.error("No changed files detected; running full pnpm run test:run.");
  run("pnpm", ["run", "test:run", ...options.passthrough]);
  process.exit(0);
}

if (decision.mode === "providers") {
  console.error(`Provider-scoped diff: ${decision.providers.join(", ")}`);

  for (const provider of decision.providers) {
    run("pnpm", ["run", "test:provider", provider, ...options.passthrough]);
  }

  // Cross-cutting repo-wide guards are not selected consistently by provider
  // scopes. Run the entries the provider runs did not already cover, unless
  // passthrough filters make de-duplication unsafe. The full test:run path
  // already includes every guard, so this is only needed here.
  const alreadySelected =
    options.passthrough.length === 0
      ? decision.providers.flatMap(listProviderTests)
      : [];
  const crossCutting = listCrossCuttingTests({ alreadySelected });
  console.error(
    `Cross-cutting repo-wide guard tests: ${crossCutting.join(", ")}`
  );
  run("pnpm", ["run", "test:run", ...crossCutting, ...options.passthrough]);

  process.exit(0);
}

console.error("Shared or ambiguous changes require full pnpm run test:run:");
for (const file of decision.fullReasons.slice(0, 20)) {
  console.error(`  ${file}`);
}
if (decision.fullReasons.length > 20) {
  console.error(`  ... ${decision.fullReasons.length - 20} more`);
}

run("pnpm", ["run", "test:run", ...options.passthrough]);

function parseArgs(args) {
  const parsed = {
    base: DEFAULT_BASE,
    forceFull: false,
    help: false,
    passthrough: [],
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--") {
      parsed.passthrough.push(...args.slice(i + 1));
      break;
    }

    if (arg === "--base") {
      const value = args[i + 1];
      if (!value) die("--base requires a git ref");
      parsed.base = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--base=")) {
      parsed.base = arg.slice("--base=".length);
      continue;
    }

    if (arg === "--full") {
      parsed.forceFull = true;
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      parsed.help = true;
      continue;
    }

    die(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function normalizeRunArgs(args) {
  return args[0] === "--" ? args.slice(1) : args;
}

function collectChangedFiles(base) {
  assertGitRef(base);

  const files = new Set();
  const commands = [
    ["diff", "--name-only", "--diff-filter=ACMRD", `${base}...HEAD`],
    ["diff", "--name-only", "--diff-filter=ACMRD"],
    ["diff", "--name-only", "--diff-filter=ACMRD", "--cached"],
    ["ls-files", "--others", "--exclude-standard"],
  ];

  for (const args of commands) {
    const output = git(args);

    for (const line of output.split("\n")) {
      const file = line.trim();
      if (file) files.add(file);
    }
  }

  return [...files].sort();
}

function assertGitRef(ref) {
  const result = spawnSync("git", ["rev-parse", "--verify", ref], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    die(
      `Could not resolve base ref "${ref}". Fetch it first or pass --base <ref>.`
    );
  }
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    die(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout;
}

function run(cmd, args) {
  console.error(`\n> ${[cmd, ...args].join(" ")}`);
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function die(message) {
  console.error(message);
  console.error("");
  printUsage();
  process.exit(1);
}

function printUsage() {
  console.error(`Usage: pnpm run test:affected -- [options] [-- vitest args]

Options:
  --base <ref>  Compare against a git base ref (default: ${DEFAULT_BASE})
  --full        Force the legacy full pnpm run test:run path

Examples:
  pnpm run test:affected
  pnpm run test:affected -- --base origin/main
  pnpm run test:affected -- --base main -- --reporter=verbose
  pnpm run test:affected -- --full`);
}
