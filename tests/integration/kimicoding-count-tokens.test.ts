import { describe, it, expect } from "vitest";
import { createKimiCoding } from "@apicity/kimicoding";

describe("kimicoding count tokens integration", () => {
  it("should have schema", async () => {
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    expect(provider.post.coding.v1.countTokens.schema).toBeDefined();
    expect(typeof provider.post.coding.v1.countTokens.schema.safeParse).toBe(
      "function"
    );
  });

  it("should validate payload correctly", async () => {
    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const validPayload = {
      model: "k2p5",
      messages: [{ role: "user", content: "Test" }],
    };
    const result =
      provider.post.coding.v1.countTokens.schema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
