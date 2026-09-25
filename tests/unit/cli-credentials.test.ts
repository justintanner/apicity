import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { runDoctor, type DoctorRow } from "../../packages/cli/src/doctor";
import { createWriter, type CliWriter } from "../../packages/cli/src/envelope";
import {
  defaultEnvFilePath,
  resolveCredentials,
  resolveServiceToken,
} from "../../packages/cli/src/credentials";
import { runCommands, runProviders } from "../../packages/cli/src/discovery";
import { CliError } from "../../packages/cli/src/errors";
import {
  runEndpoint,
  runMain,
  type ProviderInstantiator,
} from "../../packages/cli/src/main";
import {
  injectOnePasswordSecrets,
  type OpInject,
} from "../../packages/cli/src/one-password";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";
import { runSetupCommand } from "../../packages/cli/src/setup";
import type {
  SubprocessResult,
  SubprocessRunner,
} from "../../packages/cli/src/subprocess";
import { installVerboseFetch } from "../../packages/cli/src/verbose";

// AC-05: credential precedence, the single-provider rule for a call, and the
// invariant that matters most — a credential value never reaches stdout, an
// envelope, or a log line. Nothing here spawns `op`: the 1Password read is
// injected through the same seam `resolveCredentials` exposes.

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

interface Injection {
  template: string;
  token?: string;
}

/**
 * A recording `op inject` seam. Every test that can reach reference resolution
 * passes one (ac-w7vzap A-4): on a host with `op` signed in, an un-seamed
 * resolution would authenticate as the real service account.
 */
function injectSeam(answer: string | Error): {
  injectSecrets: OpInject;
  calls: Injection[];
} {
  const calls: Injection[] = [];
  const injectSecrets: OpInject = (template, token) => {
    calls.push({ template, token });
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer);
  };
  return { injectSecrets, calls };
}

