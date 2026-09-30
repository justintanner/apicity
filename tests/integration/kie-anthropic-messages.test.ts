import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  KieError,
  type KieAnthropicMessagesRequest,
} from "@apicity/kie";

/**
 * `POST https://api.kie.ai/anthropic/v1/messages`, the Messages endpoint
 * Claude Code uses through KIE (https://docs.kie.ai/ai-agent/claude-code).
 * The invalid-key case is free and comes first. The success case is one
 * minimal paid turn, pre-approved on intake ac-wma4p9; its model is
 * the first Haiku-family id the listing returned in the committed
 * kie/anthropic-models recording (OQ-11).
 * Both cases send the same body. `stream: false` is explicit, as in every
 * shipped KIE Claude and chat recording: with `stream` absent the first
 * paid attempt got no answer within 30 s (ledger attempt-1, ac-hfy5vd).
 */
const REQUEST: KieAnthropicMessagesRequest = {
  model: "claude-haiku-4-5",
  max_tokens: 16,
  messages: [{ role: "user", content: "Reply with the single word: pong" }],
  stream: false,
};

describe("kie anthropic v1 messages", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/anthropic-messages-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-anthropic-messages",
    });

    await expect(
      provider.post.anthropic.v1.messages(REQUEST)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it(
    "answers one minimal turn as an Anthropic Message",
    { timeout: 150_000 },
    async () => {
      ctx = setupPolly("kie/anthropic-messages");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
        // A paid turn must not be lost to the 30 s default while recording.
        timeout: 120_000,
      });

      const message = await provider.post.anthropic.v1.messages(REQUEST);

      expect(message.type).toBe("message");
      expect(message.role).toBe("assistant");
      expect(message.content.some((block) => block.type === "text")).toBe(true);
      expect(message.usage.input_tokens).toBeGreaterThan(0);
    }
  );
});
