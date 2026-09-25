import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import { parseGlobalFlags } from "./args.js";
import {
  locateEnvFile,
  resolveServiceToken,
  type CredentialFlags,
} from "./credentials.js";
import { removeEnvFileAssignments, setEnvFileAssignments } from "./env-file.js";
import { createWriter, type CliWriter } from "./envelope.js";
import { CliError } from "./errors.js";
import { errorMessage } from "./internal.js";
import { describeOpFailure, OP_ITEM_LIST_TIMEOUT_MS } from "./one-password.js";
import {
  detectClaude,
  detectCodex,
  findClaudeBinary,
  readInstalledPlugin,
  resolveHome,
  MARKETPLACE_NAME,
  MARKETPLACE_SOURCE,
  PLUGIN_KEY,
} from "./plugin.js";
import {
  installSkill,
  removeSkill,
  type InstallSkillOptions,
  type RemoveSkillResult,
} from "./skill.js";
import {
  runSubprocess,
  SUBPROCESS_STDIO,
  type SubprocessResult,
  type SubprocessRunner,
} from "./subprocess.js";

// ---------------------------------------------------------------------------
// the subprocess seam — declared in subprocess.ts
// ---------------------------------------------------------------------------

/** Every call site goes through here, so none can forget the stdio rule. */
function invoke(
  run: SubprocessRunner,
  command: string,
  args: string[],
  timeoutMs: number
): Promise<SubprocessResult> {
  return run(command, args, { timeoutMs, stdio: SUBPROCESS_STDIO });
}

// ---------------------------------------------------------------------------
// the contract
// ---------------------------------------------------------------------------

export const MARKETPLACE_ADD_TIMEOUT_MS = 60_000;
export const MARKETPLACE_UPDATE_TIMEOUT_MS = 60_000;
export const PLUGIN_INSTALL_TIMEOUT_MS = 120_000;
export const PLUGIN_UNINSTALL_TIMEOUT_MS = 120_000;

/** The env var that picks an agent for `apicity setup agents`. */
export const SETUP_AGENT_VAR = "APICITY_SETUP_AGENT";
export const SETUP_AGENT_SELECTORS = [
  "claude",
  "codex",
  "all",
  "none",
] as const;
export type SetupAgentSelector = (typeof SETUP_AGENT_SELECTORS)[number];

/** The four things `apicity setup` can be pointed at. */
export const SETUP_FORMS = ["claude", "codex", "agents", "1password"] as const;
export type SetupForm = (typeof SETUP_FORMS)[number];

/** The two lines `apicity setup 1password` owns in the env file. */
const ONE_PASSWORD_VARIABLES = [
  "APICITY_OP_VAULT",
  "APICITY_OP_SERVICE_TOKEN",
] as const;

export type AgentId = "claude" | "codex";

/**
 * What a caller has to run by hand when `claude` is not on this host. Printed
 * in the hint and repeated verbatim in `meta.manual_commands`, so the envelope
 * carries copy-pasteable commands rather than a description of them.
 */
export const MANUAL_CLAUDE_COMMANDS: readonly string[] = [
  `claude plugin marketplace add ${MARKETPLACE_SOURCE}`,
  `claude plugin marketplace update ${MARKETPLACE_NAME}`,
  `claude plugin install ${PLUGIN_KEY}`,
];

export interface AgentStatus {
  id: AgentId;
  detected: boolean;
  connected: boolean;
}

/** What every `apicity setup …` form answers as its `data`. */
export interface SetupResult {
  plugin_installed: boolean;
  agent_detected: boolean;
  /** Present on the `agents` form: every agent, detected or not. */
  agents?: AgentStatus[];
  /** Non-fatal things the caller should know; empty on the `agents` form. */
  warnings?: string[];
}

export interface SetupOptions extends InstallSkillOptions {
  /** Seam: the subprocess runner, so a test never spawns `claude`. */
  run?: SubprocessRunner;
}

export interface SetupCommandOptions extends SetupOptions {
  /** Injected so a test can drive both halves of the output rule (D-5). */
  stdoutIsTTY?: boolean;
}

export interface OnePasswordSetupOptions {
  env?: NodeJS.ProcessEnv;
  /** `--env-file`, `--op-vault` and `--op-token`, as the line gave them. */
  flags?: CredentialFlags;
  /** False for `--no-verify`: write the two lines and never run `op`. */
  verify?: boolean;
  /** Seam: the subprocess runner, so a test never spawns `op`. */
  run?: SubprocessRunner;
}

