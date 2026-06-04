import { describe, it, expect } from "vitest";
import { createHmac, randomBytes } from "node:crypto";

import {
  PayGateError,
  PayGateConfig,
  PayGateOtpPayload,
  ReplayStore,
  canonicalizeJson,
  canonicalHash,
  parseOtp,
  mintOtp,
  createReplayStore,
  dispatchWithPaidGate,
} from "../../packages/provider/cost/src/paygate";

const SECRET = "test-secret";

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
 * Mint an OTP from a raw payload object, signed with an HMAC secret. Unlike
 * `mintOtp`, this gives the test full control over every payload field (jti,
 * iat, exp, provider, method, dotPath, requestHash) so failure cases can be
 * constructed deterministically.
 */
function mintRaw(secret: string, payload: PayGateOtpPayload): string {
  const segment = base64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = base64urlEncode(
    createHmac("sha256", secret).update(segment, "utf8").digest()
  );
  return `${segment}.${signature}`;
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
    const otp = mintRaw(SECRET, {
      v: 1,
      jti: "abc123",
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: "sha256:deadbeef",
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

describe("mintOtp", () => {
  it("resolves provider/method from dotPath via PAID_ENDPOINTS", () => {
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request: { model: "wan/2-7-text-to-video" },
    });
    const { payload } = parseOtp(otp);
    expect(payload.provider).toBe("kie");
    expect(payload.method).toBe("POST");
    expect(payload.dotPath).toBe("api.v1.jobs.createTask");
  });

  it("binds requestHash to the canonical request", () => {
    const request = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request,
    });
    const { payload } = parseOtp(otp);
    expect(payload.requestHash).toBe(canonicalHash(request));
  });

  it("applies a default 600s TTL", () => {
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request: {},
    });
    const { payload } = parseOtp(otp);
    expect(payload.exp - payload.iat).toBe(600);
  });

  it("honours a string TTL", () => {
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request: {},
      ttl: "1h",
    });
    const { payload } = parseOtp(otp);
    expect(payload.exp - payload.iat).toBe(3600);
  });

  it("rejects an empty secret", () => {
    expect(() =>
      mintOtp("", { dotPath: "api.v1.jobs.createTask", request: {} })
    ).toThrow();
  });
});

describe("dispatchWithPaidGate", () => {
  const NOW_MS = 1_700_000_000_000;
  const NOW_SECONDS = Math.floor(NOW_MS / 1000);

  /**
   * Build a fresh gate config with a controlled clock and an isolated,
   * in-memory replay store.
   */
  function makeConfig(overrides: Partial<PayGateConfig> = {}): PayGateConfig {
    return {
      secret: SECRET,
      replayStore: createReplayStore(),
      now: () => NOW_MS,
      ...overrides,
    };
  }

  /**
   * Mint an OTP for the canonical kie createTask endpoint with controllable
   * payload field overrides. Defaults to a valid, not-yet-expired token bound
   * to `request`.
   */
  function makeOtp(
    request: Record<string, unknown>,
    overrides: Partial<PayGateOtpPayload> = {},
    secret = SECRET
  ): string {
    return mintRaw(secret, {
      v: 1,
      jti: randomBytes(16).toString("hex"),
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(request),
      iat: NOW_SECONDS - 60,
      exp: NOW_SECONDS + 3600,
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

  it("throws paygate-not-configured when no config is supplied", async () => {
    const dispatch = async () => "ok";
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "test" },
        dispatch
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("paygate-not-configured");
    }
  });

  it("throws paygate-not-configured when the secret is empty", async () => {
    const dispatch = async () => "ok";
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "test" },
        dispatch,
        makeConfig({ secret: "" })
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("paygate-not-configured");
    }
  });

  it("throws otp-missing when approval is omitted", async () => {
    const dispatch = async () => "ok";
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        undefined,
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-missing");
    }
  });

  it("throws otp-missing when approval has no otp", async () => {
    const dispatch = async () => "ok";
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "" },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-missing");
    }
  });

  it("throws otp-malformed for invalid OTP", async () => {
    const dispatch = async () => "ok";
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: "notavalidotp" },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-malformed");
    }
  });

  it("throws otp-invalid-signature for an OTP signed with the wrong secret", async () => {
    const dispatch = async () => "ok";
    const forgedOtp = makeOtp({}, {}, "wrong-secret");
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: forgedOtp },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-invalid-signature");
    }
  });

  it("throws otp-expired for expired OTP", async () => {
    const dispatch = async () => "ok";
    const expiredOtp = makeOtp({}, { exp: NOW_SECONDS - 1 });
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        { otp: expiredOtp },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-expired");
    }
  });

  it("throws otp-mismatched-request for wrong provider", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload, { provider: "other" });
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-mismatched-request for wrong method", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload, { method: "GET" });
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-mismatched-request for wrong dotPath", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload, { dotPath: "other.path" });
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-mismatched-request for wrong request hash", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload, {
      requestHash:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    });
    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        makeConfig()
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-mismatched-request");
    }
  });

  it("throws otp-replayed when the jti is already in the store", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const jti = randomBytes(16).toString("hex");
    const otp = makeOtp(payload, { jti });

    const store: ReplayStore = createReplayStore();
    store.add(jti);

    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        makeConfig({ replayStore: store })
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-replayed");
    }
  });

  it("rejects a second dispatch with the same OTP (consumed before dispatch)", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload);
    const config = makeConfig();

    const first = await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      payload,
      { otp },
      dispatch,
      config
    );
    expect(first).toBe("ok");

    try {
      await dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        config
      );
      throw new Error("expected PayGateError");
    } catch (e) {
      expect(e).toBeInstanceOf(PayGateError);
      expect((e as PayGateError).code).toBe("otp-replayed");
    }
  });

  it("allows a paid endpoint with a valid OTP and dispatches", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload);
    const result = await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      payload,
      { otp },
      dispatch,
      makeConfig()
    );
    expect(result).toBe("ok");
  });

  it("accepts an OTP minted by mintOtp end-to-end", async () => {
    const dispatch = async () => "ok";
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request: payload,
    });
    // mintOtp uses Date.now for iat/exp, so let the gate use the real clock.
    const result = await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      payload,
      { otp },
      dispatch,
      { secret: SECRET, replayStore: createReplayStore() }
    );
    expect(result).toBe("ok");
  });

  it("does not call dispatch when the gate blocks", async () => {
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
        dispatch,
        makeConfig()
      );
    } catch {
      // expected
    }
    expect(called).toBe(false);
  });

  it("propagates dispatch errors after the gate passes", async () => {
    const dispatch = async () => {
      throw new Error("network failure");
    };
    const payload = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = makeOtp(payload);
    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        payload,
        { otp },
        dispatch,
        makeConfig()
      )
    ).rejects.toThrow("network failure");
  });
});
