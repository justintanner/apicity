// Tests for schema objects and schema+validation integration — pure data, no API calls
import { describe, it, expect } from "vitest";

// Import Zod schemas from kimicoding
import {
  ChatRequestSchema as KimiChatRequestSchema,
  EmbeddingRequestSchema as KimiEmbeddingRequestSchema,
} from "../../packages/provider/kimicoding/src/zod";
import {
  OpenAiChatRequestSchema,
  OpenAiEmbeddingRequestSchema,
  OpenAiImageEditRequestSchema,
  OpenAiImageGenerationRequestSchema,
  OpenAiTranscribeRequestSchema,
  OpenAiTranslateRequestSchema,
  OpenAiResponseRequestSchema,
  OpenAiFileUploadRequestSchema,
  OpenAiBatchCreateRequestSchema,
  OpenAiSpeechRequestSchema,
  OpenAiModerationRequestSchema,
  OpenAiResponseCompactRequestSchema,
  OpenAiFineTuningJobCreateRequestSchema,
  OpenAiCheckpointPermissionCreateRequestSchema,
  OpenAiResponseInputTokensRequestSchema,
} from "../../packages/provider/openai/src/zod";
import {
  XaiChatRequestSchema as xaiChatSchema,
  XaiImageGenerateRequestSchema as xaiImageGenSchema,
  XaiImageEditRequestSchema as xaiImageEditsSchema,
  XaiVideoGenerateRequestSchema as xaiVideoGenSchema,
  XaiVideoEditRequestSchema as xaiVideoEditsSchema,
  XaiVideoExtendRequestSchema as xaiVideoExtensionsSchema,
  XaiBatchCreateRequestSchema as xaiBatchCreateSchema,
  XaiBatchAddRequestsBodySchema as xaiBatchAddRequestsSchema,
  XaiCollectionCreateRequestSchema as xaiCollectionCreateSchema,
  XaiCollectionUpdateRequestSchema as xaiCollectionUpdateSchema,
  XaiDocumentAddRequestSchema as xaiDocumentAddSchema,
  XaiDocumentSearchRequestSchema as xaiDocumentSearchSchema,
  XaiResponseRequestSchema as xaiResponsesSchema,
  XaiTokenizeTextRequestSchema as xaiTokenizeTextSchema,
  XaiRealtimeClientSecretRequestSchema as xaiRealtimeClientSecretsSchema,
} from "../../packages/provider/xai/src/zod";
import {
  FalPricingEstimateRequestSchema,
  FalDeletePayloadsRequestSchema,
  FalQueueSubmitRequestSchema,
  FalLogsStreamRequestSchema,
  FalFilesUploadUrlRequestSchema,
  FalFilesUploadLocalRequestSchema,
} from "../../packages/provider/fal/src/zod";
import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
  UploadMediaRequestSchema,
  FileUrlUploadRequestSchema,
  FileBase64UploadRequestSchema,
  VeoGenerateRequestSchema,
  VeoExtendRequestSchema,
  SunoGenerateRequestSchema,
  KieChatRequestSchema,
  KieClaudeRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  AnthropicMessageRequestSchema,
  AnthropicCountTokensRequestSchema,
  AnthropicBatchCreateRequestSchema,
  AnthropicFileUploadRequestSchema,
  AnthropicSkillsCreateRequestSchema,
} from "../../packages/provider/anthropic/src/zod";
import {
  FireworksChatRequestSchema,
  FireworksCompletionRequestSchema,
  FireworksEmbeddingRequestSchema,
  FireworksRerankRequestSchema,
  AnthropicMessagesRequestSchema as FwAnthropicMessagesRequestSchema,
  FireworksTextToImageRequestSchema,
  FireworksKontextRequestSchema,
  FireworksGetResultRequestSchema,
  FireworksSFTCreateRequestSchema,
  FireworksDpoJobCreateRequestSchema,
  FireworksRFTCreateRequestSchema,
  FireworksBatchJobCreateRequestSchema,
  FireworksCreateDeploymentRequestSchema,
  FireworksCreateEvaluatorRequestSchema,
  FireworksCreateEvaluationJobRequestSchema,
} from "../../packages/provider/fireworks/src/zod";

