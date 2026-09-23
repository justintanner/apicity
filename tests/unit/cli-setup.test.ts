import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CliWriter } from "../../packages/cli/src/envelope";
import { CliError } from "../../packages/cli/src/errors";
import { runMain } from "../../packages/cli/src/main";
import { PLUGIN_KEY } from "../../packages/cli/src/plugin";
import {
  removeSetup,
  setupAgents,
  setupClaude,
  setupCodex,
  MANUAL_CLAUDE_COMMANDS,
  MARKETPLACE_ADD_TIMEOUT_MS,
  MARKETPLACE_UPDATE_TIMEOUT_MS,
  PLUGIN_INSTALL_TIMEOUT_MS,
  SETUP_AGENT_VAR,
  type SetupResult,
} from "../../packages/cli/src/setup";
import { OWNERSHIP_MARKER_FILE } from "../../packages/cli/src/skill";
import {
  runSubprocess,
  SUBPROCESS_STDIO,
  type SubprocessOptions,
  type SubprocessResult,
  type SubprocessRunner,
} from "../../packages/cli/src/subprocess";

// AC-10 / REQ-011 / EX-12: `apicity setup claude|codex|agents`, driven through
// the subprocess seam so no test ever runs `claude`. Every case works in a
// temporary home: these commands write real directories into a real home, so
// a test using the developer's could not tell success from the bug.

interface SeamCall {
  command: string;
  args: string[];
  options: SubprocessOptions;
}

interface Seam {
  run: SubprocessRunner;
  calls: SeamCall[];
}

let home: string;
let binDir: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "apicity-setup-"));
  binDir = join(home, "bin");
  mkdirSync(binDir, { recursive: true });
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

