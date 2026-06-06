import { describe, it, expect } from "vitest";
import {
  z,
  OpenAiChatRequestSchema,
  OpenAiSpeechRequestSchema,
  OpenAiEmbeddingRequestSchema,
  OpenAiImageGenerationRequestSchema,
  OpenAiImageVariationRequestSchema,
  OpenAiModerationRequestSchema,
  OpenAiBatchCreateRequestSchema,
  OpenAiResponseRequestSchema,
  OpenAiFineTuningJobCreateRequestSchema,
  OpenAiCheckpointPermissionCreateRequestSchema,
  OpenAiFileUploadRequestSchema,
  OpenAiOptionsSchema,
  OpenAiMessageSchema,
  OpenAiToolSchema,
  OpenAiStoredCompletionUpdateRequestSchema,
  OpenAiResponseCompactRequestSchema,
  OpenAiResponseInputTokensRequestSchema,
  OpenAiOrganizationUsageQuerySchema,
  OpenAiOrganizationCostsQuerySchema,
  OpenAiOrganizationProjectListQuerySchema,
  OpenAiOrganizationProjectRateLimitListQuerySchema,
} from "@apicity/openai/zod";

describe("OpenAI Zod schemas", () => {
  describe("OpenAiChatRequestSchema", () => {
    it("accepts a valid chat request", () => {
      const result = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("accepts chat request with all optional fields", () => {
      const result = OpenAiChatRequestSchema.safeParse({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.7,
        max_tokens: 100,
        store: true,
        metadata: { key: "value" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing messages", () => {
      const result = OpenAiChatRequestSchema.safeParse({
        model: "gpt-4o",
      });
      expect(result.success).toBe(false);
    });

    it("enforces temperature range 0-2", () => {
      const tooHigh = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hi" }],
        temperature: 3.0,
      });
      expect(tooHigh.success).toBe(false);

      const negative = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hi" }],
        temperature: -0.1,
      });
      expect(negative.success).toBe(false);

      const valid = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hi" }],
        temperature: 2.0,
      });
      expect(valid.success).toBe(true);
    });

    it("validates message role enum", () => {
      const result = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "invalid", content: "Hi" }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts vision content parts", () => {
      const result = OpenAiChatRequestSchema.safeParse({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is this?" },
              {
                type: "image_url",
                image_url: { url: "https://example.com/img.png" },
              },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts tool_choice as string or object", () => {
      const auto = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hi" }],
        tool_choice: "auto",
      });
      expect(auto.success).toBe(true);

      const specific = OpenAiChatRequestSchema.safeParse({
        messages: [{ role: "user", content: "Hi" }],
        tool_choice: {
          type: "function",
          function: { name: "get_weather" },
        },
      });
      expect(specific.success).toBe(true);
    });
  });

  describe("OpenAiSpeechRequestSchema", () => {
    it("accepts a valid speech request", () => {
      const result = OpenAiSpeechRequestSchema.safeParse({
        model: "tts-1",
        input: "Hello world",
        voice: "alloy",
      });
      expect(result.success).toBe(true);
    });

    it("enforces voice enum", () => {
      const result = OpenAiSpeechRequestSchema.safeParse({
        model: "tts-1",
        input: "Hello",
        voice: "invalid_voice",
      });
      expect(result.success).toBe(false);
    });

    it("enforces speed range 0.25-4.0", () => {
      const tooSlow = OpenAiSpeechRequestSchema.safeParse({
        model: "tts-1",
        input: "Hello",
        voice: "alloy",
        speed: 0.1,
      });
      expect(tooSlow.success).toBe(false);

      const tooFast = OpenAiSpeechRequestSchema.safeParse({
        model: "tts-1",
        input: "Hello",
        voice: "alloy",
        speed: 5.0,
      });
      expect(tooFast.success).toBe(false);
    });

    it("enforces input max length 4096", () => {
      const result = OpenAiSpeechRequestSchema.safeParse({
        model: "tts-1",
        input: "x".repeat(4097),
        voice: "alloy",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiEmbeddingRequestSchema", () => {
    it("accepts string input", () => {
      const result = OpenAiEmbeddingRequestSchema.safeParse({
        input: "Hello world",
        model: "text-embedding-3-small",
      });
      expect(result.success).toBe(true);
    });

    it("accepts array of strings input", () => {
      const result = OpenAiEmbeddingRequestSchema.safeParse({
        input: ["Hello", "World"],
        model: "text-embedding-3-small",
      });
      expect(result.success).toBe(true);
    });

    it("validates encoding_format enum", () => {
      const result = OpenAiEmbeddingRequestSchema.safeParse({
        input: "test",
        model: "text-embedding-3-small",
        encoding_format: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiImageGenerationRequestSchema", () => {
    it("accepts a valid generation request", () => {
      const result = OpenAiImageGenerationRequestSchema.safeParse({
        prompt: "A cat sitting on a mat",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty prompt", () => {
      const result = OpenAiImageGenerationRequestSchema.safeParse({
        prompt: "",
      });
      expect(result.success).toBe(false);
    });

    it("validates output_compression range 0-100", () => {
      const result = OpenAiImageGenerationRequestSchema.safeParse({
        prompt: "A cat",
        output_compression: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiImageVariationRequestSchema", () => {
    it("accepts a valid variation request", () => {
      const result = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing image", () => {
      const result = OpenAiImageVariationRequestSchema.safeParse({
        n: 2,
      });
      expect(result.success).toBe(false);
    });

    it("validates size enum", () => {
      const valid = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
        size: "1024x1024",
      });
      expect(valid.success).toBe(true);

      const invalid = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
        size: "256x256",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates n range 1-10", () => {
      const tooHigh = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
        n: 11,
      });
      expect(tooHigh.success).toBe(false);

      const valid = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
        n: 1,
      });
      expect(valid.success).toBe(true);
    });

    it("validates response_format enum", () => {
      const valid = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
        response_format: "url",
      });
      expect(valid.success).toBe(true);

      const invalid = OpenAiImageVariationRequestSchema.safeParse({
        image: new Blob(["fake-image"]),
        response_format: "json",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("OpenAiModerationRequestSchema", () => {
    it("accepts string input", () => {
      const result = OpenAiModerationRequestSchema.safeParse({
        input: "Hello world",
      });
      expect(result.success).toBe(true);
    });

    it("accepts array of strings", () => {
      const result = OpenAiModerationRequestSchema.safeParse({
        input: ["Hello", "World"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts multimodal input", () => {
      const result = OpenAiModerationRequestSchema.safeParse({
        input: [
          { type: "text", text: "Hello" },
          {
            type: "image_url",
            image_url: { url: "https://example.com/a.png" },
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("OpenAiBatchCreateRequestSchema", () => {
    it("accepts a valid batch request", () => {
      const result = OpenAiBatchCreateRequestSchema.safeParse({
        input_file_id: "file-abc123",
        endpoint: "/v1/chat/completions",
        completion_window: "24h",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const result = OpenAiBatchCreateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiResponseRequestSchema", () => {
    it("accepts a simple string input", () => {
      const result = OpenAiResponseRequestSchema.safeParse({
        model: "gpt-4o",
        input: "Hello",
      });
      expect(result.success).toBe(true);
    });

    it("accepts array of input items", () => {
      const result = OpenAiResponseRequestSchema.safeParse({
        model: "gpt-4o",
        input: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing model", () => {
      const result = OpenAiResponseRequestSchema.safeParse({
        input: "Hello",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiFineTuningJobCreateRequestSchema", () => {
    it("accepts a valid fine-tuning request", () => {
      const result = OpenAiFineTuningJobCreateRequestSchema.safeParse({
        model: "gpt-4o-mini-2024-07-18",
        training_file: "file-abc123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing training_file", () => {
      const result = OpenAiFineTuningJobCreateRequestSchema.safeParse({
        model: "gpt-4o-mini",
      });
      expect(result.success).toBe(false);
    });

    it("enforces suffix max length 64", () => {
      const result = OpenAiFineTuningJobCreateRequestSchema.safeParse({
        model: "gpt-4o-mini",
        training_file: "file-abc",
        suffix: "x".repeat(65),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiCheckpointPermissionCreateRequestSchema", () => {
    it("accepts valid project_ids", () => {
      const result = OpenAiCheckpointPermissionCreateRequestSchema.safeParse({
        project_ids: ["proj-1", "proj-2"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing project_ids", () => {
      const result = OpenAiCheckpointPermissionCreateRequestSchema.safeParse(
        {}
      );
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiFileUploadRequestSchema", () => {
    it("accepts a valid file upload", () => {
      const result = OpenAiFileUploadRequestSchema.safeParse({
        file: new Blob(["test"]),
        purpose: "fine-tune",
      });
      expect(result.success).toBe(true);
    });

    it("validates purpose enum", () => {
      const result = OpenAiFileUploadRequestSchema.safeParse({
        file: new Blob(["test"]),
        purpose: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("OpenAiOptionsSchema", () => {
    it("accepts valid options", () => {
      const result = OpenAiOptionsSchema.safeParse({
        apiKey: "sk-test-key",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty apiKey", () => {
      const result = OpenAiOptionsSchema.safeParse({
        apiKey: "",
      });
      expect(result.success).toBe(false);
    });

    it("validates baseURL format", () => {
      const result = OpenAiOptionsSchema.safeParse({
        apiKey: "sk-test",
        baseURL: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Sub-schemas", () => {
    it("OpenAiMessageSchema validates role enum", () => {
      const result = OpenAiMessageSchema.safeParse({
        role: "invalid",
        content: "Hi",
      });
      expect(result.success).toBe(false);
    });

    it("OpenAiToolSchema requires function type", () => {
      const result = OpenAiToolSchema.safeParse({
        type: "function",
        function: { name: "get_weather" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Composability", () => {
    it("schemas support .pick()", () => {
      const PickedSchema = OpenAiChatRequestSchema.pick({
        model: true,
        messages: true,
      });
      const result = PickedSchema.safeParse({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hi" }],
      });
      expect(result.success).toBe(true);
    });

    it("schemas support .partial()", () => {
      const PartialSchema = OpenAiChatRequestSchema.partial();
      const result = PartialSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("schemas support .extend()", () => {
      const ExtendedSchema = OpenAiChatRequestSchema.extend({
        custom_field: z.string(),
      });
      const result = ExtendedSchema.safeParse({
        messages: [{ role: "user", content: "Hi" }],
        custom_field: "hello",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("StoredCompletionUpdateRequestSchema", () => {
    it("accepts valid metadata", () => {
      const result = OpenAiStoredCompletionUpdateRequestSchema.safeParse({
        metadata: { key: "value" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing metadata", () => {
      const result = OpenAiStoredCompletionUpdateRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("ResponseCompactRequestSchema", () => {
    it("accepts a valid compact request", () => {
      const result = OpenAiResponseCompactRequestSchema.safeParse({
        model: "gpt-5",
        input: "Hello",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ResponseInputTokensRequestSchema", () => {
    it("accepts a valid input tokens request", () => {
      const result = OpenAiResponseInputTokensRequestSchema.safeParse({
        model: "gpt-5",
        input: "Hello",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Organization usage schemas", () => {
    it("accepts valid usage query filters", () => {
      const result = OpenAiOrganizationUsageQuerySchema.safeParse({
        start_time: 1700000000,
        end_time: 1700086400,
        bucket_width: "1d",
        models: ["gpt-5"],
        group_by: ["model"],
        batch: true,
      });

      expect(result.success).toBe(true);
    });

    it("rejects usage queries without start_time", () => {
      const result = OpenAiOrganizationUsageQuerySchema.safeParse({
        bucket_width: "1d",
      });

      expect(result.success).toBe(false);
    });

    it("accepts valid costs query filters", () => {
      const result = OpenAiOrganizationCostsQuerySchema.safeParse({
        start_time: 1700000000,
        end_time: 1700086400,
        bucket_width: "1d",
        project_ids: ["proj_123"],
        group_by: ["project_id"],
      });

      expect(result.success).toBe(true);
    });

    it("accepts project list and rate limit pagination options", () => {
      const projects = OpenAiOrganizationProjectListQuerySchema.safeParse({
        after: "proj_123",
        include_archived: true,
        limit: 20,
      });
      const rateLimits =
        OpenAiOrganizationProjectRateLimitListQuerySchema.safeParse({
          after: "rl_123",
          before: "rl_456",
          limit: 20,
        });

      expect(projects.success).toBe(true);
      expect(rateLimits.success).toBe(true);
    });
  });
});
