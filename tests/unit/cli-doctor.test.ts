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
import { PLUGIN_KEY } from "../../packages/cli/src/plugin";
import {
  SUBPROCESS_STDIO,
  type SubprocessOptions,
  type SubprocessRunner,
} from "../../packages/cli/src/setup";
import {
  installSkill,
  INSTALLED_VERSION_FILE,
} from "../../packages/cli/src/skill";

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
      status: "warning",
      message: "not set; paid endpoints will fail closed",
    });
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

  it("counts providers in the shape the session hook parses", async () => {
    const providers = row(await rows(), "Providers");

    // EX-13's hook reads exactly this with /^(\d+) of \d+ configured(.*)$/.
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
    const calls: Array<{ command: string; options: SubprocessOptions }> = [];
    const run: SubprocessRunner = (command, _args, options) => {
      calls.push({ command, options });
      return Promise.resolve({
        code: 0,
        stdout: "2.30.0\n",
        stderr: "",
        timedOut: false,
      });
    };

    expect((await rows({ run })).length).toBe(DOCTOR_ROW_NAMES.length);
    expect(calls).toEqual([]);

    const configured = await rows({
      env: bareEnv({ APICITY_OP_VAULT: "Apicity" }),
      run,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe("op");
    expect(calls[0].options.timeoutMs).toBe(OP_VERSION_TIMEOUT_MS);
    expect(calls[0].options.stdio).toEqual(SUBPROCESS_STDIO);
    expect(row(configured, "1Password CLI")).toMatchObject({
      status: "ok",
      message: "op 2.30.0",
    });
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
