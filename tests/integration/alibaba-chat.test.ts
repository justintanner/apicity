import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { alibaba } from "@nakedapi/alibaba";

describe("alibaba chat completions", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    ctx = setupPolly("alibaba/chat-hello");
    const provider = alibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const result = await provider.post.v1.chat.completions({
      model: "qwen3-max",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
      max_tokens: 64,
    });

    expect(result.choices[0].message.content).toBeTruthy();
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });
});
