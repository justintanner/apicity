import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

import { ENDPOINT_BILLING } from "./endpoint-billing";
import { PAID_ENDPOINTS } from "./paid-endpoints";

export const GRANT_TOKEN_PREFIX = "apicity-grant-v1.";
export const GRANT_DEFAULT_TTL_SECONDS = 3600;
export const GRANT_MAX_TTL_SECONDS = 86400;
export const GRANT_CLOCK_SKEW_SECONDS = 300;

const PROVIDER_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const GRANT_PAYLOAD_KEYS = ["exp", "iat", "jti", "provider", "v"];

const KNOWN_GRANT_PROVIDERS = new Set<string>([
  ...ENDPOINT_BILLING.map((policy) => policy.match.provider),
  ...PAID_ENDPOINTS.map((entry) => entry.key.provider),
]);

/** Claims carried inside a signed provider grant token. */
export interface GrantPayload {
  v: 1;
  jti: string;
  provider: string;
  iat: number;
  exp: number;
}

/** Failure codes returned when verifying a provider grant token. */
export type GrantVerifyFailureCode =
  | "grant-malformed"
  | "grant-invalid-signature"
  | "grant-not-yet-valid"
  | "grant-expired"
  | "grant-mismatched-provider";

/** Tagged-union result of pure grant token verification. */
export type GrantVerifyResult =
  | { ok: true; payload: GrantPayload }
  | { ok: false; code: GrantVerifyFailureCode; message: string };

/** Inputs accepted by `mintGrant`. */
export interface MintGrantOptions {
  provider: string;
  /** Time-to-live in whole seconds or duration string (default `3600`, max `86400`). */
  ttl?: string | number;
  /** Optional clock override returning epoch ms (defaults to `Date.now`). */
  now?: () => number;
}

/** Inputs accepted by `verifyGrant`. */
export interface VerifyGrantInput {
  token: string;
  secret: string;
  provider: string;
  /** Current UNIX time in seconds (defaults to `Math.floor(Date.now() / 1000)`). */
  nowSeconds?: number;
}

function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  return Buffer.from(base64 + "=".repeat(padLen), "base64");
}

function parseGrantTtl(ttl: string | number | undefined): number {
  if (ttl === undefined) {
    return GRANT_DEFAULT_TTL_SECONDS;
  }
  let seconds: number;
  if (typeof ttl === "number") {
    seconds = ttl;
  } else {
    const match = ttl.match(/^(\d+)([smhd])$/i);
    if (!match) {
      throw new Error(
        `Invalid grant TTL format: ${ttl}. Expected format like 30m, 1h, 24h.`
      );
    }
    const amount = parseInt(match[1]!, 10);
    const unit = match[2]!.toLowerCase();
    seconds =
      unit === "s"
        ? amount
        : unit === "m"
          ? amount * 60
          : unit === "h"
            ? amount * 3600
            : amount * 86400;
  }
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(
      `Invalid grant TTL: ${ttl}. Expected a whole number of seconds above 0.`
    );
  }
  if (seconds > GRANT_MAX_TTL_SECONDS) {
    throw new Error(
      `Grant TTL ${seconds}s exceeds the 24-hour maximum (${GRANT_MAX_TTL_SECONDS}s).`
    );
  }
  return seconds;
}

function signGrantSegment(payloadSegment: string, secret: string): Buffer {
  return createHmac("sha256", secret)
    .update(`${GRANT_TOKEN_PREFIX}${payloadSegment}`, "utf8")
    .digest();
}

/**
 * Return `true` when `provider` is a valid known provider name from
 * `ENDPOINT_BILLING` or `PAID_ENDPOINTS`.
 */
export function isGrantProviderName(provider: string): boolean {
  return PROVIDER_NAME_RE.test(provider) && KNOWN_GRANT_PROVIDERS.has(provider);
}

/**
 * Return `<provider>.grant` after validating that `provider` cannot traverse
 * directories.
 */
export function grantFileName(provider: string): string {
  if (!PROVIDER_NAME_RE.test(provider)) {
    throw new Error(
      `Invalid provider name "${provider}": expected ^[a-z0-9][a-z0-9-]*$`
    );
  }
  return `${provider}.grant`;
}

/**
 * Resolve the grant directory: `$APICITY_PAYGATE_GRANT_DIR`, else
 * `<home>/.config/apicity/paygate-grants`.
 */
export function grantDirectory(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.APICITY_PAYGATE_GRANT_DIR;
  if (override !== undefined && override !== "") {
    return override;
  }
  const home =
    env.HOME !== undefined && env.HOME !== ""
      ? env.HOME
      : env.USERPROFILE !== undefined && env.USERPROFILE !== ""
        ? env.USERPROFILE
        : homedir();
  return join(home, ".config", "apicity", "paygate-grants");
}

