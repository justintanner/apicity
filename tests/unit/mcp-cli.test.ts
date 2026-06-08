import { describe, expect, it, vi } from "vitest";

import {
  parseArgs,
  resolveOpVault,
  resolveOutputDir,
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
      enabledProviders: ["openai", "xai"],
      outputDir: "/tmp/out",
      paygateSecretFile: "/tmp/secret",
    });
  });

  it("parses equals-style flags", () => {
    expect(
      parseArgs([
        "--op-vault=Apicity",
        "--providers=openai, anthropic",
        "--output-dir=/tmp/out",
        "--paygate-secret-file=/tmp/secret",
      ])
    ).toEqual({
      help: false,
      opVault: "Apicity",
      enabledProviders: ["openai", "anthropic"],
      outputDir: "/tmp/out",
      paygateSecretFile: "/tmp/secret",
    });
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

describe("apicity-mcp 1Password vault option", () => {
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
        enabledProviders: ["openai"],
        env,
        readSecret,
      })
    ).rejects.toThrow(
      "Missing 1Password secret for OPENAI_API_KEY. Expected op://Apicity/OPENAI_API_KEY/password."
    );
  });
});
