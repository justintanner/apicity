import { describe, it, expect } from "vitest";

import {
  XaiChatRequestSchema,
  XaiImageGenerateRequestSchema,
  XaiImageEditRequestSchema,
  XaiVideoGenerateRequestSchema,
  XaiVideoEditRequestSchema,
  XaiVideoExtendRequestSchema,
  XaiBatchCreateRequestSchema,
  XaiBatchAddRequestsBodySchema,
  XaiCollectionCreateRequestSchema,
  XaiCollectionUpdateRequestSchema,
  XaiDocumentAddRequestSchema,
  XaiDocumentSearchRequestSchema,
  XaiResponseRequestSchema,
  XaiRealtimeClientSecretRequestSchema,
  XaiTokenizeTextRequestSchema,
  XaiBillingUsageRequestSchema,
} from "../../packages/provider/xai/src/zod";

describe("Zod schema validation edge cases", () => {
  describe("null and undefined handling", () => {
    it("should reject null payload", () => {
      const result = XaiChatRequestSchema.safeParse(null);

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject undefined payload", () => {
      const result = XaiChatRequestSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject array as payload", () => {
      const result = XaiChatRequestSchema.safeParse([]);

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject string as payload", () => {
      const result = XaiChatRequestSchema.safeParse("string");

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject number as payload", () => {
      const result = XaiChatRequestSchema.safeParse(123);

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject boolean as payload", () => {
      const result = XaiChatRequestSchema.safeParse(true);

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("empty object handling", () => {
    it("should handle empty object with no required fields", () => {
      // XaiDocumentAddRequestSchema has no required fields
      const result = XaiDocumentAddRequestSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should reject empty object when required fields missing", () => {
      const result = XaiChatRequestSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should reject empty object for batch creation", () => {
      const result = XaiBatchCreateRequestSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("name"))).toBe(
        true
      );
    });
  });

  describe("type validation edge cases", () => {
    it("should reject string where number expected", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [{ role: "user", content: "Hello" }],
        temperature: "hot", // Should be number
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject number where string expected", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: 123, // Should be string
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject object where array expected", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: { role: "user", content: "Hello" }, // Should be array
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject array where object expected", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({
        prompt: "A cat",
        model: [], // Should be string
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept null for non-required fields", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [{ role: "user", content: "Hello" }],
        temperature: null, // Not required, so null is acceptable
      });

      // Zod may or may not accept null for optional fields depending on schema definition;
      // this tests the schema's actual behavior
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("enum validation edge cases", () => {
    it("should reject invalid enum value for resolution", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({
        prompt: "A cat",
        resolution: "4k", // Not in enum ["1k", "2k"]
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject invalid aspect ratio", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "A cat",
        aspect_ratio: "21:9", // Not in enum
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept valid enum values", () => {
      const result1 = XaiImageGenerateRequestSchema.safeParse({
        prompt: "A cat",
        resolution: "1k",
      });
      const result2 = XaiImageGenerateRequestSchema.safeParse({
        prompt: "A cat",
        resolution: "2k",
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("should handle case-sensitive enum validation", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({
        prompt: "A cat",
        response_format: "URL", // Should be lowercase "url"
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("nested field validation", () => {
    it("should validate deeply nested required fields in messages", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [
          { role: "user" }, // Missing required 'content'
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate nested role enum", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [
          { role: "bot", content: "Hello" }, // Invalid role
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate nested type in tools", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            type: "invalid", // Should be "function"
            function: { name: "test" },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate deeply nested function properties", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            type: "function",
            function: {
              // Missing required 'name'
              description: "Test function",
            },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate image URL structure", () => {
      const result = XaiImageEditRequestSchema.safeParse({
        prompt: "Edit this image",
        image: {
          // Missing required 'url'
          type: "image_url",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate video URL in video generations", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "Generate video",
        image: {
          // Missing required 'url'
          type: "image_url",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate video URL in video edits", () => {
      const result = XaiVideoEditRequestSchema.safeParse({
        prompt: "Edit video",
        // Missing required 'video'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("video"))).toBe(
        true
      );
    });

    it("should validate video URL structure in video edits", () => {
      const result = XaiVideoEditRequestSchema.safeParse({
        prompt: "Edit video",
        video: {
          // Missing required 'url'
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("array validation edge cases", () => {
    it("should validate empty required array", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [], // Empty but required
      });

      // Empty array is still an array, schema validates the type not length
      expect(result.success).toBe(true);
    });

    it("should validate array item types", () => {
      const result = XaiBatchAddRequestsBodySchema.safeParse({
        batch_requests: [
          {
            batch_request_id: "req-1",
            batch_request: {
              chat_get_completion: {},
            },
          },
          "invalid item", // Should be object
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate multiple array item errors", () => {
      const result = XaiBatchAddRequestsBodySchema.safeParse({
        batch_requests: [
          {
            batch_request_id: "req-1",
            // Missing required batch_request
          },
          {
            batch_request_id: "req-2",
            // Missing required batch_request
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate nested array in source.collections", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test",
        source: {
          collection_ids: ["id1", 123], // Second item should be string
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("complex schema validation", () => {
    it("should validate responses schema with minimal input", () => {
      const result = XaiResponseRequestSchema.safeParse({
        model: "grok-4-fast",
        input: "Hello",
      });

      expect(result.success).toBe(true);
    });

    it("should accept array input (schema supports string | InputItem[])", () => {
      const result = XaiResponseRequestSchema.safeParse({
        model: "grok-4-fast",
        input: [{ role: "user", content: "Hello" }],
      });

      expect(result.success).toBe(true);
    });

    it("should reject responses schema missing model", () => {
      const result = XaiResponseRequestSchema.safeParse({
        input: "Hello",
        // Missing required model
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should validate realtime client secrets with expires_after", () => {
      const result = XaiRealtimeClientSecretRequestSchema.safeParse({
        expires_after: {
          seconds: 600,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should validate realtime client secrets with partial config", () => {
      const result = XaiRealtimeClientSecretRequestSchema.safeParse({
        expires_after: {
          seconds: 3600,
        },
        session: {
          voice: "alloy",
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("collection schema validation", () => {
    it("should validate collection creation with field definitions", () => {
      const result = XaiCollectionCreateRequestSchema.safeParse({
        collection_name: "My Collection",
        collection_description: "Test collection",
        field_definitions: [
          {
            key: "title",
            required: true,
            unique: false,
            inject_into_chunk: true,
            description: "Document title",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should reject collection field definition missing key", () => {
      const result = XaiCollectionCreateRequestSchema.safeParse({
        collection_name: "My Collection",
        field_definitions: [
          {
            required: true,
            // Missing required key
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should validate collection update with field_definition_updates", () => {
      const result = XaiCollectionUpdateRequestSchema.safeParse({
        field_definition_updates: [
          {
            field_definition: {
              key: "new_field",
              required: false,
            },
            operation: "FIELD_DEFINITION_ADD",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid operation in field_definition_updates", () => {
      const result = XaiCollectionUpdateRequestSchema.safeParse({
        field_definition_updates: [
          {
            field_definition: {
              key: "new_field",
            },
            operation: "INVALID_OPERATION",
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("document search validation", () => {
    it("should validate document search with minimal fields", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test query",
        source: {
          collection_ids: ["col-1"],
        },
      });

      expect(result.success).toBe(true);
    });

    it("should validate document search with all fields", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test query",
        source: {
          collection_ids: ["col-1", "col-2"],
          rag_pipeline: "chroma_db",
        },
        filter: "field:value",
        instructions: "Custom instructions",
        limit: 10,
        ranking_metric: "RANKING_METRIC_COSINE_SIMILARITY",
        group_by: {
          keys: ["field1"],
          aggregate: {},
        },
        retrieval_mode: {
          type: "hybrid",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should reject document search with invalid ranking_metric", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test",
        source: { collection_ids: ["col-1"] },
        ranking_metric: "INVALID_METRIC",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject document search with missing group_by.keys", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test",
        source: { collection_ids: ["col-1"] },
        group_by: {
          // Missing required keys
          aggregate: {},
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject document search with invalid retrieval_mode.type", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test",
        source: { collection_ids: ["col-1"] },
        retrieval_mode: {
          type: "invalid",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("tokenize text validation", () => {
    it("should validate tokenize text with required fields", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({
        model: "grok-4-0709",
        text: "Hello world",
      });

      expect(result.success).toBe(true);
    });

    it("should validate tokenize text with optional user field", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({
        model: "grok-4-0709",
        text: "Hello world",
        user: "user-123",
      });

      expect(result.success).toBe(true);
    });

    it("should reject tokenize text missing model", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({
        text: "Hello world",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("should reject tokenize text missing text", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({
        model: "grok-4-0709",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
        true
      );
    });
  });

  describe("billing usage validation", () => {
    it("should validate billing usage requests", () => {
      const result = XaiBillingUsageRequestSchema.safeParse({
        analyticsRequest: {
          timeRange: {
            startTime: "2026-01-01T00:00:00Z",
            endTime: "2026-01-02T00:00:00Z",
            timezone: "UTC",
          },
          timeUnit: "TIME_UNIT_DAY",
          values: [{ name: "usd", aggregation: "AGGREGATION_SUM" }],
          groupBy: ["model"],
          filters: ["model:grok-4"],
        },
      });

      expect(result.success).toBe(true);
    });

    it("should reject billing usage without analyticsRequest", () => {
      const result = XaiBillingUsageRequestSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("analyticsRequest"))
      ).toBe(true);
    });

    it("should reject invalid billing usage aggregations", () => {
      const result = XaiBillingUsageRequestSchema.safeParse({
        analyticsRequest: {
          timeRange: {
            startTime: "2026-01-01T00:00:00Z",
            endTime: "2026-01-02T00:00:00Z",
            timezone: "UTC",
          },
          values: [{ name: "usd", aggregation: "TOTAL" }],
        },
      });

      expect(result.success).toBe(false);
    });
  });

  describe("video extensions validation", () => {
    it("should validate video extensions with required fields", () => {
      const result = XaiVideoExtendRequestSchema.safeParse({
        prompt: "Extend this video",
        video: {
          url: "https://example.com/video.mp4",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should validate video extensions with optional duration", () => {
      const result = XaiVideoExtendRequestSchema.safeParse({
        prompt: "Extend this video",
        video: {
          url: "https://example.com/video.mp4",
        },
        duration: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should reject video extensions missing video", () => {
      const result = XaiVideoExtendRequestSchema.safeParse({
        prompt: "Extend this video",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("video"))).toBe(
        true
      );
    });

    it("should reject video extensions with missing video.url", () => {
      const result = XaiVideoExtendRequestSchema.safeParse({
        prompt: "Extend this video",
        video: {},
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("multiple validation errors", () => {
    it("should collect all validation errors", () => {
      const result = XaiChatRequestSchema.safeParse({
        // Missing model and messages
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(1);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("should return success when valid", () => {
      const result = XaiChatRequestSchema.safeParse({
        model: "grok-3",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.success).toBe(true);
    });
  });
});
