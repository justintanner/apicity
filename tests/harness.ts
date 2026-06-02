import { Polly, Timing } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";
import fs from "fs";

Polly.register(FetchAdapter);
Polly.register(FSPersister);

export interface PollyContext {
  polly: Polly;
  mode: string;
}

interface MultipartFileSummary {
  _file: true;
  filename?: string;
  contentType: string | null;
  size: number;
}

type MultipartSummaryValue = string | MultipartFileSummary;

function appendMultipartField(
  summary: Record<string, unknown>,
  name: string,
  value: MultipartSummaryValue
): void {
  const current = summary[name];
  if (current === undefined) {
    summary[name] = value;
    return;
  }
  if (Array.isArray(current)) {
    current.push(value);
    return;
  }
  summary[name] = [current, value];
}

function summarizeMultipartValue(
  value: FormDataEntryValue
): MultipartSummaryValue {
  if (typeof value === "string") {
    return value;
  }

  const maybeNamed = value as Blob & { name?: string };
  return {
    _file: true,
    filename: typeof maybeNamed.name === "string" ? maybeNamed.name : undefined,
    contentType: value.type || null,
    size: value.size,
  };
}

function findHeaderValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  return headers?.find((header) => header.name?.toLowerCase() === lower)?.value;
}

export function summarizeMultipartFormData(
  form: FormData
): Record<string, unknown> {
  const summary: Record<string, unknown> = { _multipart: true };
  for (const [name, value] of form.entries()) {
    appendMultipartField(summary, name, summarizeMultipartValue(value));
  }
  return summary;
}

export function setupPolly(recordingName: string): PollyContext {
  return setupPollyWithOptions(recordingName, {});
}

export function setupPollyForFileUploads(recordingName: string): PollyContext {
  // Disable body matching for FormData compatibility
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "user-agent",
          "x-api-key",
          "xi-api-key",
          "x-dashscope-ossresourceresolve",
        ],
      },
      body: false,
    },
  });
}

export function setupPollyIgnoringBody(recordingName: string): PollyContext {
  // Disable body matching when the factory injects defaults that weren't in
  // the original HAR (e.g. NSFW/safety permissive defaults). Headers are
  // still matched so requests can't collide across endpoints.
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "user-agent",
          "x-api-key",
          "xi-api-key",
          "x-dashscope-ossresourceresolve",
        ],
      },
      body: false,
    },
  });
}

type RawPollyMode = "record" | "replay" | "passthrough" | "record-missing";
type PollyAdapterMode = "record" | "replay" | "passthrough";

