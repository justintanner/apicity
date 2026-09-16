import {
  accessSync,
  constants,
  lstatSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

import { parseGlobalFlags } from "./args.js";
import {
  defaultEnvFilePath,
  isProviderConfigured,
  providerNames,
} from "./credentials.js";
import {
  createWriter,
  resolveOutputDirectory,
  type CliWriter,
} from "./envelope.js";
import {
  detectClaude,
  detectCodex,
  readInstalledPlugin,
  resolveHome,
  type AgentDetectionOptions,
} from "./plugin.js";
import {
  runSubprocess,
  SUBPROCESS_STDIO,
  type SubprocessRunner,
} from "./setup.js";
import {
  baselineSkillDir,
  claudeSkillLink,
  INSTALLED_VERSION_FILE,
  OWNERSHIP_MARKER_FILE,
  SKILL_FILENAME,
} from "./skill.js";
import { readPackageVersion } from "./version.js";

export type DoctorStatus = "ok" | "warning" | "error";

export interface DoctorRow {
  name: string;
  status: DoctorStatus;
  message: string;
  /** One actionable line: the command that repairs this row. */
  hint?: string;
}

/**
 * Every row, in the order `doctor` prints them, and the only order it ever
 * prints them in: this is the list `cli-doctor.test.ts` pins, and a caller
 * reading the `--json` array by index depends on it.
 *
 * A row is never dropped. A check that does not apply to this host — no
 * 1Password configured, no Claude Code installed — says so at `ok` rather than
 * disappearing, so the shape of the answer does not depend on the host.
 */
export const DOCTOR_ROW_NAMES = [
  "CLI Version",
  "Node Version",
  "Env File",
  "1Password CLI",
  "Providers",
  "Paygate Secret File",
  "Output Dir",
  "Agent Skill",
  "Claude Code Plugin",
  "Claude Code Plugin Version",
  "Claude Code Skill",
  "Codex Skill",
] as const;

/** The `op --version` budget: a health check, not a wait. */
export const OP_VERSION_TIMEOUT_MS = 5_000;

/** The subset of the global flags `doctor` reads. */
export interface DoctorFlags {
  envFile?: string;
  opVault?: string;
  opToken?: string;
  paygateSecretFile?: string;
  outputDir?: string;
}

export interface DoctorOptions extends AgentDetectionOptions {
  flags?: DoctorFlags;
  /** Seam: the subprocess runner, so a test never spawns `op`. */
  run?: SubprocessRunner;
  /** The CLI version to compare against; defaults to this package's. */
  version?: string;
  cwd?: string;
}

export interface DoctorCommandOptions extends DoctorOptions {
  /** Injected so a test can drive both halves of the output rule (D-5). */
  stdoutIsTTY?: boolean;
}

/** Everything the rows share, resolved once. */
interface DoctorContext {
  env: NodeJS.ProcessEnv;
  flags: DoctorFlags;
  home: string;
  version: string;
  claude: boolean;
  codex: boolean;
  options: DoctorOptions;
}

/**
 * Answer every row.
 *
 * No row ever carries a credential: the Env File and Paygate rows print the
 * path a variable named and never its contents, the Providers row prints
 * names, and the 1Password row prints `op`'s own version string.
 */
export async function collectDoctorRows(
  options: DoctorOptions = {}
): Promise<DoctorRow[]> {
  const context: DoctorContext = {
    env: options.env ?? process.env,
    flags: options.flags ?? {},
    home: resolveHome(options),
    version: options.version ?? readPackageVersion(),
    claude: detectClaude(options),
    codex: detectCodex(options),
    options,
  };

  return [
    { name: "CLI Version", status: "ok", message: context.version },
    { name: "Node Version", status: "ok", message: process.version },
    envFileRow(context),
    await onePasswordRow(context),
    providersRow(context),
    paygateRow(context),
    outputDirRow(context),
    agentSkillRow(context),
    claudePluginRow(context),
    claudePluginVersionRow(context),
    claudeSkillRow(context),
    codexSkillRow(context),
  ];
}

/** `apicity doctor [--json]` — always exit 0, whatever the rows say. */
export async function runDoctor(
  argv: string[],
  writer: CliWriter,
  options: DoctorCommandOptions = {}
): Promise<number> {
  const { flags, rest } = parseGlobalFlags(argv);
  if (rest.length > 0) {
    // Not a `usage` error: `doctor` is the command a confused caller reaches
    // for, and refusing to run it because of a stray word helps nobody.
    writer.err(`[apicity] ignoring unexpected argument: ${rest[0]}`);
  }

  const rows = await collectDoctorRows({
    ...options,
    flags: options.flags ?? flags,
  });

  const out = createWriter({
    json: flags.json,
    quiet: flags.quiet,
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: (text) => writer.out(text),
    stderr: (text) => writer.err(text),
  });
  if (out.machine) {
    out.success(rows, { summary: doctorSummary(rows) });
    return 0;
  }
  out.text(humanReport(rows));
  return 0;
}

/**
 * `[ok]` and `[!!]` are the two markers the contract names; `[XX]` is the
 * third, so a warning and an error are still one glance apart.
 */
const STATUS_MARKER: Record<DoctorStatus, string> = {
  ok: "[ok]",
  warning: "[!!]",
  error: "[XX]",
};

export function humanReport(rows: DoctorRow[]): string[] {
  const lines: string[] = [];
  for (const row of rows) {
    lines.push(`${STATUS_MARKER[row.status]} ${row.name}: ${row.message}`);
    if (row.hint !== undefined) lines.push(`     hint: ${row.hint}`);
  }
  if (rows.every((row) => row.status === "ok"))
    lines.push("All checks passed.");
  return lines;
}

function doctorSummary(rows: DoctorRow[]): string {
  const errors = rows.filter((row) => row.status === "error").length;
  const warnings = rows.filter((row) => row.status === "warning").length;
  if (errors === 0 && warnings === 0) return "All checks passed.";
  return `${errors} error(s), ${warnings} warning(s) of ${rows.length} checks`;
}

// ---------------------------------------------------------------------------
// the rows
// ---------------------------------------------------------------------------

function envFileRow(context: DoctorContext): DoctorRow {
  const named = context.flags.envFile ?? context.env.APICITY_ENV_FILE;
  if (named !== undefined && named !== "") {
    return isReadable(named)
      ? { name: "Env File", status: "ok", message: named }
      : {
          name: "Env File",
          status: "error",
          message: `${named} could not be read`,
          hint: `check --env-file, or unset APICITY_ENV_FILE`,
        };
  }

  const fallback = defaultEnvFilePath(context.env);
  return isReadable(fallback)
    ? { name: "Env File", status: "ok", message: fallback }
    : {
        name: "Env File",
        status: "ok",
        message: "not found, using environment",
      };
}

/**
 * Only a host that configured 1Password is checked: spawning `op` on a host
 * that never asked for it would make a check out of a non-feature.
 */
async function onePasswordRow(context: DoctorContext): Promise<DoctorRow> {
  const vault = context.flags.opVault ?? context.env.APICITY_OP_VAULT;
  const token = context.flags.opToken ?? context.env.APICITY_OP_SERVICE_TOKEN;
  if (!vault && !token) {
    return { name: "1Password CLI", status: "ok", message: "not configured" };
  }

  const run = context.options.run ?? runSubprocess;
  const result = await run("op", ["--version"], {
    timeoutMs: OP_VERSION_TIMEOUT_MS,
    stdio: SUBPROCESS_STDIO,
  });
  if (result.code === 0) {
    const version = result.stdout.trim().split("\n")[0];
    return {
      name: "1Password CLI",
      status: "ok",
      message: version === "" ? "installed" : `op ${version}`,
    };
  }
  return {
    name: "1Password CLI",
    status: "error",
    message: result.timedOut
      ? "op --version timed out"
      : "op --version failed; the CLI is configured but not usable",
    hint: "install the 1Password CLI, or unset APICITY_OP_VAULT",
  };
}

function providersRow(context: DoctorContext): DoctorRow {
  const names = providerNames();
  const configured = names.filter((name) =>
    isProviderConfigured(name, context.env)
  );
  // `N of M configured (names)` is parsed by the plugin's SessionStart hook.
  const message =
    `${configured.length} of ${names.length} configured` +
    (configured.length === 0 ? "" : ` (${configured.join(", ")})`);
  if (configured.length === names.length) {
    return { name: "Providers", status: "ok", message };
  }
  return {
    name: "Providers",
    status: "warning",
    message,
    hint: "run: apicity providers — it names the variable each one reads",
  };
}

function paygateRow(context: DoctorContext): DoctorRow {
  const path =
    context.flags.paygateSecretFile ?? context.env.APICITY_PAYGATE_SECRET_FILE;
  if (path === undefined || path === "") {
    return {
      name: "Paygate Secret File",
      status: "warning",
      message: "not set; paid endpoints will fail closed",
      hint: "set APICITY_PAYGATE_SECRET_FILE, or pass --paygate-secret-file",
    };
  }
  // Readability, never contents: the value in that file is the shared secret.
  return isReadable(path)
    ? { name: "Paygate Secret File", status: "ok", message: path }
    : {
        name: "Paygate Secret File",
        status: "error",
        message: `${path} could not be read`,
        hint: "check the path and its permissions",
      };
}

function outputDirRow(context: DoctorContext): DoctorRow {
  const dir = resolveOutputDirectory(
    context.flags.outputDir,
    context.env,
    context.options.cwd
  );
  return isWritable(dir)
    ? { name: "Output Dir", status: "ok", message: dir }
    : {
        name: "Output Dir",
        status: "error",
        message: `${dir} is not writable`,
        hint: "pass --output-dir, or set APICITY_OUTPUT_DIR",
      };
}

function agentSkillRow(context: DoctorContext): DoctorRow {
  const dir = baselineSkillDir(context.home);
  if (lstat(dir) === undefined) {
    return {
      name: "Agent Skill",
      status: "warning",
      message: "Not installed",
      hint: "apicity skill install",
    };
  }
  if (!isManagedSkillDir(dir)) {
    return {
      name: "Agent Skill",
      status: "error",
      message: `${dir} was not written by the apicity CLI`,
      hint: "Move it aside, then run: apicity skill install",
    };
  }

  const stamp = readTrimmed(join(dir, INSTALLED_VERSION_FILE));
  if (stamp === context.version) {
    return {
      name: "Agent Skill",
      status: "ok",
      message: `Installed (${context.version})`,
    };
  }
  return {
    name: "Agent Skill",
    status: "warning",
    message: `Installed ${stamp ?? "unknown"}, CLI ${context.version}`,
    hint: "apicity skill install",
  };
}

function claudePluginRow(context: DoctorContext): DoctorRow {
  if (!context.claude) return notDetected("Claude Code Plugin", "Claude Code");
  const record = readInstalledPlugin(context.home);
  if (record === undefined) {
    return {
      name: "Claude Code Plugin",
      status: "warning",
      message: "Not installed",
      hint: "apicity setup claude",
    };
  }
  return {
    name: "Claude Code Plugin",
    status: "ok",
    message: `Installed (${record.key})`,
  };
}

function claudePluginVersionRow(context: DoctorContext): DoctorRow {
  const name = "Claude Code Plugin Version";
  if (!context.claude) return notDetected(name, "Claude Code");

  const record = readInstalledPlugin(context.home);
  if (record === undefined) {
    return { name, status: "ok", message: "Plugin not installed" };
  }
  if (record.version === undefined) {
    return { name, status: "ok", message: "Version not tracked" };
  }
  if (record.version === context.version) {
    return { name, status: "ok", message: `Matched (${record.version})` };
  }
  return {
    name,
    status: "warning",
    message: `Mismatched (plugin ${record.version}, CLI ${context.version})`,
    hint: "In Claude Code: /plugins → Marketplaces → apicity → Enable auto-update",
  };
}

function claudeSkillRow(context: DoctorContext): DoctorRow {
  const name = "Claude Code Skill";
  if (!context.claude) return notDetected(name, "Claude Code");

  const link = claudeSkillLink(context.home);
  if (lstat(link) === undefined) {
    return {
      name,
      status: "error",
      message: "Skill not linked",
      hint: "apicity setup claude",
    };
  }
  // One test for the symlink and the copy fallback alike: the skill file has
  // to be a regular file *through* whatever is at the path, and the directory
  // it lands in has to carry our marker.
  if (isRegularFile(join(link, SKILL_FILENAME)) && isMarked(link)) {
    return { name, status: "ok", message: "Linked" };
  }
  return {
    name,
    status: "error",
    message: `A skill not written by apicity occupies ${link}`,
    hint: "Move it aside, then run: apicity setup claude",
  };
}

function codexSkillRow(context: DoctorContext): DoctorRow {
  const name = "Codex Skill";
  if (!context.codex) return notDetected(name, "Codex");

  const dir = baselineSkillDir(context.home);
  if (isManagedSkillDir(dir)) {
    return { name, status: "ok", message: `Installed at ${dir}` };
  }
  return {
    name,
    status: "error",
    message: "Shared skill not installed",
    hint: "apicity setup codex",
  };
}

function notDetected(name: string, agent: string): DoctorRow {
  return { name, status: "ok", message: `${agent} not detected` };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Ours, and healthy: our marker plus a `SKILL.md` that is a regular file. */
function isManagedSkillDir(dir: string): boolean {
  return isMarked(dir) && isRegularFile(join(dir, SKILL_FILENAME));
}

function isMarked(dir: string): boolean {
  return isRegularFile(join(dir, OWNERSHIP_MARKER_FILE));
}

/**
 * Follows symlinks on purpose — `~/.claude/skills/apicity` is one — so a
 * dangling link reads as absent rather than as a file.
 */
function isRegularFile(path: string): boolean {
  try {
    return statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;
  } catch {
    return false;
  }
}

function lstat(path: string): ReturnType<typeof lstatSync> | undefined {
  return lstatSync(path, { throwIfNoEntry: false });
}

function readTrimmed(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8").trim();
  } catch {
    return undefined;
  }
}

function isReadable(path: string): boolean {
  return canAccess(path, constants.R_OK);
}

function isWritable(path: string): boolean {
  return canAccess(path, constants.W_OK);
}

function canAccess(path: string, mode: number): boolean {
  try {
    accessSync(path, mode);
    return true;
  } catch {
    return false;
  }
}
