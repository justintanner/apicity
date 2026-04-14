import { afterEach, describe, expect, it, vi } from "vitest";
import { anthropic } from "../../../packages/provider/anthropic/src/index";
import { fal } from "../../../packages/provider/fal/src/index";
import { fireworks } from "../../../packages/provider/fireworks/src/index";
import { kie } from "../../../packages/provider/kie/src/index";
import { kimicoding } from "../../../packages/provider/kimicoding/src/index";
import { openai } from "../../../packages/provider/openai/src/index";
import {
  withFallback,
  withRetry,
} from "../../../packages/provider/openai/src/middleware";
import { xai } from "../../../packages/provider/xai/src/index";

interface SharedRequestOptions {
  baseURL?: string;
  fetch?: typeof fetch;
  timeout?: number;
}

interface SharedRequestScenario {
  name: string;
  customBaseURL: string;
  expectedUrl: string;
  invoke: (opts: SharedRequestOptions) => Promise<unknown>;
  successBody: unknown;
}

const sharedRequestScenarios: SharedRequestScenario[] = [
  {
    name: "OpenAI",
    customBaseURL: "https://custom.example/openai/v1",
    expectedUrl: "https://custom.example/openai/v1/models",
    invoke: (opts) =>
      openai({
        apiKey: "sk-test-key",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).get.v1.models(),
    successBody: { object: "list", data: [] },
  },
  {
    name: "Anthropic",
    customBaseURL: "https://custom.example/anthropic",
    expectedUrl: "https://custom.example/anthropic/v1/messages/batches",
    invoke: (opts) =>
      anthropic({
        apiKey: "sk-ant-test",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).get.v1.messages.batches.list(),
    successBody: {
      data: [],
      has_more: false,
      first_id: "",
      last_id: "",
    },
  },
  {
    name: "xAI",
    customBaseURL: "https://custom.example/xai/v1",
    expectedUrl: "https://custom.example/xai/v1/models",
    invoke: (opts) =>
      xai({
        apiKey: "sk-xai-test",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).get.v1.models(),
    successBody: { data: [] },
  },
  {
    name: "Fal",
    customBaseURL: "https://custom.example/fal/v1",
    expectedUrl: "https://custom.example/fal/v1/models",
    invoke: (opts) =>
      fal({
        apiKey: "fal-test-key",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).v1.models(),
    successBody: { models: [], next_cursor: null, has_more: false },
  },
  {
    name: "Fireworks",
    customBaseURL: "https://custom.example/fireworks/v1",
    expectedUrl: "https://custom.example/fireworks/v1/chat/completions",
    invoke: (opts) =>
      fireworks({
        apiKey: "fw-test-key",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).inference.v1.chat.completions({
        model: "accounts/fireworks/models/test-model",
        messages: [{ role: "user", content: "hello" }],
      }),
    successBody: { id: "chatcmpl-test", choices: [] },
  },
  {
    name: "KimiCoding",
    customBaseURL: "https://custom.example/kimi/",
    expectedUrl: "https://custom.example/kimi/v1/models",
    invoke: (opts) =>
      kimicoding({
        apiKey: "kimi-test-key",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).get.coding.v1.models(),
    successBody: { data: [] },
  },
  {
    name: "KIE",
    customBaseURL: "https://custom.example/kie",
    expectedUrl: "https://custom.example/kie/api/v1/common/download-url",
    invoke: (opts) =>
      kie({
        apiKey: "kie-test-key",
        baseURL: opts.baseURL,
        fetch: opts.fetch,
        timeout: opts.timeout,
      }).post.api.v1.common.downloadUrl({ taskId: "task_123" }),
    successBody: {
      code: 200,
      msg: "ok",
      data: { downloadUrl: "https://files.example/task_123.mp4" },
    },
  },
];

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("shared provider request infrastructure", () => {
  for (const scenario of sharedRequestScenarios) {
    it(`uses custom fetch and baseURL for ${scenario.name}`, async () => {
      let capturedUrl = "";
      let capturedSignal: AbortSignal | undefined;

      const globalFetch = vi.fn(() =>
        Promise.reject(new Error("global fetch should not be called"))
      );
      vi.stubGlobal("fetch", globalFetch);

      const customFetch = vi.fn(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          capturedUrl = String(input);
          capturedSignal = init?.signal ?? undefined;
          return jsonResponse(scenario.successBody);
        }
      );

      await expect(
        scenario.invoke({
          baseURL: scenario.customBaseURL,
          fetch: customFetch as unknown as typeof fetch,
        })
      ).resolves.toEqual(scenario.successBody);

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(globalFetch).not.toHaveBeenCalled();
      expect(capturedUrl).toBe(scenario.expectedUrl);
      expect(capturedSignal).toBeDefined();
      expect(capturedSignal?.aborted).toBe(false);
    });

    it(`applies custom timeout for ${scenario.name}`, async () => {
      let capturedUrl = "";
      let capturedSignal: AbortSignal | undefined;

      const customFetch = vi.fn(
        (input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            capturedUrl = String(input);
            capturedSignal = init?.signal ?? undefined;

            if (!capturedSignal) {
              reject(new Error("missing signal"));
              return;
            }

            if (capturedSignal.aborted) {
              reject(new Error("already aborted"));
              return;
            }

            capturedSignal.addEventListener(
              "abort",
              () => reject(new Error("aborted by timeout")),
              { once: true }
            );
          })
      );

      await expect(
        scenario.invoke({
          baseURL: scenario.customBaseURL,
          timeout: 5,
          fetch: customFetch as unknown as typeof fetch,
        })
      ).rejects.toThrow();

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(capturedUrl).toBe(scenario.expectedUrl);
      expect(capturedSignal?.aborted).toBe(true);
    });
  }
});

describe("shared middleware composition", () => {
  it("retries the primary function before switching to fallback", async () => {
    const primary = vi.fn(async () => {
      throw Object.assign(new Error("primary unavailable"), { status: 503 });
    });
    const secondary = vi.fn(async () => "secondary-ok");
    const fallbackIndexes: number[] = [];

    const composed = withFallback(
      [withRetry(primary, { retries: 1, baseMs: 1, jitter: false }), secondary],
      {
        onFallback: (_error, index) => fallbackIndexes.push(index),
      }
    );

    await expect(composed("request")).resolves.toBe("secondary-ok");
    expect(primary).toHaveBeenCalledTimes(2);
    expect(secondary).toHaveBeenCalledTimes(1);
    expect(fallbackIndexes).toEqual([0]);
  });

  it("changes behavior when retry wraps fallback instead of the primary", async () => {
    const events: string[] = [];
    const primary = vi.fn(async () => {
      events.push("primary");
      throw Object.assign(new Error("primary failed"), { status: 503 });
    });
    const secondary = vi.fn(async () => {
      events.push("secondary");
      return "fallback-ok";
    });

    const retryAroundFallback = withRetry(
      withFallback([primary, secondary], {
        onFallback: () => events.push("fallback"),
      }),
      { retries: 2, baseMs: 1, jitter: false }
    );

    await expect(retryAroundFallback("request")).resolves.toBe("fallback-ok");
    expect(primary).toHaveBeenCalledTimes(1);
    expect(secondary).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["primary", "fallback", "secondary"]);
  });
});