/** A fireworks provider whose one GET the tests call. */
function fireworks(list: () => Promise<unknown>): InstantiatedProvider {
  return {
    get: { inference: { v1: { accounts: { list } } } },
  } as InstantiatedProvider;
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

  it("resolves an env-file op:// reference ahead of the vault convention", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const reads: string[] = [];
    const listings: string[] = [];
    const { injectSecrets, calls } = injectSeam(
      "FIREWORKS_API_KEY=from-reference\n"
    );

    await resolveCredentials({
      provider: "fireworks",
      flags: {
        // The item title is not the variable name, which the vault
        // convention could never reach.
        envFile: envFile(
          "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password\n"
        ),
        opVault: "Apicity",
        opToken: "ops_token",
      },
      env,
      readSecret: (ref) => {
        reads.push(ref);
        return Promise.resolve("unused");
      },
      listItemTitles: (vault) => {
        listings.push(vault);
        return Promise.resolve([]);
      },
      injectSecrets,
    });

    expect(calls).toEqual([
      {
        template:
          "FIREWORKS_API_KEY={{ op://Apicity/FIREWORKS_AI_API_KEY/password }}",
        token: "ops_token",
      },
    ]);
    expect(calls[0].template).not.toContain(
      "op://Apicity/FIREWORKS_API_KEY/password"
    );
    expect(reads).toEqual([]);
    expect(listings).toEqual([]);
    expect(env.FIREWORKS_API_KEY).toBe("from-reference");

    // With no reference the convention answers, through the batch a real
    // call takes (no readSecret): one listing, then one inject that carries
    // the token, since the seam no longer closes over it (F-8).
    const conventionEnv: NodeJS.ProcessEnv = { HOME: sandbox() };
    const convention = injectSeam("OPENAI_API_KEY=from-convention\n");
    await resolveCredentials({
      provider: "openai",
      flags: { opVault: "Apicity", opToken: "ops_token" },
      env: conventionEnv,
      listItemTitles: (vault) => {
        listings.push(vault);
        return Promise.resolve(["OPENAI_API_KEY"]);
      },
      injectSecrets: convention.injectSecrets,
    });
    expect(listings).toEqual(["Apicity"]);
    expect(convention.calls).toEqual([
      {
        template: "OPENAI_API_KEY={{ op://Apicity/OPENAI_API_KEY/password }}",
        token: "ops_token",
      },
    ]);
    expect(conventionEnv.OPENAI_API_KEY).toBe("from-convention");
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

// ac-w7vzap REQ-016: `op://` references resolve for the addressed provider, in
// one `op inject`, through the seam. None of these spawns `op`.
describe("op:// references", () => {
  it("resolve with op's own sign-in when no vault or token is set", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const { injectSecrets, calls } = injectSeam(
      "FIREWORKS_API_KEY=from-reference\n"
    );

    await resolveCredentials({
      provider: "fireworks",
      flags: {
        envFile: envFile(
          "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password\n"
        ),
      },
      env,
      injectSecrets,
    });

    expect(calls).toEqual([
      {
        template:
          "FIREWORKS_API_KEY={{ op://Apicity/FIREWORKS_AI_API_KEY/password }}",
        token: undefined,
      },
    ]);
    expect(env.FIREWORKS_API_KEY).toBe("from-reference");
  });

  it("resolve a mixed file: literals as today, references in the batch", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const { injectSecrets, calls } = injectSeam(
      "S3_SECRET_ACCESS_KEY=secret-from-reference\n"
    );

    await resolveCredentials({
      provider: "s3",
      flags: {
        envFile: envFile(
          [
            "S3_ACCESS_KEY_ID=AKIA-literal",
            "S3_SECRET_ACCESS_KEY=op://Apicity/s3/secret",
            "OPENAI_API_KEY=sk-literal",
          ].join("\n")
        ),
      },
      env,
      injectSecrets,
    });

    expect(calls.map((call) => call.template)).toEqual([
      "S3_SECRET_ACCESS_KEY={{ op://Apicity/s3/secret }}",
    ]);
    expect(env.S3_ACCESS_KEY_ID).toBe("AKIA-literal");
    expect(env.S3_SECRET_ACCESS_KEY).toBe("secret-from-reference");
    // Literals keep today's meaning: every one is loaded, addressed or not.
    expect(env.OPENAI_API_KEY).toBe("sk-literal");
  });

  it("resolve a reference exported in the process environment", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      OPENAI_API_KEY: "op://Apicity/openai/credential",
      // REQ-016 step 3: the process's reference goes ahead of the env file's,
      // so the batch below never carries this one.
      APICITY_ENV_FILE: envFile(
        "OPENAI_API_KEY=op://Apicity/openai/file-credential\n"
      ),
    };
    const { injectSecrets, calls } = injectSeam(
      "OPENAI_API_KEY=from-reference\n"
    );

    await resolveCredentials({ provider: "openai", env, injectSecrets });

    expect(calls.map((call) => call.template)).toEqual([
      "OPENAI_API_KEY={{ op://Apicity/openai/credential }}",
    ]);
    expect(env.OPENAI_API_KEY).toBe("from-reference");
  });

  it("accept a token without a vault, and hand it to op", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      APICITY_OP_SERVICE_TOKEN: "env:T",
      T: "ops_token_from_T",
      OPENAI_API_KEY: "op://Apicity/openai/credential",
    };
    const { injectSecrets, calls } = injectSeam(
      "OPENAI_API_KEY=from-reference\n"
    );

    await expect(
      resolveCredentials({ provider: "openai", env, injectSecrets })
    ).resolves.toBeUndefined();

    expect(calls).toHaveLength(1);
    expect(calls[0].token).toBe("ops_token_from_T");
    expect(env.OPENAI_API_KEY).toBe("from-reference");
  });

  it("run nothing for a token alone when no reference needs it", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      APICITY_OP_SERVICE_TOKEN: "ops_token",
    };
    const { injectSecrets, calls } = injectSeam("unused");

    await expect(
      resolveCredentials({ provider: "openai", env, injectSecrets })
    ).resolves.toBeUndefined();
    expect(calls).toEqual([]);
  });

  it("resolve all of a call's references in one batch", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const { injectSecrets, calls } = injectSeam(
      "S3_ACCESS_KEY_ID=id-from-reference\n" +
        "S3_SECRET_ACCESS_KEY=secret-from-reference\n"
    );

    await resolveCredentials({
      provider: "s3",
      flags: {
        envFile: envFile(
          "S3_ACCESS_KEY_ID=op://Apicity/s3/id\n" +
            "S3_SECRET_ACCESS_KEY=op://Apicity/s3/secret\n"
        ),
      },
      env,
      injectSecrets,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].template.split("\n")).toEqual([
      "S3_ACCESS_KEY_ID={{ op://Apicity/s3/id }}",
      "S3_SECRET_ACCESS_KEY={{ op://Apicity/s3/secret }}",
    ]);
    expect(env.S3_ACCESS_KEY_ID).toBe("id-from-reference");
    expect(env.S3_SECRET_ACCESS_KEY).toBe("secret-from-reference");
  });

  it("neither batch nor export another provider's references, or S3_REGION", async () => {
    const env: NodeJS.ProcessEnv = { HOME: sandbox() };
    const { injectSecrets, calls } = injectSeam(
      "S3_ACCESS_KEY_ID=id-from-reference\n"
    );

    await resolveCredentials({
      provider: "s3",
      flags: {
        envFile: envFile(
          [
            "S3_ACCESS_KEY_ID=op://Apicity/s3/id",
            "S3_SECRET_ACCESS_KEY=secret-literal",
            "S3_REGION=op://Apicity/s3/region",
            "OPENAI_API_KEY=op://Apicity/openai/credential",
          ].join("\n")
        ),
      },
      env,
      injectSecrets,
    });

    expect(calls.map((call) => call.template)).toEqual([
      "S3_ACCESS_KEY_ID={{ op://Apicity/s3/id }}",
    ]);
    // ac-w7vzap OQ-003: a setting outside the provider's variables stays unset,
    // so the s3 factory falls back to its default region rather than "op://…".
    expect(env.S3_REGION).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it("let an env-file literal beat a process reference, with no op run", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      OPENAI_API_KEY: "op://V/I/F",
    };
    const { injectSecrets, calls } = injectSeam("unused");

    await resolveCredentials({
      provider: "openai",
      flags: { envFile: envFile("OPENAI_API_KEY=sk-lit\n") },
      env,
      injectSecrets,
    });

    expect(calls).toEqual([]);
    expect(env.OPENAI_API_KEY).toBe("sk-lit");
  });

  it("let a process literal beat an env-file reference, with no op run", async () => {
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      OPENAI_API_KEY: "sk-process",
    };
    const { injectSecrets, calls } = injectSeam("unused");

    await resolveCredentials({
      provider: "openai",
      flags: { envFile: envFile("OPENAI_API_KEY=op://V/I/F\n") },
      env,
      injectSecrets,
    });

    expect(calls).toEqual([]);
    expect(env.OPENAI_API_KEY).toBe("sk-process");
  });

  it("report a failed resolution as auth (exit 3), naming the variable and the reference", async () => {
    const token = "ops_SENTINEL_reference_token";
    const cap = capture();
    const instantiated: string[] = [];
    const { injectSecrets } = injectSeam(
      new Error(`[ERROR] could not read secret; token ${token} was rejected`)
    );

    const exit = await runEndpoint(
      "fireworks",
      ["inference.v1.accounts.list"],
      cap.writer,
      {
        env: {
          HOME: sandbox(),
          APICITY_OP_SERVICE_TOKEN: token,
          APICITY_ENV_FILE: envFile(
            "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password\n"
          ),
        },
        stdoutIsTTY: false,
        injectSecrets,
        instantiate: (name) => {
          instantiated.push(name);
          return Promise.resolve(null);
        },
      }
    );

    expect(exit).toBe(3);
    expect(instantiated).toEqual([]);
    const envelope = JSON.parse(cap.err[0]) as Record<string, unknown>;
    expect(envelope.code).toBe("auth");
    expect(String(envelope.error)).toContain("FIREWORKS_API_KEY");
    expect(String(envelope.error)).toContain(
      "op://Apicity/FIREWORKS_AI_API_KEY/password"
    );
    expect(envelope.hint).toBe(
      "check the op:// reference and op's sign-in; see apicity doctor"
    );
    expect([...cap.out, ...cap.err].join("\n")).not.toContain(token);

    // `op inject` can also exit 0 and leave the variable empty: the same auth
    // error, naming the variable and the reference, before any provider.
    const empty = capture();
    const emptyExit = await runEndpoint(
      "fireworks",
      ["inference.v1.accounts.list"],
      empty.writer,
      {
        env: {
          HOME: sandbox(),
          APICITY_ENV_FILE: envFile(
            "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password\n"
          ),
        },
        stdoutIsTTY: false,
        injectSecrets: injectSeam("FIREWORKS_API_KEY=\n").injectSecrets,
        instantiate: (name) => {
          instantiated.push(name);
          return Promise.resolve(null);
        },
      }
    );
    expect(emptyExit).toBe(3);
    expect(instantiated).toEqual([]);
    const emptyEnvelope = JSON.parse(empty.err[0]) as Record<string, unknown>;
    expect(emptyEnvelope.code).toBe("auth");
    expect(String(emptyEnvelope.error)).toContain(
      "FIREWORKS_API_KEY from op://Apicity/FIREWORKS_AI_API_KEY/password"
    );
  });

  // The seam above stands in for this function. It spawns `op`, so a fake
  // takes its place on PATH: one that accepts only `inject --in-file <file>`
  // and resolves whatever template that file holds. A template on stdin cannot
  // work on Linux, where a child's stdin is a socket that `op inject` refuses
  // both as `--in-file /dev/stdin` and as plain stdin.
  it("hand op inject its template in a private file, with the token only in its environment", async () => {
    const dir = mkdtempSync(join(tmpdir(), "apicity-fake-op-"));
    writeFileSync(
      join(dir, "op"),
      [
        "#!/bin/sh",
        'if [ "$#" -ne 3 ] || [ "$1" != inject ] || [ "$2" != --in-file ] ||',
        '  [ ! -f "$3" ]; then',
        '  echo "unexpected argv: $*" >&2',
        "  exit 9",
        "fi",
        "sed 's/{{ [^}]* }}/from-fake-op/' \"$3\"",
        "echo",
        'echo "MODE=$(ls -l "$3" | cut -c1-10)"',
        'echo "FILE=$3"',
        '[ "$OP_SERVICE_ACCOUNT_TOKEN" = ops_fake_token ] && echo TOKEN=env',
        "",
      ].join("\n"),
      { mode: 0o755 }
    );
    vi.stubEnv("PATH", `${dir}${delimiter}${process.env.PATH ?? ""}`);

    try {
      const out = await injectOnePasswordSecrets(
        "FIREWORKS_API_KEY={{ op://Apicity/FIREWORKS_AI_API_KEY/password }}",
        4000,
        "ops_fake_token"
      );
      const lines = out.trimEnd().split("\n");

      expect(lines[0]).toBe("FIREWORKS_API_KEY=from-fake-op");
      expect(lines[1]).toBe("MODE=-rw-------");
      expect(lines[3]).toBe("TOKEN=env");
      // The template file is gone once `op` has answered.
      const file = lines[2].replace(/^FILE=/, "");
      expect(file).not.toContain("ops_fake_token");
      expect(existsSync(file)).toBe(false);
    } finally {
      vi.unstubAllEnvs();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuse a malformed reference before anything runs", async () => {
    for (const [name, env] of [
      [
        "an inject delimiter",
        {
          APICITY_ENV_FILE: envFile(
            "FIREWORKS_API_KEY=op://Apicity/{{ x }}/password\n"
          ),
        },
      ],
      [
        "a line break",
        { FIREWORKS_API_KEY: "op://Apicity/FIREWORKS\nKIE_API_KEY=x/password" },
      ],
    ] as const) {
      const cap = capture();
      const { injectSecrets, calls } = injectSeam("unused");

      const exit = await runEndpoint(
        "fireworks",
        ["inference.v1.accounts.list"],
        cap.writer,
        {
          env: { HOME: sandbox(), ...env },
          stdoutIsTTY: false,
          injectSecrets,
          instantiate: () => Promise.resolve(null),
        }
      );

      expect(exit, name).toBe(3);
      expect(calls, name).toEqual([]);
      const envelope = JSON.parse(cap.err[0]) as Record<string, unknown>;
      expect(String(envelope.error), name).toContain(
        "FIREWORKS_API_KEY holds a malformed op:// reference"
      );
    }
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
  // `credentials.ts` is the only implementation of the four forms since the
  // server this CLI replaced was removed, so each form is pinned to the value
  // that implementation resolves rather than compared with a second one.
  const env: NodeJS.ProcessEnv = {
    APICITY_TOKEN_VAR: "resolved-token",
  };

  for (const [form, expected] of [
    ["literal-token", "literal-token"],
    ["env:APICITY_TOKEN_VAR", "resolved-token"],
    ["$APICITY_TOKEN_VAR", "resolved-token"],
    ["APICITY_TOKEN_VAR", "resolved-token"],
  ] as const) {
    it(`resolves ${form}`, () => {
      expect(resolveServiceToken(form, env)).toBe(expected);
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

// ac-w7vzap REQ-022: the paths it adds or changes print no credential either.
describe("no credential value is ever printed, 1Password edition", () => {
  const TOKEN = "ops_SENTINEL_literal_token";

  function probe(result: Partial<SubprocessResult>): SubprocessRunner {
    return () =>
      Promise.resolve({
        code: 0,
        stdout: "[]",
        stderr: "",
        timedOut: false,
        ...result,
      });
  }

  /** What the command prints for a failure: the envelope a pipe reads. */
  function printedFailure(err: unknown): string {
    const lines: string[] = [];
    createWriter({
      json: true,
      stdoutIsTTY: false,
      stdout: (text) => lines.push(text),
      stderr: (text) => lines.push(text),
    }).failure(err as CliError);
    return lines.join("\n");
  }

  it("keeps a literal setup 1password token out of every stream", async () => {
    const cap = capture();

    await expect(
      runMain(
        [
          "setup",
          "1password",
          "--op-vault",
          "Apicity",
          "--op-token",
          TOKEN,
          "--no-verify",
          "--json",
        ],
        cap.writer,
        { env: { HOME: sandbox(), PATH: "" }, stdoutIsTTY: false }
      )
    ).resolves.toBe(0);

    expect(cap.out.join("\n")).toContain("apicity setup 1password complete");
    expect([...cap.out, ...cap.err].join("\n")).not.toContain(TOKEN);
  });

  for (const [label, result, exit] of [
    ["verified", {}, 0],
    ["op missing", { code: 1, notFound: true, stderr: "spawn op ENOENT" }, 7],
    [
      "op rejecting the token",
      { code: 1, stderr: `[ERROR] 401 Unauthorized: token ${TOKEN}\n` },
      3,
    ],
    ["op timing out", { code: 1, timedOut: true }, 6],
  ] as const) {
    it(`keeps a literal setup 1password token out of the answer: ${label}`, async () => {
      const cap = capture();
      const argv = [
        "1password",
        "--op-vault",
        "Apicity",
        "--op-token",
        TOKEN,
        "--json",
      ];

      let printed: string;
      let status: number;
      try {
        status = await runSetupCommand(argv, cap.writer, {
          env: { HOME: sandbox(), PATH: "" },
          stdoutIsTTY: false,
          run: probe(result),
        });
        printed = [...cap.out, ...cap.err].join("\n");
      } catch (err) {
        status = (err as CliError).exit;
        printed = printedFailure(err);
      }

      expect(status).toBe(exit);
      expect(printed).not.toContain(TOKEN);
    });
  }

  it("keeps a literal env-file token out of doctor", async () => {
    const home = sandbox();
    mkdirSync(join(home, ".config", "apicity"), { recursive: true });
    writeFileSync(
      defaultEnvFilePath({ HOME: home }),
      `APICITY_OP_VAULT=Apicity\nAPICITY_OP_SERVICE_TOKEN=${TOKEN}\n`
    );
    const cap = capture();
    const tokens: Array<string | undefined> = [];
    const run: SubprocessRunner = (_command, args, options) => {
      tokens.push(options.env?.OP_SERVICE_ACCOUNT_TOKEN);
      return Promise.resolve(
        args[0] === "--version"
          ? { code: 0, stdout: "2.39.0\n", stderr: "", timedOut: false }
          : {
              code: 1,
              stdout: "",
              stderr: `[ERROR] token ${TOKEN} rejected`,
              timedOut: false,
            }
      );
    };

    await expect(
      runDoctor(["--json"], cap.writer, {
        home,
        env: { HOME: home, PATH: "" },
        stdoutIsTTY: false,
        run,
      })
    ).resolves.toBe(0);

    // The token reached the listing, as its environment and nowhere else.
    expect(tokens).toEqual([undefined, TOKEN]);
    const printed = cap.out.join("\n");
    expect(printed).not.toContain(TOKEN);
    const rows = (JSON.parse(printed) as { data: DoctorRow[] }).data;
    expect(rows.find((row) => row.name === "1Password CLI")?.message).toContain(
      "token from env file (literal)"
    );
  });

  it("keeps a resolved reference out of a success envelope and --verbose lines", async () => {
    const VALUE = "fw_SENTINEL_resolved_value";
    const cap = capture();
    const env: NodeJS.ProcessEnv = {
      HOME: sandbox(),
      APICITY_ENV_FILE: envFile(
        "FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password\n"
      ),
    };
    const host = {
      fetch: (): Promise<Response> =>
        Promise.resolve(new Response("{}", { status: 200 })),
    } as unknown as { fetch: typeof globalThis.fetch };
    let restore = (): void => undefined;

    const exit = await runEndpoint(
      "fireworks",
      ["inference.v1.accounts.list", "--verbose"],
      cap.writer,
      {
        env,
        stdoutIsTTY: false,
        injectSecrets: injectSeam(`FIREWORKS_API_KEY=${VALUE}\n`).injectSecrets,
        installVerbose: (log) => {
          restore = installVerboseFetch(log, host);
        },
        instantiate: () =>
          Promise.resolve(
            fireworks(async () => {
              await host.fetch("https://api.fireworks.test/v1/accounts", {
                headers: { Authorization: `Bearer ${env.FIREWORKS_API_KEY}` },
              });
              return { accounts: [] };
            })
          ),
      }
    );
    restore();

    expect(exit).toBe(0);
    expect(env.FIREWORKS_API_KEY).toBe(VALUE);
    expect(cap.err.some((line) => line.includes("[apicity] GET"))).toBe(true);
    expect([...cap.out, ...cap.err].join("\n")).not.toContain(VALUE);
  });

  it("keeps a resolved reference out of a failing call's envelope", async () => {
    const VALUE = "fw_SENTINEL_resolved_value";
    const cap = capture();

    const exit = await runEndpoint(
      "fireworks",
      ["inference.v1.accounts.list"],
      cap.writer,
      {
        env: {
          HOME: sandbox(),
          FIREWORKS_API_KEY: "op://Apicity/FIREWORKS_AI_API_KEY/password",
        },
        stdoutIsTTY: false,
        injectSecrets: injectSeam(`FIREWORKS_API_KEY=${VALUE}\n`).injectSecrets,
        instantiate: () =>
          Promise.resolve(
            fireworks(() => {
              throw Object.assign(new Error("upstream said no"), {
                status: 500,
              });
            })
          ),
      }
    );

    expect(exit).toBe(7);
    expect([...cap.out, ...cap.err].join("\n")).not.toContain(VALUE);
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