/** What `apicity setup 1password` answers as `data`: names, never values. */
export interface OnePasswordSetupResult {
  env_file: string;
  variables: string[];
  vault: string;
  /** Whether `op item list` accepted the pair; false with `--no-verify`. */
  verified: boolean;
}

/** What `apicity setup 1password --remove` answers as its `data`. */
export interface OnePasswordRemoveResult {
  env_file: string;
  /** The variables whose lines were deleted, in file order. */
  removed: string[];
}

// ---------------------------------------------------------------------------
// the three forms
// ---------------------------------------------------------------------------

/**
 * `apicity setup claude` — the skill, the link, and the plugin.
 *
 * The skill is installed first and unconditionally: it is the half that works
 * on every host, so a caller whose plugin install fails still ends up with a
 * usable skill and an envelope saying which half is missing.
 */
export async function setupClaude(
  options: SetupOptions = {}
): Promise<SetupResult> {
  installSkill(options);
  const warnings: string[] = [];
  const installed = await connectClaude(options, warnings);
  return withWarnings(
    { plugin_installed: installed, agent_detected: true },
    warnings
  );
}

/**
 * `apicity setup codex` — the shared skill, and nothing else.
 *
 * Codex has no plugin mechanism: it reads `~/.agents/skills` directly, which
 * `installSkill` already wrote, so "connecting" Codex is detecting it.
 */
export function setupCodex(options: SetupOptions = {}): SetupResult {
  installSkill(options);
  if (!detectCodex(options)) throw codexMissing();
  return { plugin_installed: false, agent_detected: true };
}

/**
 * `apicity setup agents` — install the skill, then connect what is
 * unambiguous.
 *
 * It never asks a question, and never fails for want of an agent: with none
 * detected, or several, the skill install is the whole result and `warnings`
 * names the explicit command for each. `APICITY_SETUP_AGENT` overrides that
 * choice; an agent it names explicitly and that is not installed is an error,
 * because the caller asked for exactly that one.
 */
export async function setupAgents(
  options: SetupOptions = {}
): Promise<SetupResult> {
  installSkill(options);

  const warnings: string[] = [];
  const detected: Record<AgentId, boolean> = {
    claude: detectClaude(options),
    codex: detectCodex(options),
  };
  const selector = readSelector(options.env ?? process.env, warnings);
  const chosen = chooseAgents(selector, detected, warnings);

  const connected: Record<AgentId, boolean> = { claude: false, codex: false };
  if (chosen.includes("claude")) {
    connected.claude = await connectClaude(options, warnings);
  }
  if (chosen.includes("codex")) {
    if (!detected.codex) throw codexMissing();
    connected.codex = true;
  }

  return {
    plugin_installed: connected.claude,
    agent_detected: detected.claude || detected.codex,
    agents: (["claude", "codex"] as const).map((id) => ({
      id,
      detected: detected[id],
      connected: connected[id],
    })),
    warnings,
  };
}

/**
 * `apicity setup … --remove` — undo, for anything this CLI wrote.
 *
 * The plugin uninstall is best effort on purpose: the skill removal is the
 * half this CLI can prove it owns, and a `claude` that is gone, broken or
 * already rid of the plugin must not strand the rest.
 */
export async function removeSetup(
  options: SetupOptions = {}
): Promise<RemoveSkillResult> {
  const removed: string[] = [];
  const record = readInstalledPlugin(resolveHome(options));
  const claude = findClaudeBinary(options);
  if (record !== undefined && claude !== undefined) {
    const result = await invoke(
      options.run ?? runSubprocess,
      claude,
      ["plugin", "uninstall", record.key],
      PLUGIN_UNINSTALL_TIMEOUT_MS
    );
    if (result.code === 0) removed.push(record.key);
  }

  const skill = removeSkill(options);
  return { removed: [...removed, ...skill.removed], kept: skill.kept };
}

// ---------------------------------------------------------------------------
// apicity setup 1password
// ---------------------------------------------------------------------------

/**
 * `apicity setup 1password` — persist the 1Password vault and service-account
 * token in the env file every call loads, then check the pair once.
 *
 * The inputs are exactly what the global flags already carry (ac-w7vzap D-3):
 * the vault from `--op-vault`, else the process's `APICITY_OP_VAULT`, and the
 * token from `--op-token`, else `APICITY_OP_SERVICE_TOKEN` — never the file
 * being written (ac-w7vzap OQ-008), and it asks nothing. The token is written
 * as given, so the `env:VAR` form keeps the secret itself off disk.
 *
 * The probe runs after the write, so a failure leaves the lines in place: the
 * repair is to fix the input and run this again, or `apicity doctor`.
 */
