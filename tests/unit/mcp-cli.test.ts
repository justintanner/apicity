import { describe, expect, it, vi } from "vitest";

import {
  parseArgs,
  resolveOpServiceToken,
  resolveOpVault,
  resolveOutputDir,
  resolveRequiredOnePasswordOptions,
} from "../../packages/mcp-server/src/cli";
import {
  fillOnePasswordEnv,
  getProviderEnvVars,
  onePasswordRef,
  type OpRead,
} from "../../packages/mcp-server/src/one-password";

describe("apicity-mcp CLI parsing", () => {
  it("parses 1Password, provider, output, and paygate flags", () => {
    expect(
      parseArgs([
        "--op-vault",
        "Apicity",
        "--op-service-token",
        "env:OP_SERVICE_TOKEN",
        "--providers",
        "openai,xai",
        "--output-dir",
        "/tmp/out",
        "--paygate-secret-file",
        "/tmp/secret",
      ])
    ).toEqual({
      help: false,
      opVault: "Apicity",
      opServiceToken: "env:OP_SERVICE_TOKEN",
      enabledProviders: ["openai", "xai"],
      outputDir: "/tmp/out",
      paygateSecretFile: "/tmp/secret",
    });
  });

  it("parses equals-style flags", () => {
    expect(
      parseArgs([
        "--op-vault=Apicity",
        "--op-service-token=op-token",
        "--providers=openai, anthropic",
        "--output-dir=/tmp/out",
        "--paygate-secret-file=/tmp/secret",
      ])
    ).toEqual({
      help: false,
      opVault: "Apicity",
      opServiceToken: "op-token",
      enabledProviders: ["openai", "anthropic"],
      outputDir: "/tmp/out",
      paygateSecretFile: "/tmp/secret",
    });
  });

  it("rejects unknown flags", () => {
    expect(() => parseArgs(["--op-vualt", "Apicity"])).toThrow(
      "unknown arg: --op-vualt"
    );
  });
});

describe("apicity-mcp output directory", () => {
  it("uses an explicit output directory first", () => {
    expect(
      resolveOutputDir("/explicit", { CLAUDE_PROJECT_DIR: "/project" }, "/cwd")
    ).toBe("/explicit");
  });

  it("defaults to CLAUDE_PROJECT_DIR", () => {
    expect(
      resolveOutputDir(undefined, { CLAUDE_PROJECT_DIR: "/project" }, "/cwd")
    ).toBe("/project");
  });

  it("falls back to the current directory", () => {
    expect(resolveOutputDir(undefined, {}, "/cwd")).toBe("/cwd");
  });
});

describe("apicity-mcp 1Password options", () => {
  it("uses an explicit vault before APICITY_OP_VAULT", () => {
    expect(resolveOpVault("Explicit", { APICITY_OP_VAULT: "EnvVault" })).toBe(
      "Explicit"
    );
  });

  it("falls back to APICITY_OP_VAULT", () => {
    expect(resolveOpVault(undefined, { APICITY_OP_VAULT: "EnvVault" })).toBe(
      "EnvVault"
    );
  });

  it("uses an explicit service token before APICITY_OP_SERVICE_TOKEN", () => {
    expect(
      resolveOpServiceToken("explicit-token", {
        APICITY_OP_SERVICE_TOKEN: "env-token",
      })
    ).toBe("explicit-token");
  });

  it("falls back to APICITY_OP_SERVICE_TOKEN", () => {
    expect(
      resolveOpServiceToken(undefined, {
        APICITY_OP_SERVICE_TOKEN: "env-token",
      })
    ).toBe("env-token");
  });

  it("resolves service token env references", () => {
    const env = { OP_SERVICE_TOKEN: "resolved-token" };
    expect(resolveOpServiceToken("env:OP_SERVICE_TOKEN", env)).toBe(
      "resolved-token"
    );
    expect(resolveOpServiceToken("$OP_SERVICE_TOKEN", env)).toBe(
      "resolved-token"
    );
    expect(resolveOpServiceToken("OP_SERVICE_TOKEN", env)).toBe(
      "resolved-token"
    );
  });

  it("requires a vault and service token together", () => {
    expect(() => resolveRequiredOnePasswordOptions({}, {})).toThrow(
      "--op-vault is required."
    );
    expect(() =>
      resolveRequiredOnePasswordOptions({ opVault: "Apicity" }, {})
    ).toThrow("--op-service-token is required.");
    expect(
      resolveRequiredOnePasswordOptions(
        {},
        {
          APICITY_OP_VAULT: "Apicity",
          APICITY_OP_SERVICE_TOKEN: "op-token",
        }
      )
    ).toEqual({
      vault: "Apicity",
      serviceAccountToken: "op-token",
    });
  });
});

