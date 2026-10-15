import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  KieError,
  type KieGemini4ArgonOpenaiChatCompletionChunk,
  type KieGemini4ArgonOpenaiChatCompletionsRequest,
  type KieGemini4ArgonOpenaiChatCompletionsResult,
} from "@apicity/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isChunkStream(
  result: KieGemini4ArgonOpenaiChatCompletionsResult
): result is AsyncIterable<KieGemini4ArgonOpenaiChatCompletionChunk> {
  return Symbol.asyncIterator in result;
}

/**
 * `POST https://api.kie.ai/gemini-4-argon-openai/v1/chat/completions`
 * (https://docs.kie.ai/market/gemini/gemini-4-argon-openai). The invalid-key
 * case is free and comes first, so `dev:record` records it before any spend.
 * The success case is one minimal paid turn. Both cases send REQUEST: one user
 * message in the documented content-parts form, streaming off, thoughts off
 * and low reasoning effort.
 */
const REQUEST: KieGemini4ArgonOpenaiChatCompletionsRequest = {
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Reply with the single word: pong" }],
    },
  ],
  stream: false,
  include_thoughts: false,
  reasoning_effort: "low",
};

describe("kie gemini 4 argon openai chat live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-4-argon-openai-chat-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-4-argon-openai",
    });

    await expect(
      provider.gemini4ArgonOpenai.post.v1.chat.completions(REQUEST)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "401",
    } satisfies Partial<KieError>);
  });

  it(
    "answers one minimal paid turn with assistant text",
    { timeout: 150_000 },
    async () => {
      ctx = setupPolly("kie/gemini-4-argon-openai-chat");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
        // A paid turn must not be lost to the 30 s default while recording.
        timeout: 120_000,
      });
      // Live only: start at least 1.1 s after the free case answered.
      if (ctx.mode !== "replay") await sleep(1100);

      const result =
        await provider.gemini4ArgonOpenai.post.v1.chat.completions(REQUEST);

      // REQUEST sets stream: false, so the answer is one JSON completion.
      if (isChunkStream(result)) throw new Error("expected a JSON completion");
      expect(result.object).toBe("chat.completion");
      expect(result.choices?.[0]?.message?.role).toBe("assistant");
      expect(result.choices?.[0]?.message?.content?.trim()).toBeTruthy();
      expect(result.usage?.prompt_tokens).toBeGreaterThan(0);
      expect(result.credits_consumed).toBeGreaterThan(0);
    }
  );
});
