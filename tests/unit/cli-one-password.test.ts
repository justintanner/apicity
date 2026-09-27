import { describe, expect, it, vi, type Mock } from "vitest";

import {
  fillOnePasswordEnv,
  getProviderEnvVars,
  onePasswordRef,
  type OpInject,
  type OpListItemTitles,
  type OpRead,
} from "../../packages/cli/src/one-password";
import { PROVIDERS } from "../../packages/cli/src/providers";
import { injectionRequests, renderInjection } from "./cli-one-password-helpers";

// Moved from `mcp-cli.test.ts` when the MCP server was removed; what stays
// here covers `packages/cli/src/one-password.ts`. The flag-parser cases went
// with the server's own module.
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

  it("returns all required B2 env vars", () => {
    expect(getProviderEnvVars(["b2"])).toEqual([
      "B2_ACCESS_KEY_ID",
      "B2_SECRET_ACCESS_KEY",
      "B2_REGION",
    ]);
  });

  it("resolves only Polymarket's secret-backed credential bundle", () => {
    expect(getProviderEnvVars(["polymarket"])).toEqual([
      "POLYMARKET_CLOB_API_KEY",
      "POLYMARKET_CLOB_API_SECRET",
      "POLYMARKET_CLOB_API_PASSPHRASE",
      "POLYMARKET_ADDRESS",
      "POLYMARKET_PRIVATE_KEY",
      "POLYMARKET_FUNDER_ADDRESS",
    ]);
    expect(getProviderEnvVars(["polymarket"])).not.toContain(
      "POLYMARKET_SIGNATURE_TYPE"
    );
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
      return renderInjection(
        template,
        "OPENAI_API_KEY=openai-secret\nXAI_API_KEY=xai-secret"
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
    const injectSecrets = vi.fn(async (template: string) =>
      renderInjection(template, "OPENAI_API_KEY=openai-secret")
    );

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
      throw Object.assign(new Error("item could not be found"), {
        stderr: "item could not be found",
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
      throw Object.assign(new Error("item could not be found"), {
        stderr: "item could not be found",
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

// ac-rdvquu: the vault convention fails a call on an item the vault lacks
// only when the addressed provider's credential is required. Every provider
// is in exactly one class, so a provider added to one list and not the other
// fails the census below instead of reaching a user as exit 3.
const OPTIONAL = ["polymarket", "simplefunctions", "thesportsdb", "youtube"];
const KEYLESS = ["binance", "free-media-upload", "openf1", "openligadb"];
const REQUIRED = Object.keys(PROVIDERS)
  .filter((name) => !OPTIONAL.includes(name) && !KEYLESS.includes(name))
  .sort();

function emptyVault(): {
  listItemTitles: Mock<OpListItemTitles>;
  injectSecrets: Mock<OpInject>;
} {
  return {
    listItemTitles: vi.fn<OpListItemTitles>(async () => []),
    injectSecrets: vi.fn<OpInject>(async () => ""),
  };
}

describe("the vault convention by provider class", () => {
  it("puts every provider in exactly one class", () => {
    expect(REQUIRED).toHaveLength(20);
    expect(Object.keys(PROVIDERS)).toHaveLength(
      REQUIRED.length + OPTIONAL.length + KEYLESS.length
    );
    for (const name of [...REQUIRED, ...OPTIONAL]) {
      expect(getProviderEnvVars([name]), name).not.toEqual([]);
    }
    for (const name of KEYLESS) {
      expect(getProviderEnvVars([name]), name).toEqual([]);
    }
  });

  it("fails a credential-required provider on its first absent item", async () => {
    for (const name of REQUIRED) {
      const [first] = getProviderEnvVars([name]);
      const vault = emptyVault();
      await expect(
        fillOnePasswordEnv({
          vault: "Apicity",
          serviceAccountToken: "op-token",
          enabledProviders: [name],
          env: {},
          ...vault,
        }),
        name
      ).rejects.toThrow(
        `Missing 1Password secret for ${first}. Expected ` +
          `op://Apicity/${first}/password.`
      );
      expect(vault.injectSecrets, name).not.toHaveBeenCalled();
    }
  });

  it("skips a credential-optional provider's absent items", async () => {
    for (const name of [...OPTIONAL, ...KEYLESS]) {
      const env: NodeJS.ProcessEnv = {};
      const vault = emptyVault();
      await fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: [name],
        env,
        ...vault,
      });
      expect(env, name).toEqual({});
      expect(vault.injectSecrets, name).not.toHaveBeenCalled();
    }
  });

  it.each([
    "1Password CLI `op` was not found in PATH.",
    "vault not found",
    "network endpoint does not exist",
  ])(
    "does not treat infrastructure failure as an optional missing item: %s",
    async (message) => {
      await expect(
        fillOnePasswordEnv({
          vault: "Apicity",
          serviceAccountToken: "op-token",
          enabledProviders: ["thesportsdb"],
          env: {},
          readSecret: async () => {
            throw new Error(message);
          },
        })
      ).rejects.toThrow(message);
    }
  );

  it.each([
    "item could not be found",
    "item not found",
    "field does not exist",
    '"KEY" isn\'t an item in the vault',
  ])("allows an optional missing item: %s", async (message) => {
    const env = {};
    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["thesportsdb"],
      env,
      readSecret: async () => {
        throw new Error(message);
      },
    });
    expect(env).toEqual({});
  });

  it("resolves the optional items the vault has, and only those", async () => {
    const env: NodeJS.ProcessEnv = {};
    const listItemTitles = vi.fn(async () => [
      "POLYMARKET_CLOB_API_KEY",
      "POLYMARKET_CLOB_API_SECRET",
    ]);
    const injectSecrets = vi.fn(async (template: string) => {
      expect(injectionRequests(template).split("\n")).toEqual([
        "POLYMARKET_CLOB_API_KEY={{ op://Apicity/POLYMARKET_CLOB_API_KEY/password }}",
        "POLYMARKET_CLOB_API_SECRET={{ op://Apicity/POLYMARKET_CLOB_API_SECRET/password }}",
      ]);
      return renderInjection(
        template,
        "POLYMARKET_CLOB_API_KEY=key\nPOLYMARKET_CLOB_API_SECRET=secret"
      );
    });

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["polymarket"],
      env,
      listItemTitles,
      injectSecrets,
    });

    expect(env).toEqual({
      POLYMARKET_CLOB_API_KEY: "key",
      POLYMARKET_CLOB_API_SECRET: "secret",
    });
    expect(injectSecrets).toHaveBeenCalledOnce();
  });

  it("skips an optional item that resolves to no value", async () => {
    const env: NodeJS.ProcessEnv = {};
    const injectSecrets = vi.fn<OpInject>(async (template) =>
      renderInjection(template, "YOUTUBE_ACCESS_TOKEN=")
    );

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["youtube"],
      env,
      listItemTitles: async () => ["YOUTUBE_ACCESS_TOKEN"],
      injectSecrets,
    });

    expect(env).toEqual({});
    expect(injectSecrets).toHaveBeenCalledOnce();
  });

  it("fails a required item that resolves to no value", async () => {
    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["openai"],
        env: {},
        listItemTitles: async () => ["OPENAI_API_KEY"],
        injectSecrets: async (template) =>
          renderInjection(template, "OPENAI_API_KEY="),
      })
    ).rejects.toThrow(
      "Missing 1Password secret for OPENAI_API_KEY. Expected " +
        "op://Apicity/OPENAI_API_KEY/password."
    );
  });

  it("keeps a multi-variable required provider whole", async () => {
    const injectSecrets = vi.fn(async () => "");

    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["s3"],
        env: {},
        listItemTitles: async () => ["S3_ACCESS_KEY_ID"],
        injectSecrets,
      })
    ).rejects.toThrow(
      "Missing 1Password secret for S3_SECRET_ACCESS_KEY. Expected " +
        "op://Apicity/S3_SECRET_ACCESS_KEY/password."
    );
    expect(injectSecrets).not.toHaveBeenCalled();
  });

  it("decides per provider when one fill names several", async () => {
    const env: NodeJS.ProcessEnv = {};

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["openai", "youtube"],
      env,
      listItemTitles: async () => ["OPENAI_API_KEY"],
      injectSecrets: async (template) =>
        renderInjection(template, "OPENAI_API_KEY=openai-secret"),
    });
    expect(env).toEqual({ OPENAI_API_KEY: "openai-secret" });

    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["openai", "youtube"],
        env: {},
        listItemTitles: async () => ["YOUTUBE_ACCESS_TOKEN"],
        injectSecrets: async () => "YOUTUBE_ACCESS_TOKEN=token",
      })
    ).rejects.toThrow("Missing 1Password secret for OPENAI_API_KEY.");
  });

  it("still fails an optional provider when op itself fails", async () => {
    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["thesportsdb"],
        env: {},
        listItemTitles: async () => {
          throw new Error("You are not currently signed in.");
        },
        injectSecrets: async () => "",
      })
    ).rejects.toThrow("You are not currently signed in.");

    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["youtube"],
        env: {},
        listItemTitles: async () => ["YOUTUBE_ACCESS_TOKEN"],
        injectSecrets: async () => {
          throw new Error("op inject: vault access denied");
        },
      })
    ).rejects.toThrow("op inject: vault access denied");
  });

  it("applies the same classes to per-variable reads", async () => {
    const notFound = async (): Promise<string> => {
      throw Object.assign(new Error("item could not be found"), {
        stderr: "item could not be found",
      });
    };
    const env: NodeJS.ProcessEnv = {};

    await fillOnePasswordEnv({
      vault: "Apicity",
      serviceAccountToken: "op-token",
      enabledProviders: ["simplefunctions"],
      env,
      readSecret: notFound,
    });
    expect(env).toEqual({});

    await expect(
      fillOnePasswordEnv({
        vault: "Apicity",
        serviceAccountToken: "op-token",
        enabledProviders: ["xai"],
        env: {},
        readSecret: notFound,
      })
    ).rejects.toThrow("Missing 1Password secret for XAI_API_KEY.");
  });
});
