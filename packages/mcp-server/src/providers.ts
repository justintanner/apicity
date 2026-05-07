// Map provider name (matches column 1 of scripts/endpoint-docs.tsv) to the
// metadata needed to instantiate it: which env var holds the credential, what
// option key the factory expects, and the dynamic-import specifier.
//
// Keeping factory imports dynamic means a missing provider package doesn't
// crash the server — that provider just gets skipped.

export interface ProviderSpec {
  envVar: string;
  optionKey: "apiKey" | "accessToken";
  importPath: string;
  factoryName: string;
}

export const PROVIDERS: Record<string, ProviderSpec> = {
  openai: {
    envVar: "OPENAI_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/openai",
    factoryName: "openai",
  },
  xai: {
    envVar: "XAI_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/xai",
    factoryName: "xai",
  },
  anthropic: {
    envVar: "ANTHROPIC_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/anthropic",
    factoryName: "anthropic",
  },
  fireworks: {
    envVar: "FIREWORKS_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/fireworks",
    factoryName: "fireworks",
  },
  fal: {
    envVar: "FAL_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/fal",
    factoryName: "fal",
  },
  kie: {
    envVar: "KIE_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/kie",
    factoryName: "kie",
  },
  kimicoding: {
    envVar: "KIMI_CODING_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/kimicoding",
    factoryName: "kimicoding",
  },
  alibaba: {
    envVar: "DASHSCOPE_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/alibaba",
    factoryName: "alibaba",
  },
  elevenlabs: {
    envVar: "ELEVENLABS_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/elevenlabs",
    factoryName: "elevenlabs",
  },
  x: {
    envVar: "X_ACCESS_TOKEN",
    optionKey: "accessToken",
    importPath: "@apicity/x",
    factoryName: "x",
  },
  meta: {
    envVar: "IG_ACCESS_TOKEN",
    optionKey: "accessToken",
    importPath: "@apicity/meta",
    factoryName: "meta",
  },
  // free needs no credential — handled specially in registry.ts
  "free-media-upload": {
    envVar: "",
    optionKey: "apiKey",
    importPath: "@apicity/free-media-upload",
    factoryName: "freeMediaUpload",
  },
};

export type InstantiatedProvider = Record<string, unknown>;

export async function instantiateProvider(
  name: string,
  spec: ProviderSpec
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
  if (!credential) return null;
  return (factory as (opts: Record<string, unknown>) => InstantiatedProvider)({
    [spec.optionKey]: credential,
  });
}