/** A host where `claude` is on PATH — it is never executed, only found. */
function withClaudeOnPath(): NodeJS.ProcessEnv {
  writeFileSync(join(binDir, "claude"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  return { PATH: binDir };
}

/** A host with neither agent: no `~/.claude`, no `~/.codex`, empty PATH. */
function bareHost(): NodeJS.ProcessEnv {
  return { PATH: "" };
}

function withCodexHome(): void {
  mkdirSync(join(home, ".codex"), { recursive: true });
}

function installedPluginsPath(): string {
  return join(home, ".claude", "plugins", "installed_plugins.json");
}

/** Claude Code's v2 record, exactly as it writes it. */
function writeInstalledPlugins(version = "0.11.2"): void {
  mkdirSync(join(home, ".claude", "plugins"), { recursive: true });
  writeFileSync(
    installedPluginsPath(),
    JSON.stringify({
      version: 2,
      plugins: { [PLUGIN_KEY]: [{ scope: "user", version }] },
    })
  );
}

/**
 * A recording seam. `reply` decides each invocation's result; the default
 * succeeds, and the `plugin install` step writes the record Claude Code would
 * have written, because that file is what `connectClaude` believes.
 */
function seam(reply?: (call: SeamCall) => Partial<SubprocessResult>): Seam {
  const calls: SeamCall[] = [];
  const run: SubprocessRunner = (command, args, options) => {
    calls.push({ command, args, options });
    const outcome = reply?.({ command, args, options }) ?? {};
    if (
      outcome.code === undefined &&
      args[0] === "plugin" &&
      args[1] === "install"
    ) {
      writeInstalledPlugins();
    }
    return Promise.resolve({
      code: 0,
      stdout: "",
      stderr: "",
      timedOut: false,
      ...outcome,
    });
  };
  return { run, calls };
}

function capture(): { writer: CliWriter; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

async function raised(promise: Promise<unknown>): Promise<CliError> {
  try {
    await promise;
  } catch (err) {
    return err as CliError;
  }
  throw new Error("expected the call to raise");
}

describe("apicity setup claude", () => {
  it("runs the three claude plugin commands in order, bounded, with no stdin", async () => {
    const env = withClaudeOnPath();
    const { run, calls } = seam();

    const result = await setupClaude({ home, env, run, version: "0.11.2" });

    expect(calls.map((call) => call.args)).toEqual([
      ["plugin", "marketplace", "add", "justintanner/apicity"],
      ["plugin", "marketplace", "update", "apicity"],
      ["plugin", "install", PLUGIN_KEY],
    ]);
    expect(calls.map((call) => call.options.timeoutMs)).toEqual([
      MARKETPLACE_ADD_TIMEOUT_MS,
      MARKETPLACE_UPDATE_TIMEOUT_MS,
      PLUGIN_INSTALL_TIMEOUT_MS,
    ]);
    // Nothing this CLI spawns may read the agent session's stdin.
    for (const call of calls) {
      expect(call.options.stdio[0]).toBe("ignore");
      expect(call.options.stdio).toEqual(SUBPROCESS_STDIO);
      expect(call.command).toBe(join(binDir, "claude"));
    }
    expect(result).toEqual({ plugin_installed: true, agent_detected: true });
    // The skill half ran too, and linked into Claude Code.
    expect(existsSync(join(home, ".agents/skills/apicity/SKILL.md"))).toBe(
      true
    );
    expect(existsSync(join(home, ".claude/skills/apicity/SKILL.md"))).toBe(
      true
    );
  });

  it("logs and continues when the marketplace steps fail", async () => {
    const env = withClaudeOnPath();
    const { run, calls } = seam((call) =>
      call.args[1] === "marketplace"
        ? { code: 1, stderr: "marketplace already exists\n" }
        : {}
    );

    const result = await setupClaude({ home, env, run, version: "0.11.2" });

    expect(calls).toHaveLength(3);
    expect(result.plugin_installed).toBe(true);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings?.[0]).toContain("marketplace add failed");
    expect(result.warnings?.[0]).toContain("marketplace already exists");
  });

  it("answers setup_incomplete when the install fails", async () => {
    const env = withClaudeOnPath();
    const { run } = seam((call) =>
      call.args[1] === "install" ? { code: 1, stderr: "network is down\n" } : {}
    );

    const err = await raised(setupClaude({ home, env, run }));

    expect(err.code).toBe("setup_incomplete");
    expect(err.exit).toBe(7);
    expect(err.message).toContain("network is down");
    expect(err.meta?.manual_commands).toEqual(MANUAL_CLAUDE_COMMANDS);
  });

  it("answers setup_incomplete when nothing was recorded", async () => {
    const env = withClaudeOnPath();
    // Every step succeeds, and installed_plugins.json still names nothing:
    // the exit statuses are not the witness, the file is.
    const { run } = seam(() => ({ code: 0 }));

    const err = await raised(setupClaude({ home, env, run }));

    expect(err.code).toBe("setup_incomplete");
    expect(err.message).toContain("does not record it");
  });

  it("answers setup_incomplete with the manual commands when claude is absent", async () => {
    const { run, calls } = seam();

    const err = await raised(setupClaude({ home, env: bareHost(), run }));

    expect(calls).toEqual([]);
    expect(err.code).toBe("setup_incomplete");
    expect(err.exit).toBe(7);
    for (const command of MANUAL_CLAUDE_COMMANDS) {
      expect(err.hint).toContain(command);
    }
    expect(err.meta?.manual_commands).toEqual(MANUAL_CLAUDE_COMMANDS);
    // The skill still landed: the half that works on every host always runs.
    expect(existsSync(join(home, ".agents/skills/apicity/SKILL.md"))).toBe(
      true
    );
  });

  it("answers exit 7 and the error envelope through the dispatcher (EX-12)", async () => {
    const { writer, err } = capture();

    await expect(
      runMain(["setup", "claude", "--json"], writer, {
        env: { HOME: home, PATH: "" },
        stdoutIsTTY: false,
      })
    ).resolves.toBe(7);

    const envelope = JSON.parse(err[0]) as {
      ok: boolean;
      code: string;
      hint: string;
      meta: { manual_commands: string[] };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.code).toBe("setup_incomplete");
    expect(envelope.meta.manual_commands).toEqual(MANUAL_CLAUDE_COMMANDS);
  });
});

describe("apicity setup codex", () => {
  it("installs the shared skill and never writes under ~/.codex", () => {
    withCodexHome();

    const result = setupCodex({ home, env: bareHost(), version: "0.11.2" });

    expect(result).toEqual({ plugin_installed: false, agent_detected: true });
    expect(existsSync(join(home, ".agents/skills/apicity/SKILL.md"))).toBe(
      true
    );
    expect(existsSync(join(home, ".codex", "skills"))).toBe(false);
  });

  it("answers setup_incomplete, skill installed, when Codex is absent", async () => {
    const err = await raised(
      Promise.resolve().then(() => setupCodex({ home, env: bareHost() }))
    );

    expect(err.code).toBe("setup_incomplete");
    expect(err.hint).toContain("~/.agents/skills/apicity");
    expect(existsSync(join(home, ".agents/skills/apicity/SKILL.md"))).toBe(
      true
    );
  });
});

describe("apicity setup agents", () => {
  async function agents(
    env: NodeJS.ProcessEnv,
    run: SubprocessRunner
  ): Promise<SetupResult> {
    return setupAgents({ home, env, run, version: "0.11.2" });
  }

  it("connects the single detected agent", async () => {
    const env = withClaudeOnPath();
    const { run, calls } = seam();

    const result = await agents(env, run);

    expect(calls).toHaveLength(3);
    expect(result.plugin_installed).toBe(true);
    expect(result.agent_detected).toBe(true);
    expect(result.agents).toEqual([
      { id: "claude", detected: true, connected: true },
      { id: "codex", detected: false, connected: false },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("installs the skill only when several agents are detected", async () => {
    const env = withClaudeOnPath();
    withCodexHome();
    const { run, calls } = seam();

    const result = await agents(env, run);

    expect(calls).toEqual([]);
    expect(result.plugin_installed).toBe(false);
    expect(result.agent_detected).toBe(true);
    expect(result.warnings?.[0]).toContain("apicity setup claude");
    expect(result.warnings?.[0]).toContain("apicity setup codex");
    expect(existsSync(join(home, ".agents/skills/apicity/SKILL.md"))).toBe(
      true
    );
  });

  it("installs the skill only when no agent is detected, and never fails", async () => {
    const { run, calls } = seam();

    const result = await agents(bareHost(), run);

    expect(calls).toEqual([]);
    expect(result).toEqual({
      plugin_installed: false,
      agent_detected: false,
      agents: [
        { id: "claude", detected: false, connected: false },
        { id: "codex", detected: false, connected: false },
      ],
      warnings: [],
    });
  });

  it("honours APICITY_SETUP_AGENT=claude", async () => {
    const env = { ...withClaudeOnPath(), [SETUP_AGENT_VAR]: "claude" };
    withCodexHome();
    const { run, calls } = seam();

    const result = await agents(env, run);

    // Several agents are detected, and the variable still decides.
    expect(calls).toHaveLength(3);
    expect(result.plugin_installed).toBe(true);
  });

  it("honours APICITY_SETUP_AGENT=codex", async () => {
    const env = { ...withClaudeOnPath(), [SETUP_AGENT_VAR]: "codex" };
    withCodexHome();
    const { run, calls } = seam();

    const result = await agents(env, run);

    expect(calls).toEqual([]);
    expect(result.agents).toEqual([
      { id: "claude", detected: true, connected: false },
      { id: "codex", detected: true, connected: true },
    ]);
  });

  it("honours APICITY_SETUP_AGENT=all", async () => {
    const env = { ...withClaudeOnPath(), [SETUP_AGENT_VAR]: "all" };
    withCodexHome();
    const { run, calls } = seam();

    const result = await agents(env, run);

    expect(calls).toHaveLength(3);
    expect(result.agents).toEqual([
      { id: "claude", detected: true, connected: true },
      { id: "codex", detected: true, connected: true },
    ]);
  });

  it("honours APICITY_SETUP_AGENT=none", async () => {
    const env = { ...withClaudeOnPath(), [SETUP_AGENT_VAR]: "none" };
    const { run, calls } = seam();

    const result = await agents(env, run);

    expect(calls).toEqual([]);
    expect(result.plugin_installed).toBe(false);
    expect(existsSync(join(home, ".agents/skills/apicity/SKILL.md"))).toBe(
      true
    );
  });

  it("warns and detects instead when APICITY_SETUP_AGENT is a typo", async () => {
    const env = { ...withClaudeOnPath(), [SETUP_AGENT_VAR]: "claud" };
    const { run, calls } = seam();

    const result = await agents(env, run);

    expect(result.warnings?.[0]).toContain("claud");
    // It never prompts and never fails: detection decides, as if unset.
    expect(calls).toHaveLength(3);
  });

  it("is what bare `apicity setup` runs", async () => {
    const { writer, out } = capture();

    await expect(
      runMain(["setup", "--json"], writer, {
        env: { HOME: home, PATH: "" },
        stdoutIsTTY: false,
      })
    ).resolves.toBe(0);

    const envelope = JSON.parse(out.join("\n")) as {
      summary: string;
      data: SetupResult;
    };
    expect(envelope.summary).toBe("apicity setup agents complete");
    expect(envelope.data.agents).toHaveLength(2);
  });
});

describe("apicity setup --remove", () => {
  it("uninstalls the plugin and removes what this CLI wrote", async () => {
    const env = withClaudeOnPath();
    const install = seam();
    await setupClaude({ home, env, run: install.run, version: "0.11.2" });

    const { run, calls } = seam();
    const result = await removeSetup({ home, env, run });

    expect(calls.map((call) => call.args)).toEqual([
      ["plugin", "uninstall", PLUGIN_KEY],
    ]);
    expect(result.removed).toContain(PLUGIN_KEY);
    expect(result.removed).toContain(join(home, ".claude/skills/apicity"));
    expect(result.removed).toContain(join(home, ".agents/skills/apicity"));
    expect(existsSync(join(home, ".agents/skills/apicity"))).toBe(false);
  });

  it("leaves unmarked directories untouched", async () => {
    const baseline = join(home, ".agents", "skills", "apicity");
    mkdirSync(baseline, { recursive: true });
    writeFileSync(join(baseline, "SKILL.md"), "hand authored\n");

    const { run, calls } = seam();
    const result = await removeSetup({ home, env: bareHost(), run });

    // No plugin recorded and no claude found: nothing to uninstall.
    expect(calls).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.kept).toEqual([baseline]);
    expect(readFileSync(join(baseline, "SKILL.md"), "utf8")).toBe(
      "hand authored\n"
    );
    expect(existsSync(join(baseline, OWNERSHIP_MARKER_FILE))).toBe(false);
  });

  it("survives a failing uninstall and still removes the skill", async () => {
    const env = withClaudeOnPath();
    writeInstalledPlugins();
    const { run } = seam(() => ({ code: 1, stderr: "not installed\n" }));

    const result = await removeSetup({ home, env, run });

    expect(result.removed).not.toContain(PLUGIN_KEY);
  });
});

describe("runSubprocess", () => {
  it("gives the child no stdin at all", async () => {
    // The seam's whole point. Run a child that reads fd 0 to completion: with
    // `stdio[0] === "ignore"` it is /dev/null and the read returns empty at
    // once. Inheriting — or a pipe nobody closes — blocks until the timeout,
    // which is exactly the hang this guards against.
    const result = await runSubprocess(
      process.execPath,
      ["-e", 'process.stdout.write(require("fs").readFileSync(0, "utf8"))'],
      { timeoutMs: 4000, stdio: SUBPROCESS_STDIO }
    );

    expect(result.timedOut).toBe(false);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("answers rather than throws when the binary does not exist", async () => {
    const result = await runSubprocess(
      join(binDir, "definitely-not-here"),
      [],
      { timeoutMs: 1000, stdio: SUBPROCESS_STDIO }
    );

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("ENOENT");
  });
});
