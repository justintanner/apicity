#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PAID_ENDPOINTS } from "./paid-endpoints.js";
import {
  grantDirectory,
  grantFileName,
  isGrantProviderName,
  mintGrant,
  verifyGrant,
} from "./paygate-grant.js";
import { mintOtp } from "./paygate.js";

/**
 * Operator CLI for minting OTPs and provider grants for paid @apicity endpoints.
 *
 * The shared HMAC secret is read from a file (`--secret-file`) — never from an
 * environment variable. The exported `mintOtp(secret, call)` and
 * `mintGrant(secret, options)` are the primary programmatic APIs; this CLI is
 * a thin wrapper.
 */

interface MintArgs {
  provider?: string;
  method?: string;
  dotPath: string;
  payloadFile?: string;
  requestHash?: `sha256:${string}`;
  secretFile: string;
  ttl?: string;
}

function parseMintArgs(argv: string[]): MintArgs {
  const out: Partial<MintArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--provider") out.provider = argv[++i];
    else if (a.startsWith("--provider=")) out.provider = a.slice(11);
    else if (a === "--method") out.method = argv[++i];
    else if (a.startsWith("--method=")) out.method = a.slice(9);
    else if (a === "--dot-path") out.dotPath = argv[++i];
    else if (a.startsWith("--dot-path=")) out.dotPath = a.slice(11);
    else if (a === "--payload-file") out.payloadFile = argv[++i];
    else if (a.startsWith("--payload-file=")) out.payloadFile = a.slice(15);
    else if (a === "--request-hash")
      out.requestHash = argv[++i] as `sha256:${string}` | undefined;
    else if (a.startsWith("--request-hash="))
      out.requestHash = a.slice(15) as `sha256:${string}`;
    else if (a === "--secret-file") out.secretFile = argv[++i];
    else if (a.startsWith("--secret-file=")) out.secretFile = a.slice(14);
    else if (a === "--ttl") out.ttl = argv[++i];
    else if (a.startsWith("--ttl=")) out.ttl = a.slice(6);
    else {
      console.error(`[apicity-paygate] unknown arg: ${a}`);
    }
  }

  const required: (keyof MintArgs)[] = ["dotPath", "secretFile"];
  for (const key of required) {
    if (out[key] === undefined || out[key] === null) {
      throw new Error(
        `Missing required argument: --${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
      );
    }
  }

  const hasPayload = out.payloadFile !== undefined;
  const hasHash = out.requestHash !== undefined;
  if (!hasPayload && !hasHash) {
    throw new Error(
      "Missing required argument: pass one of --payload-file or --request-hash"
    );
  }
  if (hasPayload && hasHash) {
    throw new Error("Pass either --payload-file or --request-hash, never both");
  }

  return out as MintArgs;
}

interface GrantMintArgs {
  provider: string;
  secretFile: string;
  ttl?: string;
  grantDir?: string;
}

interface GrantListArgs {
  secretFile: string;
  grantDir?: string;
}

interface GrantRevokeArgs {
  provider: string;
  grantDir?: string;
}

function readSecretFromFile(secretFile: string): string {
  const secret = readFileSync(secretFile, "utf8").trim();
  if (!secret) {
    throw new Error(`Secret file ${secretFile} is empty`);
  }
  return secret;
}

function parseGrantMintArgs(argv: string[]): GrantMintArgs {
  const out: Partial<GrantMintArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--provider") out.provider = argv[++i];
    else if (a.startsWith("--provider=")) out.provider = a.slice(11);
    else if (a === "--secret-file") out.secretFile = argv[++i];
    else if (a.startsWith("--secret-file=")) out.secretFile = a.slice(14);
    else if (a === "--ttl") out.ttl = argv[++i];
    else if (a.startsWith("--ttl=")) out.ttl = a.slice(6);
    else if (a === "--grant-dir") out.grantDir = argv[++i];
    else if (a.startsWith("--grant-dir=")) out.grantDir = a.slice(12);
    else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!out.secretFile) {
    throw new Error("Missing required argument: --secret-file");
  }
  if (!out.provider) {
    throw new Error("Missing required argument: --provider");
  }
  return out as GrantMintArgs;
}

function parseGrantListArgs(argv: string[]): GrantListArgs {
  const out: Partial<GrantListArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--secret-file") out.secretFile = argv[++i];
    else if (a.startsWith("--secret-file=")) out.secretFile = a.slice(14);
    else if (a === "--grant-dir") out.grantDir = argv[++i];
    else if (a.startsWith("--grant-dir=")) out.grantDir = a.slice(12);
    else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!out.secretFile) {
    throw new Error("Missing required argument: --secret-file");
  }
  return out as GrantListArgs;
}

function parseGrantRevokeArgs(argv: string[]): GrantRevokeArgs {
  const out: Partial<GrantRevokeArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--provider") out.provider = argv[++i];
    else if (a.startsWith("--provider=")) out.provider = a.slice(11);
    else if (a === "--grant-dir") out.grantDir = argv[++i];
    else if (a.startsWith("--grant-dir=")) out.grantDir = a.slice(12);
    else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!out.provider) {
    throw new Error("Missing required argument: --provider");
  }
  return out as GrantRevokeArgs;
}

function runGrantMint(argv: string[]): void {
  const args = parseGrantMintArgs(argv);
  if (!isGrantProviderName(args.provider)) {
    throw new Error(
      `Unknown provider "${args.provider}". Expected a known apicity provider name.`
    );
  }
  const secret = readSecretFromFile(args.secretFile);
  const token = mintGrant(secret, {
    provider: args.provider,
    ttl: args.ttl,
  });
  const verified = verifyGrant({
    token,
    secret,
    provider: args.provider,
  });
  if (!verified.ok) {
    throw new Error(
      `Freshly minted grant failed verification: ${verified.code}`
    );
  }
  const dir = args.grantDir ?? grantDirectory(process.env);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const target = join(dir, grantFileName(args.provider));
  const tmp = join(
    dir,
    `.${args.provider}.grant.${process.pid}.${randomBytes(6).toString("hex")}.tmp`
  );
  writeFileSync(tmp, `${token}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(tmp, 0o600);
  renameSync(tmp, target);

  const expiry = new Date(verified.payload.exp * 1000).toISOString();
  console.log(`id: ${verified.payload.jti}`);
  console.log(`expires: ${expiry}`);
  console.log(`path: ${target}`);

  const sdkCount = PAID_ENDPOINTS.filter(
    (entry) => entry.key.provider === args.provider
  ).length;
  if (sdkCount > 0) {
    console.log(
      `${sdkCount} endpoints are checked by the provider package and still need an OTP for each request.`
    );
  }
}

function runGrantList(argv: string[]): void {
  const args = parseGrantListArgs(argv);
  const secret = readSecretFromFile(args.secretFile);
  const dir = args.grantDir ?? grantDirectory(process.env);
  if (!existsSync(dir)) {
    return;
  }
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".grant"))
    .sort();
  const nowSeconds = Math.floor(Date.now() / 1000);
  for (const file of files) {
    const provider = file.slice(0, -".grant".length);
    const fullPath = join(dir, file);
    let raw: string;
    try {
      raw = readFileSync(fullPath, "utf8").trim();
    } catch {
      console.log(`${provider} (${fullPath}): grant-unreadable`);
      continue;
    }
    const verified = verifyGrant({
      token: raw,
      secret,
      provider,
      nowSeconds,
    });
    if (verified.ok) {
      const expiry = new Date(verified.payload.exp * 1000).toISOString();
      console.log(
        `${provider} (${fullPath}): valid until ${expiry} (id: ${verified.payload.jti})`
      );
    } else {
      console.log(`${provider} (${fullPath}): ${verified.code}`);
    }
  }
}

