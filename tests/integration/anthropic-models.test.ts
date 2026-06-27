import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type { AnthropicModel } from "@apicity/anthropic";

describe("anthropic models integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("list models", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/models-list");
    });

    it("should list available models", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.models.list();

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(typeof result.has_more).toBe("boolean");

      const model: AnthropicModel = result.data[0];
      expect(model.id).toBeDefined();
      expect(model.type).toBe("model");
      expect(model.display_name).toBeDefined();
      expect(model.created_at).toBeDefined();
      expect(typeof model.max_input_tokens).toBe("number");
      expect(typeof model.max_tokens).toBe("number");
    });
  });

  describe("retrieve model", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/models-retrieve");
    });

    it("should retrieve a single model by id", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.models.retrieve("claude-opus-4-8");

      expect(result.id).toBe("claude-opus-4-8");
      expect(result.type).toBe("model");
      expect(result.display_name).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(typeof result.max_input_tokens).toBe("number");
      expect(typeof result.max_tokens).toBe("number");
    });
  });
});
