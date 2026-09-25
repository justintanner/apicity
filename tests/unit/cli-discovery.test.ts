import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCatalog } from "../../packages/cli/src/catalog";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { CliError } from "../../packages/cli/src/errors";
import { HELP_TOPICS, helpTopicText } from "../../packages/cli/src/help";
import { runMain } from "../../packages/cli/src/main";
import {
  describeEndpoint,
  listProviders,
  runCommands,
  runDescribe,
  runProviders,
  type ProviderLoader,
} from "../../packages/cli/src/discovery";
import { instantiateForIntrospection } from "../../packages/cli/src/discovery";
import { providerEnvVars } from "../../packages/cli/src/credentials";
import type { JsonSchema } from "../../packages/cli/src/schema";
import {
  runSubprocess,
  SUBPROCESS_STDIO,
} from "../../packages/cli/src/subprocess";

// AC-07: the three discovery commands. None of them needs a credential, and
// only `describe` may touch a provider package — the import seam below is the
// half of the timing budget that a stopwatch cannot protect.

/** A home with nothing in it (ac-w7vzap F-10): `configured` reads it. */
function sandboxHome(): string {
  return mkdtempSync(join(tmpdir(), "apicity-discovery-home-"));
}

const EMPTY_ENV: NodeJS.ProcessEnv = { HOME: sandboxHome() };

interface Capture {
  writer: CliWriter;
  out: string[];
  err: string[];
}