function runGrantRevoke(argv: string[]): void {
  const args = parseGrantRevokeArgs(argv);
  if (!isGrantProviderName(args.provider)) {
    throw new Error(
      `Unknown provider "${args.provider}". Expected a known apicity provider name.`
    );
  }
  const dir = args.grantDir ?? grantDirectory(process.env);
  const target = join(dir, grantFileName(args.provider));
  const existed = existsSync(target);
  rmSync(target, { force: true });
  console.log(
    existed ? `revoked: ${target}` : `no grant file present at ${target}`
  );
  console.log(
    "Note: any copy of the grant kept elsewhere stays valid until its expiry (24 hours at most)."
  );
  console.log(
    "Note: rotating to a new pay-gate secret voids every active grant and OTP immediately."
  );
}

function printHelp(): void {
  console.error(
    [
      "apicity-paygate — Mint OTPs and provider grants for paid @apicity endpoints.",
      "",
      "Usage:",
      "  apicity-paygate otp mint \\",
      "    --secret-file <path> \\",
      "    --dot-path <api.path> \\",
      "    --payload-file <path> | --request-hash <sha256:...> \\",
      "    [--provider <provider>] \\",
      "    [--method <HTTP method>] \\",
      "    [--ttl <duration>]",
      "",
      "  apicity-paygate grant mint \\",
      "    --secret-file <path> \\",
      "    --provider <provider> \\",
      "    [--ttl <duration>] \\",
      "    [--grant-dir <dir>]",
      "",
      "  apicity-paygate grant list \\",
      "    --secret-file <path> \\",
      "    [--grant-dir <dir>]",
      "",
      "  apicity-paygate grant revoke \\",
      "    --provider <provider> \\",
      "    [--grant-dir <dir>]",
      "",
      "Options:",
      "  --secret-file   Path to a file containing the shared HMAC secret",
      "  --dot-path      API dot-path (e.g. api.v1.jobs.createTask)",
      "  --payload-file  Path to JSON request payload file",
      "  --request-hash  Precomputed request hash (sha256:<64 hex chars>)",
      "  --provider      Provider name (required for grants; optional for OTPs)",
      "  --method        HTTP method (optional; resolved from the dot-path)",
      "  --ttl           Time-to-live: e.g. 10m (OTP default), 1h (grant default, 24h max)",
      "  --grant-dir     Grant directory (default $APICITY_PAYGATE_GRANT_DIR or ~/.config/apicity/paygate-grants)",
    ].join("\n")
  );
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  if (argv[0] === "otp" && argv[1] === "mint") {
    const args = parseMintArgs(argv.slice(2));
    const secret = readSecretFromFile(args.secretFile);
    const otp =
      args.requestHash !== undefined
        ? mintOtp(secret, {
            provider: args.provider,
            method: args.method,
            dotPath: args.dotPath,
            requestHash: args.requestHash,
            ttl: args.ttl,
          })
        : mintOtp(secret, {
            provider: args.provider,
            method: args.method,
            dotPath: args.dotPath,
            request: JSON.parse(
              readFileSync(args.payloadFile!, "utf8")
            ) as Record<string, unknown>,
            ttl: args.ttl,
          });
    console.log(otp);
    return;
  }

  if (argv[0] === "grant") {
    if (argv[1] === "mint") {
      runGrantMint(argv.slice(2));
      return;
    }
    if (argv[1] === "list") {
      runGrantList(argv.slice(2));
      return;
    }
    if (argv[1] === "revoke") {
      runGrantRevoke(argv.slice(2));
      return;
    }
  }

  console.error(
    "[apicity-paygate] supported commands: 'otp mint', 'grant mint', 'grant list', 'grant revoke'."
  );
  printHelp();
  process.exit(1);
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
