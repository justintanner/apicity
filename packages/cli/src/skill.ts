import {
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { parseGlobalFlags } from "./args.js";
import { createWriter, type CliWriter } from "./envelope.js";
import { CliError } from "./errors.js";
import { errorMessage, lstat } from "./internal.js";
import {
  detectClaude,
  resolveHome,
  type AgentDetectionOptions,
} from "./plugin.js";
import { readPackageVersion } from "./version.js";

/** The skill directory name under every agent's skills root. */
export const SKILL_NAME = "apicity";
export const SKILL_FILENAME = "SKILL.md";

/**
 * The file that says this directory is ours to rewrite.
 *
 * Shape is not ownership: a hand-authored skill is also "a directory with one
 * SKILL.md in it", so every write path below proves provenance with this
 * marker before touching anything.
 */
export const OWNERSHIP_MARKER_FILE = ".managed-by-apicity";
export const OWNERSHIP_MARKER_TEXT =
  "This skill is managed by the apicity CLI. " +
  "Manual edits will be overwritten on upgrade.\n";

/** The version stamp `doctor` reads to spot a stale install. */
export const INSTALLED_VERSION_FILE = ".installed-version";

/**
 * The relative target every `~/.claude/skills/apicity` symlink we write points
 * at. It doubles as provenance: a link with any other target was not written
 * by this CLI, so it is never removed or replaced.
 */
export const CLAUDE_SKILL_LINK_TARGET = join(
  "..",
  "..",
  ".agents",
  "skills",
  SKILL_NAME
);

/** The files `install` writes, and the only ones the copy fallback carries. */
const MANAGED_FILES = [
  SKILL_FILENAME,
  INSTALLED_VERSION_FILE,
  OWNERSHIP_MARKER_FILE,
];

/**
 * Where the skill is read from, in order.
 *
 * The package copy comes first (D-8): an installed user has only that one,
 * `scripts/dist.mjs` stages it from the repository root at build time, and
 * resolving it first means `apicity skill` prints what this package ships
 * rather than whatever tree the process happens to be running in. Each path is
 * listed at both depths because the module runs as `src/skill.ts` in the
 * workspace and `dist/src/skill.js` once built — the same two-layout trick
 * `loadTsv` and `readPackageVersion` use.
 */
const SKILL_CANDIDATES = [
  `../skills/${SKILL_NAME}/${SKILL_FILENAME}`, // <pkg>/skills, from src/
  `../../skills/${SKILL_NAME}/${SKILL_FILENAME}`, // <pkg>/skills, from dist/src/
  `../../../skills/${SKILL_NAME}/${SKILL_FILENAME}`, // <repo>/skills, from src/
  `../../../../skills/${SKILL_NAME}/${SKILL_FILENAME}`, // <repo>/skills, from dist/src/
];

/** Read the agent skill this CLI ships, exactly as it is on disk. */
export function readSkill(): string {
  for (const candidate of SKILL_CANDIDATES) {
    try {
      return readFileSync(new URL(candidate, import.meta.url), "utf8");
    } catch {
      /* try the next layout */
    }
  }
  throw new CliError(
    "setup_incomplete",
    `could not locate ${SKILL_NAME}/${SKILL_FILENAME}`,
    { hint: "reinstall @apicity/cli, or run: pnpm run build:cli" }
  );
}

/** The seam the copy fallback is tested through. */
export type SymlinkFn = (target: string, path: string) => void;

export interface InstallSkillOptions extends AgentDetectionOptions {
  /** The version to stamp; defaults to this package's. */
  version?: string;
  symlink?: SymlinkFn;
}

/** What `apicity skill install --json` answers as its `data`. */
export interface InstallSkillResult {
  skill_path: string;
  symlink_path?: string;
  notice?: string;
}

export interface RemoveSkillResult {
  /** Paths this CLI wrote and has now removed. */
  removed: string[];
  /** Paths left alone because this CLI did not write them. */
  kept: string[];
}

/**
 * Install the skill into `~/.agents/skills/apicity`, and link it into Claude
 * Code when Claude Code is installed.
 *
 * Codex reads `~/.agents/skills` directly, so nothing is ever written under
 * `~/.codex`: one baseline copy serves every agent that follows the shared
 * convention, and only Claude needs the link.
 */
export function installSkill(
  options: InstallSkillOptions = {}
): InstallSkillResult {
  const home = resolveHome(options);
  const content = readSkill();
  const version = options.version ?? readPackageVersion();

  const skillDir = baselineSkillDir(home);
  claimSkillDir(skillDir);
  const skillPath = join(skillDir, SKILL_FILENAME);
  writeSkillFile(skillPath, content);
  writeSkillFile(join(skillDir, INSTALLED_VERSION_FILE), version);

  const result: InstallSkillResult = { skill_path: skillPath };
  if (detectClaude({ home, env: options.env })) {
    const link = linkIntoClaude(home, options.symlink ?? symlinkSync);
    result.symlink_path = link.path;
    if (link.notice !== undefined) result.notice = link.notice;
  }
  return result;
}

/**
 * Undo an install, removing only what this CLI wrote.
 *
 * Nothing here throws on unmanaged content: a user's own skill at either path
 * is reported in `kept` and left exactly as it is, which is what W5's
 * `--remove` needs to report rather than fail on.
 */
export function removeSkill(
  options: AgentDetectionOptions = {}
): RemoveSkillResult {
  const home = resolveHome(options);
  const result: RemoveSkillResult = { removed: [], kept: [] };

  const linkPath = claudeSkillLink(home);
  const link = lstat(linkPath);
  if (link !== undefined) {
    if (
      link.isSymbolicLink() &&
      readLink(linkPath) === CLAUDE_SKILL_LINK_TARGET
    ) {
      unlinkSync(linkPath);
      result.removed.push(linkPath);
    } else if (link.isDirectory() && isManagedSkillCopy(linkPath)) {
      rmSync(linkPath, { recursive: true, force: true });
      result.removed.push(linkPath);
    } else {
      result.kept.push(linkPath);
    }
  }

  const skillDir = baselineSkillDir(home);
  const baseline = lstat(skillDir);
  if (baseline !== undefined) {
    if (baseline.isDirectory() && isOwnedSkillDir(skillDir)) {
      rmSync(skillDir, { recursive: true, force: true });
      result.removed.push(skillDir);
    } else {
      result.kept.push(skillDir);
    }
  }

  return result;
}

export function baselineSkillDir(home: string): string {
  return join(home, ".agents", "skills", SKILL_NAME);
}

export function claudeSkillLink(home: string): string {
  return join(home, ".claude", "skills", SKILL_NAME);
}

// ---------------------------------------------------------------------------
// the ownership gate
// ---------------------------------------------------------------------------

/**
 * The one gate every skill write goes through.
 *
 * It creates and marks a missing or empty directory, accepts one that already
 * carries our marker, and refuses everything else — a symlink (whose target
 * was never inspected), a file, or a populated directory somebody else wrote.
 */
function claimSkillDir(dir: string): void {
  const info = lstat(dir);
  if (info === undefined) {
    mkdirSync(dir, { recursive: true });
  } else if (info.isSymbolicLink() || !info.isDirectory()) {
    throw unmanaged(dir);
  } else if (!isOwnedSkillDir(dir) && readdirSync(dir).length > 0) {
    throw unmanaged(dir);
  }
  writeSkillFile(join(dir, OWNERSHIP_MARKER_FILE), OWNERSHIP_MARKER_TEXT);
}

/**
 * Write one skill file, refusing to write *through* a symlink or any other
 * non-regular file: its target was never inspected by the gate above, so
 * following it could truncate a file we do not own even inside a directory
 * that carries our marker.
 */
function writeSkillFile(path: string, data: string): void {
  const info = lstat(path);
  if (info !== undefined && !info.isFile()) throw unmanaged(path);
  writeFileSync(path, data);
}

/** Does this directory carry our marker as a regular file? */
function isOwnedSkillDir(dir: string): boolean {
  const info = lstat(join(dir, OWNERSHIP_MARKER_FILE));
  return info !== undefined && info.isFile();
}

/**
 * Is this directory one the copy fallback wrote?
 *
 * All three conditions are required: the marker proves provenance, every entry
 * must be a regular file (a symlink planted in the marker's name proves
 * nothing), and the allowlist keeps anything a user added alongside it safe.
 */
function isManagedSkillCopy(path: string): boolean {
  const info = lstat(path);
  if (info === undefined || !info.isDirectory()) return false;
  let sawMarker = false;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (!entry.isFile()) return false;
    if (!MANAGED_FILES.includes(entry.name)) return false;
    if (entry.name === OWNERSHIP_MARKER_FILE) sawMarker = true;
  }
  return sawMarker;
}

