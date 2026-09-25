import { accessSync, constants, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { parseGlobalFlags } from "./args.js";
import {
  defaultEnvFilePath,
  isProviderConfigured,
  providerNames,
  readCredentialSources,
  resolveServiceToken,
  type CredentialSetting,
  type CredentialSources,
} from "./credentials.js";
import {
  createWriter,
  resolveOutputDirectory,
  type CliWriter,
} from "./envelope.js";
import { errorMessage, lstat } from "./internal.js";
import {
  describeOpFailure,
  getProviderEnvVars,
  parseItemTitles,
  OP_ITEM_LIST_TIMEOUT_MS,
} from "./one-password.js";
import {
  detectClaude,
  detectCodex,
  readInstalledPlugin,
  resolveHome,
  type AgentDetectionOptions,
  type InstalledPlugin,
} from "./plugin.js";
import {
  runSubprocess,
  SUBPROCESS_STDIO,
  type SubprocessRunner,
} from "./subprocess.js";
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
  /**
   * The env file and 1Password settings a call would read, read once and
   * never exported: the Providers and 1Password rows both answer from it.
   */
  sources: CredentialSources;
  home: string;
  version: string;
  claude: boolean;
  codex: boolean;
  /**
   * Claude Code's install record for this plugin, read once here for the
   * two plugin rows (A-7); `undefined` when the file or the record is
   * absent.
   */
  plugin: InstalledPlugin | undefined;
  options: DoctorOptions;
}

/**
 * Answer every row.
 *
 * No row ever carries a credential: the Env File and Paygate rows print the
 * path a variable named and never its contents, the Providers row prints
 * names, and the 1Password row prints `op`'s version, the vault's name,
 * variable names and where the token came from — never the token.
 */
