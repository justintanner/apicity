import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai chat stream integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/chat-stream");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should stream chat completions", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const stream = await provider.post.v1.chat.completions({
      model: "gpt-5.4-2026-03-05",
      messages: [{ role: "user", content: "Say hello" }],
      stream: true,
      temperature: 0,
    });

    expect(stream).toBeDefined();
    expect(typeof stream[Symbol.asyncIterator]).toBe("function");

    // Collect stream chunks
    const chunks: string[] = [];
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        chunks.push(chunk.choices[0].delta.content);
      }
    }

    expect(chunks.length).toBeGreaterThan(0);
    const fullResponse = chunks.join("");
    expect(fullResponse).toBeTruthy();
  });
});
