// Unit tests for xAI validate.ts — pure functions, no API calls
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
  collectionCreateSchema,
  collectionUpdateSchema,
  documentSearchSchema,
  responsesSchema,
  tokenizeTextSchema,
  realtimeClientSecretsSchema,
} from "../../packages/provider/xai/src/schemas";

describe("xAI validatePayload", () => {
  describe("chat completions", () => {
    it("accepts valid chat request with required fields", () => {
      const result = validatePayload(
        { messages: [{ role: "user", content: "Hello" }] },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts valid chat request with all fields", () => {
      const result = validatePayload(
        {
          model: "grok-3-fast",
          messages: [
            { role: "system", content: "You are helpful" },
            { role: "user", content: "Hello" },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          tools: [
            {
              type: "function",
              function: { name: "get_weather", description: "Get weather" },
            },
          ],
          tool_choice: "auto",
          deferred: true,
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required messages field", () => {
      const result = validatePayload({}, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages is required");
    });

    it("rejects invalid message role", () => {
      const result = validatePayload(
        {
          messages: [{ role: "invalid_role", content: "Hello" }],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });

    it("validates nested message objects", () => {
      const result = validatePayload(
        {
          messages: [{ role: "user" }], // missing content
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages[0].content is required");
    });
  });

  describe("image generations", () => {
    it("accepts valid image generation request", () => {
      const result = validatePayload(
        {
          prompt: "A red apple",
          model: "grok-imagine-image",
          n: 2,
          response_format: "url",
          aspect_ratio: "16:9",
          resolution: "1k",
        },
        imageGenerationsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required prompt", () => {
      const result = validatePayload({}, imageGenerationsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("rejects invalid response_format enum", () => {
      const result = validatePayload(
        { prompt: "test", response_format: "invalid" },
        imageGenerationsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });

    it("rejects invalid resolution enum", () => {
      const result = validatePayload(
        { prompt: "test", resolution: "4k" },
        imageGenerationsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });
  });

  describe("image edits", () => {
    it("accepts valid image edit request", () => {
      const result = validatePayload(
        {
          prompt: "Make it blue",
          model: "grok-imagine-image",
          image: { url: "https://example.com/image.jpg", type: "image_url" },
          n: 1,
        },
        imageEditsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("accepts valid image edit with images array", () => {
      const result = validatePayload(
        {
          prompt: "Combine these",
          images: [
            { url: "https://example.com/1.jpg", type: "image_url" },
            { url: "https://example.com/2.jpg" },
          ],
        },
        imageEditsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required prompt", () => {
      const result = validatePayload({}, imageEditsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });
  });

  describe("video generations", () => {
    it("accepts valid video generation request", () => {
      const result = validatePayload(
        {
          prompt: "A cat walking",
          model: "grok-imagine-video",
          duration: 10,
          aspect_ratio: "16:9",
          resolution: "720p",
          image: { url: "https://example.com/image.jpg" },
          reference_images: [{ url: "https://example.com/ref1.jpg" }],
        },
        videoGenerationsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required prompt", () => {
      const result = validatePayload({}, videoGenerationsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("rejects invalid aspect_ratio", () => {
      const result = validatePayload(
        { prompt: "test", aspect_ratio: "21:9" },
        videoGenerationsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });

    it("rejects invalid resolution", () => {
      const result = validatePayload(
        { prompt: "test", resolution: "1080p" },
        videoGenerationsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });
  });

  describe("video edits", () => {
    it("accepts valid video edit request", () => {
      const result = validatePayload(
        {
          prompt: "Add a filter",
          model: "grok-imagine-video",
          video: { url: "https://example.com/video.mp4" },
          output: { upload_url: "https://example.com/upload" },
          user: "user-123",
        },
        videoEditsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required video field", () => {
      const result = validatePayload({ prompt: "test" }, videoEditsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video is required");
    });

    it("rejects missing required url in video object", () => {
      const result = validatePayload(
        { prompt: "test", video: {} },
        videoEditsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video.url is required");
    });
  });

  describe("video extensions", () => {
    it("accepts valid video extension request", () => {
      const result = validatePayload(
        {
          prompt: "Continue the scene",
          model: "grok-imagine-video",
          duration: 5,
          video: { url: "https://example.com/video.mp4" },
        },
        videoExtensionsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required video field", () => {
      const result = validatePayload({ prompt: "test" }, videoExtensionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("video is required");
    });
  });

  describe("batch operations", () => {
    it("accepts valid batch create request", () => {
      const result = validatePayload({ name: "my-batch" }, batchCreateSchema);
      expect(result.valid).toBe(true);
    });

    it("rejects missing required name field", () => {
      const result = validatePayload({}, batchCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name is required");
    });
  });

  describe("collections", () => {
    it("accepts valid collection create request", () => {
      const result = validatePayload(
        {
          collection_name: "my-collection",
          collection_description: "Test collection",
          team_id: "team-123",
          index_configuration: { model_name: "embedding-model" },
          metric_space: "HNSW_METRIC_COSINE",
        },
        collectionCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required collection_name", () => {
      const result = validatePayload({}, collectionCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("collection_name is required");
    });

    it("rejects invalid metric_space enum", () => {
      const result = validatePayload(
        { collection_name: "test", metric_space: "INVALID" },
        collectionCreateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });

    it("accepts valid collection update request", () => {
      const result = validatePayload(
        {
          collection_name: "updated-name",
          field_definition_updates: [
            {
              field_definition: { key: "title", required: true },
              operation: "FIELD_DEFINITION_ADD",
            },
          ],
        },
        collectionUpdateSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("document search", () => {
    it("accepts valid document search request", () => {
      const result = validatePayload(
        {
          query: "search term",
          source: {
            collection_ids: ["col-1", "col-2"],
            rag_pipeline: "chroma_db",
          },
          filter: "field:value",
          limit: 10,
          ranking_metric: "RANKING_METRIC_COSINE_SIMILARITY",
        },
        documentSearchSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required query", () => {
      const result = validatePayload({}, documentSearchSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("query is required");
    });

    it("rejects missing required source", () => {
      const result = validatePayload({ query: "test" }, documentSearchSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("source is required");
    });

    it("rejects invalid ranking_metric", () => {
      const result = validatePayload(
        {
          query: "test",
          source: { collection_ids: ["col-1"] },
          ranking_metric: "INVALID",
        },
        documentSearchSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });
  });

  describe("responses", () => {
    it("accepts valid responses request", () => {
      const result = validatePayload(
        {
          model: "grok-4-fast",
          input: "What is AI?",
          instructions: "Be helpful",
          max_output_tokens: 500,
          temperature: 0.7,
          tools: [{ type: "function", name: "search" }],
          tool_choice: "auto",
          store: true,
          stream: false,
          search_parameters: { mode: "auto", max_search_results: 5 },
          reasoning: { effort: "medium" },
        },
        responsesSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required model", () => {
      const result = validatePayload({ input: "test" }, responsesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("rejects missing required input", () => {
      const result = validatePayload({ model: "grok-4-fast" }, responsesSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input is required");
    });

    it("rejects invalid search_parameters.mode", () => {
      const result = validatePayload(
        {
          model: "grok-4-fast",
          input: "test",
          search_parameters: { mode: "invalid" },
        },
        responsesSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("must be one of");
    });
  });

  describe("tokenize text", () => {
    it("accepts valid tokenize request", () => {
      const result = validatePayload(
        { model: "grok-4-0709", text: "Hello world", user: "user-123" },
        tokenizeTextSchema
      );
      expect(result.valid).toBe(true);
    });

    it("rejects missing required model", () => {
      const result = validatePayload({ text: "test" }, tokenizeTextSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("rejects missing required text", () => {
      const result = validatePayload(
        { model: "grok-4-0709" },
        tokenizeTextSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("text is required");
    });
  });

  describe("realtime client secrets", () => {
    it("accepts valid client secrets request", () => {
      const result = validatePayload(
        {
          expires_after: { seconds: 3600 },
          session: { model: "grok-4-fast" },
        },
        realtimeClientSecretsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("accepts empty request (all fields optional)", () => {
      const result = validatePayload({}, realtimeClientSecretsSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("rejects null payload", () => {
      const result = validatePayload(null, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("rejects array payload", () => {
      const result = validatePayload([], chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("rejects string payload", () => {
      const result = validatePayload("hello", chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("rejects number payload", () => {
      const result = validatePayload(123, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("rejects boolean payload", () => {
      const result = validatePayload(true, chatCompletionsSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("accepts payload with extra fields (not strict)", () => {
      const result = validatePayload(
        {
          messages: [{ role: "user", content: "Hello" }],
          extra_field: "ignored",
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(true);
    });

    it("handles deeply nested array validation", () => {
      const result = validatePayload(
        {
          messages: [
            { role: "user", content: "Hello" },
            { role: "assistant" }, // missing content
          ],
        },
        chatCompletionsSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("messages[1].content is required");
    });
  });
});
