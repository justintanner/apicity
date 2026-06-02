import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { computeEstimate } from "./compute";
import { isPaidEndpoint } from "./paid-endpoints";
import { SpendBoundError } from "./paid-endpoints";

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
  // Replace base64url chars with base64 chars and add padding
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
 *
 * @param jti - The OTP jti to check
 * @param ledgerPath - Optional override path; defaults to XDG_STATE_HOME or ~/.local/state
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
 *
 * @param jti - The OTP jti to consume
 * @param ledgerPath - Optional override path; defaults to XDG_STATE_HOME or ~/.local/state
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
function loadPublicKey(): string | undefined {
  const path = process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
  if (!path) {
    return undefined;
  }
  return readFileSync(path, "utf8");
}

/**
 * Verify an OTP against the public key, checking signature, expiry,
 * request binding, and replay.
 */
function verifyOtp(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  otp: string,
  publicKeyPem: string
): PayGateOtpPayload {
  let parsed: { payload: PayGateOtpPayload; signature: Buffer };
  try {
    parsed = parseOtp(otp);
  } catch (e) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-malformed",
      e instanceof Error ? e.message : "OTP is malformed"
    );
  }

  const { payload: otpPayload, signature } = parsed;
  const parts = otp.split(".");
  const payloadSegment = parts[0]!;

  const sigOk = verifyOtpSignature(payloadSegment, signature, publicKeyPem);
  if (!sigOk) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-invalid-signature",
      "OTP signature is invalid"
    );
  }

  const now = Math.floor(Date.now() / 1000);
  if (otpPayload.exp < now) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-expired",
      `OTP expired at ${otpPayload.exp} (now is ${now})`
    );
  }

  if (
    otpPayload.provider !== provider ||
    otpPayload.method !== method ||
    otpPayload.dotPath !== dotPath
  ) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-mismatched-request",
      `OTP bound to ${otpPayload.provider} ${otpPayload.method} ${otpPayload.dotPath}, ` +
        `but call is ${provider} ${method} ${dotPath}`
    );
  }

  const expectedHash = canonicalHash(payload);
  if (otpPayload.requestHash !== expectedHash) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-mismatched-request",
      `OTP request hash mismatch: expected ${expectedHash}, got ${otpPayload.requestHash}`
    );
  }

  if (isJtiConsumed(otpPayload.jti)) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "otp-replayed",
      `OTP jti ${otpPayload.jti} has already been consumed`
    );
  }

  return otpPayload;
}

/**
 * Wrap a provider network dispatch with the OTP-based paid-endpoint gate.
 *
 * Free/unlisted endpoints return `dispatch()` immediately without OTP or
 * pay gate configuration.
 *
 * Paid endpoints fail closed: if the pay gate is not configured, or the OTP
 * is missing, invalid, expired, replayed, mismatched, or the cost exceeds the
 * OTP's maxSpendUsd, the call throws before dispatch runs.
 */
export async function dispatchWithPaidGate<T>(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  approval: PayGateApproval | undefined,
  dispatch: () => Promise<T>
): Promise<T> {
  if (!isPaidEndpoint(provider, method, dotPath)) {
    return dispatch();
  }

  const publicKeyPem = loadPublicKey();
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

  const otpPayload = verifyOtp(
    provider,
    method,
    dotPath,
    payload,
    approval.otp,
    publicKeyPem
  );

  const estimate = computeEstimate({
    provider: provider as EstimateRequest["provider"],
    payload,
  });

  if (estimate.warnings.length > 0) {
    throw new SpendBoundError(
      provider,
      method,
      dotPath,
      otpPayload.maxSpendUsd,
      estimate.usd,
      `Endpoint ${provider} ${method} ${dotPath} spend cannot be bounded ` +
        `from the payload: ${estimate.warnings.join("; ")}. ` +
        `Pass an OTP with a higher maxSpendUsd, ` +
        `or adjust the payload so the cost can be estimated.`
    );
  }

  if (estimate.usd > otpPayload.maxSpendUsd) {
    throw new SpendBoundError(
      provider,
      method,
      dotPath,
      otpPayload.maxSpendUsd,
      estimate.usd,
      `Endpoint ${provider} ${method} ${dotPath} estimated cost ` +
        `(${estimate.usd} USD) exceeds OTP maxSpendUsd (${otpPayload.maxSpendUsd} USD).`
    );
  }

  // Consume the OTP immediately before dispatch.
  consumeJti(otpPayload.jti);

  return dispatch();
}
