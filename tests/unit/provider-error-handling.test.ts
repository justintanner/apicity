import { describe, expect, it, vi } from "vitest";

import { createAlibaba } from "../../packages/provider/alibaba/src/alibaba";
import { AlibabaError } from "../../packages/provider/alibaba/src/types";
import { createAnthropic } from "../../packages/provider/anthropic/src/anthropic";
import { AnthropicError } from "../../packages/provider/anthropic/src/types";
import { createDoltHub } from "../../packages/provider/dolthub/src/dolthub";
import { DoltHubError } from "../../packages/provider/dolthub/src/types";
import { createElevenLabs } from "../../packages/provider/elevenlabs/src/elevenlabs";
import { ElevenLabsError } from "../../packages/provider/elevenlabs/src/types";
import { createFal } from "../../packages/provider/fal/src/fal";
import { FalError } from "../../packages/provider/fal/src/types";
import { createFireworks } from "../../packages/provider/fireworks/src/fireworks";
import { FireworksError } from "../../packages/provider/fireworks/src/types";
import { kieRequest } from "../../packages/provider/kie/src/request";
import { KieError } from "../../packages/provider/kie/src/types";
import { createKimiCoding } from "../../packages/provider/kimicoding/src/kimicoding";
import { KimiCodingError } from "../../packages/provider/kimicoding/src/types";
import { createMeta } from "../../packages/provider/meta/src/meta";
import { MetaError } from "../../packages/provider/meta/src/types";
import { createOpenAi } from "../../packages/provider/openai/src/openai";
import { OpenAiError } from "../../packages/provider/openai/src/types";
import { createPolymarket } from "../../packages/provider/polymarket/src/polymarket";
import { PolymarketError } from "../../packages/provider/polymarket/src/types";
import { createTelegram } from "../../packages/provider/telegram/src/telegram";
import { TelegramError } from "../../packages/provider/telegram/src/types";
import { createX } from "../../packages/provider/x/src/x";
import { XError } from "../../packages/provider/x/src/types";
import { createXai } from "../../packages/provider/xai/src/xai";
import { XaiError } from "../../packages/provider/xai/src/types";
import { createYouTube } from "../../packages/provider/youtube/src/youtube";
import { YouTubeError } from "../../packages/provider/youtube/src/types";

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

async function getThrownError<T extends Error>(
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
      return createOpenAi({
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
      return createAnthropic({
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
      return createXai({
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
      return createKimiCoding({
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
      return createFal({
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
      return createFireworks({
        apiKey: "fw-test",
        fetch: fetchImpl,
        timeout,
      }).inference.v1.chat.completions({
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
  {
    name: "Alibaba",
    errorClass: AlibabaError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createAlibaba({
        apiKey: "sk-alibaba-test",
        fetch: fetchImpl,
        timeout,
      }).get.compatibleMode.v1.models();
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "Alibaba API error 429: Slow down",
    assertError(error, context) {
      const alibabaError = error as AlibabaError;
      expect(alibabaError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "DoltHub",
    errorClass: DoltHubError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createDoltHub({
        apiToken: "dolt-test",
        fetch: fetchImpl,
        timeout,
      }).v1alpha1.user.get();
    },
    rateLimitBody: { message: "Slow down" },
    expectedRateLimitMessage: "DoltHub API error 429: Slow down",
    assertError(error, context) {
      const dolthubError = error as DoltHubError;
      expect(dolthubError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "ElevenLabs",
    errorClass: ElevenLabsError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createElevenLabs({
        apiKey: "el-test",
        fetch: fetchImpl,
        timeout,
      }).post.v1.speechToText(
        // @ts-expect-error — deliberately minimal payload without the required
        // model_id: this error-path test never dispatches a real request body
        {
          file: new Blob(["test"]),
        }
      );
    },
    rateLimitBody: { detail: { message: "Slow down" } },
    expectedRateLimitMessage: "ElevenLabs API error 429: Slow down",
    assertError(error, context) {
      const elevenlabsError = error as ElevenLabsError;
      expect(elevenlabsError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "Meta",
    errorClass: MetaError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createMeta({
        accessToken: "meta-test",
        fetch: fetchImpl,
        timeout,
      }).get.v25.container("1234567890");
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "IG API error 429: Slow down",
    assertError(error, context) {
      const metaError = error as MetaError;
      expect(metaError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "Polymarket",
    errorClass: PolymarketError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createPolymarket({
        fetch: fetchImpl,
        timeout,
      }).get.clob.book({ token_id: "123" });
    },
    rateLimitBody: { message: "Slow down" },
    expectedRateLimitMessage: "Polymarket API error 429: Slow down",
    assertError(error, context) {
      const polymarketError = error as PolymarketError;
      expect(polymarketError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "X",
    errorClass: XError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createX({
        accessToken: "x-test",
        fetch: fetchImpl,
        timeout,
      }).get.v2.media.upload("1234567890");
    },
    rateLimitBody: { errors: [{ message: "Slow down" }] },
    expectedRateLimitMessage: "X API error 429: Slow down",
    assertError(error, context) {
      const xError = error as XError;
      expect(xError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "YouTube",
    errorClass: YouTubeError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createYouTube({
        accessToken: "yt-test",
        fetch: fetchImpl,
        timeout,
      }).channels.list({ part: "snippet" });
    },
    rateLimitBody: { error: { message: "Slow down" } },
    expectedRateLimitMessage: "YouTube API error 429: Slow down",
    assertError(error, context) {
      const youtubeError = error as YouTubeError;
      expect(youtubeError.status).toBe(context === "rateLimit" ? 429 : 500);
    },
  },
  {
    name: "Telegram",
    errorClass: TelegramError as ErrorConstructor<Error>,
    invoke(fetchImpl, timeout) {
      return createTelegram({
        botToken: "telegram-test",
        fetch: fetchImpl,
        timeout,
      }).sendMessage({
        chat_id: 42,
        text: "hello",
      });
    },
    rateLimitBody: {
      ok: false,
      error_code: 429,
      description: "Too Many Requests: retry later",
    },
    expectedRateLimitMessage:
      "Telegram API error 429: Too Many Requests: retry later",
    assertError(error, context) {
      const telegramError = error as TelegramError;
      expect(telegramError.status).toBe(context === "rateLimit" ? 429 : 500);
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
