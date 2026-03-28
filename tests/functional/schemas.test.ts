// Tests for schema objects and schema+validation integration — pure data, no API calls
import { describe, it, expect } from "vitest";

// Import all schemas from each provider
import { messagesSchema } from "../../packages/provider/kimicoding/src/schemas";
import {
  chatCompletionsSchema as openaiChatSchema,
  embeddingsSchema,
  imageEditsSchema as openaiImageEditsSchema,
  imageGenerationsSchema,
  audioTranscriptionsSchema,
  audioTranslationsSchema,
  responsesSchema,
} from "../../packages/provider/openai/src/schemas";
import {
  chatCompletionsSchema as xaiChatSchema,
  imageGenerationsSchema as xaiImageGenSchema,
  imageEditsSchema as xaiImageEditsSchema,
  videoGenerationsSchema,
  videoEditsSchema,
  videoExtensionsSchema,
  batchCreateSchema,
  batchAddRequestsSchema,
  collectionCreateSchema,
  collectionUpdateSchema,
  documentAddSchema,
  documentSearchSchema,
} from "../../packages/provider/xai/src/schemas";
import {
  pricingEstimateSchema,
  deletePayloadsSchema,
} from "../../packages/provider/fal/src/schemas";
import {
  createTaskSchema,
  downloadUrlSchema,
  fileStreamUploadSchema,
  fileUrlUploadSchema,
  fileBase64UploadSchema,
  veoGenerateSchema,
  veoExtendSchema,
  sunoGenerateSchema,
  chatCompletionsSchema as kieChatSchema,
  claudeMessagesSchema,
  modelInputSchemas,
} from "../../packages/provider/kie/src/schemas";

// Import validatePayload to test schemas with real validation
import { validatePayload } from "../../packages/provider/kimicoding/src/validate";

describe("schema structure", () => {
  const allSchemas = [
    { name: "kimicoding/messages", schema: messagesSchema },
    { name: "openai/chat", schema: openaiChatSchema },
    { name: "openai/embeddings", schema: embeddingsSchema },
    { name: "openai/imageEdits", schema: openaiImageEditsSchema },
    { name: "openai/imageGenerations", schema: imageGenerationsSchema },
    { name: "openai/audioTranscriptions", schema: audioTranscriptionsSchema },
    { name: "openai/audioTranslations", schema: audioTranslationsSchema },
    { name: "openai/responses", schema: responsesSchema },
    { name: "xai/chat", schema: xaiChatSchema },
    { name: "xai/imageGen", schema: xaiImageGenSchema },
    { name: "xai/imageEdits", schema: xaiImageEditsSchema },
    { name: "xai/videoGen", schema: videoGenerationsSchema },
    { name: "xai/videoEdits", schema: videoEditsSchema },
    { name: "xai/videoExtensions", schema: videoExtensionsSchema },
    { name: "xai/batchCreate", schema: batchCreateSchema },
    { name: "xai/batchAddRequests", schema: batchAddRequestsSchema },
    { name: "xai/collectionCreate", schema: collectionCreateSchema },
    { name: "xai/collectionUpdate", schema: collectionUpdateSchema },
    { name: "xai/documentAdd", schema: documentAddSchema },
    { name: "xai/documentSearch", schema: documentSearchSchema },
    { name: "fal/pricingEstimate", schema: pricingEstimateSchema },
    { name: "fal/deletePayloads", schema: deletePayloadsSchema },
    { name: "kie/createTask", schema: createTaskSchema },
    { name: "kie/downloadUrl", schema: downloadUrlSchema },
    { name: "kie/fileStreamUpload", schema: fileStreamUploadSchema },
    { name: "kie/fileUrlUpload", schema: fileUrlUploadSchema },
    { name: "kie/fileBase64Upload", schema: fileBase64UploadSchema },
    { name: "kie/veoGenerate", schema: veoGenerateSchema },
    { name: "kie/veoExtend", schema: veoExtendSchema },
    { name: "kie/sunoGenerate", schema: sunoGenerateSchema },
    { name: "kie/chat", schema: kieChatSchema },
    { name: "kie/claudeMessages", schema: claudeMessagesSchema },
  ];

  for (const { name, schema } of allSchemas) {
    it(`${name} has valid method`, () => {
      expect(["POST", "PUT", "DELETE"]).toContain(schema.method);
    });

    it(`${name} has non-empty path`, () => {
      expect(schema.path.length).toBeGreaterThan(0);
    });

    it(`${name} has valid contentType`, () => {
      expect(["application/json", "multipart/form-data"]).toContain(
        schema.contentType
      );
    });

    it(`${name} has fields object`, () => {
      expect(typeof schema.fields).toBe("object");
      expect(Object.keys(schema.fields).length).toBeGreaterThan(0);
    });
  }
});