describe("1Password credential resolution", () => {
  it("builds expected 1Password secret references", () => {
    expect(onePasswordRef("Apicity", "OPENAI_API_KEY")).toBe(
      "op://Apicity/OPENAI_API_KEY/password"
    );
  });

  it("returns env vars for requested providers", () => {
    expect(getProviderEnvVars(["openai", "xai", "free-media-upload"])).toEqual([
      "OPENAI_API_KEY",
      "XAI_API_KEY",
    ]);
  });

  it("rejects unknown providers", () => {
    expect(() => getProviderEnvVars(["openai", "missing"])).toThrow(
      "Unknown provider in --providers: missing"
    );
  });

  it("fills missing provider env vars from 1Password", async () => {
    const env: NodeJS.ProcessEnv = {};
    const readSecret: OpRead = vi.fn(async (ref) => `secret:${ref}`);

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["openai", "xai"],
      env,
      readSecret,
    });

    expect(env.OPENAI_API_KEY).toBe(
      "secret:op://Apicity/OPENAI_API_KEY/password"
    );
    expect(env.XAI_API_KEY).toBe("secret:op://Apicity/XAI_API_KEY/password");
    expect(readSecret).toHaveBeenCalledTimes(2);
  });

  it("batch resolves existing vault items with one inject call", async () => {
    const env: NodeJS.ProcessEnv = {};
    const listItemTitles = vi.fn(async () => ["OPENAI_API_KEY", "XAI_API_KEY"]);
    const injectSecrets = vi.fn(async (template: string) => {
      expect(template).toContain(
        "OPENAI_API_KEY={{ op://Apicity/OPENAI_API_KEY/password }}"
      );
      expect(template).toContain(
        "XAI_API_KEY={{ op://Apicity/XAI_API_KEY/password }}"
      );
      return ["OPENAI_API_KEY=openai-secret", "XAI_API_KEY=xai-secret"].join(
        "\n"
      );
    });

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["openai", "xai"],
      env,
      listItemTitles,
      injectSecrets,
    });

    expect(env.OPENAI_API_KEY).toBe("openai-secret");
    expect(env.XAI_API_KEY).toBe("xai-secret");
    expect(listItemTitles).toHaveBeenCalledWith("Apicity");
    expect(injectSecrets).toHaveBeenCalledTimes(1);
  });

  it("skips absent vault items when providers are not explicit", async () => {
    const env: NodeJS.ProcessEnv = {};
    const listItemTitles = vi.fn(async () => ["OPENAI_API_KEY"]);
    const injectSecrets = vi.fn(async () => "OPENAI_API_KEY=openai-secret");

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      env,
      listItemTitles,
      injectSecrets,
    });

    expect(env.OPENAI_API_KEY).toBe("openai-secret");
    expect(env.XAI_API_KEY).toBeUndefined();
    expect(injectSecrets).toHaveBeenCalledOnce();
  });

  it("fails when a requested provider item is absent from the vault list", async () => {
    const env: NodeJS.ProcessEnv = {};
    const listItemTitles = vi.fn(async () => []);
    const injectSecrets = vi.fn(async () => "");

    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["openai"],
        env,
        listItemTitles,
        injectSecrets,
      })
    ).rejects.toThrow(
      "Missing 1Password secret for OPENAI_API_KEY. Expected op://Apicity/OPENAI_API_KEY/password."
    );
    expect(injectSecrets).not.toHaveBeenCalled();
  });

  it("reads missing provider env vars concurrently", async () => {
    const env: NodeJS.ProcessEnv = {};
    const started: string[] = [];
    let resolveAllStarted: () => void = () => undefined;
    let releaseReads: () => void = () => undefined;
    const allStarted = new Promise<void>((resolve) => {
      resolveAllStarted = resolve;
    });
    const readRelease = new Promise<void>((resolve) => {
      releaseReads = resolve;
    });
    const readSecret: OpRead = vi.fn(async (ref) => {
      started.push(ref);
      if (started.length === 4) resolveAllStarted();
      await readRelease;
      return `secret:${ref}`;
    });

    const fill = fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["openai", "xai", "anthropic", "fireworks"],
      env,
      readSecret,
      concurrency: 4,
    });

    await Promise.race([
      allStarted,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("1Password reads did not start in parallel")),
          100
        )
      ),
    ]);
    expect(started).toHaveLength(4);

    releaseReads();
    await fill;

    expect(env.OPENAI_API_KEY).toBe(
      "secret:op://Apicity/OPENAI_API_KEY/password"
    );
    expect(env.XAI_API_KEY).toBe("secret:op://Apicity/XAI_API_KEY/password");
    expect(env.ANTHROPIC_API_KEY).toBe(
      "secret:op://Apicity/ANTHROPIC_API_KEY/password"
    );
    expect(env.FIREWORKS_API_KEY).toBe(
      "secret:op://Apicity/FIREWORKS_API_KEY/password"
    );
  });

  it("does not overwrite resolved env vars", async () => {
    const env: NodeJS.ProcessEnv = {
      OPENAI_API_KEY: "existing",
    };
    const readSecret: OpRead = vi.fn(async (ref) => `secret:${ref}`);

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["openai", "xai"],
      env,
      readSecret,
    });

    expect(env.OPENAI_API_KEY).toBe("existing");
    expect(env.XAI_API_KEY).toBe("secret:op://Apicity/XAI_API_KEY/password");
    expect(readSecret).toHaveBeenCalledOnce();
  });

  it("skips missing vault items when providers are not explicitly requested", async () => {
    const env: NodeJS.ProcessEnv = {};
    const readSecret: OpRead = vi.fn(async (ref) => {
      if (ref.includes("OPENAI_API_KEY")) return "openai-secret";
      throw Object.assign(new Error("could not be found"), {
        stderr: "could not be found",
      });
    });

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      env,
      readSecret,
    });

    expect(env.OPENAI_API_KEY).toBe("openai-secret");
    expect(env.XAI_API_KEY).toBeUndefined();
  });

  it("fails when a requested provider secret is missing", async () => {
    const env: NodeJS.ProcessEnv = {};
    const readSecret: OpRead = vi.fn(async () => {
      throw Object.assign(new Error("could not be found"), {
        stderr: "could not be found",
      });
    });

    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["openai"],
        env,
        readSecret,
      })
    ).rejects.toThrow(
      "Missing 1Password secret for OPENAI_API_KEY. Expected op://Apicity/OPENAI_API_KEY/password."
    );
  });
});
