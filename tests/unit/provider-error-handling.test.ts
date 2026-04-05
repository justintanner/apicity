import { describe, expect, it, vi } from "vitest";

import { anthropic } from "../../packages/provider/anthropic/src/anthropic";
import { AnthropicError } from "../../packages/provider/anthropic/src/types";
import { fal } from "../../packages/provider/fal/src/fal";
import { FalError } from "../../packages/provider/fal/src/types";
import { fireworks } from "../../packages/provider/fireworks/src/fireworks";
import { FireworksError } from "../../packages/provider/fireworks/src/types";
import { kieRequest } from "../../packages/provider/kie/src/request";
import { KieError } from "../../packages/provider/kie/src/types";
import { kimicoding } from "../../packages/provider/kimicoding/src/kimicoding";
import { KimiCodingError } from "../../packages/provider/kimicoding/src/types";
import { openai } from "../../packages/provider/openai/src/openai";
import { OpenAiError } from "../../packages/provider/openai/src/types";
import { xai } from "../../packages/provider/xai/src/xai";
import { XaiError } from "../../packages/provider/xai/src/types";

type ErrorConstructor<T extends Error> = new (...args: never[]) => T;

interface RequestErrorCase<T extends Error> {
  name: string;
  errorClass: ErrorConstructor<T>;
  invoke(fetchImpl: typeof fetch, timeout?: number): Promise<unknown>;
  rateLimitBody: unknown;
  expectedRateLimitMessage: string;
  assertError(
    error: T,
    context: "rateLimit" | "network" | "malformed" | "timeout"
  ): void;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function invalidJsonResponse(status = 200): Response {
  return new Response("{", {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function abortError(): Error {
  return Object.assign(new Error("Aborted"), { name: "AbortError" });
}

function createAbortablePendingFetch(): typeof fetch {
  return vi.fn(
    async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
      await new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        const rejectOnAbort = () => reject(abortError());

        if (signal?.aborted) {
          rejectOnAbort();
          return;
        }

        signal?.addEventListener("abort", rejectOnAbort, { once: true });
      })
  ) as unknown as typeof fetch;
}

async function getThrownError<T>(
  promise: Promise<unknown>,
  ErrorClass: ErrorConstructor<T>
): Promise<T> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorClass);
    return error as T;
  }

  throw new Error("Expected promise to reject");
}

const requestErrorCases: Array<RequestErrorCase<Error>> = [
  {
    name: "OpenAI",
    errorClass: OpenAiError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return openai({
        apiKey: "sk-openai-test",
        fetch: fetchImpl,
        timeout,
      }).get.v1.models();
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "OpenAI API error 429: Slow down",
    assertError(error, context) {
      const openAiError = error as OpenAiError;
      expect(openAiError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "Anthropic",
    errorClass: AnthropicError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return anthropic({
        apiKey: "sk-anthropic-test",
        fetch: fetchImpl,
        timeout,
      }).v1.models.list();
    },
    rateLimitBody: {
      error: { message: "Slow down", type: "rate_limit_error" },
    },
    expectedRateLimitMessage: "Anthropic API error 429: Slow down",
    assertError(error, context) {
      const anthropicError = error as AnthropicError;
      expect(anthropicError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "xAI",
    errorClass: XaiError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return xai({
        apiKey: "sk-xai-test",
        fetch: fetchImpl,
        timeout,
      }).get.v1.models();
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "XAI API error 429: Slow down",
    assertError(error, context) {
      const xaiError = error as XaiError;
      expect(xaiError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "KimiCoding",
    errorClass: KimiCodingError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return kimicoding({
        apiKey: "sk-kimi-test",
        fetch: fetchImpl,
        timeout,
      }).get.coding.v1.models();
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "KimiCoding error 429: Slow down",
    assertError(error, context) {
      const kimiError = error as KimiCodingError;
      expect(kimiError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "Fal",
    errorClass: FalError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return fal({
        apiKey: "fal-test",
        fetch: fetchImpl,
        timeout,
      }).v1.models();
    },
    rateLimitBody: {
      error: { type: "rate_limited", message: "Slow down" },
    },
    expectedRateLimitMessage: "Slow down",
    assertError(error, context) {
      const falError = error as FalError;
      expect(falError.status).toBe(context === "rateLimit" ? 429 : 500);
      if (context !== "rateLimit") {
        expect(falError.type).toBe("server_error");
      }
    },
  },
  {
    name: "Fireworks",
    errorClass: FireworksError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return fireworks({
        apiKey: "fw-test",
        fetch: fetchImpl,
        timeout,
      }).v1.chat.completions({
        model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
        messages: [{ role: "user", content: "Hello" }],
      });
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "Fireworks API error 429: Slow down",
    assertError(error, context) {
      const fireworksError = error as FireworksError;
      expect(fireworksError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "KIE",
    errorClass: KieError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return kieRequest("https://api.kie.ai/test", {
        method: "GET",
        apiKey: "kie-test",
        timeout: timeout ?? 30000,
        doFetch: fetchImpl,
      });
    },
    rateLimitBody: { msg: "Slow down" },
    expectedRateLimitMessage: "Kie API error 429: Slow down",
    assertError(error, context) {
      const kieError = error as KieError;
      expect(kieError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
];

describe("provider request error handling", () => {
  for (const testCase of requestErrorCases) {
    describe(testCase.name, () => {
      it("surfaces 429 responses with provider-specific error details", async () => {
        const mockFetch = vi
          .fn()
          .mockResolvedValue(jsonResponse(testCase.rateLimitBody, 429));

        const error = await getThrownError(
          testCase.invoke(mockFetch as unknown as typeof fetch),
          testCase.errorClass
        );

        expect(error.message).toBe(testCase.expectedRateLimitMessage);
        testCase.assertError(error, "rateLimit");
      });

      it("wraps network failures in the provider error class", async () => {
        const mockFetch = vi
          .fn()
          .mockRejectedValue(new Error("socket hang up"));

        const error = await getThrownError(
          testCase.invoke(mockFetch as unknown as typeof fetch),
          testCase.errorClass
        );

        expect(error.message.toLowerCase()).toContain("failed");
        testCase.assertError(error, "network");
      });

      it("wraps malformed JSON success bodies", async () => {
        const mockFetch = vi.fn().mockResolvedValue(invalidJsonResponse());

        const error = await getThrownError(
          testCase.invoke(mockFetch as unknown as typeof fetch),
          testCase.errorClass
        );

        expect(error.message.toLowerCase()).toContain("failed");
        testCase.assertError(error, "malformed");
      });

      it("wraps timeout-triggered aborts", async () => {
        const mockFetch = createAbortablePendingFetch();

        const error = await getThrownError(
          testCase.invoke(mockFetch, 1),
          testCase.errorClass
        );

        expect(error.message.toLowerCase()).toContain("failed");
        testCase.assertError(error, "timeout");
      });
    });
  }
});
