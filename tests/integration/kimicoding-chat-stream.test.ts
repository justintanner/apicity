import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding } from "@nakedapi/kimicoding";

describe("kimicoding chat stream integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kimicoding/chat-stream");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should stream chat messages", async () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });

    const stream = await provider.post.stream.coding.v1.messages({
      model: "k2p5",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 1024,
      stream: true,
    });

    expect(stream).toBeDefined();
    expect(typeof stream[Symbol.asyncIterator]).toBe("function");

    // Collect stream events
    const events: string[] = [];
    for await (const event of stream) {
      if (event.type === "content_block_delta") {
        events.push(event.delta?.text || "");
      }
    }

    expect(events.length).toBeGreaterThan(0);
    const fullResponse = events.join("");
    expect(fullResponse).toBeTruthy();
  });

  it("should validate payload schema for streaming", () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });

    const validation = provider.post.stream.coding.v1.messages.validatePayload({
      model: "k2p5",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 1024,
      stream: true,
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});
