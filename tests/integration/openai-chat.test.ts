import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/chat-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.chat({
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });
});
