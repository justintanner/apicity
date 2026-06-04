import { describe, it, expect } from "vitest";
import { createHmac, randomBytes } from "node:crypto";

import {
  verifyOtp,
  canonicalHash,
  type PayGateOtpPayload,
} from "../../packages/provider/cost/src/paygate";

function b64url(b: Buffer): string {
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function mintRaw(secret: string, payload: PayGateOtpPayload): string {
  const seg = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(createHmac("sha256", secret).update(seg).digest());
  return `${seg}.${sig}`;
}

function mintTestOtp(
  secret: string,
  payload: Omit<PayGateOtpPayload, "v">
): string {
  return mintRaw(secret, { v: 1, ...payload });
}

const SECRET = "test-secret";

const expected = {
  provider: "kie",
  method: "POST",
  dotPath: "api.v1.jobs.createTask",
};

const noJtiConsumed = () => false;
const alwaysJtiConsumed = () => true;

describe("verifyOtp — pure tagged-union verifier", () => {
  it("returns ok for a fresh, well-formed OTP that binds to the expected call", () => {
    const payload = { model: "grok-imagine/text-to-image", input: {} };
    const payloadHash = canonicalHash(payload);
    const otp = mintTestOtp(SECRET, {
      jti: "jti-1",
      ...expected,
      requestHash: payloadHash,
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash,
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result).toEqual({ ok: true, jti: "jti-1" });
  });

  it("returns otp-malformed for envelope with no dot", () => {
    const result = verifyOtp({
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash({}),
      otp: "not-a-valid-envelope",
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-malformed");
  });

  it("returns otp-invalid-signature when signed by the wrong key", () => {
    const payload = { model: "x" };
    const otp = mintTestOtp("other-secret", {
      jti: "jti-1",
      ...expected,
      requestHash: canonicalHash(payload),
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-invalid-signature");
  });

  it("returns otp-expired when nowSeconds is past exp", () => {
    const payload = { model: "x" };
    const otp = mintTestOtp(SECRET, {
      jti: "jti-1",
      ...expected,
      requestHash: canonicalHash(payload),
      iat: 1000,
      exp: 1100,
    });
    const result = verifyOtp({
      nowSeconds: 2000,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-expired");
  });

  it("returns otp-mismatched-request for wrong provider/method/dotPath", () => {
    const payload = { model: "x" };
    const otp = mintTestOtp(SECRET, {
      jti: "jti-1",
      provider: "other",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(payload),
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-mismatched-request");
  });

  it("returns otp-mismatched-request when the request hash differs", () => {
    const otp = mintTestOtp(SECRET, {
      jti: "jti-1",
      ...expected,
      requestHash:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash({ model: "different" }),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-mismatched-request");
  });

  it("returns otp-replayed when the ledger lookup says the jti is consumed", () => {
    const payload = { model: "x" };
    const otp = mintTestOtp(SECRET, {
      jti: randomBytes(16).toString("hex"),
      ...expected,
      requestHash: canonicalHash(payload),
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: alwaysJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-replayed");
  });

  it("is referentially transparent — same inputs return equal results", () => {
    const payload = { model: "x" };
    const otp = mintTestOtp(SECRET, {
      jti: "jti-stable",
      ...expected,
      requestHash: canonicalHash(payload),
      iat: 1000,
      exp: 2000,
    });
    const input = {
      nowSeconds: 1500,
      secret: SECRET,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    };
    expect(verifyOtp(input)).toEqual(verifyOtp(input));
  });
});
