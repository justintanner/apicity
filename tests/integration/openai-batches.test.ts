import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai batches integration", () => {
  let ctx: PollyContext;

  describe("list batches", () => {
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list batches", async () => {
      ctx = setupPolly("openai/batches-list");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.get.v1.batches();

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");
    });

    it("should list batches with limit parameter", async () => {
      ctx = setupPolly("openai/batches-list-limit");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.get.v1.batches({ limit: 2 });

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe("payload validation", () => {
    it("should expose schema on create method", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });
      expect(provider.post.v1.batches.schema).toBeDefined();
      expect(typeof provider.post.v1.batches.schema.safeParse).toBe("function");
    });

    it("should validate a valid create payload", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });
      const result = provider.post.v1.batches.schema.safeParse({
        input_file_id: "file-abc123",
        endpoint: "/v1/chat/completions",
        completion_window: "24h",
      });
      expect(result.success).toBe(true);
    });

    it("should reject payload missing required fields", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });
      const result = provider.post.v1.batches.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});
