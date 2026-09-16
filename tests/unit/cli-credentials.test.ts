import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { CliWriter } from "../../packages/cli/src/envelope";
import {
  defaultEnvFilePath,
  resolveCredentials,
  resolveServiceToken,
} from "../../packages/cli/src/credentials";
import { runCommands, runProviders } from "../../packages/cli/src/discovery";
import {
  runEndpoint,
  type ProviderInstantiator,
} from "../../packages/cli/src/main";
import { resolveOpServiceToken } from "../../packages/cli/src/mcp/cli";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";
import { installVerboseFetch } from "../../packages/cli/src/verbose";

// AC-05: credential precedence, the single-provider rule for a call, and the
// invariant that matters most — a credential value never reaches stdout, an
// envelope, or a log line. Nothing here spawns `op`: the 1Password read is
// injected through the same seam the MCP server exposes.

const SECRET = "sk-test-SECRET";

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

function sandbox(): string {
  return mkdtempSync(join(tmpdir(), "apicity-cli-home-"));
}

function envFile(contents: string): string {
  const file = join(sandbox(), ".env");
  writeFileSync(file, contents);
  return file;
}

describe("precedence", () => {
  it("keeps a value already set in the process", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      OPENAI_API_KEY: "from-process",
    };

    await resolveCredentials({
      provider: "openai",
      flags: { envFile: envFile("OPENAI_API_KEY=from-file") },
      env,
    });

    expect(env.OPENAI_API_KEY).toBe("from-process");
  });

  it("fills an unset value from the env file", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };

    await resolveCredentials({
      provider: "openai",
      flags: { envFile: envFile("OPENAI_API_KEY=from-file") },
      env,
    });

    expect(env.OPENAI_API_KEY).toBe("from-file");
  });

  it("reads APICITY_ENV_FILE when no flag names one", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      APICITY_ENV_FILE: envFile("OPENAI_API_KEY=from-variable"),
    };

    await resolveCredentials({ provider: "openai", env });

    expect(env.OPENAI_API_KEY).toBe("from-variable");
  });

  it("falls back to ~/.config/apicity/.env when that file exists", async () => {
    const home = sandbox();
    mkdirSync(join(home, ".config", "apicity"), { recursive: true });
    writeFileSync(
      defaultEnvFilePath({ HOME: home }),
      "OPENAI_API_KEY=from-home\n"
    );
    const env: NodeJS.ProcessEnv = { HOME: home };

    await resolveCredentials({ provider: "openai", env });

    expect(defaultEnvFilePath({ HOME: home })).toBe(
      join(home, ".config", "apicity", ".env")
    );
    expect(env.OPENAI_API_KEY).toBe("from-home");
  });

  it("is quiet when the default env file is absent", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };

    await expect(
      resolveCredentials({ provider: "binance", env })
    ).resolves.toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it("reports an --env-file that cannot be read as usage", async () => {
    await expect(
      resolveCredentials({
        provider: "openai",
        flags: { envFile: "/nope/missing.env" },
        env: { HOME: sandbox() },
      })
    ).rejects.toMatchObject({ code: "usage" });
  });

  it("skips op:// references in the env file, leaving 1Password to fill them", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const reads: string[] = [];

    await resolveCredentials({
      provider: "openai",
      flags: {
        envFile: envFile("OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password"),
        opVault: "Apicity",
        opToken: "ops_token",
      },
      env,
      readSecret: (ref) => {
        reads.push(ref);
        return Promise.resolve("from-1password");
      },
    });

    expect(reads).toEqual(["op://Apicity/OPENAI_API_KEY/password"]);
    expect(env.OPENAI_API_KEY).toBe("from-1password");
  });

  it("never reads 1Password for a value the process already has", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox(), OPENAI_API_KEY: "set" };
    const reads: string[] = [];

    await resolveCredentials({
      provider: "openai",
      flags: { opVault: "Apicity", opToken: "ops_token" },
      env,
      readSecret: (ref) => {
        reads.push(ref);
        return Promise.resolve("unused");
      },
    });

    expect(reads).toEqual([]);
    expect(env.OPENAI_API_KEY).toBe("set");
  });
});

