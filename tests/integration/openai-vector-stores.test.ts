import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai vector stores integration", () => {
  let ctx: PollyContext;

  describe("create vector store", () => {
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a vector store", async () => {
      ctx = setupPolly("openai/vector-stores-create");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.post.v1.vectorStores({
        name: "Apicity vector store create test",
        description: "Created by the Apicity OpenAI integration test.",
        expires_after: { anchor: "last_active_at", days: 1 },
        metadata: { purpose: "integration-test" },
      });

      expect(result.id).toBeDefined();
      expect(result.object).toBe("vector_store");
      expect(typeof result.created_at).toBe("number");
      expect(result.name).toBe("Apicity vector store create test");
      expect(result.description).toBe(
        "Created by the Apicity OpenAI integration test."
      );
      expect(result.file_counts.total).toBe(0);
      expect(result.status).toMatch(/^(expired|in_progress|completed)$/);
      expect(typeof result.usage_bytes).toBe("number");
      expect(result.metadata).toEqual({ purpose: "integration-test" });
      expect(result.expires_after).toEqual({
        anchor: "last_active_at",
        days: 1,
      });
    });
  });

  describe("payload validation", () => {
    it("should expose schema on create method", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });

      expect(provider.post.v1.vectorStores.schema).toBeDefined();
      expect(typeof provider.post.v1.vectorStores.schema.safeParse).toBe(
        "function"
      );
    });

    it("should validate a static chunking payload", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });

      const result = provider.post.v1.vectorStores.schema.safeParse({
        chunking_strategy: {
          type: "static",
          static: {
            chunk_overlap_tokens: 0,
            max_chunk_size_tokens: 100,
          },
        },
        file_ids: ["file-abc123"],
        name: "Support FAQ",
      });

      expect(result.success).toBe(true);
    });

    it("should reject an invalid expiration window", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });

      const result = provider.post.v1.vectorStores.schema.safeParse({
        expires_after: { anchor: "last_active_at", days: 366 },
      });

      expect(result.success).toBe(false);
    });
  });
});
