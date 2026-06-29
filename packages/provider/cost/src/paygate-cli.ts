#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { mintOtp } from "./paygate.js";

/**
 * Operator CLI for minting OTPs for paid @apicity endpoints.
 *
 * The shared HMAC secret is read from a file (`--secret-file`) — never from an
 * environment variable. The exported `mintOtp(secret, call)` is the primary
 * programmatic API; this CLI is a thin convenience wrapper.
 */

interface MintArgs {
  provider?: string;
  method?: string;
  dotPath: string;
  payloadFile: string;
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
    else if (a === "--secret-file") out.secretFile = argv[++i];
    else if (a.startsWith("--secret-file=")) out.secretFile = a.slice(14);
    else if (a === "--ttl") out.ttl = argv[++i];
    else if (a.startsWith("--ttl=")) out.ttl = a.slice(6);
    else {
      console.error(`[apicity-paygate] unknown arg: ${a}`);
    }
  }

  const required: (keyof MintArgs)[] = ["dotPath", "payloadFile", "secretFile"];
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
      "    --secret-file <path> \\",
      "    --dot-path <api.path> \\",
      "    --payload-file <path> \\",
      "    [--provider <provider>] \\",
      "    [--method <HTTP method>] \\",
      "    [--ttl <duration>]",
      "",
      "Options:",
      "  --secret-file  Path to a file containing the shared HMAC secret",
      "  --dot-path     API dot-path (e.g. api.v1.jobs.createTask)",
      "  --payload-file Path to JSON request payload file",
      "  --provider     Provider name (optional; resolved from the dot-path)",
      "  --method       HTTP method (optional; resolved from the dot-path)",
      "  --ttl          Time-to-live: 10m, 1h, 30s, 1d (default 10m)",
    ].join("\n")
  );
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
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
  const secret = readFileSync(args.secretFile, "utf8").trim();
  const request = JSON.parse(readFileSync(args.payloadFile, "utf8")) as Record<
    string,
    unknown
  >;
  const otp = mintOtp(secret, {
    provider: args.provider,
    method: args.method,
    dotPath: args.dotPath,
    request,
    ttl: args.ttl,
  });
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
