import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  isPaidEndpoint,
  lookupPaidEndpoint,
  maxSpendPreflight,
  MaxSpendError,
  SpendBoundError,
  dispatchWithPaidGuard,
  spendBoundCheck,
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
 * These tests lock down the contract described in the epic:
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
    it("does not require maxSpend for free endpoints", () => {
      expect(() =>
        maxSpendPreflight("openai", "POST", "v1.chat.completions")
      ).not.toThrow();
      expect(() =>
        maxSpendPreflight("kie", "GET", "api.v1.jobs.recordInfo")
      ).not.toThrow();
      expect(() =>
        maxSpendPreflight("xai", "POST", "v1.chat.completions")
      ).not.toThrow();
    });

    it("dispatchWithPaidGuard passes through free endpoints without maxSpend", async () => {
      const dispatch = async () => "ok";
      const result = await dispatchWithPaidGuard(
        "openai",
        "POST",
        "v1.chat.completions",
        {},
        undefined,
        dispatch
      );
      expect(result).toBe("ok");
    });

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
    it("maxSpendPreflight throws MaxSpendError", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask")
      ).toThrow(MaxSpendError);
    });

    it("dispatchWithPaidGuard throws MaxSpendError before dispatch", async () => {
      let called = false;
      const dispatch = async () => {
        called = true;
        return "ok";
      };
      await expect(
        dispatchWithPaidGuard(
          "kie",
          "POST",
          "api.v1.jobs.createTask",
          {},
          undefined,
          dispatch
        )
      ).rejects.toThrow(MaxSpendError);
      expect(called).toBe(false);
    });

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

  describe("KIE POST api.v1.jobs.createTask blocks when maxSpend = 0", () => {
    it("maxSpendPreflight throws MaxSpendError", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", 0)
      ).toThrow(MaxSpendError);
    });

    it("dispatchWithPaidGuard throws MaxSpendError before dispatch", async () => {
      let called = false;
      const dispatch = async () => {
        called = true;
        return "ok";
      };
      await expect(
        dispatchWithPaidGuard(
          "kie",
          "POST",
          "api.v1.jobs.createTask",
          {},
          0,
          dispatch
        )
      ).rejects.toThrow(MaxSpendError);
      expect(called).toBe(false);
    });

    it("kie provider createTask throws PayGateError with numeric maxSpend", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.jobs.createTask(
          {
            model: "grok-imagine/text-to-image",
            input: {
              prompt: "test",
              aspect_ratio: "1:1",
            },
          },
          0 as unknown as { otp: string }
        );
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
    });
  });

  describe(
    "KIE POST api.v1.jobs.createTask allows with valid OTP and " +
      "estimated spend is within OTP maxSpendUsd",
    () => {
      it("spendBoundCheck does not throw when estimate is within maxSpend", () => {
        expect(() =>
          spendBoundCheck("kie", "POST", "api.v1.jobs.createTask", 5, {
            usd: 3,
            warnings: [],
          })
        ).not.toThrow();
      });

      it("spendBoundCheck does not throw when estimate equals maxSpend", () => {
        expect(() =>
          spendBoundCheck("kie", "POST", "api.v1.jobs.createTask", 5, {
            usd: 5,
            warnings: [],
          })
        ).not.toThrow();
      });

      it("dispatchWithPaidGuard allows when maxSpend is sufficient", async () => {
        const dispatch = async () => "ok";
        const result = await dispatchWithPaidGuard(
          "kie",
          "POST",
          "api.v1.jobs.createTask",
          {
            model: "grok-imagine/text-to-image",
            input: {
              prompt: "test",
              aspect_ratio: "1:1",
            },
          },
          5,
          dispatch
        );
        expect(result).toBe("ok");
      });

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
    it("dispatchWithPaidGuard does not call dispatch when maxSpend is omitted", async () => {
      let called = false;
      const dispatch = async () => {
        called = true;
        return "ok";
      };
      try {
        await dispatchWithPaidGuard(
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

    it("dispatchWithPaidGuard does not call dispatch when maxSpend = 0", async () => {
      let called = false;
      const dispatch = async () => {
        called = true;
        return "ok";
      };
      try {
        await dispatchWithPaidGuard(
          "kie",
          "POST",
          "api.v1.jobs.createTask",
          {},
          0,
          dispatch
        );
      } catch {
        // expected
      }
      expect(called).toBe(false);
    });

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
    it("MaxSpendError names the endpoint and shows maxSpend", () => {
      let caught: MaxSpendError | undefined;
      try {
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask");
      } catch (error) {
        caught = error as MaxSpendError;
      }
      expect(caught).toBeInstanceOf(MaxSpendError);
      expect(caught!.message).toContain("kie POST api.v1.jobs.createTask");
      expect(caught!.message).toContain("maxSpend is 0 USD");
      expect(caught!.message).toContain("Pass an explicit maxSpend");
    });

    it("MaxSpendError includes structured fields", () => {
      let caught: MaxSpendError | undefined;
      try {
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", 0);
      } catch (error) {
        caught = error as MaxSpendError;
      }
      expect(caught!.provider).toBe("kie");
      expect(caught!.method).toBe("POST");
      expect(caught!.dotPath).toBe("api.v1.jobs.createTask");
      expect(caught!.maxSpend).toBe(0);
    });

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
