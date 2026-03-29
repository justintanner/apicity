import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { deepseek } from "@nakedapi/deepseek";

describe("deepseek chat completions", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("deepseek/chat-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    const provider = deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.chat.completions({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
      max_tokens: 50,
    });
    expect(result.choices[0].message.content).toBeTruthy();
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });
});
