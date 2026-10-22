import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * Live Polly recording for Claude Haiku 5.5
 * (`POST /claude/v1/messages`): one short text completion, no tools.
 */
describe("kie claude haiku 5.5", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    ctx = setupPolly("kie/claude-haiku-5-5-chat-hello");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result = await provider.claude.post.v1.messages({
      model: "claude-haiku-5-5",
      messages: [{ role: "user", content: "Reply with the single word ok." }],
      stream: false,
    });
    expect(result.role).toBe("assistant");
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content!.length).toBeGreaterThan(0);
    const textBlock = result.content!.find((block) => block.type === "text");
    expect(textBlock).toBeTruthy();
    expect(result.usage?.input_tokens).toBeGreaterThan(0);
  });
});
