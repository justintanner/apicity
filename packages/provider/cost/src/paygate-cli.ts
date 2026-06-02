#!/usr/bin/env node
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { canonicalHash } from "./paygate.js";

/**
 * Encode a buffer to unpadded base64url.
 */
function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Parse a TTL string like "10m", "1h", "30s" into seconds.
 */
export function parseTtl(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(
      `Invalid TTL format: ${ttl}. Expected format like 10m, 1h, 30s.`
    );
  }
  const value = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unknown TTL unit: ${unit}`);
  }
}

/**
 * Mint an OTP for a specific request.
 *
 * Requires `APICITY_PAYGATE_PRIVATE_KEY_PATH` to point to an Ed25519 private key PEM.
 */
export function mintOtp(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  maxSpendUsd: number,
  ttlSeconds: number
): string {
  const privateKeyPath = process.env.APICITY_PAYGATE_PRIVATE_KEY_PATH;
  if (!privateKeyPath) {
    throw new Error(
      "APICITY_PAYGATE_PRIVATE_KEY_PATH is not set. " +
        "Export the path to your Ed25519 private key PEM."
    );
  }

  const privateKeyPem = readFileSync(privateKeyPath, "utf8");

  const jti = randomBytes(16).toString("hex");
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;

  const payloadObj = {
    v: 1 as const,
    jti,
    provider,
    method,
    dotPath,
    requestHash: canonicalHash(payload),
    maxSpendUsd,
    iat,
    exp,
  };

  const payloadJson = JSON.stringify(payloadObj);
  const payloadSegment = base64urlEncode(Buffer.from(payloadJson, "utf8"));

  const signature = sign(
    null,
    Buffer.from(payloadSegment, "utf8"),
    privateKeyPem
  );

  const signatureSegment = base64urlEncode(signature);

  return `${payloadSegment}.${signatureSegment}`;
}

/**
 * Generate a fresh Ed25519 key pair for the pay gate.
 */
export function generateKeyPair(): {
  publicKeyPem: string;
  privateKeyPem: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

interface MintArgs {
  provider: string;
  method: string;
  dotPath: string;
  payloadFile: string;
  maxSpend: number;
  ttl: string;
}

function parseMintArgs(argv: string[]): MintArgs {
  const out: Partial<MintArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--provider") out.provider = argv[++i];
    else if (a.startsWith("--provider=")) out.provider = a.slice(11);
    else if (a === "--method") out.method = argv[++i];
    else if (a.startsWith("--method=")) out.method = a.slice(9);
    else if (a === "--dot-path") out.dotPath = argv[++i];
    else if (a.startsWith("--dot-path=")) out.dotPath = a.slice(11);
    else if (a === "--payload-file") out.payloadFile = argv[++i];
    else if (a.startsWith("--payload-file=")) out.payloadFile = a.slice(15);
    else if (a === "--max-spend") out.maxSpend = parseFloat(argv[++i]!);
    else if (a.startsWith("--max-spend="))
      out.maxSpend = parseFloat(a.slice(12));
    else if (a === "--ttl") out.ttl = argv[++i];
    else if (a.startsWith("--ttl=")) out.ttl = a.slice(6);
    else {
      console.error(`[apicity-paygate] unknown arg: ${a}`);
    }
  }

  const required: (keyof MintArgs)[] = [
    "provider",
    "method",
    "dotPath",
    "payloadFile",
    "maxSpend",
    "ttl",
  ];
  for (const key of required) {
    if (out[key] === undefined || out[key] === null) {
      throw new Error(
        `Missing required argument: --${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
      );
    }
  }

  return out as MintArgs;
}

function printHelp(): void {
  console.error(
    [
      "apicity-paygate — Mint OTPs for paid @apicity endpoints.",
      "",
      "Usage:",
      "  apicity-paygate otp mint \\",
      "    --provider <provider> \\",
      "    --method <HTTP method> \\",
      "    --dot-path <api.path> \\",
      "    --payload-file <path> \\",
      "    --max-spend <usd> \\",
      "    --ttl <duration>",
      "",
      "Options:",
      "  --provider     Provider name (e.g. kie, openai, xai)",
      "  --method       HTTP method (e.g. POST, GET)",
      "  --dot-path     API dot-path (e.g. api.v1.jobs.createTask)",
      "  --payload-file Path to JSON request payload file",
      "  --max-spend    Maximum spend in USD",
      "  --ttl          Time-to-live: 10m, 1h, 30s, 1d",
      "",
      "Environment:",
      "  APICITY_PAYGATE_PRIVATE_KEY_PATH  Path to Ed25519 private key PEM",
    ].join("\n")
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  if (argv[0] !== "otp" || argv[1] !== "mint") {
    console.error("[apicity-paygate] only 'otp mint' is supported.");
    printHelp();
    process.exit(1);
  }

  const args = parseMintArgs(argv.slice(2));
  const payload = JSON.parse(readFileSync(args.payloadFile, "utf8")) as Record<
    string,
    unknown
  >;
  const ttlSeconds = parseTtl(args.ttl);
  const otp = mintOtp(
    args.provider,
    args.method,
    args.dotPath,
    payload,
    args.maxSpend,
    ttlSeconds
  );
  console.log(otp);
}
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(
      "[apicity-paygate] fatal:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  });
}
