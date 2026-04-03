import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie claude haiku 4.5", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skip("should complete a chat request", async () => {
    ctx = setupPolly("kie/claude-haiku-chat-hello");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result = await provider.claude.post.v1.messages({
      model: "claude-haiku-4-5",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      stream: false,
    });
    expect(result.role).toBe("assistant");
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content!.length).toBeGreaterThan(0);
    const textBlock = result.content!.find((b) => b.type === "text");
    expect(textBlock).toBeTruthy();
    expect(result.usage?.input_tokens).toBeGreaterThan(0);
  });
});
