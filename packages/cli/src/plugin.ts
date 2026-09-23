import { accessSync, constants, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

import { isRecord } from "./internal.js";

/**
 * Which coding agents are installed on this host.
 *
 * W4 declares `detectClaude` and `findClaudeBinary`, which `skill install`
 * needs to decide whether to link the skill into Claude Code. W5 appends the
 * Codex detector, the installed-plugin reader and the marketplace constants to
 * this same file rather than opening a second one.
 */
export interface AgentDetectionOptions {
  /** The home directory to probe; defaults to `$HOME`, then `os.homedir()`. */
  home?: string;
  /** Read for `PATH`, so a test can present a host with no `claude` on it. */
  env?: NodeJS.ProcessEnv;
}

/** The home this CLI treats as the user's, injected everywhere for tests. */
export function resolveHome(options: AgentDetectionOptions = {}): string {
  return options.home ?? options.env?.HOME ?? homedir();
}

/**
 * Is Claude Code installed?
 *
 * The directory is checked first because it is the one signal that survives
 * every installation method: a user who installed Claude Code through an IDE
 * extension has `~/.claude` without `claude` on the shell's PATH.
 */
export function detectClaude(options: AgentDetectionOptions = {}): boolean {
  if (isDirectory(join(resolveHome(options), ".claude"))) return true;
  return findClaudeBinary(options) !== undefined;
}

/**
 * Where the `claude` binary lives, or `undefined`.
 *
 * `PATH` is walked here rather than shelled out to `which`: `skill install`
 * runs in agent sessions where spawning a subprocess to answer a yes/no
 * question is both slower and one more failure mode.
 */
export function findClaudeBinary(
  options: AgentDetectionOptions = {}
): string | undefined {
  return findBinary("claude", options);
}

/**
 * Walk `PATH` for one agent binary, then the `~/.local/bin` install both
 * Claude Code and Codex use. Shared by the two detectors rather than shelled
 * out to `which`: these run in agent sessions where spawning a subprocess to
 * answer a yes/no question is both slower and one more failure mode.
 */
function findBinary(
  name: string,
  options: AgentDetectionOptions = {}
): string | undefined {
  const env = options.env ?? process.env;
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    if (dir === "") continue;
    const candidate = join(dir, name);
    if (isExecutableFile(candidate)) return candidate;
  }
  const local = join(resolveHome(options), ".local", "bin", name);
  return isExecutableFile(local) ? local : undefined;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isExecutableFile(path: string): boolean {
  try {
    if (!statSync(path).isFile()) return false;
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// W5: Codex detection, and the Claude Code plugin install record
// ---------------------------------------------------------------------------

/** The plugin's name in `.claude-plugin/plugin.json`. */
export const PLUGIN_NAME = "apicity";

/**
 * The marketplace `apicity setup claude` adds, and the name it is known by
 * afterwards.
 *
 * These two constants and `PLUGIN_KEY` are the only things a move to a
 * smaller marketplace repository would change (OQ-18): the source is what
 * `claude plugin marketplace add` clones, the name is what `update` and the
 * `<plugin>@<marketplace>` key address.
 */
export const MARKETPLACE_SOURCE = "justintanner/apicity";
export const MARKETPLACE_NAME = "apicity";
export const PLUGIN_KEY = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

/**
 * Is Codex installed?
 *
 * `$CODEX_HOME` first because a user who moved it has no `~/.codex` at all,
 * then the default directory, then the binary — the same directory-before-PATH
 * order `detectClaude` uses, and for the same reason.
 */
export function detectCodex(options: AgentDetectionOptions = {}): boolean {
  const codexHome = (options.env ?? process.env).CODEX_HOME;
  if (codexHome !== undefined && codexHome !== "" && isDirectory(codexHome)) {
    return true;
  }
  if (isDirectory(join(resolveHome(options), ".codex"))) return true;
  return findCodexBinary(options) !== undefined;
}

/** Where the `codex` binary lives, or `undefined`. */
export function findCodexBinary(
  options: AgentDetectionOptions = {}
): string | undefined {
  return findBinary("codex", options);
}

/** Claude Code's record of one installed plugin. */
export interface InstalledPlugin {
  /** The key it was found under — `apicity@<marketplace>`. */
  key: string;
  /** The version the file records, absent when it tracks none. */
  version?: string;
}

/** Where Claude Code records what it has installed. */
export function installedPluginsPath(home: string): string {
  return join(home, ".claude", "plugins", "installed_plugins.json");
}

/**
 * Read Claude Code's install record for this plugin, if it has one.
 *
 * Three shapes are accepted because the file has had three: today's v2 maps a
 * `<plugin>@<marketplace>` key to an *array* of install records (one per
 * scope, each with its own `version`), v1 mapped the key straight to a record
 * or to a bare version string, and a top-level array of records names its
 * plugin inline. Anything unreadable or unparseable is "not installed" rather
 * than an error: `doctor` reports a row about it and `setup` re-runs the
 * install, and neither has any business failing on a file it does not own.
 *
 * The exact key is preferred, then any `apicity@<other>` — a plugin installed
 * from a differently named marketplace is still this plugin, and reporting it
 * as missing would send the caller to re-install a plugin they already have.
 */
export function readInstalledPlugin(home: string): InstalledPlugin | undefined {
  const entries = pluginEntries(parseJsonFile(installedPluginsPath(home)));
  const entry =
    entries.find(([key]) => key === PLUGIN_KEY) ??
    entries.find(([key]) => key.startsWith(`${PLUGIN_NAME}@`));
  if (entry === undefined) return undefined;

  const [key, value] = entry;
  const version = versionOf(value);
  return version === undefined ? { key } : { key, version };
}

/**
 * The version Claude Code records for this plugin, or `undefined` when it is
 * not installed or the record tracks no version.
 */
export function installedPluginVersion(home: string): string | undefined {
  return readInstalledPlugin(home)?.version;
}

function pluginEntries(parsed: unknown): Array<[string, unknown]> {
  if (Array.isArray(parsed)) return namedEntries(parsed);
  if (!isRecord(parsed)) return [];

  const plugins = parsed.plugins;
  if (Array.isArray(plugins)) return namedEntries(plugins);
  if (isRecord(plugins)) return Object.entries(plugins);
  // v1 wrote the map at the top level. Only `apicity@…` keys are ever read
  // out of it, so a sibling such as `"version": 2` is harmless here.
  return Object.entries(parsed);
}

/** A list of records that each name their own plugin. */
function namedEntries(items: unknown[]): Array<[string, unknown]> {
  const entries: Array<[string, unknown]> = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    const key = [item.key, item.name, item.id].find(
      (candidate): candidate is string => typeof candidate === "string"
    );
    if (key !== undefined) entries.push([key, item]);
  }
  return entries;
}

/** The first version any of the three record shapes carries. */
function versionOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const version = versionOf(item);
      if (version !== undefined) return version;
    }
    return undefined;
  }
  if (isRecord(value) && typeof value.version === "string") {
    return value.version;
  }
  return undefined;
}

function parseJsonFile(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return undefined;
  }
}