function resolvePollyMode(): {
  raw: RawPollyMode;
  adapter: PollyAdapterMode;
  recordIfMissing: boolean;
} {
  const raw = (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
  if (raw === "record-missing") {
    return { raw, adapter: "replay", recordIfMissing: true };
  }
  return { raw, adapter: raw, recordIfMissing: false };
}

function setupPollyWithOptions(
  recordingName: string,
  options: { matchRequestsBy?: Record<string, unknown> }
): PollyContext {
  const { raw, adapter, recordIfMissing } = resolvePollyMode();
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");

  const defaultMatchRequestsBy = {
    headers: {
      exclude: [
        "authorization",
        "user-agent",
        "x-api-key",
        "xi-api-key",
        "x-dashscope-ossresourceresolve",
      ],
    },
  };

  const polly = new Polly(recordingName, {
    mode: adapter,
    adapters: [FetchAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: { recordingsDir },
    },
    recordIfMissing,
    recordFailedRequests: true,
    timing: Timing.fixed(0),
    matchRequestsBy: options.matchRequestsBy ?? defaultMatchRequestsBy,
  });

  // Redact sensitive headers before persisting to disk and keep a scrubbed
  // multipart summary so prompts remain visible in the harness viewer.
  polly.server.any().on("beforePersist", (req, recording) => {
    const entries = recording.request?.headers ?? [];
    for (const header of entries) {
      if (header.name?.toLowerCase() === "authorization") {
        header.value = "Bearer ***";
      }
      if (header.name?.toLowerCase() === "x-api-key") {
        header.value = "***";
      }
      if (header.name?.toLowerCase() === "xi-api-key") {
        header.value = "***";
      }
    }

    if (
      typeof FormData !== "undefined" &&
      req.body instanceof FormData &&
      recording.request
    ) {
      const contentType =
        findHeaderValue(recording.request.headers, "content-type") ??
        "multipart/form-data";
      recording.request.postData ??= { mimeType: contentType, params: [] };
      recording.request.postData.mimeType = contentType;
      recording.request.postData.text = JSON.stringify(
        summarizeMultipartFormData(req.body)
      );
    }
  });

  return { polly, mode: raw };
}

export async function teardownPolly(ctx: PollyContext): Promise<void> {
  await ctx.polly.stop();
}

export function recordingExists(recordingName: string): boolean {
  const recordingsDir = path.resolve(import.meta.dirname, "recordings");
  // Polly normalizes dots to hyphens when creating directory names
  const parts = recordingName.split("/").map((p) => p.replace(/\./g, "-"));
  function walk(dir: string, depth: number): boolean {
    if (depth === parts.length) {
      return fs.existsSync(path.join(dir, "recording.har"));
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(parts[depth] + "_")) {
        if (walk(path.join(dir, entry.name), depth + 1)) {
          return true;
        }
      }
    }
    return false;
  }
  try {
    return walk(recordingsDir, 0);
  } catch {
    return false;
  }
}

export function getPollyMode(): RawPollyMode {
  return (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
}

// ---------------------------------------------------------------------------
// OTP helpers for paid-endpoint tests
// ---------------------------------------------------------------------------
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalHash } from "../packages/provider/cost/src/paygate";
let _otpPrivateKey: string | undefined;
let _otpPublicKeyPath: string | undefined;
let _otpTestDir: string | undefined;
function ensureOtpKeys(): { privateKey: string; publicKeyPath: string } {
  if (_otpPrivateKey && _otpPublicKeyPath) {
    return { privateKey: _otpPrivateKey, publicKeyPath: _otpPublicKeyPath };
  }
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const testDir = join(
    tmpdir(),
    "apicity-paygate-test-" + randomBytes(8).toString("hex")
  );
  mkdirSync(testDir, { recursive: true });
  const publicKeyPath = join(testDir, "public.pem");
  writeFileSync(publicKeyPath, publicKey, "utf8");
  _otpPrivateKey = privateKey;
  _otpPublicKeyPath = publicKeyPath;
  _otpTestDir = testDir;
  process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH = publicKeyPath;
  return { privateKey, publicKeyPath };
}
function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
/**
 * Mint a test OTP signed with the generated private key.
 */
export function mintTestOtp(payload: Record<string, unknown>): string {
  const { privateKey } = ensureOtpKeys();
  const payloadJson = JSON.stringify({ v: 1, ...payload });
  const payloadSegment = base64urlEncode(Buffer.from(payloadJson, "utf8"));
  const signature = sign(null, Buffer.from(payloadSegment, "utf8"), privateKey);
  const signatureSegment = base64urlEncode(signature);
  return `${payloadSegment}.${signatureSegment}`;
}
/**
 * Generate a valid OTP for a KIE createTask request.
 */
export function mintKieCreateTaskOtp(request: Record<string, unknown>): {
  otp: string;
} {
  return {
    otp: mintTestOtp({
      jti: randomBytes(16).toString("hex"),
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(request),
      maxSpendUsd: 100,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  };
}
/**
 * Clean up OTP test directories. Call in an afterAll or afterEach.
 */
export function cleanupOtpKeys(): void {
  if (_otpTestDir && existsSync(_otpTestDir)) {
    rmSync(_otpTestDir, { recursive: true, force: true });
  }
  _otpPrivateKey = undefined;
  _otpPublicKeyPath = undefined;
  _otpTestDir = undefined;
  delete process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
}