function capture(): Capture {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

/** Every model id a createTask-style union offers, across const and enum branches. */
function modelIds(variants: JsonSchema[]): string[] {
  const out: string[] = [];
  for (const variant of variants) {
    const model = (variant.properties as Record<string, JsonSchema>)?.model;
    if (!model) continue;
    for (const branch of (model.anyOf as JsonSchema[]) ?? [model]) {
      if (typeof branch?.const === "string") out.push(branch.const);
      for (const value of (branch?.enum as unknown[]) ?? []) {
        if (typeof value === "string") out.push(value);
      }
    }
  }
  return out;
}

function tsvRowCount(provider: string): number {
  return readFileSync("scripts/endpoint-docs.tsv", "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .filter((line) => line.split("\t")[0] === provider).length;
}

/** A loader that records every call, so a test can assert it was never used. */
function countingLoader(): { loader: ProviderLoader; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    loader: async (name) => {
      calls.push(name);
      return instantiateForIntrospection(name);
    },
  };
}

describe("apicity commands", () => {
  it("reports one entry per tsv row for a single provider", async () => {
    const { writer, out } = capture();

    await expect(
      runCommands(writer, {
        provider: "openligadb",
        json: true,
        env: EMPTY_ENV,
      })
    ).resolves.toBe(0);

    const { data } = JSON.parse(out.join("\n")) as { data: unknown[] };
    expect(data).toHaveLength(tsvRowCount("openligadb"));
  });

  it("prints a table with both parameter kinds in human mode", async () => {
    const { writer, out } = capture();

    await runCommands(writer, {
      provider: "kie",
      env: EMPTY_ENV,
      stdoutIsTTY: true,
    });
    const table = out.join("\n");

    expect(table.split("\n")[0]).toContain("provider");
    expect(table).toContain("dotPath");
    // A positional reads as `<taskId>`; a request property reads bare.
    expect(table).toContain("<taskId>");
  });

  it("reports an unknown provider as not_found", async () => {
    const { writer } = capture();

    await expect(
      runCommands(writer, { provider: "nope", env: EMPTY_ENV })
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("apicity providers", () => {
  it("lists env var names and status, never a value", async () => {
    const summaries = await listProviders({
      env: { OPENAI_API_KEY: "sk-secret-value" },
    });
    const openai = summaries.find((s) => s.provider === "openai");
    const binance = summaries.find((s) => s.provider === "binance");

    expect(openai).toMatchObject({
      envVars: ["OPENAI_API_KEY"],
      configured: true,
    });
    expect(openai?.endpoints).toBe(tsvRowCount("openai"));
    // A provider that needs no credential is always usable.
    expect(binance).toMatchObject({ envVars: [], configured: true });
    expect(JSON.stringify(summaries)).not.toContain("sk-secret-value");
  });

  it("prints no credential value in human mode either", async () => {
    const { writer, out } = capture();

    await runProviders(writer, {
      env: { OPENAI_API_KEY: "sk-secret-value" },
      stdoutIsTTY: true,
    });

    expect(out.join("\n")).not.toContain("sk-secret-value");
    expect(out.join("\n")).toContain("OPENAI_API_KEY");
  });
});

describe("apicity describe", () => {
  it("answers the schema, call shape and paid flag for a paid endpoint", async () => {
    const description = await describeEndpoint(
      "kie",
      "api.v1.jobs.createTask",
      { method: "POST", env: EMPTY_ENV }
    );

    expect(description.paid).toBe(true);
    expect(description.method).toBe("POST");
    expect(description.callShape).toBeUndefined(); // no URL placeholder
    // createTask is a discriminated union: one variant per model, each pinning
    // its `model` to a const or an open enum branch, exactly as
    // `cli-schema.test.ts` pins for the JSON Schema `apicity describe` prints.
    const variants = (description.schema as JsonSchema).anyOf as JsonSchema[];
    expect(variants.length).toBeGreaterThan(0);
    expect(modelIds(variants)).toContain("grok-imagine/text-to-video");
  });

  it("needs no credential in the environment", async () => {
    const description = await describeEndpoint(
      "openai",
      "v1.vectorStores.files",
      { method: "GET", env: EMPTY_ENV }
    );

    expect(description.configured).toBe(false);
    expect(description.callShape?.positional).toEqual([
      {
        placeholder: "vector_store_id",
        param: "vectorStoreId",
        optional: false,
        alias: "vector_store_id",
      },
    ]);
  });

  // A workspace checkout without `pnpm run build`, or an install missing a
  // provider package, must read as setup rather than as a crashed CLI.
  it("reports an unloadable provider package as setup_incomplete", async () => {
    await expect(
      describeEndpoint("openligadb", "getcurrentgroup", {
        env: EMPTY_ENV,
        loadProvider: () => Promise.reject(new Error("ERR_MODULE_NOT_FOUND")),
      })
    ).rejects.toThrow("ERR_MODULE_NOT_FOUND");

    await expect(
      instantiateForIntrospection("openligadb", {
        envVar: "",
        optionKey: "apiKey",
        importPath: "@apicity/does-not-exist",
        factoryName: "createNothing",
      })
    ).rejects.toMatchObject({ code: "setup_incomplete" });
  });

  // RR-5 (ac-yrwwpi): a factory that throws while building — validating a
  // credential bundle it was handed a placeholder for, say — is a describe
  // failure, not a crash. `runMain` converts only `CliError`, so anything
  // else would reach `bin.ts` as `[apicity] fatal:`. The stub spec points at
  // a one-function module written into a temporary directory.
  it("reports a factory that throws at construction as a CliError", async () => {
    const dir = mkdtempSync(join(tmpdir(), "apicity-describe-"));
    writeFileSync(
      join(dir, "throwing-provider.mjs"),
      'export function createThrowing() {\n  throw new Error("no tree for you");\n}\n'
    );
    try {
      const caught: unknown = await instantiateForIntrospection("openai", {
        envVar: "OPENAI_API_KEY",
        optionKey: "apiKey",
        importPath: pathToFileURL(join(dir, "throwing-provider.mjs")).href,
        factoryName: "createThrowing",
      }).then(
        () => undefined,
        (err: unknown) => err
      );

      expect(caught).toBeInstanceOf(CliError);
      expect(caught).toMatchObject({ code: "api", exit: 7 });
      expect((caught as CliError).message).toContain("no tree for you");
      expect((caught as CliError).cause).toBeInstanceOf(Error);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is ambiguous without --method on a multi-method dotPath", async () => {
    await expect(
      describeEndpoint("openai", "v1.chat.completions", { env: EMPTY_ENV })
    ).rejects.toMatchObject({ code: "ambiguous" });
  });
});

// The import seam. `commands` and `providers` answer from the generated table;
// only `describe` may pay for a provider import, and only once.
describe("provider-import seam", () => {
  it("never loads a provider for commands", async () => {
    const { writer } = capture();
    const { loader, calls } = countingLoader();

    await runCommands(writer, {
      json: true,
      env: EMPTY_ENV,
      loadProvider: loader,
    });

    expect(calls).toEqual([]);
  });

  it("never loads a provider for providers", async () => {
    const { writer } = capture();
    const { loader, calls } = countingLoader();

    await runProviders(writer, {
      json: true,
      env: EMPTY_ENV,
      loadProvider: loader,
    });

    expect(calls).toEqual([]);
  });

  it("loads exactly one provider for describe", async () => {
    const { loader, calls } = countingLoader();

    await describeEndpoint("openligadb", "getcurrentgroup", {
      env: EMPTY_ENV,
      loadProvider: loader,
    });

    expect(calls).toEqual(["openligadb"]);
  });
});

// D-5 (ac-w7vzap): "configured" means the CLI knows where each credential
// comes from — a process value, an env-file literal or `op://` reference, or
// the vault convention — and answering it never runs `op`.
describe("configured counts the env file and the vault convention", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** A sandbox home whose default env file holds `content`. */
  function homeWithEnvFile(content: string): NodeJS.ProcessEnv {
    const home = sandboxHome();
    mkdirSync(join(home, ".config", "apicity"), { recursive: true });
    writeFileSync(join(home, ".config", "apicity", ".env"), content);
    return { HOME: home };
  }

  async function configured(
    env: NodeJS.ProcessEnv
  ): Promise<Record<string, boolean>> {
    const summaries = await listProviders({ env });
    return Object.fromEntries(
      summaries.map((summary) => [summary.provider, summary.configured])
    );
  }

  it("counts an env-file literal", async () => {
    const found = await configured(
      homeWithEnvFile("OPENAI_API_KEY=sk-file-literal\n")
    );

    expect(found.openai).toBe(true);
    expect(found.xai).toBe(false);
  });

  it("counts an env-file op:// reference, unresolved", async () => {
    const found = await configured(
      homeWithEnvFile(
        "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password\n"
      )
    );

    expect(found.fireworks).toBe(true);
    expect(found.openai).toBe(false);
  });

  it("counts every credentialed provider for a vault and token in the env file", async () => {
    const found = await configured(
      homeWithEnvFile(
        "APICITY_OP_VAULT=Apicity\n" +
          "APICITY_OP_SERVICE_TOKEN=env:OP_SERVICE_ACCOUNT_TOKEN\n"
      )
    );

    expect(Object.values(found).every(Boolean)).toBe(true);
  });

  it("does not count a vault without a token", async () => {
    const found = await configured(
      homeWithEnvFile("APICITY_OP_VAULT=Apicity\n")
    );

    expect(found.openai).toBe(false);
    expect(found.binance).toBe(true);
  });

  it("reads the env file and 1Password flags a command line gives", async () => {
    const home = sandboxHome();
    const file = join(home, "named.env");
    writeFileSync(file, "XAI_API_KEY=xai-file-literal\n");

    const commands = capture();
    await expect(
      runMain(
        ["commands", "--provider", "xai", "--env-file", file, "--json"],
        commands.writer,
        { env: { HOME: home }, stdoutIsTTY: false }
      )
    ).resolves.toBe(0);
    const rows = (
      JSON.parse(commands.out.join("\n")) as {
        data: Array<{ configured: boolean }>;
      }
    ).data;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.configured)).toBe(true);

    const providers = capture();
    await runMain(
      ["providers", "--op-vault", "Apicity", "--op-token", "env:T", "--json"],
      providers.writer,
      { env: { HOME: home }, stdoutIsTTY: false }
    );
    const summaries = (
      JSON.parse(providers.out.join("\n")) as {
        data: Array<{ provider: string; configured: boolean }>;
      }
    ).data;
    expect(summaries.every((summary) => summary.configured)).toBe(true);

    const described = capture();
    await runMain(
      [
        "describe",
        "kie",
        "api.v1.jobs.createTask",
        "--op-vault",
        "Apicity",
        "--op-service-token",
        "env:T",
        "--json",
      ],
      described.writer,
      { env: { HOME: home }, stdoutIsTTY: false }
    );
    expect(
      (
        JSON.parse(described.out.join("\n")) as {
          data: { configured: boolean };
        }
      ).data.configured
    ).toBe(true);
  });

  // ac-w7vzap A-2: the two alias paths forward the same flags.
  it("forwards the flags on the apicity <provider> and --help paths", async () => {
    const env = { HOME: sandboxHome() };
    const flags = ["--op-vault", "Apicity", "--op-token", "env:T", "--json"];

    const alias = capture();
    await expect(
      runMain(["kie", ...flags], alias.writer, { env, stdoutIsTTY: false })
    ).resolves.toBe(0);
    const rows = (
      JSON.parse(alias.out.join("\n")) as {
        data: Array<{ configured: boolean }>;
      }
    ).data;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.configured)).toBe(true);

    const help = capture();
    await expect(
      runMain(
        ["kie", "api.v1.jobs.createTask", "--help", ...flags],
        help.writer,
        {
          env,
          stdoutIsTTY: false,
        }
      )
    ).resolves.toBe(0);
    expect(
      (JSON.parse(help.out.join("\n")) as { data: { configured: boolean } })
        .data.configured
    ).toBe(true);
  });

  // ac-w7vzap A3 (REQ-017): discovery stays offline under a vault and a token.
  // A fake `op` first on PATH leaves a marker when anything runs it; the three
  // discovery calls must leave none, and the positive control proves the fake
  // would have been found.
  it("never runs op under a vault and a token", async () => {
    const dir = mkdtempSync(join(tmpdir(), "apicity-fake-op-"));
    const marker = join(dir, "op-ran");
    writeFileSync(
      join(dir, "op"),
      `#!/bin/sh\necho ran >> '${marker}'\necho 2.39.0\n`,
      { mode: 0o755 }
    );
    vi.stubEnv("PATH", `${dir}${delimiter}${process.env.PATH ?? ""}`);
    const env: NodeJS.ProcessEnv = {
      HOME: sandboxHome(),
      APICITY_OP_VAULT: "Apicity",
      APICITY_OP_SERVICE_TOKEN: "env:NOT_A_TOKEN",
    };
    const { loader, calls } = countingLoader();

    try {
      const summaries = await listProviders({ env, loadProvider: loader });
      await runCommands(capture().writer, {
        json: true,
        env,
        loadProvider: loader,
      });
      const description = await describeEndpoint(
        "openligadb",
        "getcurrentgroup",
        {
          env,
          loadProvider: loader,
        }
      );

      expect(summaries.every((summary) => summary.configured)).toBe(true);
      expect(description.configured).toBe(true);
      expect(calls).toEqual(["openligadb"]);
      expect(existsSync(marker)).toBe(false);

      // Positive control: the same PATH does reach the fake.
      const control = await runSubprocess("op", ["--version"], {
        timeoutMs: 4000,
        stdio: SUBPROCESS_STDIO,
      });
      expect(control.code).toBe(0);
      expect(existsSync(marker)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("names every variable a provider reads, with no value", async () => {
    const summaries = await listProviders({
      env: homeWithEnvFile("S3_ACCESS_KEY_ID=AKIA-file-sentinel\n"),
    });
    const s3 = summaries.find((summary) => summary.provider === "s3");

    expect(s3?.envVars).toEqual(providerEnvVars("s3"));
    expect(s3?.configured).toBe(false);
    expect(JSON.stringify(summaries)).not.toContain("sentinel");
  });
});

// Routing: every command this slice adds has to be reachable from argv, and a
// failure has to leave the envelope on stderr rather than a stack trace.
describe("dispatcher routing", () => {
  it("prints each help topic", async () => {
    for (const topic of HELP_TOPICS) {
      const { writer, out, err } = capture();

      await expect(runMain(["help", topic], writer)).resolves.toBe(0);
      expect(err, topic).toEqual([]);
      expect(out.join("\n"), topic).toContain(topic);
    }
  });

  it("names every exit code in the exit-codes topic", async () => {
    const { writer, out } = capture();

    await runMain(["help", "exit-codes"], writer);
    const text = out.join("\n");

    for (const code of ["usage", "not_found", "ambiguous", "paygate"]) {
      expect(text, code).toContain(code);
    }
  });

  it("answers an unknown help topic with not_found", async () => {
    const { writer, err } = capture();

    await expect(runMain(["help", "nosuch"], writer)).resolves.toBe(2);
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "not_found" });
  });

  it("routes a bare provider name to its command list", async () => {
    const direct = capture();
    const viaFlag = capture();

    await expect(
      runMain(["openligadb", "--json"], direct.writer)
    ).resolves.toBe(0);
    await expect(
      runMain(
        ["commands", "--provider", "openligadb", "--json"],
        viaFlag.writer
      )
    ).resolves.toBe(0);

    expect(direct.out).toEqual(viaFlag.out);
    const { data } = JSON.parse(direct.out.join("\n")) as { data: unknown[] };
    expect(data).toHaveLength(tsvRowCount("openligadb"));
  });

  it("reports a describe call with no arguments as usage", async () => {
    const { writer, err } = capture();

    await expect(
      runMain(["describe"], writer, { stdoutIsTTY: false })
    ).resolves.toBe(1);
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "usage" });
  });

  it("puts a discovery failure in the error envelope, not a stack", async () => {
    const { writer, out, err } = capture();

    await expect(
      runMain(["commands", "--provider", "nosuchprovider"], writer, {
        stdoutIsTTY: false,
      })
    ).resolves.toBe(2);
    expect(out).toEqual([]);
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "not_found" });
  });
});