describe("the single-provider rule for a call", () => {
  it("reads only the addressed provider's variables", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const reads: string[] = [];

    await resolveCredentials({
      provider: "s3",
      flags: { opVault: "Apicity", opToken: "ops_token" },
      env,
      readSecret: (ref) => {
        reads.push(ref);
        return Promise.resolve("value");
      },
    });

    // s3's two variables, and nothing belonging to the other 27 providers.
    expect(reads).toEqual([
      "op://Apicity/S3_ACCESS_KEY_ID/password",
      "op://Apicity/S3_SECRET_ACCESS_KEY/password",
    ]);
  });

  it("instantiates exactly one provider for a call", async () => {
    const instantiated: string[] = [];
    const instantiate: ProviderInstantiator = (name) => {
      instantiated.push(name);
      return Promise.resolve({
        get: {
          api: { v1: { jobs: { recordInfo: () => Promise.resolve({}) } } },
        },
      } as InstantiatedProvider);
    };

    await runEndpoint(
      "kie",
      ["api.v1.jobs.recordInfo", "--taskId", "abc"],
      capture().writer,
      {
        env: { HOME: sandbox(), KIE_API_KEY: "kie-test" },
        stdoutIsTTY: false,
        instantiate,
      }
    );

    expect(instantiated).toEqual(["kie"]);
  });

  it("reports a failed vault read as auth (exit 3)", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      ["v1.embeddings", "--data", '{"model":"m","input":"hi"}'],
      cap.writer,
      {
        env: { HOME: sandbox(), APICITY_OP_VAULT: "Apicity" },
        stdoutIsTTY: false,
        readSecret: () =>
          Promise.reject(new Error('item "OPENAI_API_KEY" not found')),
        instantiate: () => Promise.resolve(null),
      }
    );

    // The vault is configured but the token is not, which is itself a usage
    // error; with both present the read failure is the auth error below.
    expect(exit).toBe(1);

    const withToken = capture();
    const exitWithToken = await runEndpoint(
      "openai",
      ["v1.embeddings", "--data", '{"model":"m","input":"hi"}'],
      withToken.writer,
      {
        env: {
          HOME: sandbox(),
          APICITY_OP_VAULT: "Apicity",
          APICITY_OP_SERVICE_TOKEN: "ops_token",
        },
        stdoutIsTTY: false,
        readSecret: () =>
          Promise.reject(new Error('item "OPENAI_API_KEY" not found')),
        instantiate: () => Promise.resolve(null),
      }
    );

    expect(exitWithToken).toBe(3);
    const envelope = JSON.parse(withToken.err[0]) as Record<string, unknown>;
    expect(envelope.code).toBe("auth");
    expect(String(envelope.error)).toContain("OPENAI_API_KEY");
  });

  it("names the variables to set when nothing is configured (EX-05)", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "s3",
      ["buckets.create", "--bucket", "b"],
      cap.writer,
      { env: { HOME: sandbox() }, stdoutIsTTY: false }
    );

    expect(exit).toBe(3);
    const envelope = JSON.parse(cap.err[0]) as Record<string, unknown>;
    expect(envelope.hint).toBe(
      "set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, or pass " +
        "--env-file / --op-vault; see apicity doctor"
    );
  });
});

describe("the service-account token forms", () => {
  // The call path restates this resolution rather than importing the MCP
  // module graph. These are the same four forms, asserted against the
  // function `apicity mcp` uses, so the restatement cannot drift.
  const env: NodeJS.ProcessEnv = {
    APICITY_TOKEN_VAR: "resolved-token",
  };

  for (const form of [
    "literal-token",
    "env:APICITY_TOKEN_VAR",
    "$APICITY_TOKEN_VAR",
    "APICITY_TOKEN_VAR",
  ]) {
    it(`resolves ${form} exactly as apicity mcp does`, () => {
      expect(resolveServiceToken(form, env)).toBe(
        resolveOpServiceToken(form, env)
      );
    });
  }

  it("is undefined when nothing names a token", () => {
    expect(resolveServiceToken(undefined, env)).toBeUndefined();
  });

  it("reports an env reference that is not set", () => {
    expect(() => resolveServiceToken("env:NOT_SET", env)).toThrow(
      /NOT_SET is not set/
    );
  });
});

