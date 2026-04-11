// Tests for schema objects and schema+validation integration — pure data, no API calls
import { describe, it, expect } from "vitest";

// Import all schemas from each provider
import {
  messagesSchema,
  embeddingsSchema as kimiEmbeddingsSchema,
} from "../../packages/provider/kimicoding/src/schemas";
import {
  chatCompletionsSchema as openaiChatSchema,
  embeddingsSchema,
  imageEditsSchema as openaiImageEditsSchema,
  imageGenerationsSchema,
  audioTranscriptionsSchema,
  audioTranslationsSchema,
  responsesSchema,
  filesUploadSchema as openaiFilesUploadSchema,
  modelsDeleteSchema,
  batchesCreateSchema as openaiBatchesCreateSchema,
  batchesCancelSchema,
  audioSpeechSchema,
  moderationsSchema,
  responsesCancelSchema,
  responsesCompactSchema,
  fineTuningJobsCreateSchema,
  checkpointPermissionsCreateSchema,
  filesDeleteSchema,
  responsesDeleteSchema,
  responsesInputTokensSchema,
  storedCompletionsDeleteSchema,
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
  responsesSchema as xaiResponsesSchema,
  responsesDeleteSchema as xaiResponsesDeleteSchema,
  tokenizeTextSchema,
  realtimeClientSecretsSchema,
  apiKeyCreateSchema,
  apiKeyUpdateSchema,
} from "../../packages/provider/xai/src/schemas";
import {
  pricingEstimateSchema,
  deletePayloadsSchema,
  queueSubmitSchema,
  logsHistorySchema,
  logsStreamSchema,
  filesUploadUrlSchema,
  filesUploadLocalSchema,
  appsFlushQueueSchema,
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
  chatCompletions55Schema as kieChatSchema,
  claudeMessagesSchema,
  modelInputSchemas,
} from "../../packages/provider/kie/src/schemas";
import {
  messagesSchema as anthropicMessagesSchema,
  countTokensSchema,
  batchesCreateSchema as anthropicBatchesCreateSchema,
  filesUploadSchema as anthropicFilesUploadSchema,
  skillsCreateSchema,
  workspaceCreateSchema,
} from "../../packages/provider/anthropic/src/schemas";

// Import validatePayload to test schemas with real validation
import { validatePayload } from "../../packages/provider/kimicoding/src/validate";

