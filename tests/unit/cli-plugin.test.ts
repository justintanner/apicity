import { spawn } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// AC-11 / REQ-012 / EX-13: the committed `.claude-plugin/` tree. Everything
// here reads the repository's own files and runs the hook as Claude Code
// would — through its shebang, on a PATH this test controls — because the
// only thing that makes a session hook trustworthy is that it behaves the
// same whether or not the CLI it reports on exists.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../..");
const pluginDir = join(repoRoot, ".claude-plugin");
const hookPath = join(pluginDir, "hooks", "session-start.sh");

const packageVersion = (
  JSON.parse(
    readFileSync(join(repoRoot, "packages/cli/package.json"), "utf8")
  ) as { version: string }
).version;

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
  ms: number;
}

/** Spawn with nothing on stdin and no inherited PATH unless one is given. */
function run(
  command: string,
  args: string[],
  options: { cwd?: string; path?: string } = {}
): Promise<RunResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env:
        options.path === undefined
          ? process.env
          : { PATH: options.path, HOME: process.env.HOME },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.on("error", (err) =>
      resolve({
        code: 127,
        stdout,
        stderr: err.message,
        ms: Date.now() - started,
      })
    );
    child.on("close", (code) =>
      resolve({ code: code ?? 1, stdout, stderr, ms: Date.now() - started })
    );
  });
}

