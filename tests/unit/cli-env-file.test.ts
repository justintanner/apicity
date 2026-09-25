import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import {
  envFileKey,
  envFileReferences,
  loadEnvFile,
  parseEnvFile,
  removeEnvFileAssignments,
  setEnvFileAssignments,
} from "../../packages/cli/src/env-file";
import { fillOnePasswordEnv } from "../../packages/cli/src/one-password";
import {
  instantiateProvider,
  polymarketOptionsFromEnv,
  POLYMARKET_ENV_VARS,
  PROVIDERS,
} from "../../packages/cli/src/providers";

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

  // ac-w7vzap OQ-004: `loadEnvFile` stays synchronous and never exports a
  // reference raw; `resolveCredentials` resolves the addressed provider's
  // references itself.
  it("leaves op:// references to the resolver", () => {
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

describe("envFileReferences", () => {
  it("collects op:// values only, first occurrence per variable", () => {
    expect(
      envFileReferences(
        parseEnvFile(
          [
            "OPENAI_API_KEY=op://Apicity/OPENAI/password",
            "XAI_API_KEY=xai-literal",
            "OPENAI_API_KEY=op://Other/OPENAI/password",
            "# FIREWORKS_API_KEY=op://Apicity/commented/password",
            'FIREWORKS_API_KEY="op://Apicity/FIREWORKS_AI_API_KEY/password"',
          ].join("\n")
        )
      )
    ).toEqual({
      OPENAI_API_KEY: "op://Apicity/OPENAI/password",
      FIREWORKS_API_KEY: "op://Apicity/FIREWORKS_AI_API_KEY/password",
    });
  });
});

// The line-preserving editor behind `apicity setup 1password` (ac-w7vzap
// REQ-013): it owns two keys and must leave every other byte of the file as
// it found it.
describe("the env-file editor", () => {
  const PAIR: Array<[string, string]> = [
    ["APICITY_OP_VAULT", "Apicity"],
    ["APICITY_OP_SERVICE_TOKEN", "env:OP_SERVICE_ACCOUNT_TOKEN"],
  ];

  it("keys a line exactly as parseEnvFile does", () => {
    expect(envFileKey("  KIE_API_KEY = abc ")).toBe("KIE_API_KEY");
    expect(envFileKey("# APICITY_OP_VAULT=Old")).toBeUndefined();
    expect(envFileKey("")).toBeUndefined();
    expect(envFileKey("=no-key")).toBeUndefined();
    expect(envFileKey("not-an-assignment")).toBeUndefined();
  });

  it("writes both lines into an empty file", () => {
    expect(setEnvFileAssignments("", PAIR)).toBe(
      "APICITY_OP_VAULT=Apicity\n" +
        "APICITY_OP_SERVICE_TOKEN=env:OP_SERVICE_ACCOUNT_TOKEN\n"
    );
  });

  it("replaces in place, appends what is missing, and keeps the rest", () => {
    expect(
      setEnvFileAssignments(
        "# mine\nKIE_API_KEY=abc\nAPICITY_OP_VAULT=Old\n\n# tail\n",
        PAIR
      )
    ).toBe(
      "# mine\nKIE_API_KEY=abc\nAPICITY_OP_VAULT=Apicity\n\n# tail\n" +
        "APICITY_OP_SERVICE_TOKEN=env:OP_SERVICE_ACCOUNT_TOKEN\n"
    );
  });

  it("removes a later duplicate of a key it sets", () => {
    expect(
      setEnvFileAssignments(
        "APICITY_OP_VAULT=Old\nKIE_API_KEY=abc\nAPICITY_OP_VAULT=Older\n",
        PAIR
      )
    ).toBe(
      "APICITY_OP_VAULT=Apicity\nKIE_API_KEY=abc\n" +
        "APICITY_OP_SERVICE_TOKEN=env:OP_SERVICE_ACCOUNT_TOKEN\n"
    );
  });

  it("never treats a comment as an assignment", () => {
    expect(setEnvFileAssignments("# APICITY_OP_VAULT=commented\n", PAIR)).toBe(
      "# APICITY_OP_VAULT=commented\nAPICITY_OP_VAULT=Apicity\n" +
        "APICITY_OP_SERVICE_TOKEN=env:OP_SERVICE_ACCOUNT_TOKEN\n"
    );
  });

  it("keeps a CRLF line's carriage return, and adds a missing final newline", () => {
    expect(
      setEnvFileAssignments(
        "KIE_API_KEY=abc\r\nAPICITY_OP_VAULT=Old\r\nX=1",
        PAIR
      )
    ).toBe(
      "KIE_API_KEY=abc\r\nAPICITY_OP_VAULT=Apicity\r\nX=1\n" +
        "APICITY_OP_SERVICE_TOKEN=env:OP_SERVICE_ACCOUNT_TOKEN\n"
    );
  });

  it("returns its own output unchanged on a second run", () => {
    const once = setEnvFileAssignments(
      "# mine\r\nKIE_API_KEY=abc\nAPICITY_OP_VAULT=Old",
      PAIR
    );
    expect(setEnvFileAssignments(once, PAIR)).toBe(once);
  });

  it("removes only the lines assigning the given keys", () => {
    expect(
      removeEnvFileAssignments(
        "# mine\nAPICITY_OP_SERVICE_TOKEN=t\nKIE_API_KEY=abc\n" +
          "APICITY_OP_VAULT=Apicity\nAPICITY_OP_SERVICE_TOKEN=again\n" +
          "# APICITY_OP_VAULT=kept\n",
        ["APICITY_OP_VAULT", "APICITY_OP_SERVICE_TOKEN"]
      )
    ).toEqual({
      content: "# mine\nKIE_API_KEY=abc\n# APICITY_OP_VAULT=kept\n",
      removed: ["APICITY_OP_SERVICE_TOKEN", "APICITY_OP_VAULT"],
    });
  });

  it("removes nothing from a file without the keys", () => {
    expect(
      removeEnvFileAssignments("KIE_API_KEY=abc", ["APICITY_OP_VAULT"])
    ).toEqual({ content: "KIE_API_KEY=abc", removed: [] });
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
