import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import {
  loadEnvFile,
  parseEnvFile,
} from "../../packages/mcp-server/src/env-file";
import { fillOnePasswordEnv } from "../../packages/mcp-server/src/one-password";
import {
  instantiateProvider,
  polymarketOptionsFromEnv,
  POLYMARKET_ENV_VARS,
  PROVIDERS,
} from "../../packages/mcp-server/src/providers";

const dir = mkdtempSync(join(tmpdir(), "apicity-env-file-"));

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function writeEnvFile(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

describe("parseEnvFile", () => {
  it("parses KEY=VALUE lines and skips comments and blanks", () => {
    expect(
      parseEnvFile(
        [
          "# providers",
          "",
          "OPENAI_API_KEY=sk-openai",
          "  XAI_API_KEY = xai-key  ",
          "not-an-assignment",
          "=no-key",
        ].join("\n")
      )
    ).toEqual([
      ["OPENAI_API_KEY", "sk-openai"],
      ["XAI_API_KEY", "xai-key"],
    ]);
  });

  it("strips one pair of matching quotes", () => {
    expect(
      parseEnvFile(
        [
          'OPENAI_API_KEY="sk-openai"',
          "XAI_API_KEY='xai-key'",
          "ANTHROPIC_API_KEY=\"mismatched'",
        ].join("\n")
      )
    ).toEqual([
      ["OPENAI_API_KEY", "sk-openai"],
      ["XAI_API_KEY", "xai-key"],
      ["ANTHROPIC_API_KEY", "\"mismatched'"],
    ]);
  });
});

describe("loadEnvFile", () => {
  it("fills env vars from the file", () => {
    const path = writeEnvFile(
      "fill.env",
      "OPENAI_API_KEY=sk-openai\nXAI_API_KEY=xai-key\n"
    );
    const env: NodeJS.ProcessEnv = {};
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBe("sk-openai");
    expect(env.XAI_API_KEY).toBe("xai-key");
  });

  it("does not overwrite env vars that are already set", () => {
    const path = writeEnvFile("no-clobber.env", "OPENAI_API_KEY=from-file\n");
    const env: NodeJS.ProcessEnv = { OPENAI_API_KEY: "existing" };
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBe("existing");
  });

  it("skips op:// reference values", () => {
    const path = writeEnvFile(
      "op-refs.env",
      [
        "OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password",
        "XAI_API_KEY=xai-key",
      ].join("\n")
    );
    const env: NodeJS.ProcessEnv = {};
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.XAI_API_KEY).toBe("xai-key");
  });

  it("overwrites env vars holding unresolved op:// references", () => {
    const path = writeEnvFile("resolve-refs.env", "OPENAI_API_KEY=sk-real\n");
    const env: NodeJS.ProcessEnv = {
      OPENAI_API_KEY: "op://Apicity/OPENAI_API_KEY/password",
    };
    loadEnvFile(path, env);
    expect(env.OPENAI_API_KEY).toBe("sk-real");
  });

  it("errors clearly on a missing file", () => {
    const missing = join(dir, "missing.env");
    expect(() => loadEnvFile(missing, {})).toThrow(
      `--env-file ${missing} could not be read:`
    );
  });
});

describe("Polymarket public signature configuration", () => {
  it.each(["0", "1", "2", "3"])(
    "passes supported signature type %s through as a number",
    (signatureType) => {
      expect(
        polymarketOptionsFromEnv({
          POLYMARKET_SIGNATURE_TYPE: signatureType,
        }).clobSignatureType
      ).toBe(Number(signatureType));
    }
  );

  it.each(["03", "3 ", "4"])(
    "rejects unsupported signature type %j without echoing it",
    (signatureType) => {
      expect(() =>
        polymarketOptionsFromEnv({
          POLYMARKET_CLOB_API_KEY: "test-placeholder",
          POLYMARKET_SIGNATURE_TYPE: signatureType,
        })
      ).toThrow("POLYMARKET_SIGNATURE_TYPE must be one of 0, 1, 2, or 3.");
    }
  );

  it("requires the public signature type when any credential is present", () => {
    expect(() =>
      polymarketOptionsFromEnv({
        POLYMARKET_CLOB_API_KEY: "test-placeholder",
      })
    ).toThrow(
      "POLYMARKET_SIGNATURE_TYPE is required when Polymarket credentials " +
        "are configured."
    );
  });

  it("preserves an env-file literal while 1Password fills credentials", async () => {
    const path = writeEnvFile(
      "polymarket-combined.env",
      "POLYMARKET_SIGNATURE_TYPE=3\n"
    );
    const env: NodeJS.ProcessEnv = {};
    const readSecret = vi.fn(async () => "test-placeholder");

    loadEnvFile(path, env);
    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "test-token",
      enabledProviders: ["polymarket"],
      env,
      readSecret,
    });

    expect(env.POLYMARKET_SIGNATURE_TYPE).toBe("3");
    expect(polymarketOptionsFromEnv(env).clobSignatureType).toBe(3);
    expect(readSecret).toHaveBeenCalledTimes(POLYMARKET_ENV_VARS.length);
    expect(readSecret).not.toHaveBeenCalledWith(
      "op://Apicity/POLYMARKET_SIGNATURE_TYPE/password"
    );
  });

  it("preserves a launcher literal while 1Password fills credentials", async () => {
    const env: NodeJS.ProcessEnv = {
      POLYMARKET_SIGNATURE_TYPE: "2",
    };
    const readSecret = vi.fn(async () => "test-placeholder");

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "test-token",
      enabledProviders: ["polymarket"],
      env,
      readSecret,
    });

    expect(env.POLYMARKET_SIGNATURE_TYPE).toBe("2");
    expect(polymarketOptionsFromEnv(env).clobSignatureType).toBe(2);
    expect(readSecret).toHaveBeenCalledTimes(POLYMARKET_ENV_VARS.length);
    expect(readSecret).not.toHaveBeenCalledWith(
      "op://Apicity/POLYMARKET_SIGNATURE_TYPE/password"
    );
  });

  it("constructs a credential-free read-only provider", async () => {
    for (const envVar of [
      ...POLYMARKET_ENV_VARS,
      "POLYMARKET_SIGNATURE_TYPE",
    ]) {
      vi.stubEnv(envVar, "");
    }

    await expect(
      instantiateProvider("polymarket", PROVIDERS.polymarket)
    ).resolves.not.toBeNull();
  });
});