// ac-3oip95: discovery answers under the one output rule (D-5) like every
// other command, rather than printing its result at the top level. Every case
// passes `stdoutIsTTY`, so the terminal the suite runs in decides nothing.
interface CliRun {
  exit: number;
  out: string;
  err: string[];
}

async function runCli(argv: string[], stdoutIsTTY: boolean): Promise<CliRun> {
  const { writer, out, err } = capture();
  const exit = await runMain(argv, writer, { stdoutIsTTY });
  return { exit, out: out.join("\n"), err };
}

const DISCOVERY = [
  {
    command: "commands",
    argv: ["commands", "--provider", "openligadb"],
    data: async (): Promise<unknown> =>
      (await loadCatalog()).filter((entry) => entry.provider === "openligadb"),
    direct: (writer: CliWriter) =>
      runCommands(writer, { provider: "openligadb", stdoutIsTTY: false }),
    human: /^provider\s+method\s+dotPath\s+params\s+paid\s+configured$/,
  },
  {
    command: "providers",
    argv: ["providers"],
    data: (): Promise<unknown> => listProviders(),
    direct: (writer: CliWriter) => runProviders(writer, { stdoutIsTTY: false }),
    human: /^provider\s+endpoints\s+configured\s+env$/,
  },
  {
    command: "describe",
    argv: ["describe", "kie", "api.v1.jobs.createTask"],
    data: (): Promise<unknown> =>
      describeEndpoint("kie", "api.v1.jobs.createTask"),
    direct: (writer: CliWriter) =>
      runDescribe(writer, "kie", "api.v1.jobs.createTask", {
        stdoutIsTTY: false,
      }),
    human: /^kie api\.v1\.jobs\.createTask$/,
  },
];

