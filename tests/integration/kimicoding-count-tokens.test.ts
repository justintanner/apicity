import { describe, it, expect } from "vitest";
import { kimicoding } from "@nakedapi/kimicoding";

describe("kimicoding count tokens integration", () => {
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
