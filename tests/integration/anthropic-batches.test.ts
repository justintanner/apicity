import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type { AnthropicBatch } from "@apicity/anthropic";

describe("anthropic message batches integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("list batches", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/batches-list");
    });

    it("should list message batches", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.messages.batches.list();

      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");

      if (result.data.length > 0) {
        const batch: AnthropicBatch = result.data[0];
        expect(batch.id).toBeDefined();
        expect(batch.type).toBe("message_batch");
        expect(["in_progress", "canceling", "ended"]).toContain(
          batch.processing_status
        );
        expect(batch.request_counts).toBeDefined();
        expect(typeof batch.request_counts.succeeded).toBe("number");
      }
    });
  });

  describe("retrieve batch", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/batches-retrieve");
    });

    it("should retrieve a single batch by id", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const list = await provider.v1.messages.batches.list();
      if (list.data.length === 0) return; // no batches to retrieve

      const id = list.data[0].id;
      const result = await provider.v1.messages.batches.retrieve(id);

      expect(result.id).toBe(id);
      expect(result.type).toBe("message_batch");
      expect(["in_progress", "canceling", "ended"]).toContain(
        result.processing_status
      );
      expect(result.request_counts).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.expires_at).toBeDefined();
    });
  });
});