for (const { command, argv, data, direct, human } of DISCOVERY) {
  describe(`apicity ${command} under the one output rule`, () => {
    it("answers the success envelope around the same data with --json", async () => {
      // At a terminal: `--json` alone selects the envelope.
      const { exit, out, err } = await runCli([...argv, "--json"], true);

      expect(exit).toBe(0);
      expect(err).toEqual([]);
      const envelope = JSON.parse(out) as Record<string, unknown>;
      expect(Object.keys(envelope).sort()).toEqual(["data", "ok"]);
      expect(envelope.ok).toBe(true);
      expect(envelope.data).toEqual(JSON.parse(JSON.stringify(await data())));
    });

    it("answers a pipe with the same bytes as --json", async () => {
      const piped = await runCli(argv, false);
      const forced = await runCli([...argv, "--json"], false);

      expect(piped.exit).toBe(0);
      expect(piped.out).toBe(forced.out);
      expect(JSON.parse(piped.out)).toMatchObject({ ok: true });
    });

    it("prints the data alone on one line for --json --quiet", async () => {
      const { exit, out } = await runCli([...argv, "--json", "--quiet"], false);

      expect(exit).toBe(0);
      expect(out).toBe(JSON.stringify(await data()));
    });

    it("prints the data alone, pretty-printed, for --quiet in a pipe or at a terminal", async () => {
      // OQ-002: at a terminal `--quiet` still wins over the human form.
      for (const stdoutIsTTY of [false, true]) {
        const { exit, out } = await runCli([...argv, "--quiet"], stdoutIsTTY);

        expect(exit).toBe(0);
        expect(out).toBe(JSON.stringify(await data(), null, 2));
      }
    });

    it("keeps the human form at a terminal", async () => {
      const { exit, out } = await runCli(argv, true);

      expect(exit).toBe(0);
      expect(out.split("\n")[0]).toMatch(human);
    });

    it("prints from the exported function what the CLI prints", async () => {
      const cap = capture();

      await expect(direct(cap.writer)).resolves.toBe(0);
      expect(cap.out.join("\n")).toBe((await runCli(argv, false)).out);
    });
  });
}

