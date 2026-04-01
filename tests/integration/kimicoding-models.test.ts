import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding } from "@nakedapi/kimicoding";

describe("kimicoding models integration", () => {
  let ctx: PollyContext;

  describe("list models", () => {
    beforeEach(() => {
      ctx = setupPolly("kimicoding/models-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list available models", async () => {
      const provider = kimicoding({
        apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
      });

      const result = await provider.get.coding.v1.models();

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].id).toBeDefined();
      expect(result.data[0].object).toBe("model");
      expect(result.data[0].created).toBeGreaterThan(0);
      expect(result.data[0].display_name).toBeDefined();
      expect(typeof result.data[0].context_length).toBe("number");
      expect(typeof result.has_more).toBe("boolean");
    });
  });
});
