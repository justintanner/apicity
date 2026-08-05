#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const candidateExtensionPattern = /\.(?:mjs|js|ts)$/;
const maxGitOutputBytes = 128 * 1024 * 1024;

const rawFileUrlPattern = "file:" + "\\/\\/";
const processArgvPathPattern = "process\\s*\\.\\s*argv\\s*\\[\\s*1\\s*\\]";
const matcherDefinitions = [
  {
    kind: "template-interpolation",
    source:
      "`" +
      rawFileUrlPattern +
      "\\$\\{\\s*" +
      processArgvPathPattern +
      "\\s*\\}",
  },
  {
    kind: "quoted-prefix-concatenation",
    source:
      "([\"'])" + rawFileUrlPattern + "\\1\\s*\\+\\s*" + processArgvPathPattern,
  },
];

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function formatError(error) {
  if (error instanceof Error) {
    const stderr = Buffer.isBuffer(error.stderr)
      ? error.stderr.toString("utf8").trim()
      : typeof error.stderr === "string"
        ? error.stderr.trim()
        : "";
    return stderr || error.message;
  }
  return String(error);
}

function outputText(output) {
  if (typeof output === "string") return output;
  if (Buffer.isBuffer(output)) return output.toString("utf8");
  throw new TypeError("Git tracked-file discovery returned no stdout value");
}

function gitStdout(result) {
  if (typeof result === "string" || Buffer.isBuffer(result)) {
    return outputText(result);
  }
  if (!result || typeof result !== "object") {
    throw new TypeError("Git tracked-file discovery returned no result");
  }
  if (result.error) throw result.error;
  if (typeof result.status === "number" && result.status !== 0) {
    const detail = result.stderr ? `: ${outputText(result.stderr).trim()}` : "";
    throw new Error(`git ls-files exited ${result.status}${detail}`);
  }
  return outputText(result.stdout);
}

function validateTrackedCandidate(filePath) {
  const segments = filePath.split("/");
  if (
    path.posix.isAbsolute(filePath) ||
    path.win32.isAbsolute(filePath) ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === ".."
    ) ||
    path.posix.normalize(filePath) !== filePath ||
    /[\r\n]/.test(filePath)
  ) {
    throw new Error(`Git returned an unsafe tracked path: ${filePath}`);
  }
  return filePath;
}

/** Parse the NUL-framed output of `git ls-files -z`. */
export function parseTrackedPaths(output) {
  const candidates = outputText(output)
    .split("\0")
    .filter((filePath) => candidateExtensionPattern.test(filePath))
    .map(validateTrackedCandidate);
  return [...new Set(candidates)].sort(compareText);
}

function defaultRunGit(args, options) {
  return execFileSync("git", args, options);
}

/** Discover every tracked JavaScript or TypeScript candidate. */
export function listTrackedCandidates(root, dependencies = {}) {
  const runGit = dependencies.runGit ?? defaultRunGit;
  let result;
  try {
    result = runGit(["ls-files", "-z"], {
      cwd: root,
      maxBuffer: maxGitOutputBytes,
    });
    return parseTrackedPaths(gitStdout(result));
  } catch (error) {
    throw new Error(`Git tracked-file discovery failed: ${formatError(error)}`);
  }
}

function locationAt(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  let line = 1;
  for (let index = 0; index < lineStart; index++) {
    if (source.charCodeAt(index) === 10) line++;
  }
  return { line, column: offset - lineStart + 1 };
}

function excerptFor(value) {
  return value.replace(/\s+/g, " ").trim();
}

/** Find direct raw-prefix constructions in one source file. */
export function findRawFileUrlEntryGuards(source) {
  if (typeof source !== "string") {
    throw new TypeError("Source must be a string");
  }

  const findings = [];
  for (const definition of matcherDefinitions) {
    const pattern = new RegExp(definition.source, "g");
    for (const match of source.matchAll(pattern)) {
      const { line, column } = locationAt(source, match.index);
      findings.push({
        line,
        column,
        kind: definition.kind,
        excerpt: excerptFor(match[0]),
      });
    }
  }

  return findings.sort((left, right) => {
    return (
      left.line - right.line ||
      left.column - right.column ||
      compareText(left.kind, right.kind)
    );
  });
}