export async function setupOnePassword(
  options: OnePasswordSetupOptions = {}
): Promise<OnePasswordSetupResult> {
  const env = options.env ?? process.env;
  const flags = options.flags ?? {};
  const vault = flags.opVault ?? env.APICITY_OP_VAULT;
  const token = flags.opToken ?? env.APICITY_OP_SERVICE_TOKEN;
  if (!vault) throw missingOnePasswordInput("--op-vault", "APICITY_OP_VAULT");
  if (!token) {
    throw missingOnePasswordInput("--op-token", "APICITY_OP_SERVICE_TOKEN");
  }
  // A CR or LF would write a second line, and so a variable of its own.
  if (/[\r\n]/.test(vault)) throw notOneLine("--op-vault");
  if (/[\r\n]/.test(token)) throw notOneLine("--op-token");

  const envFile = locateEnvFile(env, flags).path;
  editEnvFile(envFile, (content) =>
    setEnvFileAssignments(content, [
      ["APICITY_OP_VAULT", vault],
      ["APICITY_OP_SERVICE_TOKEN", token],
    ])
  );
  const result: OnePasswordSetupResult = {
    env_file: envFile,
    variables: [...ONE_PASSWORD_VARIABLES],
    vault,
    verified: false,
  };
  if (options.verify === false) return result;

  const meta = { env_file: envFile, variables: [...ONE_PASSWORD_VARIABLES] };
  let resolved: string;
  try {
    resolved = resolveServiceToken(token, env) ?? "";
  } catch (err) {
    if (!(err instanceof CliError)) throw err;
    throw new CliError(err.code, err.message, {
      hint:
        `the vault and token were saved to ${envFile}; set that variable, ` +
        "or re-run with --no-verify",
      meta,
      cause: err,
    });
  }

  const probe = await (options.run ?? runSubprocess)(
    "op",
    ["item", "list", "--vault", vault, "--format", "json"],
    {
      timeoutMs: OP_ITEM_LIST_TIMEOUT_MS,
      stdio: SUBPROCESS_STDIO,
      // The token reaches `op` as its environment, never on argv.
      env: { OP_SERVICE_ACCOUNT_TOKEN: resolved },
    }
  );
  if (probe.notFound) {
    throw new CliError(
      "setup_incomplete",
      "the 1Password CLI `op` was not found; the vault and token were saved " +
        `to ${envFile}`,
      {
        hint:
          "install the 1Password CLI " +
          "(https://developer.1password.com/docs/cli/), then run: " +
          "apicity doctor",
        meta,
      }
    );
  }
  if (probe.timedOut) {
    throw new CliError(
      "network",
      `op item list --vault ${vault} timed out after ` +
        `${OP_ITEM_LIST_TIMEOUT_MS} ms`,
      { hint: "re-run apicity setup 1password, or pass --no-verify", meta }
    );
  }
  if (probe.code !== 0) {
    throw new CliError(
      "auth",
      `1Password rejected vault ${vault} or the service-account token: ` +
        describeOpFailure(probe, resolved),
      {
        hint:
          "fix the vault or the token, then re-run apicity setup 1password " +
          "or run: apicity doctor",
        meta,
      }
    );
  }
  return { ...result, verified: true };
}

/**
 * `apicity setup 1password --remove` — delete the lines that assign the two
 * variables, and nothing else. An absent file is a success with nothing
 * removed; the file itself is never deleted, and nothing is verified.
 */
export function removeOnePasswordSetup(
  options: OnePasswordSetupOptions = {}
): OnePasswordRemoveResult {
  const envFile = locateEnvFile(options.env ?? process.env, options.flags).path;
  if (!existsSync(envFile)) return { env_file: envFile, removed: [] };

  let removed: string[] = [];
  editEnvFile(envFile, (content) => {
    const edit = removeEnvFileAssignments(content, ONE_PASSWORD_VARIABLES);
    removed = edit.removed;
    return edit.content;
  });
  return { env_file: envFile, removed };
}

/**
 * Apply `edit` to the env file, creating it if need be.
 *
 * A directory this creates is made private (0700), and so is a file (0600);
 * both are `chmod`ed after creation, so a narrow umask cannot leave them any
 * wider. An existing file keeps its mode (ac-w7vzap OQ-011), and one whose
 * content the edit leaves alone is not rewritten at all.
 */
