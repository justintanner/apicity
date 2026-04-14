import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks chat completions integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/chat-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });
    const result = await provider.inference.v1.chat.completions({
      model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
      max_tokens: 64,
    });
    expect(result.choices[0].message.content).toBeTruthy();
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });
});
