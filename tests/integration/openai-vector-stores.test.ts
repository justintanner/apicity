import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";
import {
  OpenAiVectorStoreCreateRequestSchema,
  OpenAiVectorStoreSearchRequestSchema,
} from "@apicity/openai/zod";

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

  describe("read vector stores", () => {
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list and retrieve vector stores", async () => {
      ctx = setupPolly("openai/vector-stores-read");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      // Setup via the already-covered create: tiny, short-expiry, no files.
      const created = await provider.post.v1.vectorStores({
        name: "Apicity vector store read test",
        expires_after: { anchor: "last_active_at", days: 1 },
        metadata: { purpose: "integration-test" },
      });
      expect(created.id).toBeDefined();

      // List with pagination options — HAR proves ?limit=2&order=desc.
      const page = await provider.get.v1.vectorStores({
        limit: 2,
        order: "desc",
      });
      expect(page.object).toBe("list");
      expect(Array.isArray(page.data)).toBe(true);
      expect(page.data.length).toBeGreaterThan(0);
      expect(page.data.length).toBeLessThanOrEqual(2);
      expect(typeof page.first_id).toBe("string");
      expect(typeof page.last_id).toBe("string");
      expect(typeof page.has_more).toBe("boolean");

      // Cursor pagination with a real id — HAR proves ?after=vs_... and the
      // anchor store is excluded from the page.
      const cursorPage = await provider.get.v1.vectorStores({
        after: created.id,
      });
      expect(cursorPage.object).toBe("list");
      expect(cursorPage.data.every((store) => store.id !== created.id)).toBe(
        true
      );

      // Retrieve by id — round-trips the created store.
      const fetched = await provider.get.v1.vectorStores(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.object).toBe("vector_store");
      expect(typeof fetched.created_at).toBe("number");
      expect(fetched.file_counts.total).toBe(0);
    });
  });

  describe("search vector store", () => {
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should search a vector store", async () => {
      ctx = setupPolly("openai/vector-stores-search");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const created = await provider.post.v1.vectorStores({
        name: "Apicity vector store search test",
        expires_after: { anchor: "last_active_at", days: 1 },
        metadata: { purpose: "integration-test" },
      });
      expect(created.id).toBeDefined();

      const page = await provider.post.v1.vectorStores.search(created.id, {
        query: "return policy",
        max_num_results: 5,
      });

      expect(page.object).toBe("vector_store.search_results.page");
      expect(page.search_query).toEqual(["return policy"]);
      expect(page.data).toEqual([]);
      expect(page.has_more).toBe(false);
      expect(page.next_page).toBeNull();
    });
  });

  describe("payload validation", () => {
    it("should expose schema on create method", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });

      // Bind the identity, not just presence: the MCP server derives this
      // endpoint's tool input JSON Schema from `.schema`, so attaching a
      // sibling's schema here would ship a wrong tool contract silently.
      expect(provider.post.v1.vectorStores.schema).toBe(
        OpenAiVectorStoreCreateRequestSchema
      );
      expect(typeof provider.post.v1.vectorStores.schema.safeParse).toBe(
        "function"
      );
    });

    it("should expose schema on search method", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });

      expect(provider.post.v1.vectorStores.search.schema).toBe(
        OpenAiVectorStoreSearchRequestSchema
      );
      expect(typeof provider.post.v1.vectorStores.search.schema.safeParse).toBe(
        "function"
      );
    });

    it("should validate search payloads", () => {
      const validPayloads = [
        { query: "return policy" },
        { query: ["return policy", "refund window"] },
        { query: "return policy", max_num_results: 5 },
        {
          query: "return policy",
          filters: {
            type: "and",
            filters: [{ key: "author", type: "eq", value: "gc" }],
          },
        },
        {
          query: "return policy",
          filters: { key: "year", type: "in", value: [2025, 2026] },
        },
        {
          query: "return policy",
          ranking_options: {
            ranker: "default-2024-11-15",
            score_threshold: 0.5,
          },
        },
        { query: "return policy", rewrite_query: true },
      ];

      for (const payload of validPayloads) {
        expect(
          OpenAiVectorStoreSearchRequestSchema.safeParse(payload).success
        ).toBe(true);
      }

      expect(OpenAiVectorStoreSearchRequestSchema.safeParse({}).success).toBe(
        false
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
