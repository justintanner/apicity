import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/chat-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.chat.completions({
      model: "gpt-5.4-2026-03-05",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
    });
    expect(result.choices[0].message.content).toBeTruthy();
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });
});
