import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic messages streaming", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/messages-stream");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should stream a message response", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const stream = await provider.post.stream.v1.messages({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 256,
      messages: [{ role: "user", content: "Say hello in one sentence." }],
    });

    const events: string[] = [];
    for await (const event of stream) {
      events.push(event.type);
    }
    expect(events).toContain("message_start");
    expect(events).toContain("content_block_start");
    expect(events).toContain("content_block_delta");
    expect(events).toContain("message_stop");
  });
});
