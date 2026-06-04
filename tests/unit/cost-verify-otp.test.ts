import { describe, it, expect } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";

import {
  verifyOtp,
  canonicalHash,
  type PayGateOtpPayload,
} from "../../packages/provider/cost/src/paygate";

function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function mintTestOtp(
  privateKeyPem: string,
  payload: Omit<PayGateOtpPayload, "v">
): string {
  const fullPayload: PayGateOtpPayload = { v: 1, ...payload };
  const payloadJson = JSON.stringify(fullPayload);
  const payloadSegment = base64urlEncode(Buffer.from(payloadJson, "utf8"));
  const signature = sign(
    null,
    Buffer.from(payloadSegment, "utf8"),
    privateKeyPem
  );
  const signatureSegment = base64urlEncode(signature);
  return `${payloadSegment}.${signatureSegment}`;
}

const expected = {
  provider: "kie",
  method: "POST",
  dotPath: "api.v1.jobs.createTask",
};

function freshKeys() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

const noJtiConsumed = () => false;
const alwaysJtiConsumed = () => true;

describe("verifyOtp — pure tagged-union verifier", () => {
  it("returns ok for a fresh, well-formed OTP that binds to the expected call", () => {
    const { publicKey, privateKey } = freshKeys();
    const payload = { model: "grok-imagine/text-to-image", input: {} };
    const payloadHash = canonicalHash(payload);
    const otp = mintTestOtp(privateKey, {
      jti: "jti-1",
      ...expected,
      requestHash: payloadHash,
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash,
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result).toEqual({ ok: true, jti: "jti-1", maxSpendUsd: 5 });
  });

  it("returns otp-malformed for envelope with no dot", () => {
    const { publicKey } = freshKeys();
    const result = verifyOtp({
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash({}),
      otp: "not-a-valid-envelope",
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-malformed");
  });

  it("returns otp-invalid-signature when signed by the wrong key", () => {
    const { publicKey } = freshKeys();
    const { privateKey: otherKey } = freshKeys();
    const payload = { model: "x" };
    const otp = mintTestOtp(otherKey, {
      jti: "jti-1",
      ...expected,
      requestHash: canonicalHash(payload),
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-invalid-signature");
  });

  it("returns otp-expired when nowSeconds is past exp", () => {
    const { publicKey, privateKey } = freshKeys();
    const payload = { model: "x" };
    const otp = mintTestOtp(privateKey, {
      jti: "jti-1",
      ...expected,
      requestHash: canonicalHash(payload),
      maxSpendUsd: 5,
      iat: 1000,
      exp: 1100,
    });
    const result = verifyOtp({
      nowSeconds: 2000,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-expired");
  });

  it("returns otp-mismatched-request for wrong provider/method/dotPath", () => {
    const { publicKey, privateKey } = freshKeys();
    const payload = { model: "x" };
    const otp = mintTestOtp(privateKey, {
      jti: "jti-1",
      provider: "other",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(payload),
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-mismatched-request");
  });

  it("returns otp-mismatched-request when the request hash differs", () => {
    const { publicKey, privateKey } = freshKeys();
    const otp = mintTestOtp(privateKey, {
      jti: "jti-1",
      ...expected,
      requestHash:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash({ model: "different" }),
      otp,
      isJtiConsumed: noJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-mismatched-request");
  });

  it("returns otp-replayed when the ledger lookup says the jti is consumed", () => {
    const { publicKey, privateKey } = freshKeys();
    const payload = { model: "x" };
    const otp = mintTestOtp(privateKey, {
      jti: randomBytes(16).toString("hex"),
      ...expected,
      requestHash: canonicalHash(payload),
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const result = verifyOtp({
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: alwaysJtiConsumed,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp-replayed");
  });

  it("is referentially transparent — same inputs return equal results", () => {
    const { publicKey, privateKey } = freshKeys();
    const payload = { model: "x" };
    const otp = mintTestOtp(privateKey, {
      jti: "jti-stable",
      ...expected,
      requestHash: canonicalHash(payload),
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const input = {
      nowSeconds: 1500,
      publicKeyPem: publicKey,
      expected,
      payloadHash: canonicalHash(payload),
      otp,
      isJtiConsumed: noJtiConsumed,
    };
    expect(verifyOtp(input)).toEqual(verifyOtp(input));
  });
});
