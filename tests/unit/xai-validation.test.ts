import { describe, it, expect } from "vitest";

import { validatePayload } from "../../packages/provider/xai/src/validate";
import {
  chatCompletionsSchema,
  imageGenerationsSchema,
  imageEditsSchema,
  videoGenerationsSchema,
  videoEditsSchema,
  videoExtensionsSchema,
  batchCreateSchema,
  batchAddRequestsSchema,
  collectionCreateSchema,
  collectionUpdateSchema,
  documentAddSchema,
  documentSearchSchema,
  responsesSchema,
  realtimeClientSecretsSchema,
  tokenizeTextSchema,
} from "../../packages/provider/xai/src/schemas";

describe("validatePayload edge cases", () => {
  describe("null and undefined handling", () => {
    it("should reject null payload", () => {
      const result = validatePayload(null, chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject undefined payload", () => {
      const result = validatePayload(undefined, chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject array as payload", () => {
      const result = validatePayload([], chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject string as payload", () => {
      const result = validatePayload("string", chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject number as payload", () => {
      const result = validatePayload(123, chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject boolean as payload", () => {
      const result = validatePayload(true, chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });
  });

  describe("empty object handling", () => {
    it("should handle empty object with no required fields", () => {
      // documentAddSchema has no required fields
      const result = validatePayload({}, documentAddSchema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty object when required fields missing", () => {
      const result = validatePayload({}, chatCompletionsSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });

    it("should reject empty object for batch creation", () => {
      const result = validatePayload({}, batchCreateSchema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name is required");
    });
  });

  describe("type validation edge cases", () => {
    it("should reject string where number expected", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [{ role: "user", content: "Hello" }],
          temperature: "hot", // Should be number
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("temperature must be of type number");
    });

    it("should reject number where string expected", () => {
      const result = validatePayload(
        {
          model: 123, // Should be string
          messages: [{ role: "user", content: "Hello" }],
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model must be of type string");
    });

    it("should reject object where array expected", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: { role: "user", content: "Hello" }, // Should be array
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages must be of type array");
    });

    it("should reject array where object expected", () => {
      const result = validatePayload(
        {
          prompt: "A cat",
          model: [], // Should be string
        },
        imageGenerationsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model must be of type string");
    });

    it("should accept null for non-required fields", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [{ role: "user", content: "Hello" }],
          temperature: null, // Not required, so null is acceptable
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(true);
    });
  });

  describe("enum validation edge cases", () => {
    it("should reject invalid enum value for resolution", () => {
      const result = validatePayload(
        {
          prompt: "A cat",
          resolution: "4k", // Not in enum ["1k", "2k"]
        },
        imageGenerationsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("resolution must be one of: 1k, 2k");
    });

    it("should reject invalid aspect ratio", () => {
      const result = validatePayload(
        {
          prompt: "A cat",
          aspect_ratio: "21:9", // Not in enum
        },
        videoGenerationsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "aspect_ratio must be one of: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3"
      );
    });

    it("should accept valid enum values", () => {
      const result1 = validatePayload(
        { prompt: "A cat", resolution: "1k" },
        imageGenerationsSchema
      );
      const result2 = validatePayload(
        { prompt: "A cat", resolution: "2k" },
        imageGenerationsSchema
      );

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it("should handle case-sensitive enum validation", () => {
      const result = validatePayload(
        {
          prompt: "A cat",
          response_format: "URL", // Should be lowercase "url"
        },
        imageGenerationsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "response_format must be one of: url, b64_json"
      );
    });
  });

  describe("nested field validation", () => {
    it("should validate deeply nested required fields in messages", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [
            { role: "user" }, // Missing required 'content'
          ],
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages[0].content is required");
    });

    it("should validate nested role enum", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [
            { role: "bot", content: "Hello" }, // Invalid role
          ],
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "messages[0].role must be one of: user, assistant, system"
      );
    });

    it("should validate nested type in tools", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [{ role: "user", content: "Hello" }],
          tools: [
            {
              type: "invalid", // Should be "function"
              function: { name: "test" },
            },
          ],
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("tools[0].type must be one of: function");
    });

    it("should validate deeply nested function properties", () => {
      const result = validatePayload(
        {
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
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("tools[0].function.name is required");
    });

    it("should validate image URL structure", () => {
      const result = validatePayload(
        {
          prompt: "Edit this image",
          image: {
            // Missing required 'url'
            type: "image_url",
          },
        },
        imageEditsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("image.url is required");
    });

    it("should validate video URL in video generations", () => {
      const result = validatePayload(
        {
          prompt: "Generate video",
          image: {
            // Missing required 'url'
            type: "image_url",
          },
        },
        videoGenerationsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("image.url is required");
    });

    it("should validate video URL in video edits", () => {
      const result = validatePayload(
        {
          prompt: "Edit video",
          // Missing required 'video'
        },
        videoEditsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video is required");
    });

    it("should validate video URL structure in video edits", () => {
      const result = validatePayload(
        {
          prompt: "Edit video",
          video: {
            // Missing required 'url'
          },
        },
        videoEditsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video.url is required");
    });
  });

  describe("array validation edge cases", () => {
    it("should validate empty required array", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [], // Empty but required
        },
        chatCompletionsSchema
      );

      // Empty array is still an array, schema validates the type not length
      expect(result.valid).toBe(true);
    });

    it("should validate array item types", () => {
      const result = validatePayload(
        {
          batch_requests: [
            {
              batch_request_id: "req-1",
              batch_request: {
                chat_get_completion: {},
              },
            },
            "invalid item", // Should be object
          ],
        },
        batchAddRequestsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "batch_requests[1] must be of type object"
      );
    });

    it("should validate multiple array item errors", () => {
      const result = validatePayload(
        {
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
        },
        batchAddRequestsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "batch_requests[0].batch_request is required"
      );
      expect(result.errors).toContain(
        "batch_requests[1].batch_request is required"
      );
    });

    it("should validate nested array in source.collections", () => {
      const result = validatePayload(
        {
          query: "test",
          source: {
            collection_ids: ["id1", 123], // Second item should be string
          },
        },
        documentSearchSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "source.collection_ids[1] must be of type string"
      );
    });
  });

  describe("complex schema validation", () => {
    it("should validate responses schema with minimal input", () => {
      const result = validatePayload(
        {
          model: "grok-4-fast",
          input: "Hello",
        },
        responsesSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should reject array input (schema requires string)", () => {
      const result = validatePayload(
        {
          model: "grok-4-fast",
          input: [{ role: "user", content: "Hello" }], // Array, but schema expects string
        },
        responsesSchema
      );

      // Schema only accepts string type for input
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input must be of type string");
    });

    it("should reject responses schema missing model", () => {
      const result = validatePayload(
        {
          input: "Hello",
          // Missing required model
        },
        responsesSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should validate realtime client secrets with expires_after", () => {
      const result = validatePayload(
        {
          expires_after: {
            seconds: 600,
          },
        },
        realtimeClientSecretsSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should validate realtime client secrets with partial config", () => {
      const result = validatePayload(
        {
          expires_after: {
            seconds: 3600,
          },
          session: {
            voice: "alloy",
          },
        },
        realtimeClientSecretsSchema
      );

      expect(result.valid).toBe(true);
    });
  });

  describe("collection schema validation", () => {
    it("should validate collection creation with field definitions", () => {
      const result = validatePayload(
        {
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
        },
        collectionCreateSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should reject collection field definition missing key", () => {
      const result = validatePayload(
        {
          collection_name: "My Collection",
          field_definitions: [
            {
              required: true,
              // Missing required key
            },
          ],
        },
        collectionCreateSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("field_definitions[0].key is required");
    });

    it("should validate collection update with field_definition_updates", () => {
      const result = validatePayload(
        {
          field_definition_updates: [
            {
              field_definition: {
                key: "new_field",
                required: false,
              },
              operation: "FIELD_DEFINITION_ADD",
            },
          ],
        },
        collectionUpdateSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should reject invalid operation in field_definition_updates", () => {
      const result = validatePayload(
        {
          field_definition_updates: [
            {
              field_definition: {
                key: "new_field",
              },
              operation: "INVALID_OPERATION",
            },
          ],
        },
        collectionUpdateSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "field_definition_updates[0].operation must be one of: FIELD_DEFINITION_ADD, FIELD_DEFINITION_DELETE"
      );
    });
  });

  describe("document search validation", () => {
    it("should validate document search with minimal fields", () => {
      const result = validatePayload(
        {
          query: "test query",
          source: {
            collection_ids: ["col-1"],
          },
        },
        documentSearchSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should validate document search with all fields", () => {
      const result = validatePayload(
        {
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
        },
        documentSearchSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should reject document search with invalid ranking_metric", () => {
      const result = validatePayload(
        {
          query: "test",
          source: { collection_ids: ["col-1"] },
          ranking_metric: "INVALID_METRIC",
        },
        documentSearchSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "ranking_metric must be one of: RANKING_METRIC_UNKNOWN, RANKING_METRIC_L2_DISTANCE, RANKING_METRIC_COSINE_SIMILARITY"
      );
    });

    it("should reject document search with missing group_by.keys", () => {
      const result = validatePayload(
        {
          query: "test",
          source: { collection_ids: ["col-1"] },
          group_by: {
            // Missing required keys
            aggregate: {},
          },
        },
        documentSearchSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("group_by.keys is required");
    });

    it("should reject document search with invalid retrieval_mode.type", () => {
      const result = validatePayload(
        {
          query: "test",
          source: { collection_ids: ["col-1"] },
          retrieval_mode: {
            type: "invalid",
          },
        },
        documentSearchSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "retrieval_mode.type must be one of: hybrid, keyword, semantic"
      );
    });
  });

  describe("tokenize text validation", () => {
    it("should validate tokenize text with required fields", () => {
      const result = validatePayload(
        {
          model: "grok-4-0709",
          text: "Hello world",
        },
        tokenizeTextSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should validate tokenize text with optional user field", () => {
      const result = validatePayload(
        {
          model: "grok-4-0709",
          text: "Hello world",
          user: "user-123",
        },
        tokenizeTextSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should reject tokenize text missing model", () => {
      const result = validatePayload(
        {
          text: "Hello world",
        },
        tokenizeTextSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject tokenize text missing text", () => {
      const result = validatePayload(
        {
          model: "grok-4-0709",
        },
        tokenizeTextSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("text is required");
    });
  });

  describe("video extensions validation", () => {
    it("should validate video extensions with required fields", () => {
      const result = validatePayload(
        {
          prompt: "Extend this video",
          video: {
            url: "https://example.com/video.mp4",
          },
        },
        videoExtensionsSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should validate video extensions with optional duration", () => {
      const result = validatePayload(
        {
          prompt: "Extend this video",
          video: {
            url: "https://example.com/video.mp4",
          },
          duration: 5,
        },
        videoExtensionsSchema
      );

      expect(result.valid).toBe(true);
    });

    it("should reject video extensions missing video", () => {
      const result = validatePayload(
        {
          prompt: "Extend this video",
        },
        videoExtensionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video is required");
    });

    it("should reject video extensions with missing video.url", () => {
      const result = validatePayload(
        {
          prompt: "Extend this video",
          video: {},
        },
        videoExtensionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video.url is required");
    });
  });

  describe("multiple validation errors", () => {
    it("should collect all validation errors", () => {
      const result = validatePayload(
        {
          // Missing model and messages
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThanOrEqual(1);
      expect(result.errors).toContain("messages is required");
    });

    it("should return empty errors array when valid", () => {
      const result = validatePayload(
        {
          model: "grok-3",
          messages: [{ role: "user", content: "Hello" }],
        },
        chatCompletionsSchema
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
