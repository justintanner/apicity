import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  isProviderConfigured,
  providerEnvVars,
  resolveCredentials,
} from "../../packages/cli/src/credentials";
import { getProviderEnvVars } from "../../packages/cli/src/one-password";
import { polymarketOptionsFromEnv } from "../../packages/cli/src/providers";
import { injectionRequests, renderInjection } from "./cli-one-password-helpers";

const homes: string[] = [];
function context(contents = "") {
  const home = mkdtempSync(join(tmpdir(), "apicity-settings-"));
  homes.push(home);
  const path = join(home, "settings.env");
  writeFileSync(path, contents);
  return { env: { HOME: home } as NodeJS.ProcessEnv, flags: { envFile: path } };
}
afterEach(() => {
  for (const home of homes.splice(0))
    rmSync(home, { recursive: true, force: true });
});

const settings = [
  ["s3", "S3_REGION", "eu-west-1"],
  ["s3", "S3_ENDPOINT", "https://s3.example.test"],
  ["b2", "B2_ENDPOINT", "https://b2.example.test"],
  ["polymarket", "POLYMARKET_SIGNATURE_TYPE", "2"],
] as const;

describe.each(settings)("%s setting %s", (provider, name, value) => {
  it.each(["file", "process"])("resolves a %s reference", async (source) => {
    const reference = "op://Settings/item/field";
    const ctx = context(source === "file" ? `${name}=${reference}\n` : "");
    if (source === "process") ctx.env[name] = reference;
    const calls: string[] = [];
    await resolveCredentials({
      provider,
      ...ctx,
      injectSecrets: async (template) => {
        calls.push(injectionRequests(template));
        return renderInjection(template, `${name}=${value}\n`);
      },
    });
    expect(calls).toEqual([`${name}={{ ${reference} }}`]);
    expect(ctx.env[name]).toBe(value);
    if (provider === "polymarket") {
      expect(polymarketOptionsFromEnv(ctx.env).clobSignatureType).toBe(2);
    }
  });

  it("keeps a process literal ahead of a file reference", async () => {
    const ctx = context(`${name}=op://Settings/item/field\n`);
    ctx.env[name] = value;
    await resolveCredentials({
      provider,
      ...ctx,
      injectSecrets: async () => {
        throw new Error("unexpected op call");
      },
    });
    expect(ctx.env[name]).toBe(value);
  });

  it("does not export unresolved file references on failure", async () => {
    const ctx = context(`${name}=op://Settings/item/field\n`);
    await expect(
      resolveCredentials({
        provider,
        ...ctx,
        injectSecrets: async () => {
          throw new Error("synthetic failure");
        },
      })
    ).rejects.toMatchObject({ code: "auth" });
    expect(ctx.env[name]).toBeUndefined();
  });

  it("prefers a process reference over a file reference", async () => {
    const ctx = context(`${name}=op://Settings/file/field\n`);
    ctx.env[name] = "op://Settings/process/field";
    await resolveCredentials({
      provider,
      ...ctx,
      injectSecrets: async (template) => {
        expect(injectionRequests(template)).toBe(
          `${name}={{ op://Settings/process/field }}`
        );
        return renderInjection(template, `${name}=${value}\n`);
      },
    });
    expect(ctx.env[name]).toBe(value);
  });

  it("lets a file literal replace a process reference, like credentials", async () => {
    const ctx = context(`${name}=${value}\n`);
    ctx.env[name] = "op://Settings/process/field";
    await resolveCredentials({
      provider,
      ...ctx,
      injectSecrets: async () => {
        throw new Error("unexpected op call");
      },
    });
    expect(ctx.env[name]).toBe(value);
  });
});

it("batches credentials and settings once, only for the addressed provider", async () => {
  const names = [
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_REGION",
    "S3_ENDPOINT",
  ];
  const ignored = [
    "B2_ENDPOINT",
    "POLYMARKET_SIGNATURE_TYPE",
    "FIREWORKS_ACCOUNT_ID",
    "XAI_MANAGEMENT_API_KEY",
  ];
  const ctx = context(
    [...names, ...ignored]
      .map((name) => `${name}=op://V/${name}/value`)
      .join("\n")
  );
  const calls: string[] = [];
  await resolveCredentials({
    provider: "s3",
    ...ctx,
    injectSecrets: async (template) => {
      calls.push(injectionRequests(template));
      return renderInjection(
        template,
        names.map((name) => `${name}=resolved-${name}`).join("\n")
      );
    },
  });
  expect(calls).toEqual([
    names.map((name) => `${name}={{ op://V/${name}/value }}`).join("\n"),
  ]);
  for (const name of names) expect(ctx.env[name]).toBe(`resolved-${name}`);
  for (const name of ignored) expect(ctx.env[name]).toBeUndefined();
});

it("does not add settings to required credentials or vault-convention lookup", async () => {
  const ctx = context();
  ctx.env.S3_ACCESS_KEY_ID = "id";
  ctx.env.S3_SECRET_ACCESS_KEY = "secret";
  ctx.env.APICITY_OP_VAULT = "V";
  ctx.env.APICITY_OP_SERVICE_TOKEN = "synthetic-token";
  expect(isProviderConfigured("s3", ctx.env)).toBe(true);
  expect(isProviderConfigured("polymarket", {})).toBe(true);
  expect(isProviderConfigured("s3", { S3_REGION: "eu-west-1" })).toBe(false);
  expect(
    isProviderConfigured("b2", {
      B2_ACCESS_KEY_ID: "id",
      B2_SECRET_ACCESS_KEY: "secret",
      B2_REGION: "us-west-004",
    })
  ).toBe(true);
  for (const [provider, name] of settings) {
    expect(providerEnvVars(provider)).not.toContain(name);
    expect(getProviderEnvVars()).not.toContain(name);
  }
  await resolveCredentials({
    provider: "s3",
    ...ctx,
    listItemTitles: async () => {
      throw new Error("unexpected vault lookup");
    },
    injectSecrets: async () => {
      throw new Error("unexpected op call");
    },
  });
  expect(ctx.env.S3_REGION).toBeUndefined();
  expect(ctx.env.S3_ENDPOINT).toBeUndefined();
});

it.each([
  ["fireworks", "FIREWORKS_ACCOUNT_ID"],
  ["xai", "XAI_MANAGEMENT_API_KEY"],
])("does not introduce a new %s input", async (provider, name) => {
  const ctx = context(`${name}=op://V/item/field\n`);
  await resolveCredentials({
    provider,
    ...ctx,
    injectSecrets: async () => {
      throw new Error("unexpected op call");
    },
  });
  expect(ctx.env[name]).toBeUndefined();
});
