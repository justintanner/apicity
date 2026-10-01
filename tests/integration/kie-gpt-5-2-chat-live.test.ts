import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  KieError,
  type KieGpt52ChatCompletionChunk,
  type KieGpt52ChatCompletionsRequest,
  type KieGpt52ChatCompletionsResult,
} from "@apicity/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isChunkStream(
  result: KieGpt52ChatCompletionsResult
): result is AsyncIterable<KieGpt52ChatCompletionChunk> {
  return Symbol.asyncIterator in result;
}

/**
 * `POST https://api.kie.ai/gpt-5-2/v1/chat/completions`
 * (https://docs.kie.ai/market/chat/gpt-5-2). The invalid-key case is free
 * and comes first, so `dev:record` records it before any spend. The success
 * case is one minimal paid turn, pre-approved on intake ac-cygxx7 (follow-up
 * ac-ibkk9q). Both cases send REQUEST: one user message with plain string
 * content, and no reasoning_effort, tools or stream field. Measured on
 * 2026-10-01, the proxy answered the documented content-parts array with an
 * empty completion and answered this string body with text.
 */
const REQUEST: KieGpt52ChatCompletionsRequest = {
  messages: [{ role: "user", content: "Reply with the single word: pong" }],
};

describe("kie gpt 5.2 chat live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gpt-5-2-chat-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gpt-5-2",
    });

    await expect(
      provider.gpt52.post.v1.chat.completions(REQUEST)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it(
    "answers one minimal paid turn with assistant text",
    { timeout: 150_000 },
    async () => {
      ctx = setupPolly("kie/gpt-5-2-chat");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
        // A paid turn must not be lost to the 30 s default while recording.
        timeout: 120_000,
      });
      // Live only: start at least 1.1 s after the free case answered.
      if (ctx.mode !== "replay") await sleep(1100);

      const result = await provider.gpt52.post.v1.chat.completions(REQUEST);

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