describe("schema structure", () => {
  const allSchemas = [
    { name: "kimicoding/messages", schema: messagesSchema },
    { name: "kimicoding/embeddings", schema: kimiEmbeddingsSchema },
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
    { name: "xai/responses", schema: xaiResponsesSchema },
    { name: "xai/responsesDelete", schema: xaiResponsesDeleteSchema },
    { name: "openai/responsesDelete", schema: responsesDeleteSchema },
    { name: "openai/responsesInputTokens", schema: responsesInputTokensSchema },
    { name: "openai/filesDelete", schema: filesDeleteSchema },
    {
      name: "openai/storedCompletionsDelete",
      schema: storedCompletionsDeleteSchema,
    },
    {
      name: "openai/checkpointPermissionsCreate",
      schema: checkpointPermissionsCreateSchema,
    },
    { name: "fal/queueSubmit", schema: queueSubmitSchema },
    { name: "fal/logsHistory", schema: logsHistorySchema },
    { name: "fal/logsStream", schema: logsStreamSchema },
    { name: "fal/filesUploadUrl", schema: filesUploadUrlSchema },
    { name: "fal/filesUploadLocal", schema: filesUploadLocalSchema },
    { name: "fal/appsFlushQueue", schema: appsFlushQueueSchema },
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

  it("kimicoding embeddings: accepts valid request", () => {
    const result = validatePayload(
      { model: "k2p5", input: "hello" },
      kimiEmbeddingsSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kimicoding embeddings: rejects missing required fields", () => {
    const result = validatePayload({}, kimiEmbeddingsSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("input is required");
    expect(result.errors).toContain("model is required");
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
      { fileUrl: "https://example.com/image.png", uploadPath: "images" },
      fileUrlUploadSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie fileUrlUpload: rejects missing fileUrl", () => {
    const result = validatePayload(
      { uploadPath: "images" },
      fileUrlUploadSchema
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("fileUrl is required");
  });

  it("kie fileBase64Upload: accepts valid request", () => {
    const result = validatePayload(
      { base64Data: "aGVsbG8=", uploadPath: "uploads" },
      fileBase64UploadSchema
    );
    expect(result.valid).toBe(true);
  });

  it("kie fileBase64Upload: rejects missing required fields", () => {
    const result = validatePayload({}, fileBase64UploadSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("base64Data is required");
    expect(result.errors).toContain("uploadPath is required");
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

  it("openai filesUpload: accepts valid request", () => {
    const result = validatePayload(
      { file: {}, purpose: "assistants" },
      openaiFilesUploadSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai filesUpload: rejects missing required fields", () => {
    const result = validatePayload({}, openaiFilesUploadSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
    expect(result.errors).toContain("purpose is required");
  });

  it("openai modelsDelete: accepts valid request", () => {
    const result = validatePayload(
      { model: "ft:gpt-4o-2024-08-06:org:custom" },
      modelsDeleteSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai modelsDelete: rejects missing model", () => {
    const result = validatePayload({}, modelsDeleteSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
  });

  it("openai batchesCreate: accepts valid request", () => {
    const result = validatePayload(
      {
        input_file_id: "file-123",
        endpoint: "/v1/chat/completions",
        completion_window: "24h",
      },
      openaiBatchesCreateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai batchesCreate: rejects missing required fields", () => {
    const result = validatePayload({}, openaiBatchesCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("input_file_id is required");
    expect(result.errors).toContain("endpoint is required");
    expect(result.errors).toContain("completion_window is required");
  });

  it("openai batchesCancel: accepts valid request", () => {
    const result = validatePayload(
      { batch_id: "batch-123" },
      batchesCancelSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai batchesCancel: rejects missing batch_id", () => {
    const result = validatePayload({}, batchesCancelSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("batch_id is required");
  });

  it("openai audioSpeech: accepts valid request", () => {
    const result = validatePayload(
      { model: "tts-1", input: "Hello world", voice: "alloy" },
      audioSpeechSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai audioSpeech: rejects missing required fields", () => {
    const result = validatePayload({}, audioSpeechSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
    expect(result.errors).toContain("input is required");
    expect(result.errors).toContain("voice is required");
  });

  it("openai moderations: accepts valid request", () => {
    const result = validatePayload({ input: "Hello world" }, moderationsSchema);
    expect(result.valid).toBe(true);
  });

  it("openai moderations: rejects missing input", () => {
    const result = validatePayload({}, moderationsSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("input is required");
  });

  it("openai responsesCancel: accepts valid request", () => {
    const result = validatePayload({ id: "resp-123" }, responsesCancelSchema);
    expect(result.valid).toBe(true);
  });

  it("openai responsesCancel: rejects missing id", () => {
    const result = validatePayload({}, responsesCancelSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("id is required");
  });

  it("openai responsesCompact: accepts valid request", () => {
    const result = validatePayload({ model: "gpt-4o" }, responsesCompactSchema);
    expect(result.valid).toBe(true);
  });

  it("openai responsesCompact: rejects missing model", () => {
    const result = validatePayload({}, responsesCompactSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
  });

  it("openai fineTuningJobsCreate: accepts valid request", () => {
    const result = validatePayload(
      { model: "gpt-4o", training_file: "file-123" },
      fineTuningJobsCreateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai fineTuningJobsCreate: rejects missing required fields", () => {
    const result = validatePayload({}, fineTuningJobsCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
    expect(result.errors).toContain("training_file is required");
  });

  it("xai tokenizeText: accepts valid request", () => {
    const result = validatePayload(
      { model: "grok-3-fast", text: "Hello world" },
      tokenizeTextSchema
    );
    expect(result.valid).toBe(true);
  });

  it("xai tokenizeText: rejects missing required fields", () => {
    const result = validatePayload({}, tokenizeTextSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
    expect(result.errors).toContain("text is required");
  });

  it("xai realtimeClientSecrets: accepts valid request", () => {
    const result = validatePayload({}, realtimeClientSecretsSchema);
    expect(result.valid).toBe(true);
  });

  it("xai apiKeyCreate: accepts valid request", () => {
    const result = validatePayload({ name: "test-key" }, apiKeyCreateSchema);
    expect(result.valid).toBe(true);
  });

  it("xai apiKeyCreate: rejects missing name", () => {
    const result = validatePayload({}, apiKeyCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("name is required");
  });

  it("xai apiKeyUpdate: accepts valid request", () => {
    const result = validatePayload(
      { apiKey: { name: "renamed-key" }, fieldMask: "name" },
      apiKeyUpdateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("xai apiKeyUpdate: rejects missing required fields", () => {
    const result = validatePayload({}, apiKeyUpdateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("apiKey is required");
    expect(result.errors).toContain("fieldMask is required");
  });

  it("anthropic messages: accepts valid request", () => {
    const result = validatePayload(
      {
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1024,
      },
      anthropicMessagesSchema
    );
    expect(result.valid).toBe(true);
  });

  it("anthropic messages: rejects missing required fields", () => {
    const result = validatePayload({}, anthropicMessagesSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
    expect(result.errors).toContain("messages is required");
    expect(result.errors).toContain("max_tokens is required");
  });

  it("anthropic countTokens: accepts valid request", () => {
    const result = validatePayload(
      {
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: "Hello" }],
      },
      countTokensSchema
    );
    expect(result.valid).toBe(true);
  });

  it("anthropic countTokens: rejects missing required fields", () => {
    const result = validatePayload({}, countTokensSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("model is required");
    expect(result.errors).toContain("messages is required");
  });

  it("anthropic batchesCreate: accepts valid request", () => {
    const result = validatePayload(
      {
        requests: [
          {
            custom_id: "req-1",
            params: {
              model: "claude-sonnet-4-20250514",
              messages: [{ role: "user", content: "Hello" }],
              max_tokens: 1024,
            },
          },
        ],
      },
      anthropicBatchesCreateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("anthropic batchesCreate: rejects missing requests", () => {
    const result = validatePayload({}, anthropicBatchesCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("requests is required");
  });

  it("anthropic filesUpload: accepts valid request", () => {
    const result = validatePayload({ file: {} }, anthropicFilesUploadSchema);
    expect(result.valid).toBe(true);
  });

  it("anthropic filesUpload: rejects missing file", () => {
    const result = validatePayload({}, anthropicFilesUploadSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });

  it("anthropic skillsCreate: accepts valid request", () => {
    const result = validatePayload(
      { display_title: "test-skill", files: [{}] },
      skillsCreateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("anthropic skillsCreate: rejects missing required fields", () => {
    const result = validatePayload({}, skillsCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("display_title is required");
    expect(result.errors).toContain("files is required");
  });

  it("anthropic workspaceCreate: accepts valid request", () => {
    const result = validatePayload(
      { name: "test-workspace" },
      workspaceCreateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("anthropic workspaceCreate: rejects missing name", () => {
    const result = validatePayload({}, workspaceCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("name is required");
  });

  // OpenAI missing schema tests
  it("openai responsesDelete: accepts valid request", () => {
    const result = validatePayload({ id: "resp-123" }, responsesDeleteSchema);
    expect(result.valid).toBe(true);
  });

  it("openai responsesDelete: rejects missing id", () => {
    const result = validatePayload({}, responsesDeleteSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("id is required");
  });

  it("openai responsesInputTokens: accepts valid request", () => {
    const result = validatePayload(
      { model: "gpt-4o" },
      responsesInputTokensSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai filesDelete: accepts valid request", () => {
    const result = validatePayload({ file_id: "file-123" }, filesDeleteSchema);
    expect(result.valid).toBe(true);
  });

  it("openai filesDelete: rejects missing file_id", () => {
    const result = validatePayload({}, filesDeleteSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file_id is required");
  });

  it("openai storedCompletionsDelete: accepts valid request", () => {
    const result = validatePayload(
      { completion_id: "comp-123" },
      storedCompletionsDeleteSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai storedCompletionsDelete: rejects missing completion_id", () => {
    const result = validatePayload({}, storedCompletionsDeleteSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("completion_id is required");
  });

  it("openai checkpointPermissionsCreate: accepts valid request", () => {
    const result = validatePayload(
      { project_ids: ["proj-1", "proj-2"] },
      checkpointPermissionsCreateSchema
    );
    expect(result.valid).toBe(true);
  });

  it("openai checkpointPermissionsCreate: rejects missing project_ids", () => {
    const result = validatePayload({}, checkpointPermissionsCreateSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("project_ids is required");
  });

  // Fal missing schema tests
  it("fal queueSubmit: accepts valid request", () => {
    const result = validatePayload(
      { endpoint_id: "fal-ai/flux/schnell", input: { prompt: "a cat" } },
      queueSubmitSchema
    );
    expect(result.valid).toBe(true);
  });

  it("fal queueSubmit: rejects missing required fields", () => {
    const result = validatePayload({}, queueSubmitSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("endpoint_id is required");
    expect(result.errors).toContain("input is required");
  });

  it("fal logsHistory: accepts valid request", () => {
    const result = validatePayload({ limit: 100 }, logsHistorySchema);
    expect(result.valid).toBe(true);
  });

  it("fal logsHistory: accepts empty request", () => {
    const result = validatePayload({}, logsHistorySchema);
    expect(result.valid).toBe(true);
  });

  it("fal logsStream: accepts valid request", () => {
    const result = validatePayload({ level: "info" }, logsStreamSchema);
    expect(result.valid).toBe(true);
  });

  it("fal filesUploadUrl: accepts valid request", () => {
    const result = validatePayload(
      { file: "path/to/file.png", url: "https://example.com/image.png" },
      filesUploadUrlSchema
    );
    expect(result.valid).toBe(true);
  });

  it("fal filesUploadUrl: rejects missing required fields", () => {
    const result = validatePayload({}, filesUploadUrlSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
    expect(result.errors).toContain("url is required");
  });

  it("fal filesUploadLocal: accepts valid request", () => {
    const result = validatePayload(
      { target_path: "uploads/image.png", file: {} },
      filesUploadLocalSchema
    );
    expect(result.valid).toBe(true);
  });

  it("fal filesUploadLocal: rejects missing required fields", () => {
    const result = validatePayload({}, filesUploadLocalSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("target_path is required");
    expect(result.errors).toContain("file is required");
  });

  it("fal appsFlushQueue: accepts valid request", () => {
    const result = validatePayload(
      { owner: "username", name: "my-app" },
      appsFlushQueueSchema
    );
    expect(result.valid).toBe(true);
  });

  it("fal appsFlushQueue: rejects missing required fields", () => {
    const result = validatePayload({}, appsFlushQueueSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("owner is required");
    expect(result.errors).toContain("name is required");
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
