#!/usr/bin/env node
/**
 * Type-check one provider package when the current diff is provider-scoped.
 *
 * This is the fast path for local provider development. It deliberately falls
 * back to the full monorepo typecheck when the branch changes another package
 * or shared TypeScript/package config, so shared-package errors are not hidden.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { repoRoot, resolveProviderScope } from "./lib/provider-scope.mjs";

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const options = parseArgs(process.argv.slice(2).filter((arg) => arg !== "--"));

let scope;
try {
  scope = resolveProviderScope(options.scopeArg);
} catch (error) {
  console.error(
    "\n" +
      red("Usage: pnpm run typecheck:provider -- <provider-or-path>") +
      "\n\n  e.g. " +
      cyan("pnpm run typecheck:provider -- openai") +
      "\n       " +
      cyan(
        "pnpm run typecheck:provider -- packages/provider/openai/src/openai.ts"
      ) +
      "\n\n" +
      red(error instanceof Error ? error.message : String(error)) +
      "\n"
  );
  process.exit(1);
}

const provider = scope.provider;
const pkgTsconfig = path.posix.join(scope.packageDir, "tsconfig.json");
const diff = listChangedFiles(options.baseRef);
const fallbackReasons = diff.error
  ? [{ file: options.baseRef, reason: diff.error }]
  : classifyFallbackReasons(diff.files, scope);

console.error(dim(`typecheck:provider ${provider}`));
console.error(dim(`base ref: ${options.baseRef}`));

if (fallbackReasons.length > 0) {
  console.error(
    dim("shared/package changes detected; running full typecheck instead:")
  );
  for (const item of fallbackReasons.slice(0, 12)) {
    console.error(dim(`  - ${item.file}: ${item.reason}`));
  }
  if (fallbackReasons.length > 12) {
    console.error(dim(`  - ... ${fallbackReasons.length - 12} more`));
  }
  run("pnpm", ["run", "typecheck"]);
} else {
  if (diff.files.length === 0) {
    console.error(dim("no branch diff detected; using provider tsconfig"));
  } else {
    console.error(
      dim("provider-scoped diff detected; using provider tsconfig")
    );
  }
  run("pnpm", ["exec", "tsc", "--noEmit", "-p", pkgTsconfig]);
}

function parseArgs(args) {
  const positionals = [];
  let baseRef = process.env.APICITY_TYPECHECK_BASE || "origin/main";

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--base") {
      baseRef = args[i + 1];
      i += 1;
    } else if (arg.startsWith("--base=")) {
      baseRef = arg.slice("--base=".length);
    } else if (arg.startsWith("-")) {
      console.error(red(`Unknown option: ${arg}`));
      process.exit(1);
    } else {
      positionals.push(arg);
    }
  }

  if (!baseRef) {
    console.error(red("Missing value for --base"));
    process.exit(1);
  }

  if (positionals.length > 1) {
    console.error(red(`Unexpected extra arguments: ${positionals.slice(1)}`));
    process.exit(1);
  }

  return {
    baseRef,
    scopeArg: positionals[0],
  };
}

function listChangedFiles(baseRef) {
  const diffRef = `${baseRef}...HEAD`;
  const committed = gitDiffNames([diffRef]);

  if (committed.status !== 0) {
    return {
      files: [],
      error: `could not inspect ${diffRef}; safe fallback`,
    };
  }

  const staged = gitDiffNames(["--cached"]);
  const unstaged = gitDiffNames([]);
  const files = new Set([
    ...committed.files,
    ...staged.files,
    ...unstaged.files,
  ]);

  return {
    files: [...files].sort(),
    error: "",
  };
}

function gitDiffNames(args) {
  const result = spawnSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMRTUXB", ...args],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  return {
    status: result.status ?? 1,
    files: result.stdout
      .split(/\r?\n/)
      .map((file) => file.trim())
      .filter(Boolean)
      .map((file) => file.replace(/\\/g, "/")),
  };
}

function classifyFallbackReasons(files, scope) {
  const reasons = [];

  for (const file of files) {
    const reason = fallbackReason(file, scope);

    if (reason) {
      reasons.push({ file, reason });
    }
  }

  return reasons;
}

function fallbackReason(file, scope) {
  if (isInside(file, scope.packageDir)) {
    return "";
  }

  if (isScopedIntegrationTest(file, scope.provider)) {
    return "";
  }

  if (isDocsOnly(file)) {
    return "";
  }

  if (isRepoTypecheckConfig(file)) {
    return "shared TypeScript/package config changed";
  }

  const providerMatch = file.match(/^packages\/provider\/([^/]+)\//);
  if (providerMatch) {
    return `provider package "${providerMatch[1]}" changed`;
  }

  if (file.startsWith("packages/")) {
    return "another package changed";
  }

  return "";
}

function isInside(file, dir) {
  return file === dir || file.startsWith(`${dir}/`);
}

function isScopedIntegrationTest(file, provider) {
  const prefix = `tests/integration/${provider}-`;

  return (
    file === `tests/integration/${provider}.test.ts` ||
    (file.startsWith(prefix) && file.endsWith(".test.ts"))
  );
}

function isDocsOnly(file) {
  return (
    file.endsWith(".md") ||
    file.startsWith("docs/") ||
    file.endsWith(".png") ||
    file.endsWith(".jpg") ||
    file.endsWith(".jpeg") ||
    file.endsWith(".gif") ||
    file.endsWith(".svg")
  );
}

function isRepoTypecheckConfig(file) {
  return (
    file === "package.json" ||
    file === "pnpm-lock.yaml" ||
    file === "pnpm-workspace.yaml" ||
    file === "tsconfig.json" ||
    file === "tsconfig.base.json" ||
    file.endsWith("/tsconfig.json")
  );
}

function run(command, args) {
  console.error(dim(`command: ${formatCommand(command, args)}`));
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: "inherit" });

  process.exit(result.status ?? 1);
}

function formatCommand(command, args) {
  return [command, ...args].map(shellQuote).join(" ");
}

function shellQuote(value) {
  return /^[a-zA-Z0-9_./:=@-]+$/.test(value)
    ? value
    : `'${value.replace(/'/g, "'\\''")}'`;
}