export async function collectDoctorRows(
  options: DoctorOptions = {}
): Promise<DoctorRow[]> {
  const home = resolveHome(options);
  const env = options.env ?? process.env;
  const flags = options.flags ?? {};
  const context: DoctorContext = {
    env,
    flags,
    sources: readCredentialSources(env, {
      envFile: flags.envFile,
      opVault: flags.opVault,
      opToken: flags.opToken,
    }),
    home,
    version: options.version ?? readPackageVersion(),
    claude: detectClaude(options),
    codex: detectCodex(options),
    plugin: readInstalledPlugin(home),
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
 *
 * The vault and the token are found the way a call finds them — flag, then
 * environment, then env file — and the row says which state that leaves
 * (ac-w7vzap OQ-005): a token alone resolves `op://` references (`ok`); a vault
 * alone makes every call exit `usage` (`error`); both are checked by listing
 * the vault once, with the token only in `op`'s environment, and the row warns
 * about any provider variable nothing else supplies and the vault lacks.
 */
async function onePasswordRow(context: DoctorContext): Promise<DoctorRow> {
  const name = "1Password CLI";
  const { vault, token } = context.sources;
  if (vault === undefined && token === undefined) {
    return { name, status: "ok", message: "not configured" };
  }

  // An `env:VAR` or `$VAR` token whose variable is unset fails every call
  // before `op` could run, so nothing is spawned to report it.
  let resolvedToken: string | undefined;
  if (token !== undefined) {
    try {
      resolvedToken = resolveServiceToken(token.value, context.sources.env);
    } catch (err) {
      return {
        name,
        status: "error",
        message: errorMessage(err),
        hint:
          "set that variable, or run: apicity setup 1password with another " +
          "--op-token",
      };
    }
  }

  const run = context.options.run ?? runSubprocess;
  const result = await run("op", ["--version"], {
    timeoutMs: OP_VERSION_TIMEOUT_MS,
    stdio: SUBPROCESS_STDIO,
  });
  if (result.code !== 0) {
    return {
      name,
      status: "error",
      message: result.timedOut
        ? "op --version timed out"
        : "op --version failed; the CLI is configured but not usable",
      hint: "install the 1Password CLI, or unset APICITY_OP_VAULT",
    };
  }
  const version = result.stdout.trim().split("\n")[0];
  const op = version === "" ? "op installed" : `op ${version}`;

  if (vault === undefined) {
    return {
      name,
      status: "ok",
      message:
        `${op}; token from ${describeTokenSource(token, context)}; ` +
        "op:// references resolve with it; no vault, so no vault convention",
    };
  }
  // A bare-name token whose variable is set but empty resolves to "", which
  // a call treats as no token at all.
  if (token === undefined || !resolvedToken) {
    return {
      name,
      status: "error",
      message: `${op}; vault ${vault.value} has no token, so calls exit usage`,
      hint:
        "set --op-token or APICITY_OP_SERVICE_TOKEN, or run: " +
        "apicity setup 1password",
    };
  }

  const configured =
    `${op}; vault ${vault.value}; ` +
    `token from ${describeTokenSource(token, context)}`;
  const listing = await run(
    "op",
    ["item", "list", "--vault", vault.value, "--format", "json"],
    {
      timeoutMs: OP_ITEM_LIST_TIMEOUT_MS,
      stdio: SUBPROCESS_STDIO,
      env: { OP_SERVICE_ACCOUNT_TOKEN: resolvedToken },
    }
  );
  let titles: Set<string> | undefined;
  if (listing.code === 0 && !listing.timedOut) {
    try {
      titles = new Set(parseItemTitles(listing.stdout));
    } catch {
      titles = undefined;
    }
  }
  if (titles === undefined) {
    const detail =
      listing.code === 0 && !listing.timedOut
        ? "unreadable output"
        : describeOpFailure(listing, resolvedToken);
    return {
      name,
      status: "error",
      message: `${configured}; op item list failed: ${detail}`,
      hint:
        "check the token and the vault name, then re-run " +
        "apicity setup 1password",
    };
  }

  // Only a variable nothing else supplies is read from the vault, so only
  // those can be missing from it.
  const missing = getProviderEnvVars().filter(
    (envVar) => !isSupplied(context.sources, envVar) && !titles.has(envVar)
  );
  if (missing.length === 0) {
    return { name, status: "ok", message: configured };
  }
  return {
    name,
    status: "warning",
    message: `${configured}; no vault item for ${missing.join(", ")}`,
    hint:
      "add those items, or supply the variables another way; see " +
      "apicity providers",
  };
}

/** Supplied by a process value, an env-file literal or a reference. */
function isSupplied(sources: CredentialSources, envVar: string): boolean {
  const value = sources.env[envVar];
  return (
    (value !== undefined && value !== "") ||
    Object.prototype.hasOwnProperty.call(sources.references, envVar)
  );
}

/**
 * Where the token came from, and how it was written — never the token: a
 * reference form (`env:VAR`, `$VAR`, a bare name that is set) is named, and
 * anything else is a literal that is only ever called one.
 */
function describeTokenSource(
  token: CredentialSetting | undefined,
  context: DoctorContext
): string {
  if (token === undefined) return "nowhere";
  const { value } = token;
  const named =
    value.startsWith("env:") ||
    value.startsWith("$") ||
    (context.sources.env[value] ?? "") !== "";
  return `${token.source} (${named ? value : "literal"})`;
}

function providersRow(context: DoctorContext): DoctorRow {
  const names = providerNames();
  const configured = names.filter((name) =>
    isProviderConfigured(name, context.env, context.sources)
  );
  // The same count `apicity providers` reports, offline: the env file and the
  // vault convention count, and nothing asks 1Password. The SessionStart hook
  // reads `apicity providers --json` now, but this message keeps its
  // `N of M configured (names)` shape.
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
      status: "ok",
      message:
        "not set; the pay gate is off and paid endpoints call upstream directly",
    };
  }
  // Readability and emptiness, never contents: the value in that file is the
  // shared secret, so it is read only to be compared with "".
  if (!isReadable(path)) {
    return {
      name: "Paygate Secret File",
      status: "error",
      message: `${path} could not be read`,
      hint: "check the path and its permissions",
    };
  }
  return isBlankFile(path)
    ? {
        name: "Paygate Secret File",
        status: "error",
        message: `${path} is empty`,
        hint: "write the shared pay-gate secret to that file",
      }
    : { name: "Paygate Secret File", status: "ok", message: path };
}

function isBlankFile(path: string): boolean {
  try {
    return readFileSync(path, "utf8").trim() === "";
  } catch {
    return false;
  }
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
  const record = context.plugin;
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

  const record = context.plugin;
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
