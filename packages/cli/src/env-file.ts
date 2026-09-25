import { readFileSync } from "node:fs";

import { errorMessage } from "./internal.js";

/**
 * Fill `env` from a dotenv file, leaving `op://` references to the resolver.
 *
 * Synchronous and non-exporting by design (ac-w7vzap OQ-004): a reference is
 * never copied into the environment raw, and resolving one needs `op`, which
 * is asynchronous. `resolveCredentials` reads the references separately
 * (`envFileReferences`) and resolves only the addressed provider's.
 */
export function loadEnvFile(
  path: string,
  env: NodeJS.ProcessEnv = process.env
): void {
  applyEnvFileEntries(parseEnvFile(readEnvFile(path)), env);
}

export function parseEnvFile(content: string): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const key = envFileKey(rawLine);
    if (key === undefined) continue;
    const line = rawLine.trim();
    const value = stripQuotes(line.slice(line.indexOf("=") + 1).trim());
    entries.push([key, value]);
  }
  return entries;
}

/**
 * The key one env-file line assigns, or `undefined` for a blank line, a
 * comment or a line that assigns nothing.
 *
 * `parseEnvFile` and the `setup 1password` editor share this one rule, so the
 * editor replaces exactly the lines the parser would read.
 */
export function envFileKey(rawLine: string): string | undefined {
  const line = rawLine.trim();
  if (line === "" || line.startsWith("#")) return undefined;
  const eq = line.indexOf("=");
  if (eq <= 0) return undefined;
  const key = line.slice(0, eq).trim();
  return key === "" ? undefined : key;
}

/**
 * Apply parsed entries to `env` the way `loadEnvFile` always has: a value the
 * environment already resolves wins, a reference is skipped, and a literal
 * replaces an unresolved reference.
 */
export function applyEnvFileEntries(
  entries: Array<[string, string]>,
  env: NodeJS.ProcessEnv
): void {
  for (const [key, value] of entries) {
    if (hasResolvedEnvValue(env[key])) continue;
    if (isOpReference(value)) continue;
    env[key] = value;
  }
}

/**
 * Every `op://` reference the entries assign, keyed by variable, first
 * occurrence winning. Nothing is resolved or exported here.
 */
export function envFileReferences(
  entries: Array<[string, string]>
): Record<string, string> {
  const references: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!isOpReference(value)) continue;
    if (Object.prototype.hasOwnProperty.call(references, key)) continue;
    references[key] = value;
  }
  return references;
}

/** A 1Password secret reference: the value `op run` and `op inject` resolve. */
export function isOpReference(value: string | undefined): boolean {
  return value !== undefined && value.startsWith("op://");
}

// ---------------------------------------------------------------------------
// the line-preserving editor `apicity setup 1password` writes with
// ---------------------------------------------------------------------------

interface EnvFileLine {
  /** The line without its `\n`; a CRLF line keeps its `\r` here. */
  text: string;
  /** `"\n"`, or `""` for a last line with no newline. */
  eol: string;
}

/**
 * Set each `KEY=value` in the file's content and change nothing else.
 *
 * The first line assigning a key is replaced in place, keeping its `\r` if it
 * had one, and later lines assigning the same key are removed. A key the file
 * does not assign is appended at the end, after a newline when the content
 * lacks a final one. Every other byte — other keys, comments, blank lines and
 * their order — stays as it was, so a second identical run returns its input.
 */
export function setEnvFileAssignments(
  content: string,
  assignments: Array<[string, string]>
): string {
  let lines = splitLines(content);
  for (const [key, value] of assignments) {
    let found = false;
    lines = lines.flatMap((line) => {
      if (envFileKey(line.text) !== key) return [line];
      if (found) return [];
      found = true;
      const cr = line.text.endsWith("\r") ? "\r" : "";
      return [{ text: `${key}=${value}${cr}`, eol: line.eol }];
    });
    if (found) continue;
    const last = lines[lines.length - 1];
    if (last !== undefined && last.eol === "") last.eol = "\n";
    lines.push({ text: `${key}=${value}`, eol: "\n" });
  }
  return joinLines(lines);
}

export interface RemovedEnvFileAssignments {
  content: string;
  /** The keys found and removed, once each, in file order. */
  removed: string[];
}

/** Delete every line assigning one of `keys`, and nothing else. */
export function removeEnvFileAssignments(
  content: string,
  keys: readonly string[]
): RemovedEnvFileAssignments {
  const removed: string[] = [];
  const kept = splitLines(content).filter((line) => {
    const key = envFileKey(line.text);
    if (key === undefined || !keys.includes(key)) return true;
    if (!removed.includes(key)) removed.push(key);
    return false;
  });
  return { content: joinLines(kept), removed };
}

function splitLines(content: string): EnvFileLine[] {
  const lines: EnvFileLine[] = [];
  let start = 0;
  while (start < content.length) {
    const newline = content.indexOf("\n", start);
    if (newline === -1) {
      lines.push({ text: content.slice(start), eol: "" });
      break;
    }
    lines.push({ text: content.slice(start, newline), eol: "\n" });
    start = newline + 1;
  }
  return lines;
}

function joinLines(lines: EnvFileLine[]): string {
  return lines.map((line) => line.text + line.eol).join("");
}

function readEnvFile(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `--env-file ${path} could not be read: ${errorMessage(err)}`
    );
  }
}

function stripQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

function hasResolvedEnvValue(value: string | undefined): boolean {
  return value !== undefined && value !== "" && !isOpReference(value);
}
