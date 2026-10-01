import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  KieError,
  type KieGemini31ProChatCompletionChunk,
  type KieGemini31ProChatCompletionsRequest,
  type KieGemini31ProChatCompletionsResult,
} from "@apicity/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isChunkStream(
  result: KieGemini31ProChatCompletionsResult
): result is AsyncIterable<KieGemini31ProChatCompletionChunk> {
  return Symbol.asyncIterator in result;
}

/**
 * `POST https://api.kie.ai/gemini-3.1-pro/v1/chat/completions`
 * (https://docs.kie.ai/market/gemini/gemini-3-1-pro). The invalid-key case
 * is free and comes first, so `dev:record` records it before any spend. The
 * success case is one minimal paid turn, pre-approved on intake ac-cygxx7
 * (follow-up ac-ibkk9q). Both cases send REQUEST. The endpoint documents no
 * token cap, so the cheapest turn is `stream: false`, no thoughts and low
 * reasoning effort (upstream defaults: true, true, high). The user content is
 * a plain string: KIE's gpt-5-2 proxy answered the parts array with an empty
 * completion when measured on 2026-10-01 (mayor-ruling-b1-retry.md).
 */
const REQUEST: KieGemini31ProChatCompletionsRequest = {
  messages: [{ role: "user", content: "Reply with the single word: pong" }],
  stream: false,
  include_thoughts: false,
  reasoning_effort: "low",
};

describe("kie gemini 3.1 pro chat live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-31-pro-chat-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-31-pro",
    });

    await expect(
      provider.gemini31Pro.post.v1.chat.completions(REQUEST)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it(
    "answers one minimal paid turn with assistant text",
    { timeout: 330_000 },
    async () => {
      ctx = setupPolly("kie/gemini-31-pro-chat");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
        // A paid turn must not be lost to a client timeout while recording:
        // two takes on 2026-10-01 ran past 120 s with no answer.
        timeout: 300_000,
      });
      // Live only: start at least 1.1 s after the free case answered.
      if (ctx.mode !== "replay") await sleep(1100);

      const result =
        await provider.gemini31Pro.post.v1.chat.completions(REQUEST);

      if (isChunkStream(result)) {
        let text = "";
        for await (const chunk of result) {
          for (const choice of chunk.choices ?? []) {
            text += choice.delta?.content ?? "";
          }
        }
        expect(text.trim()).not.toBe("");
      } else {
        expect(result.choices?.[0]?.message?.content?.trim()).toBeTruthy();
        expect(result.usage?.prompt_tokens).toBeGreaterThan(0);
      }
    }
  );
});