/** A healthy baseline: our marker, and a `SKILL.md` that is a regular file. */
function baselineInstalled(skillDir: string): boolean {
  const skill = lstat(join(skillDir, SKILL_FILENAME));
  return skill !== undefined && skill.isFile() && isOwnedSkillDir(skillDir);
}

// ---------------------------------------------------------------------------
// the Claude Code link
// ---------------------------------------------------------------------------

interface ClaudeLink {
  path: string;
  notice?: string;
}

function linkIntoClaude(home: string, symlink: SymlinkFn): ClaudeLink {
  const skillDir = baselineSkillDir(home);
  // Never point Claude at a baseline the write paths refused to claim: the
  // link would modify Claude while the same command reports the install unfit.
  if (!baselineInstalled(skillDir)) throw unmanaged(skillDir);

  const linkPath = claudeSkillLink(home);
  mkdirSync(join(home, ".claude", "skills"), { recursive: true });
  removeExistingSkillLink(linkPath);

  try {
    symlink(CLAUDE_SKILL_LINK_TARGET, linkPath);
  } catch (cause) {
    // A host without symlink privileges still gets a working skill: copy the
    // three files we own and say so, rather than failing the install.
    copySkillFiles(skillDir, linkPath);
    return {
      path: linkPath,
      notice: `symlink failed (${errorMessage(cause)}), copied files instead`,
    };
  }
  return { path: linkPath };
}

