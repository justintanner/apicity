import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai batches integration", () => {
  let ctx: PollyContext;

  describe("list batches", () => {
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list batches", async () => {
      ctx = setupPolly("openai/batches-list");
      const provider = openai({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.batches.list();

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");
    });

    it("should list batches with limit parameter", async () => {
      ctx = setupPolly("openai/batches-list-limit");
      const provider = openai({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.batches.list({ limit: 2 });

      expect(result.object).toBe("list");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe("payload validation", () => {
    it("should expose payloadSchema on create method", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const schema = provider.v1.batches.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/batches");
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.input_file_id.required).toBe(true);
      expect(schema.fields.endpoint.required).toBe(true);
      expect(schema.fields.completion_window.required).toBe(true);
    });

    it("should validate a valid create payload", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const result = provider.v1.batches.validatePayload({
        input_file_id: "file-abc123",
        endpoint: "/v1/chat/completions",
        completion_window: "24h",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject payload missing required fields", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const result = provider.v1.batches.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should expose payloadSchema on cancel method", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const schema = provider.v1.batches.cancel.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/batches/{batch_id}/cancel");
    });
  });
});
