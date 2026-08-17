import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie claude sonnet 4.6", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    ctx = setupPolly("kie/claude-chat-hello");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result = await provider.claude.post.v1.messages({
      model: "claude-sonnet-4-6",
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

  it("should complete an Opus 5 chat request", async () => {
    ctx = setupPolly("kie/claude-opus-5-chat-hello");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result = await provider.claude.post.v1.messages({
      model: "claude-opus-5",
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
