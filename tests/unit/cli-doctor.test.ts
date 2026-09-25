import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { providerNames } from "../../packages/cli/src/credentials";
import {
  collectDoctorRows,
  humanReport,
  DOCTOR_ROW_NAMES,
  OP_VERSION_TIMEOUT_MS,
  type DoctorOptions,
  type DoctorRow,
} from "../../packages/cli/src/doctor";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { runMain } from "../../packages/cli/src/main";
import {
  getProviderEnvVars,
  OP_ITEM_LIST_TIMEOUT_MS,
} from "../../packages/cli/src/one-password";
import { PLUGIN_KEY } from "../../packages/cli/src/plugin";
import {
  installSkill,
  INSTALLED_VERSION_FILE,
} from "../../packages/cli/src/skill";
import {
  SUBPROCESS_STDIO,
  type SubprocessOptions,
  type SubprocessResult,
  type SubprocessRunner,
} from "../../packages/cli/src/subprocess";

// AC-12 / REQ-013: `apicity doctor`. Every scenario is a sandboxed home, and
// the row set never changes shape — a check that does not apply to the host
// says so rather than disappearing, so a caller reading the `--json` array by
// index reads the same twelve rows everywhere.

const CLI_VERSION = "0.11.2";
const ALLOWED_STATUSES = ["ok", "warning", "error"];

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "apicity-doctor-"));
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

function bareEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return { HOME: home, PATH: "", ...extra };
}

function rows(options: Partial<DoctorOptions> = {}): Promise<DoctorRow[]> {
  return collectDoctorRows({
    home,
    env: bareEnv(),
    version: CLI_VERSION,
    ...options,
  });
}

