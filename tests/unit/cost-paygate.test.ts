import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  PayGateError,
  PayGateOtpPayload,
  canonicalizeJson,
  canonicalHash,
  parseOtp,
  verifyOtpSignature,
  isJtiConsumed,
  consumeJti,
  dispatchWithPaidGate,
} from "../../packages/provider/cost/src/paygate";

import { SpendBoundError } from "../../packages/provider/cost/src/paid-endpoints";

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
 * Mint a test OTP signed with the given private key PEM.
 */
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

function makeTestDir(): string {
  const dir = join(
    tmpdir(),
    "apicity-paygate-test-" + randomBytes(8).toString("hex")
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("canonicalizeJson", () => {
  it("serializes primitives", () => {
    expect(canonicalizeJson(null)).toBe("null");
    expect(canonicalizeJson(true)).toBe("true");
    expect(canonicalizeJson(42)).toBe("42");
    expect(canonicalizeJson("hello")).toBe('"hello"');
  });

  it("sorts object keys recursively", () => {
    expect(canonicalizeJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalizeJson({ z: { c: 1, a: 2 } })).toBe('{"z":{"a":2,"c":1}}');
  });

  it("preserves array order", () => {
    expect(canonicalizeJson([3, 1, 2])).toBe("[3,1,2]");
  });

  it("rejects undefined", () => {
    expect(() => canonicalizeJson({ a: undefined })).toThrow(TypeError);
  });

  it("rejects functions", () => {
    expect(() => canonicalizeJson({ a: () => 1 })).toThrow(TypeError);
  });

  it("rejects circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(() => canonicalizeJson(obj)).toThrow(TypeError);
  });
});

describe("canonicalHash", () => {
  it("returns sha256: prefix", () => {
    const hash = canonicalHash({ a: 1 });
    expect(hash.startsWith("sha256:")).toBe(true);
    expect(hash.length).toBe("sha256:".length + 64);
  });

  it("is deterministic for same input", () => {
    expect(canonicalHash({ b: 2, a: 1 })).toBe(canonicalHash({ a: 1, b: 2 }));
  });
});

describe("parseOtp", () => {
  it("parses a valid OTP", () => {
    const { privateKey } = generateKeyPairSync("ed25519", {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const otp = mintTestOtp(privateKey, {
      jti: "abc123",
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: "sha256:deadbeef",
      maxSpendUsd: 5,
      iat: 1000,
      exp: 2000,
    });
    const parsed = parseOtp(otp);
    expect(parsed.payload.provider).toBe("kie");
    expect(parsed.payload.jti).toBe("abc123");
    expect(parsed.signature.length).toBeGreaterThan(0);
  });

  it("throws on malformed OTP (no dot)", () => {
    expect(() => parseOtp("notadot")).toThrow(
      "OTP must contain exactly one '.' separator"
    );
  });

  it("throws on invalid JSON payload", () => {
    expect(() => parseOtp("bm90anNvbg.notjson")).toThrow(
      "OTP payload is not valid JSON"
    );
  });

  it("throws on missing fields", () => {
    const payloadJson = JSON.stringify({ v: 1 });
    const segment = base64urlEncode(Buffer.from(payloadJson, "utf8"));
    expect(() => parseOtp(`${segment}.sig`)).toThrow(
      "OTP payload missing required fields"
    );
  });
});

describe("verifyOtpSignature", () => {
  it("accepts valid signature", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const payload = "testpayload";
    const signature = sign(null, Buffer.from(payload, "utf8"), privateKey);
    expect(verifyOtpSignature(payload, signature, publicKey)).toBe(true);
  });

  it("rejects invalid signature", () => {
    const { publicKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const fakeSignature = randomBytes(64);
    expect(verifyOtpSignature("testpayload", fakeSignature, publicKey)).toBe(
      false
    );
  });
});

describe("replay ledger", () => {
  let ledgerPath: string;
  let testDir: string;

  beforeEach(() => {
    testDir = makeTestDir();
    ledgerPath = join(testDir, "ledger.jsonl");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("isJtiConsumed returns false for unknown jti", () => {
    expect(isJtiConsumed("unknown", ledgerPath)).toBe(false);
  });

  it("consumeJti records a jti", () => {
    consumeJti("jti-1", ledgerPath);
    expect(isJtiConsumed("jti-1", ledgerPath)).toBe(true);
    expect(isJtiConsumed("jti-2", ledgerPath)).toBe(false);
  });

  it("consumeJti creates directories if needed", () => {
    const deepDir = join(testDir, "a", "b", "ledger.jsonl");
    consumeJti("jti-deep", deepDir);
    expect(isJtiConsumed("jti-deep", deepDir)).toBe(true);
  });

  it("skips malformed lines in ledger", () => {
    writeFileSync(ledgerPath, "not json\n{\n", "utf8");
    expect(isJtiConsumed("jti-1", ledgerPath)).toBe(false);
  });
});

describe("dispatchWithPaidGate", () => {
  let publicKeyPem: string;
  let privateKeyPem: string;
  let publicKeyPath: string;
  let testDir: string;

  beforeEach(() => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    publicKeyPem = publicKey;
    privateKeyPem = privateKey;
    testDir = makeTestDir();
    publicKeyPath = join(testDir, "public.pem");
    writeFileSync(publicKeyPath, publicKeyPem, "utf8");
    process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH = publicKeyPath;
  });

  afterEach(() => {
    delete process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  function makeOtp(
    payload: Record<string, unknown>,
    overrides: Partial<PayGateOtpPayload> = {}
  ): string {
    const now = Math.floor(Date.now() / 1000);
    return mintTestOtp(privateKeyPem, {
      jti: randomBytes(16).toString("hex"),
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(payload),
      maxSpendUsd: 10,
      iat: now,
      exp: now + 3600,
      ...overrides,
    });
  }

  it("passes through for free endpoints without approval", async () => {
    const dispatch = async () => "ok";
    const result = await dispatchWithPaidGate(
      "openai",
      "POST",
      "v1.chat.completions",
      {},
      undefined,
      dispatch
    );
    expect(result).toBe("ok");
  });

  it("passes through for free endpoints with approval", async () => {
    const dispatch = async () => "ok";
    const result = await dispatchWithPaidGate(
      "openai",
      "POST",
      "v1.chat.completions",
      {},
      { otp: "anything" },
      dispatch
    );
    expect(result).toBe("ok");
  });

  it("throws paygate-not-configured when public key is missing", async () => {
    delete process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
    const dispatch = async () => "ok";
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "test" },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "test" },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("paygate-not-configured");
    }
  });

  it("throws otp-missing when approval is omitted", async () => {
    const dispatch = async () => "ok";
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        undefined,
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        undefined,
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-missing");
    }
  });

  it("throws otp-missing when approval has no otp", async () => {
    const dispatch = async () => "ok";
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "" },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "" },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-missing");
    }
  });

  it("throws otp-malformed for invalid OTP", async () => {
    const dispatch = async () => "ok";
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "notavalidotp" },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "notavalidotp" },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-malformed");
    }
  });

  it("throws otp-invalid-signature for forged OTP", async () => {
    const dispatch = async () => "ok";
    const { privateKey: otherPrivateKey } = generateKeyPairSync("ed25519", {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const forgedOtp = mintTestOtp(otherPrivateKey, {
      jti: "forged",
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash({}),
      maxSpendUsd: 10,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: forgedOtp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: forgedOtp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-invalid-signature");
    }
  });

  it("throws otp-expired for expired OTP", async () => {
    const dispatch = async () => "ok";
    const now = Math.floor(Date.now() / 1000);
    const expiredOtp = makeOtp({}, { exp: now - 1 });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: expiredOtp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: expiredOtp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-expired");
    }
  });

  it("throws otp-mismatched-request for wrong provider", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, { provider: "other" });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-mismatched-request for wrong method", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, { method: "GET" });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-mismatched-request for wrong dotPath", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, { dotPath: "other.path" });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-mismatched-request for wrong request hash", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, {
      requestHash:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-replayed for reused OTP", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload);
    // First call succeeds
    await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      payload,
      { otp },
      dispatch
    );
    // Second call fails
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(PayGateError);
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      );
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-replayed");
    }
  });

  it("throws SpendBoundError when estimate exceeds maxSpendUsd", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, { maxSpendUsd: 0.01 });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(SpendBoundError);
  });

  it("throws SpendBoundError when cost cannot be estimated", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "unknown-model" };
    const otp = makeOtp(payload);
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow(SpendBoundError);
  });

  it("allows paid endpoint with valid OTP and dispatches", async () => {
    const dispatch = async () => "ok";
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, { maxSpendUsd: 100 });
    const result = await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      payload,
      { otp },
      dispatch
    );
    expect(result).toBe("ok");
  });

  it("does not call dispatch when gate blocks", async () => {
    let called = false;
    const dispatch = async () => {
      called = true;
      return "ok";
    };
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        undefined,
        dispatch
      );
    } catch {
      // expected
    }
    expect(called).toBe(false);
  });

  it("propagates dispatch errors after gate passes", async () => {
    const dispatch = async () => {
      throw new Error("network failure");
    };
    const payload = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = makeOtp(payload, { maxSpendUsd: 100 });
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch
      )
    ).rejects.toThrow("network failure");
  });
});
