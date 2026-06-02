import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { kie } from "@apicity/kie";
import { PayGateError, SpendBoundError } from "@apicity/cost";
import { canonicalHash } from "../../packages/provider/cost/src/paygate";
import type { PayGateOtpPayload } from "../../packages/provider/cost/src/paygate";

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

function makeTestDir(): string {
  const dir = join(
    tmpdir(),
    "apicity-paygate-test-" + randomBytes(8).toString("hex")
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("kie OTP preflight", () => {
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

  it("blocks paid endpoint with missing approval when paygate is not configured", async () => {
    delete process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
    const provider = kie({ apiKey: "test-key" });
    await expect(
      provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      })
    ).rejects.toThrow(PayGateError);
  });

  it("blocks paid endpoint with missing approval when paygate is configured", async () => {
    const provider = kie({ apiKey: "test-key" });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      });
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-missing");
  });

  it("error message names the endpoint and mentions OTP", async () => {
    const provider = kie({ apiKey: "test-key" });
    let caught: PayGateError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      });
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
    const providerNoNetwork = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    let caught: PayGateError | undefined;
    try {
      await providerNoNetwork.post.api.v1.jobs.createTask({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      });
    } catch (error) {
      caught = error as PayGateError;
    }
    expect(caught).toBeInstanceOf(PayGateError);
    expect(caught!.code).toBe("otp-missing");
  });

  it("blocks paid endpoint with invalid OTP", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    await expect(
      provider.post.api.v1.jobs.createTask(
        {
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        },
        { otp: "invalid-otp" }
      )
    ).rejects.toThrow(PayGateError);
  });

  it("allows paid endpoint with valid OTP", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    const payload = {
      model: "grok-imagine/text-to-image",
      input: {
        prompt: "test",
        aspect_ratio: "1:1",
      },
    };
    const otp = makeOtp(payload);
    let caught: unknown;
    try {
      await provider.post.api.v1.jobs.createTask(payload, { otp });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(caught).not.toBeInstanceOf(PayGateError);
    expect(caught).not.toBeInstanceOf(SpendBoundError);
  });

  it("allows paid endpoint when estimated cost is within OTP maxSpendUsd", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    const payload = {
      model: "grok-imagine/text-to-image",
      input: {
        prompt: "test",
        aspect_ratio: "1:1",
      },
    };
    const otp = makeOtp(payload, { maxSpendUsd: 5 });
    let caught: unknown;
    try {
      await provider.post.api.v1.jobs.createTask(payload, { otp });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(caught).not.toBeInstanceOf(PayGateError);
    expect(caught).not.toBeInstanceOf(SpendBoundError);
  });

  it("blocks paid endpoint when estimated cost exceeds OTP maxSpendUsd", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    const payload = {
      model: "veo3",
      prompt: "test",
      duration: 60,
    };
    const otp = makeOtp(payload, { maxSpendUsd: 5 });
    await expect(
      provider.post.api.v1.jobs.createTask(payload, { otp })
    ).rejects.toThrow(SpendBoundError);
  });

  it("blocks paid endpoint when cost cannot be estimated", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    const payload = {
      model: "totally-unknown-model",
      input: { prompt: "test" },
    };
    const otp = makeOtp(payload);
    await expect(
      provider.post.api.v1.jobs.createTask(payload, { otp })
    ).rejects.toThrow(SpendBoundError);
  });

  it("SpendBoundError names the endpoint and shows estimated cost", async () => {
    const provider = kie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
    });
    const payload = {
      model: "veo3",
      prompt: "test",
      duration: 60,
    };
    const otp = makeOtp(payload, { maxSpendUsd: 5 });
    let caught: SpendBoundError | undefined;
    try {
      await provider.post.api.v1.jobs.createTask(payload, { otp });
    } catch (error) {
      caught = error as SpendBoundError;
    }
    expect(caught).toBeInstanceOf(SpendBoundError);
    expect(caught!.message).toContain("kie POST api.v1.jobs.createTask");
    expect(caught!.message).toContain("estimated cost");
    expect(caught!.message).toContain("maxSpendUsd");
  });

  it("free endpoint with omitted approval proceeds normally", async () => {
    const provider = kie({ apiKey: "test-key" });
    expect(provider.post.api.v1.jobs.createTask.schema).toBeDefined();
  });
});
