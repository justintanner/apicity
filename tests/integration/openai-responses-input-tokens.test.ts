import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai responses input_tokens integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/responses-input-tokens");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should count input tokens for a string input", async () => {
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.responses.inputTokens({
      model: "gpt-4o-mini",
      input: "Say hello in one sentence.",
    });

    expect(result.object).toBe("response.input_tokens");
    expect(typeof result.input_tokens).toBe("number");
    expect(result.input_tokens).toBeGreaterThan(0);
  });
});