function row(all: DoctorRow[], name: string): DoctorRow {
  const found = all.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no ${name} row`);
  return found;
}

function withClaudeHome(): void {
  mkdirSync(join(home, ".claude"), { recursive: true });
}

function writeInstalledPlugins(version?: string): void {
  mkdirSync(join(home, ".claude", "plugins"), { recursive: true });
  const record =
    version === undefined ? [{ scope: "user" }] : [{ scope: "user", version }];
  writeFileSync(
    join(home, ".claude", "plugins", "installed_plugins.json"),
    JSON.stringify({ version: 2, plugins: { [PLUGIN_KEY]: record } })
  );
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

/** The default env file of the sandbox home. */
function writeEnvFile(content: string): void {
  mkdirSync(join(home, ".config", "apicity"), { recursive: true });
  writeFileSync(join(home, ".config", "apicity", ".env"), content);
}

interface OpCall {
  command: string;
  args: string[];
  options: SubprocessOptions;
}

/**
 * A fake `op`: `--version` answers 2.39.0 and `item list` the given titles
 * (or the given failure). Nothing here ever spawns the real one.
 */
function opSeam(
  reply: {
    titles?: string[];
    listing?: Partial<SubprocessResult>;
  } = {}
): { run: SubprocessRunner; calls: OpCall[] } {
  const calls: OpCall[] = [];
  const run: SubprocessRunner = (command, args, options) => {
    calls.push({ command, args, options });
    if (args[0] === "--version") {
      return Promise.resolve({
        code: 0,
        stdout: "2.39.0\n",
        stderr: "",
        timedOut: false,
      });
    }
    return Promise.resolve({
      code: 0,
      stdout: JSON.stringify(
        (reply.titles ?? []).map((title) => ({ id: title, title }))
      ),
      stderr: "",
      timedOut: false,
      ...reply.listing,
    });
  };
  return { run, calls };
}

describe("apicity doctor", () => {
  it("answers the twelve rows in order, whatever the host", async () => {
    const bare = await rows();
    withClaudeHome();
    mkdirSync(join(home, ".codex"), { recursive: true });
    installSkill({ home, env: bareEnv(), version: CLI_VERSION });
    writeInstalledPlugins(CLI_VERSION);
    const equipped = await rows();

    for (const set of [bare, equipped]) {
      expect(set.map((each) => each.name)).toEqual([...DOCTOR_ROW_NAMES]);
      for (const each of set) {
        expect(ALLOWED_STATUSES).toContain(each.status);
        expect(each.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("reports a bare host: no variables, no skill, nothing installed", async () => {
    const all = await rows();

    expect(row(all, "CLI Version").message).toBe(CLI_VERSION);
    expect(row(all, "Node Version").message).toBe(process.version);
    expect(row(all, "Env File")).toMatchObject({
      status: "ok",
      message: "not found, using environment",
    });
    expect(row(all, "1Password CLI")).toMatchObject({
      status: "ok",
      message: "not configured",
    });
    expect(row(all, "Paygate Secret File")).toMatchObject({
      status: "ok",
      message:
        "not set; the pay gate is off and paid endpoints call upstream directly",
    });
    expect(row(all, "Paygate Secret File").hint).toBeUndefined();
    expect(row(all, "Agent Skill")).toMatchObject({
      status: "warning",
      message: "Not installed",
      hint: "apicity skill install",
    });
    // No Claude Code and no Codex on this host: the rows stay, and say so.
    expect(row(all, "Claude Code Plugin").message).toBe(
      "Claude Code not detected"
    );
    expect(row(all, "Claude Code Skill").message).toBe(
      "Claude Code not detected"
    );
    expect(row(all, "Codex Skill").message).toBe("Codex not detected");
  });

  it("counts providers in the N of M configured shape", async () => {
    const providers = row(await rows(), "Providers");

    // ac-w7vzap REQ-017 keeps this shape. The SessionStart hook no longer
    // parses it — it reads `apicity providers --json`, which answers offline —
    // but a caller reading the row still gets exactly this.
    const match = /^(\d+) of (\d+) configured(.*)$/.exec(providers.message);
    expect(match).not.toBeNull();
    expect(Number(match?.[2])).toBe(providerNames().length);
    const configured = Number(match?.[1]);
    expect(configured).toBeGreaterThanOrEqual(0);
    expect(configured).toBeLessThanOrEqual(providerNames().length);
    expect(providers.status).toBe(
      configured === providerNames().length ? "ok" : "warning"
    );
  });

  it("reports a stale skill against the CLI version", async () => {
    installSkill({ home, env: bareEnv(), version: CLI_VERSION });
    writeFileSync(
      join(home, ".agents", "skills", "apicity", INSTALLED_VERSION_FILE),
      "0.9.0"
    );

    expect(row(await rows(), "Agent Skill")).toMatchObject({
      status: "warning",
      message: `Installed 0.9.0, CLI ${CLI_VERSION}`,
      hint: "apicity skill install",
    });
  });

  it("reports an unmanaged skill as an error, and says how to repair it", async () => {
    const dir = join(home, ".agents", "skills", "apicity");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "hand authored\n");

    const skill = row(await rows(), "Agent Skill");
    expect(skill.status).toBe("error");
    expect(skill.message).toContain("was not written by the apicity CLI");
    expect(skill.hint).toBe("Move it aside, then run: apicity skill install");
  });

  // A-3 (ac-yrwwpi): a row must not throw on a path it can report as absent.
  // `~/.agents` here is a regular file, so every stat under it fails with
  // ENOTDIR — the one failure injection that works when the suite runs as
  // root, where chmod-based EACCES never fires. Before the shared `lstat`,
  // the doctor's own copy passed `throwIfNoEntry: false`, which suppresses
  // ENOENT alone, and this call escaped as `[apicity] fatal:`.
  it("reports a skill path whose parent is a file as not installed", async () => {
    writeFileSync(join(home, ".agents"), "not a directory\n");

    expect(row(await rows(), "Agent Skill")).toMatchObject({
      status: "warning",
      message: "Not installed",
      hint: "apicity skill install",
    });
  });

  it("reports a plugin whose version differs from the CLI's", async () => {
    withClaudeHome();
    writeInstalledPlugins("0.9.0");

    const all = await rows();
    expect(row(all, "Claude Code Plugin")).toMatchObject({
      status: "ok",
      message: `Installed (${PLUGIN_KEY})`,
    });
    expect(row(all, "Claude Code Plugin Version")).toMatchObject({
      status: "warning",
      message: `Mismatched (plugin 0.9.0, CLI ${CLI_VERSION})`,
    });
    expect(row(all, "Claude Code Plugin Version").hint).toContain(
      "Enable auto-update"
    );
  });

  it("accepts a matching plugin, and a record that tracks no version", async () => {
    withClaudeHome();
    writeInstalledPlugins(CLI_VERSION);
    expect(row(await rows(), "Claude Code Plugin Version")).toMatchObject({
      status: "ok",
      message: `Matched (${CLI_VERSION})`,
    });

    writeInstalledPlugins(undefined);
    expect(row(await rows(), "Claude Code Plugin Version")).toMatchObject({
      status: "ok",
      message: "Version not tracked",
    });
  });

  it("reports the Claude skill as linked, missing or occupied", async () => {
    withClaudeHome();
    expect(row(await rows(), "Claude Code Skill")).toMatchObject({
      status: "error",
      message: "Skill not linked",
      hint: "apicity setup claude",
    });

    const link = join(home, ".claude", "skills", "apicity");
    mkdirSync(link, { recursive: true });
    writeFileSync(join(link, "SKILL.md"), "somebody else's skill\n");
    const occupied = row(await rows(), "Claude Code Skill");
    expect(occupied.status).toBe("error");
    expect(occupied.message).toContain("A skill not written by apicity");

    rmSync(link, { recursive: true, force: true });
    installSkill({ home, env: bareEnv(), version: CLI_VERSION });
    expect(row(await rows(), "Claude Code Skill")).toMatchObject({
      status: "ok",
      message: "Linked",
    });
  });

  it("reports the Codex skill only where Codex is installed", async () => {
    mkdirSync(join(home, ".codex"), { recursive: true });
    expect(row(await rows(), "Codex Skill")).toMatchObject({
      status: "error",
      message: "Shared skill not installed",
      hint: "apicity setup codex",
    });

    installSkill({ home, env: bareEnv(), version: CLI_VERSION });
    expect(row(await rows(), "Codex Skill").status).toBe("ok");
  });

  it("checks op only when 1Password is configured, through the seam", async () => {
    const { run, calls } = opSeam();

    const bare = await rows({ run });

    expect(bare.length).toBe(DOCTOR_ROW_NAMES.length);
    expect(calls).toEqual([]);
    expect(row(bare, "1Password CLI")).toMatchObject({
      status: "ok",
      message: "not configured",
    });
  });

  it("reports a token alone as ok: references resolve with it", async () => {
    const { run, calls } = opSeam();

    const all = await rows({
      env: bareEnv({
        APICITY_OP_SERVICE_TOKEN: "env:OP_TEST_TOKEN",
        OP_TEST_TOKEN: "ops_test_value",
      }),
      run,
    });

    expect(calls.map((call) => call.args)).toEqual([["--version"]]);
    expect(calls[0].command).toBe("op");
    expect(calls[0].options.timeoutMs).toBe(OP_VERSION_TIMEOUT_MS);
    expect(calls[0].options.stdio).toEqual(SUBPROCESS_STDIO);
    expect(calls[0].options.env).toBeUndefined();
    expect(row(all, "1Password CLI")).toMatchObject({
      status: "ok",
      message:
        "op 2.39.0; token from environment (env:OP_TEST_TOKEN); op:// " +
        "references resolve with it; no vault, so no vault convention",
    });
  });

  it("reports a vault alone as an error, because calls exit usage", async () => {
    const { run, calls } = opSeam();

    const all = await rows({
      env: bareEnv({ APICITY_OP_VAULT: "Apicity" }),
      run,
    });

    expect(calls.map((call) => call.args)).toEqual([["--version"]]);
    expect(row(all, "1Password CLI")).toEqual({
      name: "1Password CLI",
      status: "error",
      message: "op 2.39.0; vault Apicity has no token, so calls exit usage",
      hint:
        "set --op-token or APICITY_OP_SERVICE_TOKEN, or run: " +
        "apicity setup 1password",
    });
  });

  it("reports a token reference to an unset variable without spawning", async () => {
    const { run, calls } = opSeam();

    const all = await rows({
      env: bareEnv({
        APICITY_OP_VAULT: "Apicity",
        APICITY_OP_SERVICE_TOKEN: "env:OP_TEST_TOKEN",
      }),
      run,
    });

    expect(calls).toEqual([]);
    expect(row(all, "1Password CLI")).toMatchObject({
      status: "error",
      message: "--op-token env reference OP_TEST_TOKEN is not set.",
    });
  });

  it("lists the vault once, with the token only in op's environment", async () => {
    const { run, calls } = opSeam({ titles: getProviderEnvVars() });
    writeEnvFile(
      "APICITY_OP_VAULT=Apicity\nAPICITY_OP_SERVICE_TOKEN=env:OP_TEST_TOKEN\n"
    );

    const all = await rows({
      env: bareEnv({ OP_TEST_TOKEN: "ops_test_value" }),
      run,
    });

    expect(calls.map((call) => call.args)).toEqual([
      ["--version"],
      ["item", "list", "--vault", "Apicity", "--format", "json"],
    ]);
    expect(calls[1].options.timeoutMs).toBe(OP_ITEM_LIST_TIMEOUT_MS);
    expect(calls[1].options.stdio).toEqual(SUBPROCESS_STDIO);
    expect(calls[1].options.env).toEqual({
      OP_SERVICE_ACCOUNT_TOKEN: "ops_test_value",
    });
    // Every needed variable has an item: the row is ok, and names where the
    // vault and the token came from without printing the token.
    expect(row(all, "1Password CLI")).toEqual({
      name: "1Password CLI",
      status: "ok",
      message:
        "op 2.39.0; vault Apicity; token from env file (env:OP_TEST_TOKEN)",
    });
    expect(JSON.stringify(all)).not.toContain("ops_test_value");
  });

  it("warns, naming the variables the vault lacks", async () => {
    const { run } = opSeam({ titles: ["KIE_API_KEY"] });
    writeEnvFile(
      "APICITY_OP_VAULT=Apicity\nAPICITY_OP_SERVICE_TOKEN=env:OP_TEST_TOKEN\n"
    );

    const doctor = row(
      await rows({ env: bareEnv({ OP_TEST_TOKEN: "ops_test_value" }), run }),
      "1Password CLI"
    );

    expect(doctor.status).toBe("warning");
    expect(doctor.message).toContain("Apicity");
    expect(doctor.message).toContain("env file");
    expect(doctor.message).toContain("op 2.39.0");
    const lacking = /; no vault item for (.+)$/.exec(doctor.message)?.[1];
    expect(lacking?.split(", ")).toEqual(
      getProviderEnvVars().filter((name) => name !== "KIE_API_KEY")
    );
    expect(lacking).toContain("OPENAI_API_KEY");
    expect(doctor.hint).toBe(
      "add those items, or supply the variables another way; see " +
        "apicity providers"
    );
  });

  it("never asks the vault for a variable a literal or reference supplies", async () => {
    const { run } = opSeam({ titles: [] });
    writeEnvFile(
      [
        "APICITY_OP_VAULT=Apicity",
        "APICITY_OP_SERVICE_TOKEN=env:OP_TEST_TOKEN",
        "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password",
        "XAI_API_KEY=xai-literal-sentinel",
        "",
      ].join("\n")
    );

    const doctor = row(
      await rows({
        env: bareEnv({
          OP_TEST_TOKEN: "ops_test_value",
          OPENAI_API_KEY: "sk-process-sentinel",
        }),
        run,
      }),
      "1Password CLI"
    );

    expect(doctor.status).toBe("warning");
    for (const supplied of [
      "FIREWORKS_API_KEY",
      "XAI_API_KEY",
      "OPENAI_API_KEY",
    ]) {
      expect(doctor.message).not.toContain(supplied);
    }
    expect(doctor.message).toContain("ANTHROPIC_API_KEY");
    expect(doctor.message).not.toContain("sentinel");
  });

  it("errors when the listing fails, and never prints a literal token", async () => {
    const token = "ops_SENTINEL_doctor";
    const { run, calls } = opSeam({
      listing: {
        code: 1,
        stderr: `[ERROR] 401: token ${token} is not authorized\n`,
      },
    });

    const all = await rows({
      flags: { opVault: "Apicity", opToken: token },
      run,
    });

    expect(calls[1].options.env).toEqual({ OP_SERVICE_ACCOUNT_TOKEN: token });
    expect(calls[1].args).not.toContain(token);
    expect(row(all, "1Password CLI")).toEqual({
      name: "1Password CLI",
      status: "error",
      message:
        "op 2.39.0; vault Apicity; token from flag (literal); op item list " +
        "failed: [ERROR] 401: token *** is not authorized",
      hint:
        "check the token and the vault name, then re-run " +
        "apicity setup 1password",
    });
    expect(JSON.stringify(all)).not.toContain(token);
    expect(humanReport(all).join("\n")).not.toContain(token);
  });

  it("counts the env file toward the Providers row, offline", async () => {
    writeEnvFile(
      [
        "OPENAI_API_KEY=sk-file-sentinel",
        "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password",
        "",
      ].join("\n")
    );
    const { run, calls } = opSeam();

    const providers = row(await rows({ run }), "Providers");

    expect(calls).toEqual([]);
    expect(providers.message).toMatch(/^\d+ of \d+ configured \(.*\)$/);
    expect(providers.message).toContain("openai");
    expect(providers.message).toContain("fireworks");
    expect(providers.message).not.toContain("sentinel");
  });

  it("reports an unusable op as an error", async () => {
    const run: SubprocessRunner = () =>
      Promise.resolve({ code: 127, stdout: "", stderr: "", timedOut: false });

    const all = await rows({
      env: bareEnv({ APICITY_OP_SERVICE_TOKEN: "ops_token" }),
      run,
    });

    expect(row(all, "1Password CLI").status).toBe("error");
  });

  it("names the env file and the paygate file it was given", async () => {
    const envFile = join(home, "env");
    const secret = join(home, "paygate.secret");
    writeFileSync(envFile, "OPENAI_API_KEY=sk-test-SECRET\n");
    writeFileSync(secret, "shared-secret\n");

    const all = await rows({
      env: bareEnv({
        APICITY_ENV_FILE: envFile,
        APICITY_PAYGATE_SECRET_FILE: secret,
      }),
    });

    expect(row(all, "Env File")).toMatchObject({
      status: "ok",
      message: envFile,
    });
    expect(row(all, "Paygate Secret File")).toMatchObject({
      status: "ok",
      message: secret,
    });
    // The paths, never the contents.
    const printed = JSON.stringify(all);
    expect(printed).not.toContain("sk-test-SECRET");
    expect(printed).not.toContain("shared-secret");
  });

  it("errors on a named env file and a paygate file it cannot read", async () => {
    const all = await rows({
      env: bareEnv({
        APICITY_ENV_FILE: join(home, "missing.env"),
        APICITY_PAYGATE_SECRET_FILE: join(home, "missing.secret"),
      }),
    });

    expect(row(all, "Env File").status).toBe("error");
    expect(row(all, "Paygate Secret File").status).toBe("error");
  });

  it("errors on an empty paygate secret file, never printing it", async () => {
    const secret = join(home, "empty.secret");
    writeFileSync(secret, "  \n");

    const all = await rows({
      env: bareEnv({ APICITY_PAYGATE_SECRET_FILE: secret }),
    });

    expect(row(all, "Paygate Secret File")).toMatchObject({
      status: "error",
      message: `${secret} is empty`,
    });
  });

  it("errors on an output directory it cannot write to", async () => {
    const all = await rows({
      env: bareEnv({ APICITY_OUTPUT_DIR: join(home, "nowhere") }),
    });

    expect(row(all, "Output Dir").status).toBe("error");
  });
});

describe("apicity doctor output", () => {
  it("answers AC-12's envelope and exit 0 with --json", async () => {
    const { writer, out } = capture();

    await expect(
      runMain(["doctor", "--json"], writer, {
        env: bareEnv(),
        stdoutIsTTY: false,
      })
    ).resolves.toBe(0);

    // `apicity doctor --json | jq -e '.ok and (.data | all(.status |
    // IN("ok","warning","error")))'`, as the acceptance criterion writes it.
    const envelope = JSON.parse(out.join("\n")) as {
      ok: boolean;
      data: DoctorRow[];
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.data).toHaveLength(DOCTOR_ROW_NAMES.length);
    for (const each of envelope.data) {
      expect(ALLOWED_STATUSES).toContain(each.status);
    }
  });

  it("exits 0 even when rows are errors, and leaks no credential (AC-05)", async () => {
    const dir = join(home, ".agents", "skills", "apicity");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "hand authored\n");
    const { writer, out } = capture();

    await expect(
      runMain(["doctor", "--json"], writer, {
        env: bareEnv({ OPENAI_API_KEY: "sk-test-SECRET" }),
        stdoutIsTTY: false,
      })
    ).resolves.toBe(0);

    const printed = out.join("\n");
    expect(printed).not.toContain("sk-test-SECRET");
    const envelope = JSON.parse(printed) as { data: DoctorRow[] };
    expect(envelope.data.some((each) => each.status === "error")).toBe(true);
  });

  it("prints one marked line per row for a human, with its hints", async () => {
    const report = humanReport([
      { name: "CLI Version", status: "ok", message: "0.11.2" },
      {
        name: "Agent Skill",
        status: "warning",
        message: "Not installed",
        hint: "apicity skill install",
      },
      {
        name: "Claude Code Skill",
        status: "error",
        message: "Skill not linked",
      },
    ]);

    expect(report).toEqual([
      "[ok] CLI Version: 0.11.2",
      "[!!] Agent Skill: Not installed",
      "     hint: apicity skill install",
      "[XX] Claude Code Skill: Skill not linked",
    ]);
    expect(report).not.toContain("All checks passed.");
  });

  it("says so when every row is ok", async () => {
    expect(
      humanReport([{ name: "CLI Version", status: "ok", message: "0.11.2" }])
    ).toEqual(["[ok] CLI Version: 0.11.2", "All checks passed."]);
  });
});