function editEnvFile(path: string, edit: (content: string) => string): void {
  try {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
      chmodSync(dir, 0o700);
    }
    if (!existsSync(path)) {
      writeFileSync(path, edit(""), { mode: 0o600 });
      chmodSync(path, 0o600);
      return;
    }
    const before = readFileSync(path, "utf8");
    const after = edit(before);
    if (after !== before) writeFileSync(path, after);
  } catch (cause) {
    throw new CliError(
      "api",
      `${path} could not be written: ${errorMessage(cause)}`,
      {
        hint: "check --env-file, or unset APICITY_ENV_FILE",
        cause,
      }
    );
  }
}

function missingOnePasswordInput(flag: string, variable: string): CliError {
  return new CliError(
    "usage",
    `apicity setup 1password needs ${flag} (or ${variable})`,
    {
      hint:
        "run: apicity setup 1password --op-vault <vault> " +
        "--op-token env:OP_SERVICE_ACCOUNT_TOKEN",
    }
  );
}

function notOneLine(flag: string): CliError {
  return new CliError("usage", `${flag} must be a single line`, {
    hint: "pass a value with no line break in it",
  });
}

// ---------------------------------------------------------------------------
// the Claude Code plugin install
// ---------------------------------------------------------------------------

/**
 * Add the marketplace, refresh it, install the plugin, then prove it.
 *
 * The first two steps log and continue: `marketplace add` fails on the second
 * run with the marketplace already present, and `update` is a refresh whose
 * failure only means the cached copy is what gets installed. Only `install`
 * and the re-read of `installed_plugins.json` decide the outcome — the file is
 * the one witness that does not depend on how a `claude` release words its
 * exit statuses.
 */
async function connectClaude(
  options: SetupOptions,
  warnings: string[]
): Promise<boolean> {
  const claude = findClaudeBinary(options);
  if (claude === undefined) throw claudeMissing();
  const run = options.run ?? runSubprocess;

  const add = await invoke(
    run,
    claude,
    ["plugin", "marketplace", "add", MARKETPLACE_SOURCE],
    MARKETPLACE_ADD_TIMEOUT_MS
  );
  if (add.code !== 0) warnings.push(stepWarning("marketplace add", add));

  const update = await invoke(
    run,
    claude,
    ["plugin", "marketplace", "update", MARKETPLACE_NAME],
    MARKETPLACE_UPDATE_TIMEOUT_MS
  );
  if (update.code !== 0)
    warnings.push(stepWarning("marketplace update", update));

  const install = await invoke(
    run,
    claude,
    ["plugin", "install", PLUGIN_KEY],
    PLUGIN_INSTALL_TIMEOUT_MS
  );
  if (install.code !== 0) {
    throw setupIncomplete(
      `claude plugin install ${PLUGIN_KEY} failed: ${failureText(install)}`
    );
  }

  if (readInstalledPlugin(resolveHome(options)) === undefined) {
    throw setupIncomplete(
      `claude plugin install ${PLUGIN_KEY} reported success but ` +
        "installed_plugins.json does not record it"
    );
  }
  return true;
}

function stepWarning(step: string, result: SubprocessResult): string {
  return `claude plugin ${step} failed, continuing: ${failureText(result)}`;
}

function failureText(result: SubprocessResult): string {
  if (result.timedOut) return "timed out";
  const detail = (result.stderr || result.stdout).trim().split("\n")[0];
  return detail === "" ? `exit ${result.code}` : detail;
}

// ---------------------------------------------------------------------------
// agent selection
// ---------------------------------------------------------------------------

function readSelector(
  env: NodeJS.ProcessEnv,
  warnings: string[]
): SetupAgentSelector | undefined {
  const raw = env[SETUP_AGENT_VAR];
  if (raw === undefined || raw === "") return undefined;
  const value = raw.trim().toLowerCase();
  if (isSelector(value)) return value;
  // Never fail for a typo in a variable: this command's whole contract is
  // that it finishes without asking anybody anything.
  warnings.push(
    `${SETUP_AGENT_VAR}=${raw} is not one of ` +
      `${SETUP_AGENT_SELECTORS.join(", ")}; detecting instead`
  );
  return undefined;
}

function isSelector(value: string): value is SetupAgentSelector {
  return (SETUP_AGENT_SELECTORS as readonly string[]).includes(value);
}

function chooseAgents(
  selector: SetupAgentSelector | undefined,
  detected: Record<AgentId, boolean>,
  warnings: string[]
): AgentId[] {
  if (selector === "none") return [];
  if (selector === "claude" || selector === "codex") return [selector];
  if (selector === "all") {
    const present = agentIds().filter((id) => detected[id]);
    for (const id of agentIds()) {
      if (!detected[id]) warnings.push(`${id} was not detected; skipped`);
    }
    return present;
  }

  const present = agentIds().filter((id) => detected[id]);
  if (present.length === 1) return present;
  if (present.length > 1) {
    warnings.push(
      "several agents detected; installed the skill only — run: " +
        agentIds()
          .map((id) => `apicity setup ${id}`)
          .join(", ")
    );
  }
  return [];
}

