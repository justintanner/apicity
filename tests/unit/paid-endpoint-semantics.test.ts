import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  isPaidEndpoint,
  lookupPaidEndpoint,
  SpendBoundError,
} from "../../packages/provider/cost/src/paid-endpoints";
import { PayGateError } from "../../packages/provider/cost/src/paygate";
import { canonicalHash } from "../../packages/provider/cost/src/paygate";
import type { PayGateOtpPayload } from "../../packages/provider/cost/src/paygate";
import { kie } from "@apicity/kie";

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

/**
 * Regression tests for paid-endpoint semantics.
 *
 * These lock down the contract:
 * - Unlisted endpoints are free (no OTP required).
 * - Listed paid endpoints block when OTP is missing or invalid.
 * - Listed paid endpoints allow when a valid OTP is provided and the estimate
 *   is within the OTP's maxSpendUsd bound.
 * - Matching is exact (no prefix, wildcard, regex, or sibling match).
 * - Blocking happens before HTTP dispatch.
 */
describe("paid endpoint semantics — regression", () => {
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

  describe("unlisted endpoints are treated as free", () => {
    it("isPaidEndpoint returns false for unlisted endpoints", () => {
      expect(isPaidEndpoint("openai", "POST", "v1.chat.completions")).toBe(
        false
      );
      expect(isPaidEndpoint("kie", "GET", "api.v1.jobs.recordInfo")).toBe(
        false
      );
      expect(isPaidEndpoint("xai", "POST", "v1.chat.completions")).toBe(false);
    });
  });

  describe("KIE POST api.v1.jobs.createTask blocks when OTP is missing", () => {
    it("kie provider createTask throws PayGateError without network call", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
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
  });

  describe(
    "KIE POST api.v1.jobs.createTask allows with valid OTP and " +
      "estimated spend is within OTP maxSpendUsd",
    () => {
      it("kie provider createTask does not throw with valid OTP", async () => {
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
    }
  );

  describe(
    "exact matching only: no regex, prefix, wildcard, or sibling " +
      "endpoint match can mark an endpoint paid",
    () => {
      it("lookupPaidEndpoint returns undefined for prefix match", () => {
        expect(
          lookupPaidEndpoint("kie", "POST", "api.v1.jobs")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for suffix match", () => {
        expect(
          lookupPaidEndpoint("kie", "POST", "v1.jobs.createTask")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for sibling endpoint", () => {
        expect(
          lookupPaidEndpoint("kie", "POST", "api.v1.jobs.recordInfo")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for different method", () => {
        expect(
          lookupPaidEndpoint("kie", "GET", "api.v1.jobs.createTask")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for different provider", () => {
        expect(
          lookupPaidEndpoint("xai", "POST", "api.v1.jobs.createTask")
        ).toBeUndefined();
      });

      it("isPaidEndpoint returns false for all nearby endpoint names", () => {
        expect(isPaidEndpoint("kie", "POST", "api.v1.jobs")).toBe(false);
        expect(isPaidEndpoint("kie", "POST", "v1.jobs.createTask")).toBe(false);
        expect(isPaidEndpoint("kie", "POST", "api.v1.jobs.recordInfo")).toBe(
          false
        );
        expect(isPaidEndpoint("kie", "GET", "api.v1.jobs.createTask")).toBe(
          false
        );
        expect(isPaidEndpoint("xai", "POST", "api.v1.jobs.createTask")).toBe(
          false
        );
      });
    }
  );

  describe("blocking happens before HTTP dispatch", () => {
    it("kie provider does not make a network request when OTP is missing", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
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
  });

  describe("error messages are actionable", () => {
    it("PayGateError names the endpoint and mentions OTP", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
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
  });
});
