import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  KieError,
  type KieGemini35FlashGenerateContentResponse,
  type KieGemini35FlashStreamGenerateContentChunk,
  type KieGemini35FlashStreamGenerateContentRequest,
  type KieGemini35FlashStreamGenerateContentResult,
} from "@apicity/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isChunkStream(
  result: KieGemini35FlashStreamGenerateContentResult
): result is AsyncIterable<KieGemini35FlashStreamGenerateContentChunk> {
  return Symbol.asyncIterator in result;
}

/** One response object, an array of them, or a chunk stream, as a list. */
async function responsesOf(
  result: KieGemini35FlashStreamGenerateContentResult
): Promise<KieGemini35FlashGenerateContentResponse[]> {
  const value: unknown = result;
  if (Array.isArray(value)) {
    return value as KieGemini35FlashGenerateContentResponse[];
  }
  if (isChunkStream(result)) {
    const chunks: KieGemini35FlashGenerateContentResponse[] = [];
    for await (const chunk of result) chunks.push(chunk);
    return chunks;
  }
  return [result];
}

/**
 * `POST https://api.kie.ai/gemini/v1/models/gemini-3-5-flash:streamGenerateContent`
 * (https://docs.kie.ai/market/gemini/gemini-3-5-flash). The invalid-key case
 * is free and comes first, so `dev:record` records it before any spend. The
 * success case is one minimal paid turn, pre-approved on intake ac-cygxx7
 * (follow-up ac-ibkk9q). Both cases send REQUEST. The endpoint documents no
 * token cap, so the cheapest turn is `stream: false` (upstream default true)
 * with low thinking and no thoughts returned.
 */
const REQUEST: KieGemini35FlashStreamGenerateContentRequest = {
  stream: false,
  contents: [
    { role: "user", parts: [{ text: "Reply with the single word: pong" }] },
  ],
  generationConfig: {
    thinkingConfig: { thinkingLevel: "low", includeThoughts: false },
  },
};

describe("kie gemini 3.5 flash live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-35-flash-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-35-flash",
    });

    await expect(
      provider.gemini.post.v1.models.gemini35Flash.streamGenerateContent(
        REQUEST
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it(
    "answers one minimal paid turn with candidate text",
    { timeout: 330_000 },
    async () => {
      ctx = setupPolly("kie/gemini-35-flash");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
        // A paid turn must not be lost to a client timeout while recording:
        // on 2026-10-01 KIE's native gemini origin hung until its edge
        // answered HTTP 524 at about 125 s.
        timeout: 300_000,
      });
      // Live only: start at least 1.1 s after the free case answered.
      if (ctx.mode !== "replay") await sleep(1100);

      const responses = await responsesOf(
        await provider.gemini.post.v1.models.gemini35Flash.streamGenerateContent(
          REQUEST
        )
      );

      const text = responses
        .flatMap((response) => response.candidates ?? [])
        .flatMap((candidate) => candidate.content?.parts ?? [])
        .filter((part) => part.thought !== true)
        .map((part) => part.text ?? "")
        .join("");
      expect(text.trim()).not.toBe("");
      for (const response of responses) {
        if (response.usageMetadata) {
          expect(response.usageMetadata.promptTokenCount).toBeGreaterThan(0);
        }
      }
    }
  );
});
