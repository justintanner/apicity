import { describe, it, expect } from "vitest";
import { sign, generateKeyPairSync } from "node:crypto";

import {
  dispatchWithPaidGate,
  canonicalHash,
  type PayGateIo,
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

function makeInMemoryIo(publicKeyPem: string): PayGateIo & {
  ledger: Set<string>;
} {
  const ledger = new Set<string>();
  return {
    now: () => 1_500_000,
    loadPublicKey: () => publicKeyPem,
    isJtiConsumed: (jti) => ledger.has(jti),
    consumeJti: (jti) => {
      ledger.add(jti);
    },
    ledger,
  };
}

/**
 * Invariant: the OTP jti is consumed BEFORE `dispatch()` runs. If dispatch
 * later throws (network error, upstream 5xx, abort), the jti remains in the
 * ledger and a retry must mint a fresh OTP.
 *
 * This is intentional — without it, a hostile caller could replay an OTP on
 * every transient failure.
 */
describe("dispatchWithPaidGate — jti consumption timing", () => {
  it("consumes the jti before dispatch is invoked", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const io = makeInMemoryIo(publicKey);
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const jti = "jti-pre-dispatch";
    const nowSec = Math.floor(io.now() / 1000);
    const otp = mintTestOtp(privateKey, {
      jti,
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(payload),
      maxSpendUsd: 100,
      iat: nowSec - 10,
      exp: nowSec + 3600,
    });

    let ledgerSnapshotDuringDispatch: boolean | undefined;
    const dispatch = async () => {
      ledgerSnapshotDuringDispatch = io.isJtiConsumed(jti);
      return "ok";
    };

    const result = await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      payload,
      { otp },
      dispatch,
      io
    );
    expect(result).toBe("ok");
    expect(ledgerSnapshotDuringDispatch).toBe(true);
  });

  it("leaves the jti consumed when dispatch throws", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const io = makeInMemoryIo(publicKey);
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const jti = "jti-dispatch-failure";
    const nowSec = Math.floor(io.now() / 1000);
    const otp = mintTestOtp(privateKey, {
      jti,
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(payload),
      maxSpendUsd: 100,
      iat: nowSec - 10,
      exp: nowSec + 3600,
    });

    const dispatch = async () => {
      throw new Error("simulated network failure");
    };

    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        io
      )
    ).rejects.toThrow("simulated network failure");

    expect(io.isJtiConsumed(jti)).toBe(true);
  });
});