/** The first directory on the real PATH holding this binary. */
function locate(name: string): string | undefined {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (dir === "") continue;
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

describe(".claude-plugin manifests", () => {
  it("pins plugin.json's version to the CLI package's", () => {
    // The lockstep the release formula has to hold: an installed plugin that
    // claims a version the CLI does not ship is what `doctor`'s Plugin
    // Version row exists to catch, and it must never be this repository.
    expect(readJson(join(pluginDir, "plugin.json")).version).toBe(
      packageVersion
    );
  });

  it("carries every field the marketplace install reads", () => {
    const plugin = readJson(join(pluginDir, "plugin.json"));
    expect(plugin.name).toBe("apicity");
    expect(plugin.license).toBe("MIT");
    expect(plugin.homepage).toBe("https://github.com/justintanner/apicity");
    expect(plugin.repository).toBe("https://github.com/justintanner/apicity");
    expect(String(plugin.description)).toContain("apicity CLI");
    expect((plugin.author as { name: string }).name).toBe("Justin Tanner");
  });

  it("makes the repository its own marketplace, with a description (F-3)", () => {
    const marketplace = readJson(join(pluginDir, "marketplace.json"));
    expect(marketplace.name).toBe("apicity");
    // F-3: `--strict` rejects a marketplace manifest with no top-level
    // description — hey's own fails that check, and this one must not.
    expect(typeof marketplace.description).toBe("string");
    expect(String(marketplace.description).length).toBeGreaterThan(0);
    expect((marketplace.owner as { name: string }).name).toBe("Justin Tanner");

    const plugins = marketplace.plugins as Array<Record<string, unknown>>;
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("apicity");
    expect(plugins[0].source).toBe("./");
    expect(plugins[0].category).toBe("development");
  });

  it("registers the SessionStart hook with a five-second timeout", () => {
    const hooks = readJson(join(pluginDir, "hooks", "hooks.json"));
    const sessionStart = (hooks.hooks as Record<string, unknown>)
      .SessionStart as Array<{
      hooks: Array<{ type: string; command: string; timeout: number }>;
    }>;
    expect(sessionStart).toHaveLength(1);
    const [entry] = sessionStart[0].hooks;
    expect(entry.type).toBe("command");
    expect(entry.command).toBe("${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh");
    expect(entry.timeout).toBe(5);
  });

  it("ships the hook executable and syntactically valid", async () => {
    expect(statSync(hookPath).mode & 0o111).toBeGreaterThan(0);
    const parsed = await run("bash", ["-n", hookPath]);
    expect(parsed.stderr).toBe("");
    expect(parsed.code).toBe(0);
  });

  it("links the shipped skill in, as a committed relative symlink", () => {
    const link = join(pluginDir, "skills", "apicity");
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(readlinkSync(link)).toBe(join("..", "..", "skills", "apicity"));
    // `test -f` through the link: the plugin ships the same bytes the CLI does.
    const through = join(link, "SKILL.md");
    expect(statSync(through).isFile()).toBe(true);
    expect(readFileSync(through, "utf8")).toBe(
      readFileSync(join(repoRoot, "skills/apicity/SKILL.md"), "utf8")
    );
  });

  it("commits every plugin path — none of them is gitignored", async () => {
    // `.gitignore` ignores the contents of `.claude/` directories, not
    // `.claude-plugin/`. check-ignore exits 1 when it matched nothing, which
    // is the state this repository needs: an ignored manifest would ship a
    // plugin nobody can install.
    const checked = await run("git", [
      "check-ignore",
      "-v",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json",
      ".claude-plugin/hooks/hooks.json",
      ".claude-plugin/hooks/session-start.sh",
      ".claude-plugin/skills/apicity",
      "skills/apicity/SKILL.md",
    ]);
    expect(checked.stdout).toBe("");
    expect(checked.code).toBe(1);
  });

  it("tracks .claude/CLAUDE.md and ignores .claude/ runtime files", async () => {
    // The guidance lives at `.claude/CLAUDE.md`, not at the root, because
    // `source: "./"` makes the repository root the plugin root, where the
    // validator flags a `./CLAUDE.md` (see the `claude plugin validate` test
    // below). Every other path in a `.claude/` directory, at any depth, is
    // harness runtime — gc-materialized skills, settings — so `.gitignore`
    // excludes those directories' contents and re-includes this one file.
    // `--no-index` is load-bearing: without it check-ignore never reports a
    // tracked path, so the memory check could not fail. A developer's global
    // excludes file is set aside so the verdict is this repository's alone.
    const checkIgnore = (paths: string[]) =>
      run("git", [
        "-c",
        "core.excludesFile=/dev/null",
        "check-ignore",
        "--no-index",
        ...paths,
      ]);

    const tracked = await run("git", [
      "ls-files",
      "--",
      "./CLAUDE.md",
      ".claude/CLAUDE.md",
    ]);
    expect(tracked.stdout).toBe(".claude/CLAUDE.md\n");

    const memory = await checkIgnore([".claude/CLAUDE.md"]);
    expect(memory.stdout).toBe("");
    expect(memory.code).toBe(1);

    // Entry names, never a path through one: in a rig checkout each
    // `.claude/skills/<pack>.<skill>` is a symlink, and git refuses a path
    // beyond a symbolic link.
    const runtime = [
      ".claude/settings.json",
      ".claude/settings.local.json",
      ".claude/skills/.gc-skill-ownership.json",
      ".claude/skills/core.gc-work",
      "packages/cli/.claude/settings.json",
      // The negation is anchored to the root: a nested copy stays runtime.
      "packages/cli/.claude/CLAUDE.md",
    ];
    const ignored = await checkIgnore(runtime);
    expect(ignored.stdout.split("\n").filter(Boolean)).toEqual(runtime);
    expect(ignored.code).toBe(0);
  });
});

// EX-13. The hook runs on a PATH holding only what it names — bash, cat and
// node — so "the CLI is absent" is a fact about the run rather than a hope
// about the machine, and the `apicity` it finds in the second case is one
// this test wrote.
describe("session-start.sh (EX-13)", () => {
  let sandbox: string;
  let binDir: string;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), "apicity-hook-"));
    binDir = join(sandbox, "bin");
    mkdirSync(binDir);
    for (const name of ["bash", "cat", "node"]) {
      const real = name === "node" ? process.execPath : locate(name);
      if (real !== undefined) symlinkSync(real, join(binDir, name));
    }
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  it("names the install command when the CLI is not on PATH", async () => {
    const result = await run(hookPath, [], { path: binDir });

    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      "<hook-output>\n" +
        "apicity plugin active — CLI not found on PATH.\n" +
        "Install: npm install -g @apicity/cli\n" +
        "</hook-output>\n"
    );
    expect(result.ms).toBeLessThan(5000);
  });

  it("reports the configured provider count when the CLI is present", async () => {
    // ac-w7vzap REQ-019: the hook reads `apicity providers --json`, which never
    // runs `op`, rather than `doctor --json`, which lists the 1Password vault.
    // The fake records its argv, so the test sees which command was asked.
    const fake = join(binDir, "apicity");
    const argvFile = join(sandbox, "argv");
    writeFileSync(
      fake,
      "#!/usr/bin/env bash\n" +
        `printf '%s' "$*" > '${argvFile}'\n` +
        "printf '%s\\n' '" +
        JSON.stringify({
          ok: true,
          data: [
            {
              provider: "binance",
              envVars: [],
              configured: true,
              endpoints: 12,
            },
            {
              provider: "openligadb",
              envVars: [],
              configured: true,
              endpoints: 20,
            },
            {
              provider: "openai",
              envVars: ["OPENAI_API_KEY"],
              configured: true,
              endpoints: 80,
            },
            {
              provider: "xai",
              envVars: ["XAI_API_KEY"],
              configured: false,
              endpoints: 60,
            },
          ],
        }) +
        "'\n",
      { mode: 0o755 }
    );

    const result = await run(hookPath, [], { path: binDir });

    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      "<hook-output>\n" +
        "apicity plugin active — 3 providers configured " +
        "(binance, openligadb, openai)\n" +
        "</hook-output>\n"
    );
    expect(readFileSync(argvFile, "utf8")).toBe("providers --json");
    // No credential can reach the transcript: the hook reads provider names
    // and configured flags out of `providers --json` and prints nothing else.
    expect(result.stdout).not.toContain("API_KEY");
    expect(result.ms).toBeLessThan(5000);
  });

  it("still reports liveness when the CLI answers nothing usable", async () => {
    const fake = join(binDir, "apicity");
    writeFileSync(fake, "#!/usr/bin/env bash\nexit 3\n", { mode: 0o755 });

    const result = await run(hookPath, [], { path: binDir });

    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      "<hook-output>\napicity plugin active.\n</hook-output>\n"
    );
  });
});