describe("no credential value is ever printed", () => {
  it("keeps it out of providers --json and commands --json", async () => {
    const providers = capture();
    const commands = capture();
    const env: NodeJS.ProcessEnv = { HOME: sandbox(), OPENAI_API_KEY: SECRET };

    await runProviders(providers.writer, { json: true, env });
    await runCommands(commands.writer, {
      json: true,
      provider: "openai",
      env,
    });

    expect(providers.out.join("\n")).toContain("OPENAI_API_KEY");
    expect(providers.out.join("\n")).not.toContain(SECRET);
    expect(commands.out.join("\n")).not.toContain(SECRET);
    // `doctor --json` joins this assertion in W5, on the same fixture.
  });

  it("keeps it out of a failing call's envelope", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      ["v1.embeddings", "--data", '{"model":"m","input":"hi"}'],
      cap.writer,
      {
        env: { HOME: sandbox(), OPENAI_API_KEY: SECRET },
        stdoutIsTTY: false,
        instantiate: () =>
          Promise.resolve({
            post: {
              v1: {
                embeddings: () => {
                  throw Object.assign(new Error("upstream said no"), {
                    status: 500,
                  });
                },
              },
            },
          } as InstantiatedProvider),
      }
    );

    expect(exit).toBe(7);
    expect([...cap.out, ...cap.err].join("\n")).not.toContain(SECRET);
  });

  it("keeps it out of a --verbose log line (D-7)", () => {
    const lines: string[] = [];
    const host = {
      fetch: (): Promise<Response> =>
        Promise.resolve(new Response("{}", { status: 201 })),
    } as unknown as { fetch: typeof globalThis.fetch };
    const restore = installVerboseFetch((line) => lines.push(line), host);

    try {
      return host
        .fetch("https://api.openai.test/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${SECRET}` },
          body: JSON.stringify({ input: SECRET }),
        })
        .then(() => {
          expect(lines).toHaveLength(1);
          expect(lines[0]).toContain("[apicity] POST");
          expect(lines[0]).toContain("https://api.openai.test/v1/embeddings");
          expect(lines[0]).toContain("→ 201");
          expect(lines[0]).toMatch(/\(\d+ ms\)/);
          expect(lines[0]).not.toContain(SECRET);
          expect(lines[0]).not.toContain("Authorization");
        });
    } finally {
      restore();
    }
  });

  it("logs a failed request by error name and restores the original fetch", async () => {
    const lines: string[] = [];
    const original = (): Promise<Response> =>
      Promise.reject(new TypeError("fetch failed"));
    const host = { fetch: original } as unknown as {
      fetch: typeof globalThis.fetch;
    };
    const restore = installVerboseFetch((line) => lines.push(line), host);

    await expect(
      host.fetch("https://api.openai.test/v1/embeddings")
    ).rejects.toThrow("fetch failed");
    restore();

    expect(lines[0]).toContain("→ TypeError");
    expect(host.fetch).toBe(original);
  });
});

// AC-17's half for this slice: nothing in the CLI prompts, and the call path
// reads stdin only through `--data -`.
describe("non-interactive (REQ-018)", () => {
  it("has no prompt library anywhere under packages/cli/src", async () => {
    const { execFile } = await import("node:child_process");
    const found = await new Promise<string>((resolve) => {
      execFile(
        "grep",
        ["-rn", "-e", "readline", "-e", "prompts", "packages/cli/src"],
        (_error, stdout) => resolve(stdout)
      );
    });

    expect(found.trim()).toBe("");
  });
});
