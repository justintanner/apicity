import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CliWriter } from "../../packages/cli/src/envelope";
import { CliError } from "../../packages/cli/src/errors";
import { runMain } from "../../packages/cli/src/main";
import {
  CLAUDE_SKILL_LINK_TARGET,
  INSTALLED_VERSION_FILE,
  OWNERSHIP_MARKER_FILE,
  OWNERSHIP_MARKER_TEXT,
  installSkill,
  readSkill,
  removeSkill,
} from "../../packages/cli/src/skill";

// AC-09 / EX-10: `apicity skill` prints the shipped SKILL.md byte-for-byte,
// and `apicity skill install` writes it into `~/.agents/skills/apicity`
// through the ownership gate. Every case here runs under a temporary HOME —
// the install paths are real directories in a real home, so a test that used
// the developer's would be indistinguishable from the bug it is checking for.

const SKILL_PATH = "skills/apicity/SKILL.md";

/** A host with no `claude` anywhere: no `~/.claude`, nothing on PATH. */
const NO_CLAUDE_ENV: NodeJS.ProcessEnv = { PATH: "" };

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "apicity-skill-"));
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

function baselineDir(): string {
  return join(home, ".agents", "skills", "apicity");
}

function claudeLink(): string {
  return join(home, ".claude", "skills", "apicity");
}

function capture(): {
  writer: CliWriter;
  out: string[];
  err: string[];
  raw: string[];
} {
  const out: string[] = [];
  const err: string[] = [];
  const raw: string[] = [];
  return {
    writer: {
      out: (text) => out.push(text),
      err: (text) => err.push(text),
      raw: (text) => raw.push(text),
    },
    out,
    err,
    raw,
  };
}

describe("apicity skill", () => {
  it("prints the shipped SKILL.md byte-for-byte", async () => {
    const { writer, raw, out, err } = capture();

    await expect(runMain(["skill"], writer)).resolves.toBe(0);
    expect(err).toEqual([]);
    expect(out).toEqual([]);
    expect(raw.join("")).toBe(readSkill());
  });

  it("prints the same bytes through a writer with no raw channel", async () => {
    const out: string[] = [];
    const writer: CliWriter = { out: (text) => out.push(text), err: () => {} };

    await expect(runMain(["skill"], writer)).resolves.toBe(0);
    // A line writer appends the newline the command dropped, which is what
    // `defaultWriter` does on the real stdout.
    expect(`${out.join("\n")}\n`).toBe(readSkill());
  });

  it("is raw output even with --json", async () => {
    const { writer, raw } = capture();

    await expect(runMain(["skill", "--json"], writer)).resolves.toBe(0);
    expect(raw.join("")).toBe(readSkill());
  });

  it("answers not_found for an unknown subcommand", async () => {
    const { writer, err } = capture();

    await expect(runMain(["skill", "uninstall"], writer)).resolves.toBe(2);
    const envelope = JSON.parse(err[0]) as Record<string, unknown>;
    expect(envelope.code).toBe("not_found");
    expect(envelope.error).toContain("uninstall");
  });

  it("reads the repository's skill byte-for-byte", () => {
    // AC-09's first half. `readSkill` prefers the package copy that
    // `scripts/dist.mjs` stages from this file, so a mismatch here means the
    // staged copy is stale: run `pnpm run build:cli`.
    const shipped = readSkill();
    const source = readFileSync(SKILL_PATH, "utf8");
    expect(Buffer.byteLength(shipped)).toBe(Buffer.byteLength(source));
    expect(shipped).toBe(source);
  });
});

