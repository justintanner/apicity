// Map provider name (matches column 1 of scripts/endpoint-docs.tsv) to the
// metadata needed to instantiate it: which env var holds the credential, what
// option key the factory expects, and the dynamic-import specifier.
//
// Keeping factory imports dynamic means a missing provider package doesn't
// crash the server — that provider just gets skipped.

import { PAID_ENDPOINTS } from "@apicity/cost";

export interface ProviderSpec {
  envVar: string;
  optionKey: "apiKey" | "accessToken" | "botToken";
  importPath: string;
  factoryName: string;
}

/** Provider names that have at least one paid endpoint in the registry. */
const PROVIDERS_WITH_PAID_ENDPOINTS = new Set(
  PAID_ENDPOINTS.map((e) => e.key.provider)
);

export const PROVIDERS: Record<string, ProviderSpec> = {
  openai: {
    envVar: "OPENAI_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/openai",
    factoryName: "createOpenAi",
  },
  xai: {
    envVar: "XAI_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/xai",
    factoryName: "createXai",
  },
  anthropic: {
    envVar: "ANTHROPIC_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/anthropic",
    factoryName: "createAnthropic",
  },
  fireworks: {
    envVar: "FIREWORKS_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/fireworks",
    factoryName: "createFireworks",
  },
  fal: {
    envVar: "FAL_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/fal",
    factoryName: "createFal",
  },
  kie: {
    envVar: "KIE_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/kie",
    factoryName: "createKie",
  },
  kimicoding: {
    envVar: "KIMI_CODING_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/kimicoding",
    factoryName: "createKimiCoding",
  },
  alibaba: {
    envVar: "DASHSCOPE_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/alibaba",
    factoryName: "createAlibaba",
  },
  elevenlabs: {
    envVar: "ELEVENLABS_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/elevenlabs",
    factoryName: "createElevenLabs",
  },
  x: {
    envVar: "X_ACCESS_TOKEN",
    optionKey: "accessToken",
    importPath: "@apicity/x",
    factoryName: "createX",
  },
  meta: {
    envVar: "IG_ACCESS_TOKEN",
    optionKey: "accessToken",
    importPath: "@apicity/meta",
    factoryName: "createMeta",
  },
  // free needs no credential — handled specially in registry.ts
  "free-media-upload": {
    envVar: "",
    optionKey: "apiKey",
    importPath: "@apicity/free-media-upload",
    factoryName: "createFreeMediaUpload",
  },
  youtube: {
    envVar: "YOUTUBE_ACCESS_TOKEN",
    optionKey: "accessToken",
    importPath: "@apicity/youtube",
    factoryName: "createYouTube",
  },
  telegram: {
    envVar: "TELEGRAM_BOT_KEY",
    optionKey: "botToken",
    importPath: "@apicity/telegram",
    factoryName: "createTelegram",
  },
};

export type InstantiatedProvider = Record<string, unknown>;

export async function instantiateProvider(
  name: string,
  spec: ProviderSpec,
  paygateSecret?: string
): Promise<InstantiatedProvider | null> {
  const mod = (await import(spec.importPath)) as Record<string, unknown>;
  const factory = mod[spec.factoryName];
  if (typeof factory !== "function") {
    throw new Error(
      `Expected ${spec.importPath} to export function "${spec.factoryName}"`
    );
  }
  if (name === "free-media-upload") {
    return (factory as () => InstantiatedProvider)();
  }
  const credential = process.env[spec.envVar];
  if (!credential && name !== "youtube") return null;
  const opts: Record<string, unknown> = {};
  if (credential) opts[spec.optionKey] = credential;
  // The MCP server is the code client: it holds the shared secret to *verify*
  // OTPs, but never mints them. A human mints an OTP out-of-band and the caller
  // passes it as the tool's `otp` argument, so the AI cannot self-approve.
  if (paygateSecret && PROVIDERS_WITH_PAID_ENDPOINTS.has(name)) {
    opts.paygate = { secret: paygateSecret };
  }
  return (factory as (opts: Record<string, unknown>) => InstantiatedProvider)(
    opts
  );
}
