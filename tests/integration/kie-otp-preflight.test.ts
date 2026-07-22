import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { CreateTaskRequestSchema } from "@apicity/kie/zod";
import { PayGateError, canonicalHash } from "@apicity/cost";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

// ---------------------------------------------------------------------------
// Local raw HMAC mint, used only to craft edge-case OTPs the public
// `mintKieCreateTaskOtp` helper cannot produce (expired exp, wrong secret).
// Mirrors the envelope format in packages/provider/cost/src/paygate.ts.
// ---------------------------------------------------------------------------
function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function mintRaw(secret: string, payload: Record<string, unknown>): string {
  const segment = base64urlEncode(
    Buffer.from(JSON.stringify({ v: 1, ...payload }), "utf8")
  );
  const signature = base64urlEncode(
    createHmac("sha256", secret).update(segment, "utf8").digest()
  );
  return `${segment}.${signature}`;
}

const REQUEST = {
  model: "grok-imagine/text-to-image",
  input: {
    prompt: "test",
    aspect_ratio: "1:1",
  },
} satisfies MediaGenerationRequest;

// Builds a syntactically valid OTP envelope bound to REQUEST but with caller
// chosen field overrides (used for the expired / wrong-secret cases).
function craftOtp(
  secret: string,
  overrides: Record<string, unknown> = {}
): string {
  const now = Math.floor(Date.now() / 1000);
  return mintRaw(secret, {
    jti: "test-jti-" + now,
    provider: "kie",
    method: "POST",
    dotPath: "api.v1.jobs.createTask",
    requestHash: canonicalHash(REQUEST),
    iat: now,
    exp: now + 600,
    ...overrides,
  });
}

describe("kie OTP preflight", () => {
  // -- No-bypass guarantee: a paid endpoint cannot fire without a configured
  //    pay gate. ---------------------------------------------------------------
  it("blocks paid endpoint when paygate is not configured", async () => {
    const provider = createKie({ apiKey: "test-key" });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST);
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("paygate-not-configured");
  });

  // -- With paygate but no approval -> otp-missing. ---------------------------
  it("blocks paid endpoint with missing approval when paygate is configured", async () => {
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST);
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-missing");
  });

  it("error names the endpoint and mentions OTP", async () => {
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST);
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.provider).toBe("kie");
    expect(caught!.method).toBe("POST");
    expect(caught!.dotPath).toBe("api.v1.jobs.createTask");
    expect(caught!.message).toContain("OTP");
  });

  it("does not make a network request when approval is missing", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST);
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-missing");
  });

  // -- Malformed OTP string. --------------------------------------------------
  it("blocks paid endpoint with a malformed OTP", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, {
        otp: "not-a-valid-otp",
      });
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-malformed");
  });

  // -- Wrong secret -> otp-invalid-signature. ---------------------------------
  it("blocks paid endpoint with an OTP signed by the wrong secret", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const otp = craftOtp("a-different-secret");
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, { otp });
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-invalid-signature");
  });

  // -- OTP minted for a different payload -> otp-mismatched-request. ----------
  it("blocks paid endpoint when the OTP is bound to a different request", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const { otp } = mintKieCreateTaskOtp({
      model: "grok-imagine/text-to-image",
      input: { prompt: "a completely different prompt", aspect_ratio: "16:9" },
    });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, { otp });
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-mismatched-request");
  });

  // -- Expired OTP -> otp-expired. --------------------------------------------
  it("blocks paid endpoint with an expired OTP", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const otp = craftOtp(TEST_PAYGATE_SECRET, { iat: 1, exp: 2 });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, { otp });
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-expired");
  });

  // -- Replay: single-use jti per provider instance -> otp-replayed. ----------
  it("blocks a replayed OTP on the same provider instance", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const { otp } = mintKieCreateTaskOtp(REQUEST);

    // First use: the OTP verifies and the gate consumes its jti before
    // dispatch. Dispatch then fails at the (unroutable) network layer, which
    // is NOT a PayGateError.
    let first: unknown;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, { otp });
    } catch (error) {
      first = error;
    }
    expect(first).toBeDefined();
    expect(first).not.toBeInstanceOf(PayGateError);

    // Second use of the same token: the jti is already consumed.
    let second: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, { otp });
    } catch (error) {
      second = error as PayGateError;
    }
    expect(second).toBeInstanceOf(PayGateError);
    expect(second!.code).toBe("otp-replayed");
  });

  // -- Happy path: a valid OTP passes the gate and dispatch runs. The OTP is
  //    verified locally and never sent over the wire, so this case does not
  //    require a recording — getting past the gate is proven by the error NOT
  //    being a PayGateError (it fails at the unroutable network layer). --------
  it("allows paid endpoint with a valid OTP", async () => {
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const { otp } = mintKieCreateTaskOtp(REQUEST);
    let caught: unknown;
    try {
      await provider.post.api.v1.jobs.createTask(REQUEST, { otp });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(caught).not.toBeInstanceOf(PayGateError);
  });

  // -- Sanity: the endpoint still exposes its payload schema. ------------------
  it("paid endpoint still exposes its payload schema", () => {
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.post.api.v1.jobs.createTask.schema).toBe(
      CreateTaskRequestSchema
    );
  });
});
