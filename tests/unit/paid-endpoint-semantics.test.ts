import { describe, it, expect, vi } from "vitest";
import {
  isPaidEndpoint,
  lookupPaidEndpoint,
  PayGateError,
} from "@apicity/cost";
import { createKie } from "@apicity/kie";
import {
  TEST_PAYGATE_SECRET,
  mintKieCreateTaskOtp,
  mintKieVeoOtp,
} from "../harness";

/**
 * Regression tests for paid-endpoint semantics.
 *
 * These lock down the contract:
 * - Unlisted endpoints are free (no OTP, no pay gate required).
 * - Listed paid endpoints fail closed when no pay gate is configured.
 * - Listed paid endpoints block when the OTP is missing.
 * - Listed paid endpoints allow when a valid, request-bound OTP is provided.
 * - The OTP is bound to the exact request (tampering invalidates it).
 * - An OTP is single-use on a given provider instance (replay is rejected).
 * - Matching is exact (no prefix, wildcard, regex, or sibling match).
 * - Blocking happens before HTTP dispatch.
 */
describe("paid endpoint semantics — regression", () => {
  const REQUEST = {
    model: "grok-imagine/text-to-image",
    input: {
      prompt: "test",
      aspect_ratio: "1:1",
    },
  };
  const VEO_GENERATE_REQUEST = {
    prompt: "A short product reveal video",
    model: "veo3",
  } as const;
  const VEO_EXTEND_REQUEST = {
    taskId: "veo-task-1",
    prompt: "Continue the camera move",
    model: "quality",
  } as const;
  const ELEVENLABS_TTS_REQUEST = {
    model: "elevenlabs/text-to-speech-turbo-2-5",
    input: {
      text: "A short paygate regression test.",
      voice: "Rachel",
    },
  } as const;

  function makeGatedProvider() {
    return createKie({
      apiKey: "test-key",
      baseURL: "http://localhost:99999",
      paygate: { secret: TEST_PAYGATE_SECRET },
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
      expect(isPaidEndpoint("kie", "POST", "api.file-url-upload")).toBe(false);
      expect(isPaidEndpoint("kie", "POST", "api.v1.common.downloadUrl")).toBe(
        false
      );
      expect(isPaidEndpoint("xai", "POST", "v1.chat.completions")).toBe(false);
    });
  });

  describe("no bypass: paid endpoints fail closed without a pay gate", () => {
    it("createTask throws paygate-not-configured when constructed without paygate", async () => {
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.jobs.createTask(REQUEST);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("paygate-not-configured");
    });
  });

  describe("KIE POST api.v1.jobs.createTask blocks when OTP is missing", () => {
    it("createTask throws PayGateError without network call", async () => {
      const provider = makeGatedProvider();
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.jobs.createTask(REQUEST);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-missing");
    });
  });

  describe("KIE direct VEO endpoints block when OTP is missing", () => {
    it("veo.generate throws PayGateError before network dispatch", async () => {
      const mockFetch = vi.fn();
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      let caught: PayGateError | undefined;
      try {
        await provider.veo.post.api.v1.veo.generate(VEO_GENERATE_REQUEST);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-missing");
      expect(caught!.dotPath).toBe("api.v1.veo.generate");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("veo.extend throws PayGateError before network dispatch", async () => {
      const mockFetch = vi.fn();
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      let caught: PayGateError | undefined;
      try {
        await provider.veo.post.api.v1.veo.extend(VEO_EXTEND_REQUEST);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-missing");
      expect(caught!.dotPath).toBe("api.v1.veo.extend");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("KIE ElevenLabs task helpers block when OTP is missing", () => {
    it("textToSpeechTurbo25 throws PayGateError before network dispatch", async () => {
      const mockFetch = vi.fn();
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.elevenlabs.textToSpeechTurbo25(
          ELEVENLABS_TTS_REQUEST
        );
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-missing");
      expect(caught!.dotPath).toBe("api.v1.elevenlabs.textToSpeechTurbo25");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("KIE POST api.v1.jobs.createTask allows with a valid OTP", () => {
    it("createTask passes the gate with a valid request-bound OTP", async () => {
      const provider = makeGatedProvider();
      let caught: unknown;
      try {
        await provider.post.api.v1.jobs.createTask(
          REQUEST,
          mintKieCreateTaskOtp(REQUEST)
        );
      } catch (error) {
        caught = error;
      }
      // The gate passes, so the call proceeds to network dispatch against an
      // unreachable host. That surfaces a network error — never a PayGateError.
      expect(caught).toBeDefined();
      expect(caught).not.toBeInstanceOf(PayGateError);
    });
  });

  describe("KIE direct VEO endpoints allow with a valid OTP", () => {
    it("veo.generate passes the gate and dispatches", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: { taskId: "veo-1" } }), {
          status: 200,
        })
      );
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      await provider.veo.post.api.v1.veo.generate(
        VEO_GENERATE_REQUEST,
        mintKieVeoOtp("api.v1.veo.generate", VEO_GENERATE_REQUEST)
      );

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kie.ai/api/v1/veo/generate");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual(VEO_GENERATE_REQUEST);
    });

    it("veo.extend passes the gate and dispatches", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 200, data: { taskId: "veo-2" } }), {
          status: 200,
        })
      );
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      await provider.veo.post.api.v1.veo.extend(
        VEO_EXTEND_REQUEST,
        mintKieVeoOtp("api.v1.veo.extend", VEO_EXTEND_REQUEST)
      );

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kie.ai/api/v1/veo/extend");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual(VEO_EXTEND_REQUEST);
    });
  });

  describe("KIE free upload, status, and helper endpoints stay ungated", () => {
    it("dispatches free endpoints without OTP despite paygate config", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              code: 200,
              data: { downloadUrl: "https://cdn/file" },
            }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ code: 200, data: { status: "success" } }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ code: 200, data: { url: "https://cdn/out" } }),
            { status: 200 }
          )
        );
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        uploadBaseURL: "https://upload.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      await provider.post.api.fileUrlUpload({
        fileUrl: "https://example.com/in.png",
        uploadPath: "uploads",
      });
      await provider.get.api.v1.jobs.recordInfo("task-1");
      await provider.post.api.v1.common.downloadUrl({ url: "https://cdn/out" });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://upload.kie.ai/api/file-url-upload"
      );
      expect(mockFetch.mock.calls[1][0]).toBe(
        "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task-1"
      );
      expect(mockFetch.mock.calls[2][0]).toBe(
        "https://api.kie.ai/api/v1/common/download-url"
      );
    });
  });

  describe("KIE VEO wrapping preserves schemas", () => {
    it("keeps schema attachments on direct VEO endpoints", () => {
      const provider = makeGatedProvider();
      expect(provider.veo.post.api.v1.veo.generate.schema.safeParse).toBeTypeOf(
        "function"
      );
      expect(provider.veo.post.api.v1.veo.extend.schema.safeParse).toBeTypeOf(
        "function"
      );
      expect(
        provider.veo.post.api.v1.veo.generate.schema.safeParse(
          VEO_GENERATE_REQUEST
        ).success
      ).toBe(true);
      expect(
        provider.veo.post.api.v1.veo.extend.schema.safeParse(VEO_EXTEND_REQUEST)
          .success
      ).toBe(true);
    });
  });

  describe("OTP is bound to the exact request", () => {
    it("createTask rejects an OTP minted for a different request", async () => {
      const provider = makeGatedProvider();
      // Mint the OTP against one request, then submit a tampered request.
      const otp = mintKieCreateTaskOtp(REQUEST);
      const tampered = {
        ...REQUEST,
        input: { ...REQUEST.input, prompt: "tampered" },
      };
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.jobs.createTask(tampered, otp);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-mismatched-request");
    });
  });

  describe("OTP is single-use on a provider instance", () => {
    it("createTask rejects a replayed OTP on the same provider", async () => {
      const provider = makeGatedProvider();
      const otp = mintKieCreateTaskOtp(REQUEST);
      // First use consumes the jti (dispatch then fails on the unreachable
      // host, but the jti is already consumed by design).
      let first: unknown;
      try {
        await provider.post.api.v1.jobs.createTask(REQUEST, otp);
      } catch (error) {
        first = error;
      }
      expect(first).toBeDefined();
      expect(first).not.toBeInstanceOf(PayGateError);

      // Reusing the same OTP on the same instance must be rejected as replay.
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.jobs.createTask(REQUEST, otp);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-replayed");
    });
  });

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
    it("createTask does not make a network request when OTP is missing", async () => {
      const provider = makeGatedProvider();
      let caught: PayGateError | undefined;
      try {
        await provider.post.api.v1.jobs.createTask(REQUEST);
      } catch (error) {
        caught = error as PayGateError;
      }
      expect(caught).toBeInstanceOf(PayGateError);
      expect(caught!.code).toBe("otp-missing");
    });
  });

  describe("error messages are actionable", () => {
    it("PayGateError names the endpoint and mentions OTP", async () => {
      const provider = makeGatedProvider();
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
  });
});
