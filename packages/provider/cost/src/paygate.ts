import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { isPaidEndpoint, PAID_ENDPOINTS } from "./paid-endpoints";

/**
 * OTP payload schema. An OTP commits to an exact
 * `(provider, method, dotPath, requestHash)` tuple with an expiry, and is
 * single-use via its `jti`.
 */
export interface PayGateOtpPayload {
  v: 1;
  jti: string;
  provider: string;
  method: string;
  dotPath: string;
  requestHash: `sha256:${string}`;
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
 * Single-use replay ledger. The default is an in-process Set scoped to one
 * provider instance (see `createReplayStore`). Pass a custom store for
 * cross-process or persistent replay protection.
 */
export interface ReplayStore {
  has(jti: string): boolean;
  add(jti: string): void;
}

/**
 * Pay-gate configuration supplied by the code client at construction time
 * (never by the autonomous caller). Holds the shared HMAC secret used to mint
 * and verify OTPs. No environment variables, no key files.
 */
export interface PayGateConfig {
  /** Shared HMAC secret. The code client holds it; the AI never sees it. */
  secret: string;
  /** Replay ledger. Defaults to an in-process Set, per provider instance. */
  replayStore?: ReplayStore;
  /** Clock injection for testing. Defaults to `Date.now`. */
  now?: () => number;
}

/**
 * Error thrown when the pay gate blocks a request.
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
  | { ok: true; jti: string }
  | { ok: false; code: VerifyFailureCode; message: string };

/**
 * Pure inputs to `verifyOtp`. Every dependency is explicit — no env vars,
 * no `Date.now()`, no filesystem reads.
 */
export interface VerifyOtpInput {
  nowSeconds: number;
  secret: string;
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
 * Decode base64url (no padding required).
 */
function base64urlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  return Buffer.from(padded, "base64");
}

/**
 * Parse a TTL string like "10m", "1h", "30s", "1d" into seconds.
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
    (payload as Record<string, unknown>).v !== 1 ||
    typeof (payload as Record<string, unknown>).jti !== "string" ||
    typeof (payload as Record<string, unknown>).provider !== "string" ||
    typeof (payload as Record<string, unknown>).method !== "string" ||
    typeof (payload as Record<string, unknown>).dotPath !== "string" ||
    typeof (payload as Record<string, unknown>).requestHash !== "string" ||
    typeof (payload as Record<string, unknown>).iat !== "number" ||
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
 * Compute the HMAC-SHA256 of an OTP payload segment with the shared secret.
 */
function signPayloadSegment(payloadSegment: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payloadSegment, "utf8").digest();
}

/**
 * Constant-time verification of an OTP payload segment's HMAC signature.
 */
function verifyPayloadSignature(
  payloadSegment: string,
  signature: Buffer,
  secret: string
): boolean {
  const expected = signPayloadSegment(payloadSegment, secret);
  if (expected.length !== signature.length) {
    return false;
  }
  return timingSafeEqual(expected, signature);
}

/**
 * Create an in-process, single-use replay store backed by a `Set`.
 * Scoped to whatever holds the reference (typically one provider instance).
 */
export function createReplayStore(): ReplayStore {
  const seen = new Set<string>();
  return {
    has: (jti) => seen.has(jti),
    add: (jti) => {
      seen.add(jti);
    },
  };
}

/**
 * The exact endpoint an OTP authorizes, plus the request it is bound to.
 * `provider`/`method` may be omitted when `dotPath` uniquely identifies a
 * single paid endpoint (it is resolved from `PAID_ENDPOINTS`).
 */
export interface OtpCall {
  provider?: string;
  method?: string;
  dotPath: string;
  request: Record<string, unknown>;
  /** Time-to-live as seconds or a string like "10m". Defaults to 10m. */
  ttl?: string | number;
}

const DEFAULT_TTL_SECONDS = 600;

/**
 * Resolve `(provider, method, dotPath)` for a mint call. When the caller omits
 * provider/method, the dotPath must match exactly one entry in
 * `PAID_ENDPOINTS`.
 */
function resolveCallKey(call: OtpCall): {
  provider: string;
  method: string;
  dotPath: string;
} {
  if (call.provider && call.method) {
    return {
      provider: call.provider,
      method: call.method,
      dotPath: call.dotPath,
    };
  }
  const matches = PAID_ENDPOINTS.filter(
    (e) =>
      e.key.dotPath === call.dotPath &&
      (call.method === undefined || e.key.method === call.method) &&
      (call.provider === undefined || e.key.provider === call.provider)
  );
  if (matches.length === 1) {
    const key = matches[0]!.key;
    return {
      provider: call.provider ?? key.provider,
      method: call.method ?? key.method,
      dotPath: call.dotPath,
    };
  }
  throw new Error(
    `Cannot resolve provider/method for dotPath "${call.dotPath}". ` +
      `Pass { provider, method } explicitly.`
  );
}

/**
 * Mint an OTP for a specific request, signed with the shared HMAC secret.
 *
 * Pure and env-free: the secret is passed explicitly. The OTP binds to the
 * exact request via its canonical hash, so changing any byte of the request
 * invalidates the token.
 */
export function mintOtp(secret: string, call: OtpCall): string {
  if (!secret) {
    throw new Error("mintOtp requires a non-empty secret");
  }
  const key = resolveCallKey(call);
  const ttlSeconds =
    call.ttl === undefined
      ? DEFAULT_TTL_SECONDS
      : typeof call.ttl === "number"
        ? call.ttl
        : parseTtl(call.ttl);
  const iat = Math.floor(Date.now() / 1000);
  const payload: PayGateOtpPayload = {
    v: 1,
    jti: randomBytes(16).toString("hex"),
    provider: key.provider,
    method: key.method,
    dotPath: key.dotPath,
    requestHash: canonicalHash(call.request),
    iat,
    exp: iat + ttlSeconds,
  };
  const payloadSegment = base64urlEncode(
    Buffer.from(JSON.stringify(payload), "utf8")
  );
  const signatureSegment = base64urlEncode(
    signPayloadSegment(payloadSegment, secret)
  );
  return `${payloadSegment}.${signatureSegment}`;
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

  if (!verifyPayloadSignature(payloadSegment, signature, input.secret)) {
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

  return { ok: true, jti: payload.jti };
}

/**
 * Wrap a provider network dispatch with the OTP-based paid-endpoint gate.
 *
 * Free/unlisted endpoints return `dispatch()` immediately without OTP or
 * pay-gate configuration.
 *
 * Paid endpoints fail closed: if the pay gate is not configured, or the OTP
 * is missing, invalid, expired, replayed, or mismatched, the call throws
 * before dispatch runs. This is the "no bypass" guarantee — a paid call cannot
 * fire without a configured secret and a valid, human/code-client-minted OTP.
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
  config?: PayGateConfig
): Promise<T> {
  if (!isPaidEndpoint(provider, method, dotPath)) {
    return dispatch();
  }

  if (!config || !config.secret) {
    throw new PayGateError(
      provider,
      method,
      dotPath,
      "paygate-not-configured",
      `Paid endpoint ${provider} ${method} ${dotPath} requires a pay gate. ` +
        `Construct the provider with { paygate: { secret } }.`
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

  const store = config.replayStore ?? createReplayStore();
  const now = config.now ?? (() => Date.now());

  const result = verifyOtp({
    nowSeconds: Math.floor(now() / 1000),
    secret: config.secret,
    expected: { provider, method, dotPath },
    payloadHash: canonicalHash(payload),
    otp: approval.otp,
    isJtiConsumed: (jti) => store.has(jti),
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

  store.add(result.jti);

  return dispatch();
}
