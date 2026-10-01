import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  KieError,
  type KieGemini35FlashStreamGenerateContentRequest,
} from "@apicity/kie";

/**
 * `POST https://api.kie.ai/gemini/v1/models/gemini-3-5-flash:streamGenerateContent`
 * (https://docs.kie.ai/market/gemini/gemini-3-5-flash). Only the free
 * invalid-key case is recorded. The minimal paid turn of row (b2), intake
 * ac-h574ml, rejoins as a follow-up: on 2026-10-01 every authenticated turn on
 * KIE's native gemini path hung until KIE's Cloudflare edge answered HTTP 524
 * after about 125 s. REQUEST is that turn's planned body: `stream: false`
 * (upstream default true) with low thinking and no thoughts returned.
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
});