// The two aliases reuse the built-ins' rendering, so they print the same bytes
// in every mode.
const ALIAS_MODES: [string, string[]][] = [
  ["--json", ["--json"]],
  ["a pipe", []],
  ["--json --quiet", ["--json", "--quiet"]],
];

describe("the discovery aliases under the one output rule", () => {
  for (const [mode, flags] of ALIAS_MODES) {
    it(`prints for apicity <provider> what commands --provider prints, under ${mode}`, async () => {
      const alias = await runCli(["openligadb", ...flags], false);
      const builtin = await runCli(
        ["commands", "--provider", "openligadb", ...flags],
        false
      );

      expect(builtin.exit).toBe(0);
      expect(alias.exit).toBe(0);
      expect(alias.out).toBe(builtin.out);
    });
  }

  for (const [mode, flags] of ALIAS_MODES) {
    it(`prints for --help what describe --method POST prints, under ${mode}`, async () => {
      const alias = await runCli(
        ["openai", "v1.chat.completions", "--help", ...flags],
        false
      );
      const builtin = await runCli(
        [
          "describe",
          "openai",
          "v1.chat.completions",
          "--method",
          "POST",
          ...flags,
        ],
        false
      );

      expect(builtin.exit).toBe(0);
      expect(alias.exit).toBe(0);
      expect(alias.out).toBe(builtin.out);
      // The other methods are named on stderr, so stdout stays one document.
      expect(alias.err).toEqual([
        "[apicity] openai v1.chat.completions also answers DELETE, GET — " +
          "pass --method to describe one of those",
      ]);
    });
  }
});