function sourceText(value, filePath) {
  if (typeof value === "string") return value;
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  throw new TypeError(`${filePath}: tracked source read returned no text`);
}

/** Scan all tracked candidates and return complete, stably ordered findings. */
export function scanRepository(root, dependencies = {}) {
  const readFile = dependencies.readFile ?? readFileSync;
  const candidates = listTrackedCandidates(root, dependencies);
  const findings = [];

  for (const filePath of candidates) {
    let source;
    try {
      source = sourceText(
        readFile(path.join(root, filePath), "utf8"),
        filePath
      );
    } catch (error) {
      throw new Error(
        `${filePath}: unable to read tracked candidate: ${formatError(error)}`
      );
    }
    for (const finding of findRawFileUrlEntryGuards(source)) {
      findings.push({ filePath, ...finding });
    }
  }

  findings.sort((left, right) => {
    return (
      compareText(left.filePath, right.filePath) ||
      left.line - right.line ||
      left.column - right.column ||
      compareText(left.kind, right.kind)
    );
  });
  return { candidates, findings };
}

function parseArgs(argv, defaultRoot) {
  if (!Array.isArray(argv)) throw new TypeError("argv must be an array");

  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  let selectedRoot = defaultRoot;
  let sawRoot = false;
  for (let index = 0; index < normalizedArgv.length; index++) {
    const argument = normalizedArgv[index];
    if (argument !== "--root") {
      throw new Error(`Unknown argument: ${argument}`);
    }
    if (sawRoot) throw new Error("--root may be specified only once");
    const value = normalizedArgv[++index];
    if (typeof value !== "string" || value.length === 0) {
      throw new Error("--root requires a path");
    }
    selectedRoot = value;
    sawRoot = true;
  }

  if (typeof selectedRoot !== "string" || selectedRoot.length === 0) {
    throw new Error("Repository root must be a non-empty path");
  }
  return path.resolve(selectedRoot);
}

function writeLine(stream, value) {
  if (!stream || typeof stream.write !== "function") {
    throw new TypeError("Output stream must provide write()");
  }
  stream.write(`${value}\n`);
}

/** Run the guard and return its intended process exit code. */
export function main({
  argv = process.argv.slice(2),
  root = repositoryRoot,
  runGit = defaultRunGit,
  readFile = readFileSync,
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  let scanRoot;
  try {
    scanRoot = parseArgs(argv, root);
  } catch (error) {
    writeLine(
      stderr,
      `✗ check-file-url-entry-guards: argument error: ${formatError(error)}`
    );
    return 1;
  }

  let result;
  try {
    result = scanRepository(scanRoot, { runGit, readFile });
  } catch (error) {
    writeLine(
      stderr,
      `✗ check-file-url-entry-guards: scan failed: ${formatError(error)}`
    );
    return 1;
  }

  const { candidates, findings } = result;
  if (findings.length === 0) {
    writeLine(
      stdout,
      `✓ check-file-url-entry-guards: completed scan of ${candidates.length} ` +
        "tracked candidate(s); 0 violations."
    );
    return 0;
  }

  const violatingFiles = new Set(findings.map((finding) => finding.filePath))
    .size;
  writeLine(
    stderr,
    `✗ check-file-url-entry-guards: ${findings.length} violation(s) in ` +
      `${violatingFiles} file(s) among ${candidates.length} tracked candidate(s).`
  );
  writeLine(
    stderr,
    "Build entry-guard URLs with one of these safe conversions:"
  );
  writeLine(stderr, "  process.argv[1] === fileURLToPath(import.meta.url)");
  writeLine(
    stderr,
    "  import.meta.url === pathToFileURL(process.argv[1]).href"
  );
  for (const finding of findings) {
    writeLine(
      stderr,
      `${finding.filePath}:${finding.line}:${finding.column} ` +
        `[${finding.kind}] ${finding.excerpt}`
    );
  }
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