/**
 * Mint an HMAC-signed provider grant token bounded to one provider and TTL.
 */
export function mintGrant(secret: string, options: MintGrantOptions): string {
  if (!secret) {
    throw new Error("mintGrant requires a non-empty secret");
  }
  if (!PROVIDER_NAME_RE.test(options.provider)) {
    throw new Error(
      `Invalid provider name "${options.provider}": expected ^[a-z0-9][a-z0-9-]*$`
    );
  }
  const ttlSeconds = parseGrantTtl(options.ttl);
  const nowMs = options.now ? options.now() : Date.now();
  const iat = Math.floor(nowMs / 1000);
  const payload: GrantPayload = {
    v: 1,
    jti: randomBytes(16).toString("hex"),
    provider: options.provider,
    iat,
    exp: iat + ttlSeconds,
  };
  const payloadSegment = base64urlEncode(
    Buffer.from(JSON.stringify(payload), "utf8")
  );
  const signatureSegment = base64urlEncode(
    signGrantSegment(payloadSegment, secret)
  );
  return `${GRANT_TOKEN_PREFIX}${payloadSegment}.${signatureSegment}`;
}

/**
 * Verify a provider grant token in strict fail-closed order: envelope shape,
 * HMAC signature over `apicity-grant-v1.<payload>` (before JSON parsing),
 * payload claims + 24-hour max lifetime, clock skew, expiry, and provider.
 */
export function verifyGrant(input: VerifyGrantInput): GrantVerifyResult {
  if (!input.secret) {
    return {
      ok: false,
      code: "grant-invalid-signature",
      message: "Grant signature verification requires a non-empty secret",
    };
  }
  if (!input.token.startsWith(GRANT_TOKEN_PREFIX)) {
    return {
      ok: false,
      code: "grant-malformed",
      message: "Grant token has an invalid prefix",
    };
  }
  const remainder = input.token.slice(GRANT_TOKEN_PREFIX.length);
  const parts = remainder.split(".");
  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1] ||
    !BASE64URL_RE.test(parts[0]) ||
    !BASE64URL_RE.test(parts[1])
  ) {
    return {
      ok: false,
      code: "grant-malformed",
      message: "Grant token envelope is malformed",
    };
  }

  const [payloadSegment, signatureSegment] = parts as [string, string];
  const signature = base64urlDecode(signatureSegment);
  const expectedSignature = signGrantSegment(payloadSegment, input.secret);
  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(signature, expectedSignature)
  ) {
    return {
      ok: false,
      code: "grant-invalid-signature",
      message: "Grant signature is invalid",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlDecode(payloadSegment).toString("utf8"));
  } catch {
    return {
      ok: false,
      code: "grant-malformed",
      message: "Grant payload is not valid JSON",
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      code: "grant-malformed",
      message: "Grant payload must be an object",
    };
  }

  const keys = Object.keys(parsed).sort();
  if (
    keys.length !== GRANT_PAYLOAD_KEYS.length ||
    keys.some((k, i) => k !== GRANT_PAYLOAD_KEYS[i])
  ) {
    return {
      ok: false,
      code: "grant-malformed",
      message: "Grant payload has unexpected or missing fields",
    };
  }

  const record = parsed as Record<string, unknown>;
  if (
    record.v !== 1 ||
    typeof record.jti !== "string" ||
    record.jti.length === 0 ||
    typeof record.provider !== "string" ||
    !PROVIDER_NAME_RE.test(record.provider) ||
    typeof record.iat !== "number" ||
    !Number.isInteger(record.iat) ||
    typeof record.exp !== "number" ||
    !Number.isInteger(record.exp) ||
    record.exp <= record.iat ||
    record.exp - record.iat > GRANT_MAX_TTL_SECONDS
  ) {
    return {
      ok: false,
      code: "grant-malformed",
      message: "Grant payload claims are invalid or exceed 24h lifetime",
    };
  }

  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (record.iat > nowSeconds + GRANT_CLOCK_SKEW_SECONDS) {
    return {
      ok: false,
      code: "grant-not-yet-valid",
      message: `Grant is not yet valid (issued at ${record.iat}, now is ${nowSeconds})`,
    };
  }

  if (nowSeconds > record.exp) {
    return {
      ok: false,
      code: "grant-expired",
      message: `Grant expired at ${record.exp} (now is ${nowSeconds})`,
    };
  }

  if (record.provider !== input.provider) {
    return {
      ok: false,
      code: "grant-mismatched-provider",
      message: `Grant is not valid for provider ${input.provider}`,
    };
  }

  return { ok: true, payload: parsed as unknown as GrantPayload };
}
