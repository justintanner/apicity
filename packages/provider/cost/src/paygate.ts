import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { computeEstimate } from "./compute";
import { isPaidEndpoint, SpendBoundError } from "./paid-endpoints";

import type { EstimateRequest } from "./types";

/**
 * OTP payload schema.
 */
export interface PayGateOtpPayload {
  v: 1;
  jti: string;
  provider: string;
  method: string;
  dotPath: string;
  requestHash: `sha256:${string}`;
  maxSpendUsd: number;
  iat: number;
  exp: number;
}

/**
 * Caller-supplied approval object.
 */
export interface PayGateApproval {
  otp: string;
}

/**
 * Error thrown when the pay gate blocks a request for any reason
 * other than spend bounds (which use SpendBoundError).
 */
export class PayGateError extends Error {
  readonly provider: string;
  readonly method: string;
  readonly dotPath: string;
  readonly code:
    | "paygate-not-configured"
    | "otp-missing"
    | "otp-malformed"
    | "otp-invalid-signature"
    | "otp-expired"
    | "otp-mismatched-request"
    | "otp-replayed";

  constructor(
    provider: string,
    method: string,
    dotPath: string,
    code: PayGateError["code"],
    message: string
  ) {
    super(message);
    this.name = "PayGateError";
    this.provider = provider;
    this.method = method;
    this.dotPath = dotPath;
    this.code = code;
  }
}

/**
 * Verification-only error codes — the subset of PayGateError codes that the
 * pure `verifyOtp` can emit. The shell layer ("paygate-not-configured",
 * "otp-missing") is handled separately in `dispatchWithPaidGate`.
 */
export type VerifyFailureCode =
  | "otp-malformed"
  | "otp-invalid-signature"
  | "otp-expired"
  | "otp-mismatched-request"
  | "otp-replayed";

/**
 * Tagged-union result from the pure `verifyOtp` function.
 */
export type VerifyResult =
  | { ok: true; jti: string; maxSpendUsd: number }
  | { ok: false; code: VerifyFailureCode; message: string };

/**
 * Pure inputs to `verifyOtp`. Every dependency is explicit — no env vars,
 * no `Date.now()`, no filesystem reads.
 */
export interface VerifyOtpInput {
  nowSeconds: number;
  publicKeyPem: string;
  expected: { provider: string; method: string; dotPath: string };
  payloadHash: `sha256:${string}`;
  otp: string;
  isJtiConsumed: (jti: string) => boolean;
}

/**
 * Canonicalize a JSON value by sorting object keys recursively.
 * Arrays preserve order. Non-JSON values (undefined, functions, symbols,
 * circular references) cause a TypeError so the caller can fail closed.
 */
