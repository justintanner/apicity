import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding } from "@nakedapi/kimicoding";

describe("kimicoding count tokens integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kimicoding/count-tokens");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should count tokens for a simple message", async () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.coding.v1.countTokens({
      model: "k2p5",
      messages: [{ role: "user", content: "Hello, world!" }],
    });
    expect(result.input_tokens).toBeGreaterThan(0);
    expect(typeof result.input_tokens).toBe("number");
  });

  it("should count tokens for multiple messages", async () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.coding.v1.countTokens({
      model: "k2p5",
      messages: [
        { role: "user", content: "What is the capital of France?" },
        { role: "assistant", content: "The capital of France is Paris." },
        { role: "user", content: "What about Germany?" },
      ],
    });
    expect(result.input_tokens).toBeGreaterThan(0);
  });

  it("should count tokens with system message", async () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.coding.v1.countTokens({
      model: "k2p5",
      system: "You are a helpful assistant.",
      messages: [{ role: "user", content: "Hi there!" }],
    });
    expect(result.input_tokens).toBeGreaterThan(0);
  });

  it("should have payload schema", async () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    expect(provider.post.coding.v1.countTokens.payloadSchema).toBeDefined();
    expect(provider.post.coding.v1.countTokens.validatePayload).toBeDefined();
  });

  it("should validate payload correctly", async () => {
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const validPayload = {
      model: "k2p5",
      messages: [{ role: "user", content: "Test" }],
    };
    const result =
      provider.post.coding.v1.countTokens.validatePayload(validPayload);
    expect(result.valid).toBe(true);
  });
});
