import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic count tokens", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/count-tokens");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should count tokens for a message", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.messages.countTokens({
      model: "claude-sonnet-4-5-20250929",
      messages: [{ role: "user", content: "Hello, how are you?" }],
    });
    expect(result.input_tokens).toBeGreaterThan(0);
  });
});
