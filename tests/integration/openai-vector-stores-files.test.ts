import { afterEach, describe, expect, it } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createOpenAi } from "@apicity/openai";
import { OpenAiVectorStoreFileCreateRequestSchema } from "@apicity/openai/zod";

describe("openai vector store files integration", () => {
  describe("attach and list vector store files", () => {
    let ctx: PollyContext;

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should attach and list a vector store file", async () => {
      ctx = setupPollyForFileUploads("openai/vector-stores-files");
      const provider = createOpenAi({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const file = new Blob(
        ["Apicity vector store files integration fixture.\n"],
        { type: "text/plain" }
      );
      const uploaded = await provider.post.v1.files({
        file,
        purpose: "assistants",
      });
      expect(uploaded.id).toBeDefined();
      expect(uploaded.object).toBe("file");

      const store = await provider.post.v1.vectorStores({
        name: "Apicity vector store files test",
        expires_after: { anchor: "last_active_at", days: 1 },
        metadata: { purpose: "integration-test" },
      });
      expect(store.id).toBeDefined();

      const attached = await provider.post.v1.vectorStores.files(store.id, {
        file_id: uploaded.id,
      });
      expect(attached.id).toBe(uploaded.id);
      expect(attached.object).toBe("vector_store.file");
      expect(attached.vector_store_id).toBe(store.id);
      expect(attached.status).toMatch(
        /^(in_progress|completed|cancelled|failed)$/
      );
      expect(typeof attached.created_at).toBe("number");
      expect(typeof attached.usage_bytes).toBe("number");

      // Attachment is accepted synchronously, but the list index becomes
      // visible shortly afterward. Keep this as a bounded, recording-only
      // delay rather than polling attachment status; replay stays immediate.
      if (ctx.mode !== "replay") {
        await new Promise((resolve) => setTimeout(resolve, 15000));
      }

      const page = await provider.get.v1.vectorStores.files(store.id);
      expect(page.object).toBe("list");
      expect(Array.isArray(page.data)).toBe(true);
      expect(typeof page.has_more).toBe("boolean");
      expect(page.data.some((item) => item.id === uploaded.id)).toBe(true);

      const limitedPage = await provider.get.v1.vectorStores.files(store.id, {
        limit: 2,
        order: "desc",
      });
      expect(limitedPage.object).toBe("list");
      expect(Array.isArray(limitedPage.data)).toBe(true);
      expect(limitedPage.data.length).toBeLessThanOrEqual(2);

      const filteredPage = await provider.get.v1.vectorStores.files(store.id, {
        filter: "completed",
      });
      expect(filteredPage.object).toBe("list");
      expect(Array.isArray(filteredPage.data)).toBe(true);
      expect(typeof filteredPage.has_more).toBe("boolean");
    });
  });

  describe("payload validation", () => {
    it("should expose the attach schema", () => {
      const provider = createOpenAi({ apiKey: "sk-test-key" });

      expect(provider.post.v1.vectorStores.files.schema).toBe(
        OpenAiVectorStoreFileCreateRequestSchema
      );
      expect(typeof provider.post.v1.vectorStores.files.schema.safeParse).toBe(
        "function"
      );
    });

    it("should validate attach payloads", () => {
      const validPayloads = [
        { file_id: "file-xyz" },
        {
          file_id: "file-xyz",
          attributes: { author: "gc", year: 2026, draft: false },
        },
        {
          file_id: "file-xyz",
          chunking_strategy: {
            type: "static",
            static: {
              max_chunk_size_tokens: 100,
              chunk_overlap_tokens: 0,
            },
          },
        },
      ];

      for (const payload of validPayloads) {
        expect(
          OpenAiVectorStoreFileCreateRequestSchema.safeParse(payload).success
        ).toBe(true);
      }

      expect(
        OpenAiVectorStoreFileCreateRequestSchema.safeParse({}).success
      ).toBe(false);
    });
  });
});