describe("discovery failures and flags under the one output rule", () => {
  it("keeps the error envelope for an unknown provider", async () => {
    const { exit, out, err } = await runCli(
      ["commands", "--provider", "nope", "--json"],
      false
    );

    expect(exit).toBe(2);
    expect(out).toBe("");
    expect(err).toEqual([
      '{"ok":false,"error":"no endpoints for provider: nope","code":"not_found","hint":"run: apicity providers"}',
    ]);
  });

  it("keeps the error envelope for an ambiguous describe", async () => {
    const { exit, out, err } = await runCli(
      ["describe", "openai", "v1.chat.completions", "--json"],
      false
    );

    expect(exit).toBe(8);
    expect(out).toBe("");
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "ambiguous" });
  });

  it("still refuses a flag the discovery parser does not know", async () => {
    const { exit, out, err } = await runCli(["commands", "--verbose"], false);

    expect(exit).toBe(1);
    expect(out).toBe("");
    expect(err).toEqual([
      '{"ok":false,"error":"--verbose needs a value","code":"usage"}',
    ]);
  });

  it("reads --quiet as a flag wherever it sits after the command", async () => {
    const { exit, out } = await runCli(
      ["describe", "kie", "--quiet", "api.v1.jobs.createTask", "--json"],
      false
    );

    expect(exit).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ method: "POST", paid: true });
  });

  it("shows the success envelope in the output help topic", () => {
    const text = helpTopicText("output");

    expect(text).toContain('{"ok": true, "data": ...');
    expect(text).toContain("the result under `data`");
  });
});
