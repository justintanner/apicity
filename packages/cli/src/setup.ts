import { spawn } from "node:child_process";

import { parseGlobalFlags } from "./args.js";
import { createWriter, type CliWriter } from "./envelope.js";
import { CliError } from "./errors.js";
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

// ---------------------------------------------------------------------------
// the subprocess seam
// ---------------------------------------------------------------------------

/**
 * The stdio every subprocess this CLI starts gets: no stdin at all, and pipes
 * for the two output streams.
 *
 * `setup` and `doctor` run inside agent sessions whose own stdin is the
 * transport. A child that inherits it can eat the host's bytes, and a child
 * that inherits a pipe nobody closes blocks until it is killed.
 */
export const SUBPROCESS_STDIO = ["ignore", "pipe", "pipe"] as const;
export type SubprocessStdio = typeof SUBPROCESS_STDIO;

export interface SubprocessOptions {
  /** Hard ceiling; the child is killed when it expires. */
  timeoutMs: number;
  /** Always `SUBPROCESS_STDIO` — carried here so a fake seam records it. */
  stdio: SubprocessStdio;
}

export interface SubprocessResult {
  /** The exit status, or 1 for a failure that produced none (spawn, timeout). */
  code: number;
  stdout: string;
  stderr: string;
  /** True when the child was killed at `timeoutMs`. */
  timedOut: boolean;
}

/** How `setup` and `doctor` reach a binary; a test passes a fake. */
export type SubprocessRunner = (
  command: string,
  args: string[],
  options: SubprocessOptions
) => Promise<SubprocessResult>;

/**
 * Run one binary, bounded, with nothing on its stdin.
 *
 * `spawn` rather than the `execFile` the plan named: `execFile` does not
 * forward a `stdio` option to `spawn` at all (Node v24.21.0, probed during
 * this slice — a child reading fd 0 blocked for the full timeout with
 * `stdio: ["ignore", "pipe", "pipe"]` passed and was killed), so `execFile`
 * would have left every child holding an open stdin pipe and met the "nothing
 * reads stdin" requirement only by killing the child at the deadline. The same
 * probe against `spawn` gave fd 0 as `/dev/null` and a 49 ms exit.
 *
 * It never rejects: a missing binary, a non-zero status and a timeout are all
 * results, because both callers report them as a row or a hint rather than a
 * stack.
 */
export function runSubprocess(
  command: string,
  args: string[],
  options: SubprocessOptions
): Promise<SubprocessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: [...options.stdio],
      timeout: options.timeoutMs,
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString()));

    child.on("error", (err) => {
      resolve({
        code: 1,
        stdout,
        stderr: stderr || err.message,
        timedOut: false,
      });
    });
    child.on("close", (code, signal) => {
      // The deadline is the only signal this CLI ever sends: `timeout` kills
      // with SIGTERM and reports a null status, so a signalled close is it.
      resolve({ code: code ?? 1, stdout, stderr, timedOut: signal !== null });
    });
  });
}

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

/** The three things `apicity setup` can be pointed at. */
export const SETUP_FORMS = ["claude", "codex", "agents"] as const;
export type SetupForm = (typeof SETUP_FORMS)[number];

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

/** `apicity setup [claude|codex|agents] [--remove] [--json]`. */
export async function runSetupCommand(
  argv: string[],
  writer: CliWriter,
  options: SetupCommandOptions = {}
): Promise<number> {
  const { flags, rest } = parseGlobalFlags(argv);
  const remove = rest.includes("--remove");
  const positional = rest.filter((arg) => arg !== "--remove");

  const unknownFlag = positional.find((arg) => arg.startsWith("-"));
  if (unknownFlag !== undefined) {
    throw new CliError("usage", `unknown flag: ${unknownFlag}`, {
      hint: "run: apicity setup [claude|codex|agents] [--remove]",
    });
  }
  if (positional.length > 1) {
    throw new CliError("usage", `unexpected argument: ${positional[1]}`, {
      hint: "run: apicity setup [claude|codex|agents] [--remove]",
    });
  }

  // Bare `apicity setup` is `apicity setup agents`: the form that decides for
  // itself is the one a caller who did not name a form wants.
  const form = positional[0] ?? "agents";
  if (!isSetupForm(form)) {
    throw new CliError("not_found", `unknown setup target: ${form}`, {
      hint: "run: apicity setup claude, codex, or agents",
    });
  }

  const out = createWriter({
    json: flags.json,
    quiet: flags.quiet,
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: (text) => writer.out(text),
    stderr: (text) => writer.err(text),
  });

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
  form: SetupForm,
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