describe("schema structure", () => {
  // All providers now use Zod schemas — verify they expose safeParse
  const zodSchemas = [
    { name: "fal/pricingEstimate", schema: FalPricingEstimateRequestSchema },
    { name: "fal/queueSubmit", schema: FalQueueSubmitRequestSchema },
    { name: "fal/logsStream", schema: FalLogsStreamRequestSchema },
    { name: "fal/filesUploadUrl", schema: FalFilesUploadUrlRequestSchema },
    { name: "fal/filesUploadLocal", schema: FalFilesUploadLocalRequestSchema },
    { name: "fal/deletePayloads", schema: FalDeletePayloadsRequestSchema },
    { name: "kimicoding/messages", schema: KimiChatRequestSchema },
    { name: "kimicoding/embeddings", schema: KimiEmbeddingRequestSchema },
    { name: "xai/chat", schema: xaiChatSchema },
    { name: "xai/imageGen", schema: xaiImageGenSchema },
    { name: "xai/imageEdits", schema: xaiImageEditsSchema },
    { name: "xai/videoGen", schema: xaiVideoGenSchema },
    { name: "xai/videoEdits", schema: xaiVideoEditsSchema },
    { name: "xai/videoExtensions", schema: xaiVideoExtensionsSchema },
    { name: "xai/batchCreate", schema: xaiBatchCreateSchema },
    { name: "xai/batchAddRequests", schema: xaiBatchAddRequestsSchema },
    { name: "xai/collectionCreate", schema: xaiCollectionCreateSchema },
    { name: "xai/collectionUpdate", schema: xaiCollectionUpdateSchema },
    { name: "xai/documentAdd", schema: xaiDocumentAddSchema },
    { name: "xai/documentSearch", schema: xaiDocumentSearchSchema },
    { name: "xai/responses", schema: xaiResponsesSchema },
    { name: "xai/tokenizeText", schema: xaiTokenizeTextSchema },
    {
      name: "xai/realtimeClientSecrets",
      schema: xaiRealtimeClientSecretsSchema,
    },
    { name: "openai/chat", schema: OpenAiChatRequestSchema },
    { name: "openai/embeddings", schema: OpenAiEmbeddingRequestSchema },
    { name: "openai/imageEdits", schema: OpenAiImageEditRequestSchema },
    {
      name: "openai/imageGenerations",
      schema: OpenAiImageGenerationRequestSchema,
    },
    {
      name: "openai/audioTranscriptions",
      schema: OpenAiTranscribeRequestSchema,
    },
    { name: "openai/audioTranslations", schema: OpenAiTranslateRequestSchema },
    { name: "openai/responses", schema: OpenAiResponseRequestSchema },
    { name: "openai/filesUpload", schema: OpenAiFileUploadRequestSchema },
    { name: "openai/batchesCreate", schema: OpenAiBatchCreateRequestSchema },
    { name: "openai/audioSpeech", schema: OpenAiSpeechRequestSchema },
    { name: "openai/moderations", schema: OpenAiModerationRequestSchema },
    {
      name: "openai/responsesCompact",
      schema: OpenAiResponseCompactRequestSchema,
    },
    {
      name: "openai/fineTuningJobsCreate",
      schema: OpenAiFineTuningJobCreateRequestSchema,
    },
    {
      name: "openai/checkpointPermissionsCreate",
      schema: OpenAiCheckpointPermissionCreateRequestSchema,
    },
    {
      name: "openai/responsesInputTokens",
      schema: OpenAiResponseInputTokensRequestSchema,
    },
    { name: "kie/createTask", schema: CreateTaskRequestSchema },
    { name: "kie/downloadUrl", schema: DownloadUrlRequestSchema },
    {
      name: "kie/fileStreamUpload",
      schema: UploadMediaRequestSchema,
    },
    { name: "kie/fileUrlUpload", schema: FileUrlUploadRequestSchema },
    {
      name: "kie/fileBase64Upload",
      schema: FileBase64UploadRequestSchema,
    },
    { name: "kie/veoGenerate", schema: VeoGenerateRequestSchema },
    { name: "kie/veoExtend", schema: VeoExtendRequestSchema },
    { name: "kie/sunoGenerate", schema: SunoGenerateRequestSchema },
    { name: "kie/chat", schema: KieChatRequestSchema },
    {
      name: "kie/claudeMessages",
      schema: KieClaudeRequestSchema,
    },
    {
      name: "anthropic/messages",
      schema: AnthropicMessageRequestSchema,
    },
    {
      name: "anthropic/countTokens",
      schema: AnthropicCountTokensRequestSchema,
    },
    {
      name: "anthropic/batchesCreate",
      schema: AnthropicBatchCreateRequestSchema,
    },
    {
      name: "anthropic/filesUpload",
      schema: AnthropicFileUploadRequestSchema,
    },
    {
      name: "anthropic/skillsCreate",
      schema: AnthropicSkillsCreateRequestSchema,
    },
    { name: "fireworks/chat", schema: FireworksChatRequestSchema },
    { name: "fireworks/completions", schema: FireworksCompletionRequestSchema },
    { name: "fireworks/embeddings", schema: FireworksEmbeddingRequestSchema },
    { name: "fireworks/rerank", schema: FireworksRerankRequestSchema },
    {
      name: "fireworks/messages",
      schema: FwAnthropicMessagesRequestSchema,
    },
    {
      name: "fireworks/textToImage",
      schema: FireworksTextToImageRequestSchema,
    },
    { name: "fireworks/kontext", schema: FireworksKontextRequestSchema },
    { name: "fireworks/getResult", schema: FireworksGetResultRequestSchema },
    { name: "fireworks/sftCreate", schema: FireworksSFTCreateRequestSchema },
    {
      name: "fireworks/dpoJobCreate",
      schema: FireworksDpoJobCreateRequestSchema,
    },
    { name: "fireworks/rftCreate", schema: FireworksRFTCreateRequestSchema },
    {
      name: "fireworks/batchJobCreate",
      schema: FireworksBatchJobCreateRequestSchema,
    },
    {
      name: "fireworks/createDeployment",
      schema: FireworksCreateDeploymentRequestSchema,
    },
    {
      name: "fireworks/createEvaluator",
      schema: FireworksCreateEvaluatorRequestSchema,
    },
    {
      name: "fireworks/createEvaluationJob",
      schema: FireworksCreateEvaluationJobRequestSchema,
    },
  ];

  for (const { name, schema } of zodSchemas) {
    it(`${name} exposes safeParse`, () => {
      expect(typeof schema.safeParse).toBe("function");
    });

    it(`${name} exposes parse`, () => {
      expect(typeof schema.parse).toBe("function");
    });
  }
});