// The manifests through Claude Code's own validator. It is the authority on
// what `--strict` accepts, and it only exists where `claude` does — which is
// the rig, never CI.
const VALIDATE_TITLE = "validates both manifests with claude plugin validate";
const NO_CLAUDE = "claude is not on PATH";
const claudeBinary = locate("claude");

describe("claude plugin validate", () => {
  it.skipIf(claudeBinary === undefined)(
    claudeBinary !== undefined
      ? VALIDATE_TITLE
      : `${VALIDATE_TITLE} [skipped: ${NO_CLAUDE}]`,
    async () => {
      const report = async (file: string) => {
        const result = await run(claudeBinary as string, [
          "plugin",
          "validate",
          join(".claude-plugin", file),
          "--strict",
          "--json",
        ]);
        return {
          ...result,
          json: JSON.parse(result.stdout) as ValidationReport,
        };
      };

      const marketplace = await report("marketplace.json");
      expect(marketplace.json.manifest.errors).toEqual([]);
      expect(marketplace.json.manifest.warnings).toEqual([]);
      expect(marketplace.code).toBe(0);

      const plugin = await report("plugin.json");
      // `source: "./"` makes the repository root the plugin root, and the
      // validator warns about a `./CLAUDE.md`, which `--strict` turns into
      // exit 1. The guidance therefore lives at `.claude/CLAUDE.md`, and the
      // plugin must validate clean: no manifest problem, no content problem.
      // A stray `./CLAUDE.md` (one `/init` writes, say, which `.gitignore`
      // hides from `git status`) fails here.
      expect(plugin.json.manifest.errors).toEqual([]);
      expect(plugin.json.manifest.warnings).toEqual([]);
      for (const entry of plugin.json.contents ?? []) {
        expect(entry.warnings).toEqual([]);
        expect(entry.errors).toEqual([]);
      }
      expect(plugin.json.success).toBe(true);
      expect(plugin.code).toBe(0);
    },
    30_000
  );
});

interface ValidationEntry {
  file: string;
  errors: Array<{ message: string }>;
  warnings: Array<{ message: string }>;
}

interface ValidationReport {
  success: boolean;
  manifest: ValidationEntry;
  contents?: ValidationEntry[];
}
