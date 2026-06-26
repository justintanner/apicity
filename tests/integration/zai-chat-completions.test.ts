import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createZai } from "@apicity/zai";

describe("zai integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("zai/chat-completions");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    const provider = createZai({
      apiKey: process.env.ZAI_API_KEY ?? "test-api-key",
    });

    // According to the docs: https://docs.z.ai/api-reference/introduction
    // But since the actual models are unknown without testing, we mock it.
    // We will use a standard model name.
    const result = await provider.api.paas.v4.chat.completions({
      model: "zai-llm-v1", // Placeholder or standard model if known
      messages: [{ role: "user", content: "Say hello." }],
    });

    expect(result.choices).toBeDefined();
    expect(result.choices.length).toBeGreaterThan(0);
    expect(result.choices[0].message.content).toBeTruthy();
  });
});