describe("schema + validatePayload integration", () => {
  it("kimicoding messages: accepts valid request", () => {
    const result = validatePayload(
      {
        model: "k2p5",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1024,
      },
      messagesSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kimicoding messages: rejects missing required fields", () => {
    const result = validatePayload({}, messagesSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
    expect(result.errors).toContain("messages is required");
    expect(result.errors).toContain("max_tokens is required");
  });

  it("openai chat: accepts valid request", () => {
    const result = validatePayload(
      { messages: [{ role: "user", content: "hi" }] },
      openaiChatSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai embeddings: accepts valid request", () => {
    const result = validatePayload(
      { model: "text-embedding-3-small", input: "hello" },
      embeddingsSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai embeddings: rejects missing input", () => {
    const result = validatePayload(
      { model: "text-embedding-3-small" },
      embeddingsSchema
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("input is required");
  });

  it("openai responses: accepts valid request", () => {
    const result = validatePayload(
      { model: "gpt-4o", input: "What is 2+2?" },
      responsesSchema
    );
    expect(result.valid).toBe(true);
  });

  it("xai chat: accepts valid request", () => {
    const result = validatePayload(
      { messages: [{ role: "user", content: "hi" }] },
      xaiChatSchema
    );
    expect(result.valid).toBe(true);
  });

  it("xai videoGen: rejects missing prompt", () => {
    const result = validatePayload({}, videoGenerationsSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("prompt is required");
  });

  it("xai documentSearch: accepts valid request", () => {
    const result = validatePayload(
      { query: "test", source: { collection_ids: ["col-1"] } },
      documentSearchSchema
    );
    expect(result.valid).toBe(true);
  });

  it("xai documentSearch: rejects missing query and source", () => {
    const result = validatePayload({}, documentSearchSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("query is required");
    expect(result.errors).toContain("source is required");
  });

  it("fal pricingEstimate: accepts valid request", () => {
    const result = validatePayload(
      { estimate_type: "unit_price", endpoints: {} },
      pricingEstimateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie createTask: accepts valid request", () => {
    const result = validatePayload(
      { model: "nano-banana-pro", input: { prompt: "sunset" } },
      createTaskSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie veoGenerate: accepts valid request", () => {
    const result = validatePayload({ prompt: "A sunset" }, veoGenerateSchema);
    expect(result.valid).toBe(true);
  });

  it("kie veoExtend: rejects missing required fields", () => {
    const result = validatePayload({}, veoExtendSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("taskId is required");
    expect(result.errors).toContain("prompt is required");
  });

  it("kie sunoGenerate: accepts valid request", () => {
    const result = validatePayload(
      {
        prompt: "A song",
        model: "V5",
        instrumental: false,
        customMode: false,
      },
      sunoGenerateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie fileUrlUpload: accepts valid request", () => {
    const result = validatePayload(
      { url: "https://example.com/image.png" },
      fileUrlUploadSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie fileUrlUpload: rejects missing url", () => {
    const result = validatePayload({}, fileUrlUploadSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("url is required");
  });

  it("kie fileBase64Upload: accepts valid request", () => {
    const result = validatePayload(
      { base64: "aGVsbG8=", filename: "test.png" },
      fileBase64UploadSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie fileBase64Upload: rejects missing required fields", () => {
    const result = validatePayload({}, fileBase64UploadSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("base64 is required");
    expect(result.errors).toContain("filename is required");
  });

  it("kie claude: accepts valid request", () => {
    const result = validatePayload(
      {
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      },
      claudeMessagesSchema
    );
    expect(result.valid).toBe(true);
  });
});

describe("kie modelInputSchemas", () => {
  it("has entries for all expected models", () => {
    const keys = Object.keys(modelInputSchemas);
    expect(keys.length).toBeGreaterThanOrEqual(18);
  });

  it("every entry has a type and non-empty fields", () => {
    for (const [model, schema] of Object.entries(modelInputSchemas)) {
      expect(
        ["image", "video", "audio", "transcription"].includes(schema.type),
        `${model} should have valid type, got: ${schema.type}`
      ).toBe(true);
      expect(
        Object.keys(schema.fields).length,
        `${model} should have non-empty fields`
      ).toBeGreaterThan(0);
    }
  });

  it("nano-banana-pro is image type with required prompt", () => {
    const schema = modelInputSchemas["nano-banana-pro"];
    expect(schema.type).toBe("image");
    expect(schema.fields.prompt.required).toBe(true);
  });

  it("kling-3.0/video is video type with required fields", () => {
    const schema = modelInputSchemas["kling-3.0/video"];
    expect(schema.type).toBe("video");
    expect(schema.fields.duration).toBeDefined();
    expect(schema.fields.mode).toBeDefined();
  });

  it("elevenlabs/speech-to-text is transcription type", () => {
    const schema = modelInputSchemas["elevenlabs/speech-to-text"];
    expect(schema.type).toBe("transcription");
  });
});
