import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./provider-scope.mjs";

export function parseChangedArgs(rawArgs) {
  const args = rawArgs.filter((arg) => arg !== "--");
  const paths = [];
  let base = process.env.APICITY_BASE_REF ?? "origin/main";
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }

    if (arg === "--base") {
      const next = args[index + 1];
      if (!next) {
        throw new Error("--base requires a git ref");
      }
      base = next;
      index += 1;
      continue;
    }

    if (arg.startsWith("--base=")) {
      const value = arg.slice("--base=".length);
      if (!value) {
        throw new Error("--base requires a git ref");
      }
      base = value;
      continue;
    }

    paths.push(arg);
  }

  return { base, help, paths };
}

export function collectChangedTargets({ base, paths }) {
  const rawTargets =
    paths.length > 0 ? collectExplicitTargets(paths) : collectGitTargets(base);

  return unique(
    rawTargets
      .map((target) => normalizeExistingFile(target))
      .filter((target) => target !== "")
  );
}

export function filterEslintTargets(targets) {
  return targets.filter((target) =>
    /\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/.test(target)
  );
}

export function formatTargetList(targets) {
  return targets.length === 0
    ? "  (none)"
    : targets.map((target) => `  ${target}`).join("\n");
}

export function formatUsage(command) {
  return [
    `Usage: ${command} [--base <ref>] [path ...]`,
    "",
    "With no paths, targets are inferred from:",
    "  git diff --name-only --diff-filter=ACMRTUXB <base>...HEAD",
    "  git diff --name-only --diff-filter=ACMRTUXB --cached",
    "  git diff --name-only --diff-filter=ACMRTUXB",
    "  git ls-files --others --exclude-standard",
    "",
    "The default base is APICITY_BASE_REF or origin/main.",
  ].join("\n");
}

function collectGitTargets(base) {
  return unique([
    ...gitLines(
      ["diff", "--name-only", "--diff-filter=ACMRTUXB", `${base}...HEAD`],
      `Could not compare against ${base}. Fetch it or pass --base <ref>.`
    ),
    ...gitLines(["diff", "--name-only", "--diff-filter=ACMRTUXB", "--cached"]),
    ...gitLines(["diff", "--name-only", "--diff-filter=ACMRTUXB"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
}

function collectExplicitTargets(paths) {
  const targets = [];

  for (const input of paths) {
    const relative = toRepoRelative(input);
    const absolute = path.join(repoRoot, relative);

    if (!existsSync(absolute)) {
      throw new Error(`Path does not exist: ${input}`);
    }

    if (statSync(absolute).isDirectory()) {
      targets.push(
        ...gitLines([
          "ls-files",
          "--cached",
          "--others",
          "--exclude-standard",
          "--",
          relative,
        ])
      );
    } else {
      targets.push(relative);
    }
  }

  return targets;
}

function gitLines(args, errorMessage = "") {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    if (errorMessage) {
      const detail = result.stderr.trim();
      throw new Error(detail ? `${errorMessage}\n${detail}` : errorMessage);
    }

    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function normalizeExistingFile(input) {
  const relative = toRepoRelative(input);
  const absolute = path.join(repoRoot, relative);

  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    return "";
  }

  return relative;
}

function toRepoRelative(input) {
  const absolute = path.isAbsolute(input)
    ? input
    : path.resolve(repoRoot, input);
  const relative = path.relative(repoRoot, absolute).replace(/\\/g, "/");

  if (relative === "") {
    return ".";
  }

  if (relative.startsWith("../") || path.isAbsolute(relative)) {
    throw new Error(`Path is outside this repository: ${input}`);
  }

  return relative;
}

function unique(values) {
  return [...new Set(values)].sort();
}
