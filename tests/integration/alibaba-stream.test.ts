import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { alibaba, type AlibabaChatStreamChunk } from "@nakedapi/alibaba";

describe("alibaba chat completions streaming", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should stream chat completion chunks", async () => {
    ctx = setupPolly("alibaba/stream-hello");
    const provider = alibaba({
      apiKey: process.env.ALIBABA_CLOUD_API_KEY ?? "test-key",
    });

    const chunks: AlibabaChatStreamChunk[] = [];
    for await (const chunk of provider.post.stream.v1.chat.completions({
      model: "qwen3-max",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
      max_tokens: 64,
    })) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].object).toBe("chat.completion.chunk");
  });
});