describe("apicity skill install", () => {
  it("writes the skill, the marker and the version stamp", () => {
    const result = installSkill({
      home,
      env: NO_CLAUDE_ENV,
      version: "9.9.9",
    });

    expect(result.skill_path).toBe(join(baselineDir(), "SKILL.md"));
    expect(result.symlink_path).toBeUndefined();
    expect(result.notice).toBeUndefined();
    expect(readFileSync(result.skill_path, "utf8")).toBe(readSkill());
    expect(
      readFileSync(join(baselineDir(), OWNERSHIP_MARKER_FILE), "utf8")
    ).toBe(OWNERSHIP_MARKER_TEXT);
    expect(
      readFileSync(join(baselineDir(), INSTALLED_VERSION_FILE), "utf8")
    ).toBe("9.9.9");
  });

  it("never writes under ~/.codex", () => {
    mkdirSync(join(home, ".claude"), { recursive: true });
    installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" });

    expect(existsSync(join(home, ".codex"))).toBe(false);
  });

  it("links the skill into Claude Code when ~/.claude exists", () => {
    mkdirSync(join(home, ".claude"), { recursive: true });

    const result = installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" });

    expect(result.symlink_path).toBe(claudeLink());
    expect(result.notice).toBeUndefined();
    expect(lstatSync(claudeLink()).isSymbolicLink()).toBe(true);
    expect(readlinkSync(claudeLink())).toBe(CLAUDE_SKILL_LINK_TARGET);
    // The relative target has to resolve from where the link lives.
    expect(readFileSync(join(claudeLink(), "SKILL.md"), "utf8")).toBe(
      readSkill()
    );
  });

  it("copies the three files when the symlink seam fails", () => {
    mkdirSync(join(home, ".claude"), { recursive: true });

    const result = installSkill({
      home,
      env: NO_CLAUDE_ENV,
      version: "1.0.0",
      symlink: () => {
        throw new Error("EPERM: operation not permitted");
      },
    });

    expect(result.symlink_path).toBe(claudeLink());
    expect(result.notice).toContain("symlink failed");
    expect(result.notice).toContain("copied files instead");
    expect(lstatSync(claudeLink()).isDirectory()).toBe(true);
    for (const name of [
      "SKILL.md",
      OWNERSHIP_MARKER_FILE,
      INSTALLED_VERSION_FILE,
    ]) {
      expect(lstatSync(join(claudeLink(), name)).isFile()).toBe(true);
    }
    expect(readFileSync(join(claudeLink(), "SKILL.md"), "utf8")).toBe(
      readSkill()
    );
  });

  it("refreshes the version stamp on re-install", () => {
    installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" });
    installSkill({ home, env: NO_CLAUDE_ENV, version: "2.0.0" });

    expect(
      readFileSync(join(baselineDir(), INSTALLED_VERSION_FILE), "utf8")
    ).toBe("2.0.0");
  });

  it("refuses an unmarked directory and touches nothing", () => {
    mkdirSync(baselineDir(), { recursive: true });
    writeFileSync(join(baselineDir(), "SKILL.md"), "hand authored\n");

    let raised: CliError | undefined;
    try {
      installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" });
    } catch (err) {
      raised = err as CliError;
    }

    expect(raised).toBeInstanceOf(CliError);
    expect(raised?.code).toBe("skill_unmanaged");
    expect(raised?.exit).toBe(1);
    expect(readFileSync(join(baselineDir(), "SKILL.md"), "utf8")).toBe(
      "hand authored\n"
    );
    expect(existsSync(join(baselineDir(), OWNERSHIP_MARKER_FILE))).toBe(false);
    expect(existsSync(join(baselineDir(), INSTALLED_VERSION_FILE))).toBe(false);
  });

  it("refuses a symlink at the baseline path", () => {
    mkdirSync(join(home, ".agents", "skills"), { recursive: true });
    mkdirSync(join(home, "elsewhere"), { recursive: true });
    symlinkSync(join(home, "elsewhere"), baselineDir());

    expect(() =>
      installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" })
    ).toThrow(/was not written by the apicity CLI/);
    expect(existsSync(join(home, "elsewhere", OWNERSHIP_MARKER_FILE))).toBe(
      false
    );
  });

  it("refuses a Claude skill link someone else wrote", () => {
    mkdirSync(claudeLink(), { recursive: true });
    writeFileSync(join(claudeLink(), "SKILL.md"), "somebody else's skill\n");

    let raised: CliError | undefined;
    try {
      installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" });
    } catch (err) {
      raised = err as CliError;
    }

    expect(raised?.code).toBe("skill_unmanaged");
    expect(readFileSync(join(claudeLink(), "SKILL.md"), "utf8")).toBe(
      "somebody else's skill\n"
    );
  });

  it("answers the success envelope and exit 0 through the dispatcher", async () => {
    const { writer, out, err } = capture();

    await expect(
      runMain(["skill", "install", "--json"], writer, {
        env: { HOME: home, PATH: "" },
        stdoutIsTTY: false,
      })
    ).resolves.toBe(0);

    expect(err).toEqual([]);
    const envelope = JSON.parse(out.join("\n")) as {
      ok: boolean;
      summary: string;
      data: { skill_path: string };
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.summary).toBe("apicity skill installed");
    expect(envelope.data.skill_path).toBe(join(baselineDir(), "SKILL.md"));
  });

  it("answers skill_unmanaged and exit 1 through the dispatcher", async () => {
    mkdirSync(baselineDir(), { recursive: true });
    writeFileSync(join(baselineDir(), "SKILL.md"), "hand authored\n");
    const { writer, err } = capture();

    await expect(
      runMain(["skill", "install", "--json"], writer, {
        env: { HOME: home, PATH: "" },
        stdoutIsTTY: false,
      })
    ).resolves.toBe(1);

    const envelope = JSON.parse(err[0]) as Record<string, unknown>;
    expect(envelope.ok).toBe(false);
    expect(envelope.code).toBe("skill_unmanaged");
  });
});

describe("removeSkill", () => {
  it("removes the link and the baseline it wrote", () => {
    mkdirSync(join(home, ".claude"), { recursive: true });
    installSkill({ home, env: NO_CLAUDE_ENV, version: "1.0.0" });

    const result = removeSkill({ home, env: NO_CLAUDE_ENV });

    expect(result.removed).toEqual([claudeLink(), baselineDir()]);
    expect(result.kept).toEqual([]);
    expect(existsSync(claudeLink())).toBe(false);
    expect(existsSync(baselineDir())).toBe(false);
  });

  it("leaves an unmarked directory untouched", () => {
    mkdirSync(baselineDir(), { recursive: true });
    writeFileSync(join(baselineDir(), "SKILL.md"), "hand authored\n");
    mkdirSync(claudeLink(), { recursive: true });
    writeFileSync(join(claudeLink(), "SKILL.md"), "also hand authored\n");

    const result = removeSkill({ home, env: NO_CLAUDE_ENV });

    expect(result.removed).toEqual([]);
    expect(result.kept).toEqual([claudeLink(), baselineDir()]);
    expect(readFileSync(join(baselineDir(), "SKILL.md"), "utf8")).toBe(
      "hand authored\n"
    );
    expect(readFileSync(join(claudeLink(), "SKILL.md"), "utf8")).toBe(
      "also hand authored\n"
    );
  });

  it("removes a copy fallback directory it marked", () => {
    mkdirSync(join(home, ".claude"), { recursive: true });
    installSkill({
      home,
      env: NO_CLAUDE_ENV,
      version: "1.0.0",
      symlink: () => {
        throw new Error("EPERM");
      },
    });

    const result = removeSkill({ home, env: NO_CLAUDE_ENV });

    expect(result.removed).toContain(claudeLink());
    expect(existsSync(claudeLink())).toBe(false);
  });
});