export function canonicalizeJson(value: unknown): string {
  const seen = new WeakSet<object>();

  function walk(v: unknown): unknown {
    if (
      v === null ||
      typeof v === "boolean" ||
      typeof v === "number" ||
      typeof v === "string"
    ) {
      return v;
    }
    if (
      typeof v === "undefined" ||
      typeof v === "function" ||
      typeof v === "symbol"
    ) {
      throw new TypeError("Cannot canonicalize non-JSON value: " + typeof v);
    }
    if (Array.isArray(v)) {
      return v.map(walk);
    }
    if (typeof v === "object") {
      if (seen.has(v)) {
        throw new TypeError("Cannot canonicalize circular reference");
      }
      seen.add(v);
      const sortedKeys = Object.keys(v).sort();
      const out: Record<string, unknown> = {};
      for (const k of sortedKeys) {
        out[k] = walk((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    throw new TypeError("Cannot canonicalize unexpected type: " + typeof v);
  }

  return JSON.stringify(walk(value));
}

/**
 * Compute SHA-256 of canonical JSON, prefixed with `sha256:`.
 */
export function canonicalHash(value: unknown): `sha256:${string}` {
  const canonical = canonicalizeJson(value);
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
  return `sha256:${hash}`;
}

/**
 * Decode base64url (no padding required).
 */
function base64urlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  return Buffer.from(padded, "base64");
}

/**
 * Parse an OTP envelope: `<base64url(payloadJson)>.<base64url(signature)>`.
 * Returns the payload object and raw signature bytes.
 */
export function parseOtp(otp: string): {
  payload: PayGateOtpPayload;
  signature: Buffer;
} {
  const parts = otp.split(".");
  if (parts.length !== 2) {
    throw new Error("OTP must contain exactly one '.' separator");
  }
  const payloadJson = base64urlDecode(parts[0]!).toString("utf8");
  const signature = base64urlDecode(parts[1]!);
  let payload: unknown;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    throw new Error("OTP payload is not valid JSON");
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("v" in payload) ||
    (payload as Record<string, unknown>).v !== 1 ||
    !("jti" in payload) ||
    typeof (payload as Record<string, unknown>).jti !== "string" ||
    !("provider" in payload) ||
    typeof (payload as Record<string, unknown>).provider !== "string" ||
    !("method" in payload) ||
    typeof (payload as Record<string, unknown>).method !== "string" ||
    !("dotPath" in payload) ||
    typeof (payload as Record<string, unknown>).dotPath !== "string" ||
    !("requestHash" in payload) ||
    typeof (payload as Record<string, unknown>).requestHash !== "string" ||
    !("maxSpendUsd" in payload) ||
    typeof (payload as Record<string, unknown>).maxSpendUsd !== "number" ||
    !("iat" in payload) ||
    typeof (payload as Record<string, unknown>).iat !== "number" ||
    !("exp" in payload) ||
    typeof (payload as Record<string, unknown>).exp !== "number"
  ) {
    throw new Error("OTP payload missing required fields");
  }
  return {
    payload: payload as PayGateOtpPayload,
    signature,
  };
}

/**
 * Verify the Ed25519 signature of an OTP payload segment.
 * `publicKey` is the PEM string read from the public key file.
 */
export function verifyOtpSignature(
  payloadSegmentBase64url: string,
  signature: Buffer,
  publicKeyPem: string
): boolean {
  const key = createPublicKey(publicKeyPem);
  const data = Buffer.from(payloadSegmentBase64url, "utf8");
  return verify(null, data, key, signature);
}

/**
 * Pure verification of an OTP against expected request context.
 *
 * Returns a tagged-union `VerifyResult` — never throws. The caller is
 * responsible for converting `{ ok: false }` into a `PayGateError` at the
 * boundary.
 */
export function verifyOtp(input: VerifyOtpInput): VerifyResult {
  let parsed: { payload: PayGateOtpPayload; signature: Buffer };
  try {
    parsed = parseOtp(input.otp);
  } catch (e) {
    return {
      ok: false,
      code: "otp-malformed",
      message: e instanceof Error ? e.message : "OTP is malformed",
    };
  }

  const { payload, signature } = parsed;
  const payloadSegment = input.otp.split(".")[0]!;

  if (!verifyOtpSignature(payloadSegment, signature, input.publicKeyPem)) {
    return {
      ok: false,
      code: "otp-invalid-signature",
      message: "OTP signature is invalid",
    };
  }

  if (payload.exp < input.nowSeconds) {
    return {
      ok: false,
      code: "otp-expired",
      message: `OTP expired at ${payload.exp} (now is ${input.nowSeconds})`,
    };
  }

  if (
    payload.provider !== input.expected.provider ||
    payload.method !== input.expected.method ||
    payload.dotPath !== input.expected.dotPath
  ) {
    return {
      ok: false,
      code: "otp-mismatched-request",
      message:
        `OTP bound to ${payload.provider} ${payload.method} ${payload.dotPath}, ` +
        `but call is ${input.expected.provider} ${input.expected.method} ${input.expected.dotPath}`,
    };
  }

  if (payload.requestHash !== input.payloadHash) {
    return {
      ok: false,
      code: "otp-mismatched-request",
      message: `OTP request hash mismatch: expected ${input.payloadHash}, got ${payload.requestHash}`,
    };
  }

  if (input.isJtiConsumed(payload.jti)) {
    return {
      ok: false,
      code: "otp-replayed",
      message: `OTP jti ${payload.jti} has already been consumed`,
    };
  }

  return { ok: true, jti: payload.jti, maxSpendUsd: payload.maxSpendUsd };
}

/**
 * Resolve the default replay ledger path.
 */
function defaultLedgerPath(): string {
  const xdg = process.env.XDG_STATE_HOME;
  if (xdg) {
    return join(xdg, "apicity", "paygate-used.jsonl");
  }
  return join(homedir(), ".local", "state", "apicity", "paygate-used.jsonl");
}

/**
 * Check whether a jti has already been consumed.
 */
export function isJtiConsumed(
  jti: string,
  ledgerPath: string = defaultLedgerPath()
): boolean {
  if (!existsSync(ledgerPath)) {
    return false;
  }
  const content = readFileSync(ledgerPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const entry = JSON.parse(trimmed) as { jti?: string };
      if (entry.jti === jti) {
        return true;
      }
    } catch {
      // Skip malformed lines
    }
  }
  return false;
}

/**
 * Append a jti to the replay ledger.
 */
export function consumeJti(
  jti: string,
  ledgerPath: string = defaultLedgerPath()
): void {
  const dir = join(ledgerPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const entry = JSON.stringify({
    jti,
    consumedAt: Math.floor(Date.now() / 1000),
  });
  appendFileSync(ledgerPath, entry + "\n", "utf8");
}

/**
 * Load the Ed25519 public key PEM from the configured path.
 */
export function loadPublicKey(): string | undefined {
  const path = process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
  if (!path) {
    return undefined;
  }
  return readFileSync(path, "utf8");
}

/**
 * Injectable IO surface for the pay-gate shell. The default implementation
 * reads env vars, the filesystem ledger, and the system clock. Tests can swap
 * in deterministic in-memory implementations.
 */
export interface PayGateIo {
  now(): number;
  loadPublicKey(): string | undefined;
  isJtiConsumed(jti: string): boolean;
  consumeJti(jti: string): void;
}

export const defaultPayGateIo: PayGateIo = {
  now: () => Date.now(),
  loadPublicKey,
  isJtiConsumed: (jti) => isJtiConsumed(jti),
  consumeJti: (jti) => consumeJti(jti),
};

/**
 * Wrap a provider network dispatch with the OTP-based paid-endpoint gate.
 *
 * Free/unlisted endpoints return `dispatch()` immediately without OTP or
 * pay gate configuration.
 *
 * Paid endpoints fail closed: if the pay gate is not configured, or the OTP
 * is missing, invalid, expired, replayed, mismatched, or the cost exceeds the
 * OTP's maxSpendUsd, the call throws before dispatch runs.
 *
 * The OTP jti is consumed BEFORE dispatch. If dispatch later fails for any
 * reason, the jti remains consumed and the caller must mint a fresh OTP to
 * retry. This is intentional — without it, a hostile caller could replay an
 * OTP on every transient failure.
 */
export async function dispatchWithPaidGate<T>(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  approval: PayGateApproval | undefined,
  dispatch: () => Promise<T>,
  io: PayGateIo = defaultPayGateIo
): Promise<T> {
  if (!isPaidEndpoint(provider, method, dotPath)) {
    return dispatch();
  }

  const publicKeyPem = io.loadPublicKey();
  if (!publicKeyPem) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "paygate-not-configured",
      "Pay gate is not configured: APICITY_PAYGATE_PUBLIC_KEY_PATH is not set"
    );
  }

  if (!approval || !approval.otp) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-missing",
      "Paid endpoint requires an OTP approval. Pass { otp: '...' }."
    );
  }

  const result = verifyOtp({
    nowSeconds: Math.floor(io.now() / 1000),
    publicKeyPem,
    expected: { provider, method, dotPath },
    payloadHash: canonicalHash(payload),
    otp: approval.otp,
    isJtiConsumed: io.isJtiConsumed,
  });
  if (!result.ok) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      result.code,
      result.message
    );
  }

  const estimate = computeEstimate({
    provider: provider as EstimateRequest["provider"],
    payload,
  });

  if (estimate.warnings.length > 0) {
    throw new SpendBoundError(
      provider,
      method,
      dotPath,
      result.maxSpendUsd,
      estimate.usd,
      `Endpoint ${provider} ${method} ${dotPath} spend cannot be bounded ` +
        `from the payload: ${estimate.warnings.join("; ")}. ` +
        `Pass an OTP with a higher maxSpendUsd, ` +
        `or adjust the payload so the cost can be estimated.`
    );
  }

  if (estimate.usd > result.maxSpendUsd) {
    throw new SpendBoundError(
      provider,
      method,
      dotPath,
      result.maxSpendUsd,
      estimate.usd,
      `Endpoint ${provider} ${method} ${dotPath} estimated cost ` +
        `(${estimate.usd} USD) exceeds OTP maxSpendUsd (${result.maxSpendUsd} USD).`
    );
  }

  io.consumeJti(result.jti);

  return dispatch();
}
