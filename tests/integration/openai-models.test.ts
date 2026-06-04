import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai models integration", () => {
  let ctx: PollyContext;

  describe("list models", () => {
    beforeEach(() => {
      ctx = setupPolly("openai/models-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list available models", async () => {
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.get.v1.models();

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].id).toBeDefined();
      expect(result.data[0].object).toBe("model");
      expect(result.data[0].created).toBeGreaterThan(0);
      expect(result.data[0].owned_by).toBeDefined();
    });
  });

  describe("retrieve model", () => {
    beforeEach(() => {
      ctx = setupPolly("openai/models-retrieve");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should retrieve a specific model", async () => {
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.get.v1.models("gpt-4o-mini");

      expect(result.id).toBe("gpt-4o-mini");
      expect(result.object).toBe("model");
      expect(result.created).toBeGreaterThan(0);
      expect(result.owned_by).toBeDefined();
    });
  });
});
