import { accessSync, constants, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

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
  const env = options.env ?? process.env;
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    if (dir === "") continue;
    const candidate = join(dir, "claude");
    if (isExecutableFile(candidate)) return candidate;
  }
  const local = join(resolveHome(options), ".local", "bin", "claude");
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