function agentIds(): AgentId[] {
  return ["claude", "codex"];
}

function withWarnings(result: SetupResult, warnings: string[]): SetupResult {
  return warnings.length === 0 ? result : { ...result, warnings };
}

// ---------------------------------------------------------------------------
// the command
// ---------------------------------------------------------------------------

/**
 * `apicity setup [claude|codex|agents|1password] [--remove] [--json]`, and
 * `--no-verify` for `1password` alone.
 */
export async function runSetupCommand(
  argv: string[],
  writer: CliWriter,
  options: SetupCommandOptions = {}
): Promise<number> {
  const { flags, rest } = parseGlobalFlags(argv);
  const remove = rest.includes("--remove");
  // Taken out of `rest` like `--remove`: it is this command's own flag, not a
  // global one, so the shared table in `args.ts` never learns it.
  const noVerify = rest.includes("--no-verify");
  const positional = rest.filter(
    (arg) => arg !== "--remove" && arg !== "--no-verify"
  );

  const unknownFlag = positional.find((arg) => arg.startsWith("-"));
  if (unknownFlag !== undefined) {
    throw new CliError("usage", `unknown flag: ${unknownFlag}`, {
      hint: "run: apicity setup [claude|codex|agents|1password] [--remove]",
    });
  }
  if (positional.length > 1) {
    throw new CliError("usage", `unexpected argument: ${positional[1]}`, {
      hint: "run: apicity setup [claude|codex|agents|1password] [--remove]",
    });
  }

  // Bare `apicity setup` is `apicity setup agents`: the form that decides for
  // itself is the one a caller who did not name a form wants.
  const form = positional[0] ?? "agents";
  if (!isSetupForm(form)) {
    throw new CliError("not_found", `unknown setup target: ${form}`, {
      hint: "run: apicity setup claude, codex, agents, or 1password",
    });
  }
  if (noVerify && form !== "1password") {
    throw new CliError("usage", "unknown flag: --no-verify", {
      hint: "only apicity setup 1password takes --no-verify",
    });
  }

  const out = createWriter({
    json: flags.json,
    quiet: flags.quiet,
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: (text) => writer.out(text),
    stderr: (text) => writer.err(text),
  });

  // The 1Password form edits the env file and nothing else; every other form,
  // `--remove` included, never opens it.
  if (form === "1password") {
    const onePassword = {
      env: options.env,
      flags,
      verify: !noVerify,
      run: options.run,
    };
    if (remove) {
      return out.success(removeOnePasswordSetup(onePassword), {
        summary: "apicity setup 1password removed",
      });
    }
    return out.success(await setupOnePassword(onePassword), {
      summary: "apicity setup 1password complete",
    });
  }

  if (remove) {
    return out.success(await removeSetup(options), {
      summary: "apicity setup removed",
    });
  }
  return out.success(await runSetupForm(form, options), {
    summary: `apicity setup ${form} complete`,
  });
}

function isSetupForm(value: string): value is SetupForm {
  return (SETUP_FORMS as readonly string[]).includes(value);
}

async function runSetupForm(
  form: Exclude<SetupForm, "1password">,
  options: SetupOptions
): Promise<SetupResult> {
  if (form === "claude") return setupClaude(options);
  if (form === "codex") return setupCodex(options);
  return setupAgents(options);
}

// ---------------------------------------------------------------------------
// the two incomplete outcomes
// ---------------------------------------------------------------------------

function setupIncomplete(message: string): CliError {
  return new CliError("setup_incomplete", message, {
    hint: `run by hand: ${MANUAL_CLAUDE_COMMANDS.join("; ")}`,
    meta: { manual_commands: [...MANUAL_CLAUDE_COMMANDS] },
  });
}

function claudeMissing(): CliError {
  return new CliError("setup_incomplete", "Claude Code was not found", {
    hint: `Claude Code was not found; run: ${MANUAL_CLAUDE_COMMANDS.join("; ")}`,
    meta: { manual_commands: [...MANUAL_CLAUDE_COMMANDS] },
  });
}

function codexMissing(): CliError {
  return new CliError("setup_incomplete", "Codex was not found", {
    hint:
      "Codex was not found; the shared skill is installed at " +
      "~/.agents/skills/apicity",
  });
}
