// Unit tests for xAI Zod schemas — pure functions, no API calls
import { describe, it, expect } from "vitest";
import {
  XaiChatRequestSchema,
  XaiImageGenerateRequestSchema,
  XaiImageEditRequestSchema,
  XaiVideoGenerateRequestSchema,
  XaiVideoEditRequestSchema,
  XaiVideoExtendRequestSchema,
  XaiBatchCreateRequestSchema,
  XaiCollectionCreateRequestSchema,
  XaiCollectionUpdateRequestSchema,
  XaiDocumentSearchRequestSchema,
  XaiResponseRequestSchema,
  XaiTokenizeTextRequestSchema,
  XaiRealtimeClientSecretRequestSchema,
} from "../../packages/provider/xai/src/zod";

describe("xAI Zod schema validation", () => {
  describe("chat completions", () => {
    it("accepts valid chat request with required fields", () => {
      const result = XaiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid chat request with all fields", () => {
      const result = XaiChatRequestSchema.safeParse({
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
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required messages field", () => {
      const result = XaiChatRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("messages"))
      ).toBe(true);
    });

    it("rejects invalid message role", () => {
      const result = XaiChatRequestSchema.safeParse({
        messages: [{ role: "invalid_role", content: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("validates nested message objects", () => {
      const result = XaiChatRequestSchema.safeParse({
        messages: [{ role: "user" }], // missing content
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("image generations", () => {
    it("accepts valid image generation request", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({
        prompt: "A red apple",
        model: "grok-imagine-image-quality",
        n: 2,
        response_format: "url",
        aspect_ratio: "16:9",
        resolution: "1k",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required prompt", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("rejects invalid response_format enum", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({
        prompt: "test",
        response_format: "invalid",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("rejects invalid resolution enum", () => {
      const result = XaiImageGenerateRequestSchema.safeParse({
        prompt: "test",
        resolution: "4k",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("image edits", () => {
    it("accepts valid image edit request", () => {
      const result = XaiImageEditRequestSchema.safeParse({
        prompt: "Make it blue",
        model: "grok-imagine-image-quality",
        image: { url: "https://example.com/image.jpg", type: "image_url" },
        n: 1,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid image edit with images array", () => {
      const result = XaiImageEditRequestSchema.safeParse({
        prompt: "Combine these",
        images: [
          { url: "https://example.com/1.jpg", type: "image_url" },
          { url: "https://example.com/2.jpg" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required prompt", () => {
      const result = XaiImageEditRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });
  });

  describe("video generations", () => {
    it("accepts valid video generation request", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "A cat walking",
        model: "grok-imagine-video",
        duration: 10,
        aspect_ratio: "16:9",
        resolution: "720p",
        image: { url: "https://example.com/image.jpg" },
        reference_images: [{ url: "https://example.com/ref1.jpg" }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required prompt", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
        true
      );
    });

    it("rejects invalid aspect_ratio", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "test",
        aspect_ratio: "21:9",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("rejects invalid resolution", () => {
      const result = XaiVideoGenerateRequestSchema.safeParse({
        prompt: "test",
        resolution: "1080p",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("video edits", () => {
    it("accepts valid video edit request", () => {
      const result = XaiVideoEditRequestSchema.safeParse({
        prompt: "Add a filter",
        model: "grok-imagine-video",
        video: { url: "https://example.com/video.mp4" },
        output: { upload_url: "https://example.com/upload" },
        user: "user-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required video field", () => {
      const result = XaiVideoEditRequestSchema.safeParse({ prompt: "test" });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("video"))).toBe(
        true
      );
    });

    it("rejects missing required url in video object", () => {
      const result = XaiVideoEditRequestSchema.safeParse({
        prompt: "test",
        video: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("video extensions", () => {
    it("accepts valid video extension request", () => {
      const result = XaiVideoExtendRequestSchema.safeParse({
        prompt: "Continue the scene",
        model: "grok-imagine-video",
        duration: 5,
        video: { url: "https://example.com/video.mp4" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required video field", () => {
      const result = XaiVideoExtendRequestSchema.safeParse({ prompt: "test" });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("video"))).toBe(
        true
      );
    });
  });

  describe("batch operations", () => {
    it("accepts valid batch create request", () => {
      const result = XaiBatchCreateRequestSchema.safeParse({
        name: "my-batch",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required name field", () => {
      const result = XaiBatchCreateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("name"))).toBe(
        true
      );
    });
  });

  describe("collections", () => {
    it("accepts valid collection create request", () => {
      const result = XaiCollectionCreateRequestSchema.safeParse({
        collection_name: "my-collection",
        collection_description: "Test collection",
        team_id: "team-123",
        index_configuration: { model_name: "embedding-model" },
        metric_space: "HNSW_METRIC_COSINE",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required collection_name", () => {
      const result = XaiCollectionCreateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("collection_name"))
      ).toBe(true);
    });

    it("rejects invalid metric_space enum", () => {
      const result = XaiCollectionCreateRequestSchema.safeParse({
        collection_name: "test",
        metric_space: "INVALID",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("accepts valid collection update request", () => {
      const result = XaiCollectionUpdateRequestSchema.safeParse({
        collection_name: "updated-name",
        field_definition_updates: [
          {
            field_definition: { key: "title", required: true },
            operation: "FIELD_DEFINITION_ADD",
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("document search", () => {
    it("accepts valid document search request", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "search term",
        source: {
          collection_ids: ["col-1", "col-2"],
          rag_pipeline: "chroma_db",
        },
        filter: "field:value",
        limit: 10,
        ranking_metric: "RANKING_METRIC_COSINE_SIMILARITY",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required query", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("query"))).toBe(
        true
      );
    });

    it("rejects missing required source", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("source"))).toBe(
        true
      );
    });

    it("rejects invalid ranking_metric", () => {
      const result = XaiDocumentSearchRequestSchema.safeParse({
        query: "test",
        source: { collection_ids: ["col-1"] },
        ranking_metric: "INVALID",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("responses", () => {
    it("accepts valid responses request", () => {
      const result = XaiResponseRequestSchema.safeParse({
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
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required model", () => {
      const result = XaiResponseRequestSchema.safeParse({ input: "test" });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("rejects missing required input", () => {
      const result = XaiResponseRequestSchema.safeParse({
        model: "grok-4-fast",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
        true
      );
    });

    it("rejects invalid search_parameters.mode", () => {
      const result = XaiResponseRequestSchema.safeParse({
        model: "grok-4-fast",
        input: "test",
        search_parameters: { mode: "invalid" },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("tokenize text", () => {
    it("accepts valid tokenize request", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({
        model: "grok-4-0709",
        text: "Hello world",
        user: "user-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required model", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({ text: "test" });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
        true
      );
    });

    it("rejects missing required text", () => {
      const result = XaiTokenizeTextRequestSchema.safeParse({
        model: "grok-4-0709",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
        true
      );
    });
  });

  describe("realtime client secrets", () => {
    it("accepts valid client secrets request", () => {
      const result = XaiRealtimeClientSecretRequestSchema.safeParse({
        expires_after: { seconds: 3600 },
        session: { model: "grok-4-fast" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty request (all fields optional)", () => {
      const result = XaiRealtimeClientSecretRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("rejects null payload", () => {
      const result = XaiChatRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("rejects array payload", () => {
      const result = XaiChatRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("rejects string payload", () => {
      const result = XaiChatRequestSchema.safeParse("hello");
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("rejects number payload", () => {
      const result = XaiChatRequestSchema.safeParse(123);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("rejects boolean payload", () => {
      const result = XaiChatRequestSchema.safeParse(true);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("accepts payload with extra fields (passthrough)", () => {
      const result = XaiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
        extra_field: "ignored",
      });
      expect(result.success).toBe(true);
    });

    it("handles deeply nested array validation", () => {
      const result = XaiChatRequestSchema.safeParse({
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant" }, // missing content
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});