/**
 * Clear the way for a fresh link, removing only what this CLI wrote: our
 * canonical symlink, or the directory a previous copy fallback left. A user's
 * own link, a regular file, or a populated unmarked directory is their state.
 */
function removeExistingSkillLink(path: string): void {
  const info = lstat(path);
  if (info === undefined) return;
  if (info.isSymbolicLink()) {
    if (readLink(path) !== CLAUDE_SKILL_LINK_TARGET) throw unmanaged(path);
    unlinkSync(path);
    return;
  }
  if (info.isDirectory()) {
    if (!isManagedSkillCopy(path)) throw unmanaged(path);
    rmSync(path, { recursive: true, force: true });
    return;
  }
  throw unmanaged(path);
}

/**
 * The copy fallback. It claims the destination first, so a copy interrupted
 * halfway is still recognized as ours and replaced on the next attempt, and it
 * carries only the files we own: anything a user added to the baseline would
 * fail the copy's own allowlist next time and strand the fallback.
 */
function copySkillFiles(src: string, dst: string): void {
  claimSkillDir(dst);
  for (const name of MANAGED_FILES) {
    const info = lstat(join(src, name));
    if (info === undefined) continue;
    writeSkillFile(join(dst, name), readFileSync(join(src, name), "utf8"));
  }
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

export interface SkillCommandOptions extends InstallSkillOptions {
  /** Injected so a test can drive both halves of the output rule (D-5). */
  stdoutIsTTY?: boolean;
}

/**
 * `apicity skill` — the skill's bytes on stdout, unchanged.
 *
 * A raw-output command: no envelope, not even with `--json`, so
 * `apicity skill > SKILL.md` and `apicity skill | diff - skills/apicity/SKILL.md`
 * both answer the file itself.
 */
export function runSkill(writer: CliWriter): number {
  const content = readSkill();
  if (writer.raw !== undefined) writer.raw(content);
  // A writer without a raw channel appends its own newline, so the file's
  // trailing one is dropped here rather than doubled.
  else writer.out(content.replace(/\n$/, ""));
  return 0;
}

/** `apicity skill install [--json]`. */
export function runSkillInstall(
  argv: string[],
  writer: CliWriter,
  options: SkillCommandOptions = {}
): number {
  const { flags, rest } = parseGlobalFlags(argv);
  if (rest.length > 0) {
    throw new CliError("usage", `unexpected argument: ${rest[0]}`, {
      hint: "run: apicity skill install [--json]",
    });
  }
  const result = installSkill(options);
  const out = createWriter({
    json: flags.json,
    quiet: flags.quiet,
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: (text) => writer.out(text),
    stderr: (text) => writer.err(text),
  });
  return out.success(result, { summary: "apicity skill installed" });
}

/** The `skill` branch of the dispatcher: print, or install. */
export function runSkillCommand(
  argv: string[],
  writer: CliWriter,
  options: SkillCommandOptions = {}
): number {
  const [sub] = argv;
  if (sub === "install") return runSkillInstall(argv.slice(1), writer, options);
  if (sub !== undefined && !sub.startsWith("-")) {
    throw new CliError("not_found", `unknown skill subcommand: ${sub}`, {
      hint: "run: apicity skill, or: apicity skill install",
    });
  }
  return runSkill(writer);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function unmanaged(path: string): CliError {
  return new CliError(
    "skill_unmanaged",
    `${path} exists but was not written by the apicity CLI`,
    { hint: "move it aside, then run: apicity skill install" }
  );
}

function readLink(path: string): string | undefined {
  try {
    return readlinkSync(path);
  } catch {
    return undefined;
  }
}
