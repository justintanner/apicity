// Map provider name (matches column 1 of scripts/endpoint-docs.tsv) to the
// metadata needed to instantiate it: which env var holds the credential, what
// option key the factory expects, and the dynamic-import specifier.
//
// Keeping factory imports dynamic means a missing provider package doesn't
// crash the server — that provider just gets skipped.

import { loadCostHelpers } from "./cost.js";

export interface ProviderSpec {
  envVar: string;
  optionKey:
    | "apiKey"
    | "apiToken"
    | "accessKeyId"
    | "accessToken"
    | "botToken"
    | "oauthToken";
  importPath: string;
  factoryName: string;
  // Extra env vars (beyond `envVar`) this provider needs resolved from the
  // secret store. Used by providers like polymarket whose factory takes a
  // bundle of credentials rather than a single `optionKey` value.
  extraEnvVars?: string[];
}

// Polymarket's CLOB trading factory takes a credential bundle, not a single
// key. These names match both the `op://<vault>/<NAME>/password` references and
// the keys read in `instantiateProvider` below.
export const POLYMARKET_ENV_VARS = [
  "POLYMARKET_CLOB_API_KEY",
  "POLYMARKET_CLOB_API_SECRET",
  "POLYMARKET_CLOB_API_PASSPHRASE",
  "POLYMARKET_ADDRESS",
  "POLYMARKET_PRIVATE_KEY",
  "POLYMARKET_FUNDER_ADDRESS",
  "POLYMARKET_SIGNATURE_TYPE",
];

export const S3_ENV_VARS = ["S3_SECRET_ACCESS_KEY"];
export const B2_ENV_VARS = ["B2_SECRET_ACCESS_KEY", "B2_REGION"];

function polymarketOptionsFromEnv(): Record<string, unknown> {
  const signatureType = process.env.POLYMARKET_SIGNATURE_TYPE;
  return {
    clobApiKey: process.env.POLYMARKET_CLOB_API_KEY,
    clobApiSecret: process.env.POLYMARKET_CLOB_API_SECRET,
    clobApiPassphrase: process.env.POLYMARKET_CLOB_API_PASSPHRASE,
    clobAddress: process.env.POLYMARKET_ADDRESS,
    clobPrivateKey: process.env.POLYMARKET_PRIVATE_KEY,
    clobFunderAddress: process.env.POLYMARKET_FUNDER_ADDRESS,
    clobSignatureType: signatureType ? Number(signatureType) : undefined,
  };
}

let providersWithPaidEndpointsPromise: Promise<Set<string>> | undefined;

async function providerHasPaidEndpoint(name: string): Promise<boolean> {
  providersWithPaidEndpointsPromise ??= loadCostHelpers().then(
    ({ PAID_ENDPOINTS }) =>
      new Set(PAID_ENDPOINTS.map((entry) => entry.key.provider))
  );
  return (await providersWithPaidEndpointsPromise).has(name);
}

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
  google: {
    envVar: "GOOGLE_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/google",
    factoryName: "createGoogle",
  },
  googleflow: {
    envVar: "GOOGLE_FLOW_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/googleflow",
    factoryName: "createGoogleFlow",
  },
  dolthub: {
    envVar: "DOLTHUB_API_KEY",
    optionKey: "apiToken",
    importPath: "@apicity/dolthub",
    factoryName: "createDoltHub",
  },
  dropbox: {
    envVar: "DROPBOX_OAUTH_TOKEN",
    optionKey: "oauthToken",
    importPath: "@apicity/dropbox",
    factoryName: "createDropbox",
  },
  simplefunctions: {
    envVar: "SIMPLEFUNCTIONS_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/simplefunctions",
    factoryName: "createSimpleFunctions",
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
  zaicoding: {
    envVar: "ZAI_CODING_PLAN_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/zaicoding",
    factoryName: "createZaiCoding",
  },
  binance: {
    envVar: "",
    optionKey: "apiKey",
    importPath: "@apicity/binance",
    factoryName: "createBinance",
  },
  openligadb: {
    envVar: "",
    optionKey: "apiKey",
    importPath: "@apicity/openligadb",
    factoryName: "createOpenLigaDB",
  },
  openf1: {
    envVar: "",
    optionKey: "apiKey",
    importPath: "@apicity/openf1",
    factoryName: "createOpenF1",
  },
  elevenlabs: {
    envVar: "ELEVENLABS_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/elevenlabs",
    factoryName: "createElevenLabs",
  },
  s3: {
    envVar: "S3_ACCESS_KEY_ID",
    optionKey: "accessKeyId",
    importPath: "@apicity/s3",
    factoryName: "createS3",
    extraEnvVars: S3_ENV_VARS,
  },
  b2: {
    envVar: "B2_ACCESS_KEY_ID",
    optionKey: "accessKeyId",
    importPath: "@apicity/b2",
    factoryName: "createB2",
    extraEnvVars: B2_ENV_VARS,
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
  // Public Gamma/Data/CLOB market-data endpoints need no credential; the CLOB
  // trading/account endpoints use the bundle in `extraEnvVars`, resolved from
  // the secret store and passed to the factory in `instantiateProvider`.
  polymarket: {
    envVar: "",
    optionKey: "apiKey",
    importPath: "@apicity/polymarket",
    factoryName: "createPolymarket",
    extraEnvVars: POLYMARKET_ENV_VARS,
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
  quo: {
    envVar: "QUO_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/quo",
    factoryName: "createQuo",
  },
  thesportsdb: {
    envVar: "THESPORTSDB_API_KEY",
    optionKey: "apiKey",
    importPath: "@apicity/thesportsdb",
    factoryName: "createTheSportsDB",
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
  if (name === "polymarket") {
    // Always instantiate: read-only market data works with no creds, and the
    // trading endpoints pick up the wallet/credential bundle when present.
    return (factory as (opts: Record<string, unknown>) => InstantiatedProvider)(
      polymarketOptionsFromEnv()
    );
  }
  if (name === "s3") {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) return null;
    return (factory as (opts: Record<string, unknown>) => InstantiatedProvider)(
      {
        accessKeyId,
        secretAccessKey,
        region: process.env.S3_REGION ?? "us-east-1",
        endpoint: process.env.S3_ENDPOINT,
      }
    );
  }
  if (name === "b2") {
    const accessKeyId = process.env.B2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.B2_SECRET_ACCESS_KEY;
    const region = process.env.B2_REGION;
    if (!accessKeyId || !secretAccessKey || !region) return null;
    return (factory as (opts: Record<string, unknown>) => InstantiatedProvider)(
      {
        accessKeyId,
        secretAccessKey,
        region,
        endpoint: process.env.B2_ENDPOINT,
      }
    );
  }
  const credential = spec.envVar ? process.env[spec.envVar] : undefined;
  if (
    !credential &&
    spec.envVar &&
    name !== "youtube" &&
    name !== "simplefunctions" &&
    name !== "thesportsdb"
  ) {
    return null;
  }
  const opts: Record<string, unknown> = {};
  if (credential) opts[spec.optionKey] = credential;
  // The MCP server is the code client: it holds the shared secret to *verify*
  // OTPs, but never mints them. A human mints an OTP out-of-band and the caller
  // passes it as the tool's `otp` argument, so the AI cannot self-approve.
  if (paygateSecret && (await providerHasPaidEndpoint(name))) {
    opts.paygate = { secret: paygateSecret };
  }
  return (factory as (opts: Record<string, unknown>) => InstantiatedProvider)(
    opts
  );
}