describe("schema + validatePayload integration", () => {
  it("kimicoding messages: accepts valid request", () => {
    const result = KimiChatRequestSchema.safeParse({
      model: "k2p5",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("kimicoding messages: rejects missing required fields", () => {
    const result = KimiChatRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("messages"))).toBe(
      true
    );
    expect(
      result.error?.issues.some((i) => i.path.includes("max_tokens"))
    ).toBe(true);
  });

  it("kimicoding embeddings: accepts valid request", () => {
    const result = KimiEmbeddingRequestSchema.safeParse({
      model: "k2p5",
      input: "hello",
    });
    expect(result.success).toBe(true);
  });

  it("kimicoding embeddings: rejects missing required fields", () => {
    const result = KimiEmbeddingRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
  });

  it("openai chat: accepts valid request", () => {
    const result = OpenAiChatRequestSchema.safeParse({
      messages: [{ role: "user", content: "hi" }],
    });
    expect(result.success).toBe(true);
  });

  it("openai embeddings: accepts valid request", () => {
    const result = OpenAiEmbeddingRequestSchema.safeParse({
      model: "text-embedding-3-small",
      input: "hello",
    });
    expect(result.success).toBe(true);
  });

  it("openai embeddings: rejects missing input", () => {
    const result = OpenAiEmbeddingRequestSchema.safeParse({
      model: "text-embedding-3-small",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
      true
    );
  });

  it("openai responses: accepts valid request", () => {
    const result = OpenAiResponseRequestSchema.safeParse({
      model: "gpt-4o",
      input: "What is 2+2?",
    });
    expect(result.success).toBe(true);
  });

  it("xai chat: accepts valid request", () => {
    const result = xaiChatSchema.safeParse({
      messages: [{ role: "user", content: "hi" }],
    });
    expect(result.success).toBe(true);
  });

  it("xai videoGen: rejects missing prompt", () => {
    const result = xaiVideoGenSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
      true
    );
  });

  it("xai documentSearch: accepts valid request", () => {
    const result = xaiDocumentSearchSchema.safeParse({
      query: "test",
      source: { collection_ids: ["col-1"] },
    });
    expect(result.success).toBe(true);
  });

  it("xai documentSearch: rejects missing query and source", () => {
    const result = xaiDocumentSearchSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("query"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("source"))).toBe(
      true
    );
  });

  it("fal pricingEstimate: accepts valid request", () => {
    const result = FalPricingEstimateRequestSchema.safeParse({
      estimate_type: "unit_price",
      endpoints: {},
    });
    expect(result.success).toBe(true);
  });

  it("kie createTask: accepts valid request", () => {
    const result = CreateTaskRequestSchema.safeParse({
      model: "nano-banana-pro",
      input: { prompt: "sunset" },
    });
    expect(result.success).toBe(true);
  });

  it("kie veoGenerate: accepts valid request", () => {
    const result = VeoGenerateRequestSchema.safeParse({
      prompt: "A sunset",
    });
    expect(result.success).toBe(true);
  });

  it("kie veoExtend: rejects missing required fields", () => {
    const result = VeoExtendRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("taskId"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("prompt"))).toBe(
      true
    );
  });

  it("kie sunoGenerate: accepts valid request", () => {
    const result = SunoGenerateRequestSchema.safeParse({
      prompt: "A song",
      model: "V5",
      instrumental: false,
      customMode: false,
    });
    expect(result.success).toBe(true);
  });

  it("kie fileUrlUpload: accepts valid request", () => {
    const result = FileUrlUploadRequestSchema.safeParse({
      fileUrl: "https://example.com/image.png",
      uploadPath: "images",
    });
    expect(result.success).toBe(true);
  });

  it("kie fileUrlUpload: rejects missing fileUrl", () => {
    const result = FileUrlUploadRequestSchema.safeParse({
      uploadPath: "images",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("fileUrl"))).toBe(
      true
    );
  });

  it("kie fileBase64Upload: accepts valid request", () => {
    const result = FileBase64UploadRequestSchema.safeParse({
      base64Data: "aGVsbG8=",
      uploadPath: "uploads",
    });
    expect(result.success).toBe(true);
  });

  it("kie fileBase64Upload: rejects missing required fields", () => {
    const result = FileBase64UploadRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("base64Data"))
    ).toBe(true);
    expect(
      result.error?.issues.some((i) => i.path.includes("uploadPath"))
    ).toBe(true);
  });

  it("kie claude: accepts valid request", () => {
    const result = KieClaudeRequestSchema.safeParse({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
  });

  it("openai filesUpload: accepts valid request", () => {
    const result = OpenAiFileUploadRequestSchema.safeParse({
      file: new Blob(["test"]),
      purpose: "assistants",
    });
    expect(result.success).toBe(true);
  });

  it("openai filesUpload: rejects missing required fields", () => {
    const result = OpenAiFileUploadRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("openai batchesCreate: accepts valid request", () => {
    const result = OpenAiBatchCreateRequestSchema.safeParse({
      input_file_id: "file-123",
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
    });
    expect(result.success).toBe(true);
  });

  it("openai batchesCreate: rejects missing required fields", () => {
    const result = OpenAiBatchCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(3);
  });

  it("openai audioSpeech: accepts valid request", () => {
    const result = OpenAiSpeechRequestSchema.safeParse({
      model: "tts-1",
      input: "Hello world",
      voice: "alloy",
    });
    expect(result.success).toBe(true);
  });

  it("openai audioSpeech: rejects missing required fields", () => {
    const result = OpenAiSpeechRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(3);
  });

  it("openai moderations: accepts valid request", () => {
    const result = OpenAiModerationRequestSchema.safeParse({
      input: "Hello world",
    });
    expect(result.success).toBe(true);
  });

  it("openai moderations: rejects missing input", () => {
    const result = OpenAiModerationRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
      true
    );
  });

  it("openai responsesCompact: accepts valid request", () => {
    const result = OpenAiResponseCompactRequestSchema.safeParse({
      model: "gpt-4o",
    });
    expect(result.success).toBe(true);
  });

  it("openai responsesCompact: rejects missing model", () => {
    const result = OpenAiResponseCompactRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
  });

  it("openai fineTuningJobsCreate: accepts valid request", () => {
    const result = OpenAiFineTuningJobCreateRequestSchema.safeParse({
      model: "gpt-4o",
      training_file: "file-123",
    });
    expect(result.success).toBe(true);
  });

  it("openai fineTuningJobsCreate: rejects missing required fields", () => {
    const result = OpenAiFineTuningJobCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("xai tokenizeText: accepts valid request", () => {
    const result = xaiTokenizeTextSchema.safeParse({
      model: "grok-3-fast",
      text: "Hello world",
    });
    expect(result.success).toBe(true);
  });

  it("xai tokenizeText: rejects missing required fields", () => {
    const result = xaiTokenizeTextSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
      true
    );
  });

  it("xai realtimeClientSecrets: accepts valid request", () => {
    const result = xaiRealtimeClientSecretsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("anthropic messages: accepts valid request", () => {
    const result = AnthropicMessageRequestSchema.safeParse({
      model: "claude-sonnet-4-20250514",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("anthropic messages: rejects missing required fields", () => {
    const result = AnthropicMessageRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("messages"))).toBe(
      true
    );
    expect(
      result.error?.issues.some((i) => i.path.includes("max_tokens"))
    ).toBe(true);
  });

  it("anthropic countTokens: accepts valid request", () => {
    const result = AnthropicCountTokensRequestSchema.safeParse({
      model: "claude-sonnet-4-20250514",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
  });

  it("anthropic countTokens: rejects missing required fields", () => {
    const result = AnthropicCountTokensRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("messages"))).toBe(
      true
    );
  });

  it("anthropic batchesCreate: accepts valid request", () => {
    const result = AnthropicBatchCreateRequestSchema.safeParse({
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
    });
    expect(result.success).toBe(true);
  });

  it("anthropic batchesCreate: rejects missing requests", () => {
    const result = AnthropicBatchCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("requests"))).toBe(
      true
    );
  });

  it("anthropic filesUpload: accepts valid request", () => {
    const result = AnthropicFileUploadRequestSchema.safeParse({
      file: new Blob(["test"]),
    });
    expect(result.success).toBe(true);
  });

  it("anthropic filesUpload: rejects missing file", () => {
    const result = AnthropicFileUploadRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });

  it("anthropic skillsCreate: accepts valid request", () => {
    const result = AnthropicSkillsCreateRequestSchema.safeParse({
      display_title: "test-skill",
      files: [{ data: new Blob(["# Skill"]), path: "SKILL.md" }],
    });
    expect(result.success).toBe(true);
  });

  it("anthropic skillsCreate: rejects missing required fields", () => {
    const result = AnthropicSkillsCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("display_title"))
    ).toBe(true);
    expect(result.error?.issues.some((i) => i.path.includes("files"))).toBe(
      true
    );
  });

  it("openai responsesInputTokens: accepts valid request", () => {
    const result = OpenAiResponseInputTokensRequestSchema.safeParse({
      model: "gpt-4o",
    });
    expect(result.success).toBe(true);
  });

  it("openai checkpointPermissionsCreate: accepts valid request", () => {
    const result = OpenAiCheckpointPermissionCreateRequestSchema.safeParse({
      project_ids: ["proj-1", "proj-2"],
    });
    expect(result.success).toBe(true);
  });

  it("openai checkpointPermissionsCreate: rejects missing project_ids", () => {
    const result = OpenAiCheckpointPermissionCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("project_ids"))
    ).toBe(true);
  });

  it("fireworks chat: accepts valid request", () => {
    const result = FireworksChatRequestSchema.safeParse({
      model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
  });

  it("fireworks chat: rejects missing required fields", () => {
    const result = FireworksChatRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("messages"))).toBe(
      true
    );
  });

  it("fireworks embeddings: accepts valid request", () => {
    const result = FireworksEmbeddingRequestSchema.safeParse({
      model: "nomic-ai/nomic-embed-text-v1.5",
      input: "hello",
    });
    expect(result.success).toBe(true);
  });

  it("fireworks rerank: accepts valid request", () => {
    const result = FireworksRerankRequestSchema.safeParse({
      model: "fireworks/qwen3-reranker-8b",
      query: "test",
      documents: ["doc1"],
    });
    expect(result.success).toBe(true);
  });

  it("fireworks textToImage: accepts valid request", () => {
    const result = FireworksTextToImageRequestSchema.safeParse({
      prompt: "A cat",
    });
    expect(result.success).toBe(true);
  });

  it("fireworks batchJobCreate: rejects missing required fields", () => {
    const result = FireworksBatchJobCreateRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("model"))).toBe(
      true
    );
    expect(
      result.error?.issues.some((i) => i.path.includes("inputDatasetId"))
    ).toBe(true);
  });

  it("fal queueSubmit: accepts valid request", () => {
    const result = FalQueueSubmitRequestSchema.safeParse({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
    });
    expect(result.success).toBe(true);
  });

  it("fal queueSubmit: rejects missing required fields", () => {
    const result = FalQueueSubmitRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("endpoint_id"))
    ).toBe(true);
    expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
      true
    );
  });

  it("fal logsStream: accepts valid request", () => {
    const result = FalLogsStreamRequestSchema.safeParse({ level: "info" });
    expect(result.success).toBe(true);
  });

  it("fal filesUploadUrl: accepts valid request", () => {
    const result = FalFilesUploadUrlRequestSchema.safeParse({
      file: "path/to/file.png",
      url: "https://example.com/image.png",
    });
    expect(result.success).toBe(true);
  });

  it("fal filesUploadUrl: rejects missing required fields", () => {
    const result = FalFilesUploadUrlRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("url"))).toBe(true);
  });

  it("fal filesUploadLocal: accepts valid request", () => {
    const result = FalFilesUploadLocalRequestSchema.safeParse({
      target_path: "uploads/image.png",
      file: new Blob(["test"]),
    });
    expect(result.success).toBe(true);
  });

  it("fal filesUploadLocal: rejects missing required fields", () => {
    const result = FalFilesUploadLocalRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("target_path"))
    ).toBe(true);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
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
