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
  GrokTextToVideoRequestSchema,
  GrokImageToVideoRequestSchema,
  GrokVideo15PreviewRequestSchema,
  Omnihuman15RequestSchema,
  Wan27VideoEditDurationSchema,
  Wan27VideoEditDurationValues,
  Wan27VideoEditRequestSchema,
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

  it("kie omnihuman 1.5: accepts valid request and applies defaults", () => {
    const result = Omnihuman15RequestSchema.safeParse({
      model: "omnihuman-1-5",
      input: {
        image_url: "https://example.com/portrait.png",
        audio_url: "https://example.com/speech.mp3",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.input.output_resolution).toBe("1080");
      expect(result.data.input.pe_fast_mode).toBe(false);
      expect(result.data.input.seed).toBe(-1);
    }
  });

  it("kie omnihuman 1.5: rejects missing required media fields and bad callback URL", () => {
    const result = Omnihuman15RequestSchema.safeParse({
      model: "omnihuman-1-5",
      callBackUrl: "not-a-url",
      input: {},
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.join(".") === "input.image_url")
    ).toBe(true);
    expect(
      result.error?.issues.some((i) => i.path.join(".") === "input.audio_url")
    ).toBe(true);
    expect(
      result.error?.issues.some((i) => i.path.includes("callBackUrl"))
    ).toBe(true);
  });

  it("kie omnihuman 1.5: rejects too many mask URLs", () => {
    const result = Omnihuman15RequestSchema.safeParse({
      model: "omnihuman-1-5",
      input: {
        image_url: "https://example.com/portrait.png",
        audio_url: "https://example.com/speech.mp3",
        mask_url: [
          "https://example.com/mask-1.png",
          "https://example.com/mask-2.png",
          "https://example.com/mask-3.png",
          "https://example.com/mask-4.png",
          "https://example.com/mask-5.png",
          "https://example.com/mask-6.png",
        ],
      },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("mask_url"))).toBe(
      true
    );
  });

  it("kie omnihuman 1.5: rejects invalid prompt and resolution", () => {
    const result = CreateTaskRequestSchema.safeParse({
      model: "omnihuman-1-5",
      input: {
        image_url: "https://example.com/portrait.png",
        audio_url: "https://example.com/speech.mp3",
        prompt: "x".repeat(1001),
        output_resolution: "4K",
      },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("kie grok text-to-video: accepts spicy mode and numeric duration", () => {
    const result = GrokTextToVideoRequestSchema.safeParse({
      model: "grok-imagine/text-to-video",
      input: {
        prompt: "A cinematic sunset over calm ocean waves",
        aspect_ratio: "16:9",
        mode: "spicy",
        duration: 30,
        resolution: "720p",
      },
    });

    expect(result.success).toBe(true);
  });

  it("kie grok image-to-video: accepts task_id spicy mode", () => {
    const result = GrokImageToVideoRequestSchema.safeParse({
      model: "grok-imagine/image-to-video",
      input: {
        task_id: "task_grok_12345678",
        index: 5,
        prompt: "x".repeat(4096),
        aspect_ratio: "16:9",
        mode: "spicy",
        duration: 30,
        resolution: "720p",
      },
    });

    expect(result.success).toBe(true);
  });

  it("kie grok image-to-video: rejects unsupported active i2v values", () => {
    const result = GrokImageToVideoRequestSchema.safeParse({
      model: "grok-imagine/image-to-video",
      input: {
        image_urls: ["https://example.com/reference.png"],
        prompt: "x".repeat(4097),
        aspect_ratio: "auto",
        mode: "normal",
        duration: "6",
      },
    });

    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path.join(".")) ?? [];
    expect(paths).toContain("input.prompt");
    expect(paths).toContain("input.aspect_ratio");
    expect(paths).toContain("input.duration");
  });

  it("kie grok image-to-video: rejects external image spicy mode", () => {
    const result = GrokImageToVideoRequestSchema.safeParse({
      model: "grok-imagine/image-to-video",
      input: {
        image_urls: ["https://example.com/reference.png"],
        mode: "spicy",
      },
    });

    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path.join(".")) ?? [];
    expect(paths).toContain("input.mode");
  });

  it("kie grok preview i2v: keeps legacy auto aspect ratio", () => {
    const result = GrokVideo15PreviewRequestSchema.safeParse({
      model: "grok-imagine-video-1-5-preview",
      input: {
        image_urls: ["https://example.com/reference.png"],
        aspect_ratio: "auto",
      },
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

describe("kie wan/2-7-videoedit duration schema", () => {
  const videoEditPayload = (duration?: number) => ({
    model: "wan/2-7-videoedit",
    input: {
      video_url: "https://example.com/demo.mp4",
      ...(duration === undefined ? {} : { duration }),
    },
  });

  it("accepts omitted, 0, 2, and 10 second durations", () => {
    expect(
      Wan27VideoEditRequestSchema.safeParse(videoEditPayload()).success
    ).toBe(true);

    for (const duration of [0, 2, 10]) {
      expect(
        Wan27VideoEditRequestSchema.safeParse(videoEditPayload(duration))
          .success
      ).toBe(true);
    }
  });

  it("rejects 1, 11, and non-integer durations", () => {
    for (const duration of [1, 11, 2.5]) {
      expect(
        Wan27VideoEditRequestSchema.safeParse(videoEditPayload(duration))
          .success
      ).toBe(false);
    }
  });

  it("exports the accepted duration domain for introspection", () => {
    expect(Wan27VideoEditDurationValues).toEqual([
      0, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);

    for (const duration of Wan27VideoEditDurationValues) {
      expect(Wan27VideoEditDurationSchema.safeParse(duration).success).toBe(
        true
      );
    }
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

  it("kling 3.0 turbo exposes documented createTask fields", () => {
    const imageToVideo = modelInputSchemas["kling/v3-turbo-image-to-video"];
    expect(imageToVideo.type).toBe("video");
    expect(imageToVideo.fields.prompt.required).toBe(true);
    expect(imageToVideo.fields.image_urls.required).toBe(true);
    expect(imageToVideo.fields.duration.type).toBe("number");
    expect(imageToVideo.fields.resolution.enum).toEqual(["720p", "1080p"]);

    const textToVideo = modelInputSchemas["kling/v3-turbo-text-to-video"];
    expect(textToVideo.type).toBe("video");
    expect(textToVideo.fields.prompt.required).toBe(true);
    expect(textToVideo.fields.prompt.maxLength).toBe(2500);
    expect(textToVideo.fields.duration.type).toBe("string");
    expect(textToVideo.fields.duration.enum).toEqual([
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
    ]);
    expect(textToVideo.fields.duration.default).toBe("5");
    expect(textToVideo.fields.aspect_ratio.enum).toEqual([
      "1:1",
      "9:16",
      "16:9",
    ]);
    expect(textToVideo.fields.aspect_ratio.default).toBe("16:9");
    expect(textToVideo.fields.resolution.enum).toEqual(["720p", "1080p"]);
    expect(textToVideo.fields.resolution.default).toBe("720p");
  });

  it("seedance 2 mini exposes documented createTask metadata", () => {
    const schema = modelInputSchemas["bytedance/seedance-2-mini"];

    expect(schema.type).toBe("video");
    expect(schema.fields.prompt.maxLength).toBe(20000);
    expect(schema.fields.reference_image_urls.default).toEqual([]);
    expect(schema.fields.reference_video_urls.maxItems).toBe(3);
    expect(schema.fields.reference_audio_urls.maxItems).toBe(3);
    expect(schema.fields.generate_audio.default).toBe(true);
    expect(schema.fields.resolution.enum).toEqual(["480p", "720p"]);
    expect(schema.fields.resolution.default).toBe("720p");
    expect(schema.fields.aspect_ratio.enum).toEqual([
      "16:9",
      "4:3",
      "1:1",
      "3:4",
      "9:16",
      "21:9",
      "adaptive",
    ]);
    expect(schema.fields.aspect_ratio.default).toBe("16:9");
    expect(schema.fields.duration.type).toBe("integer");
    expect(schema.fields.duration.minimum).toBe(4);
    expect(schema.fields.duration.maximum).toBe(15);
    expect(schema.fields.duration.default).toBe(15);
    expect(schema.fields.web_search.default).toBe(false);
    expect(schema.fields.nsfw_checker.default).toBe(true);
  });

  it("grok imagine video schemas expose separate t2v and i2v metadata", () => {
    const textToVideo = modelInputSchemas["grok-imagine/text-to-video"];
    expect(textToVideo.type).toBe("video");
    expect(textToVideo.fields.prompt.description).toContain("5000");
    expect(textToVideo.fields.mode.enum).toEqual(["fun", "normal", "spicy"]);
    expect(textToVideo.fields.duration.type).toBe("integer");
    expect(textToVideo.fields.duration.minimum).toBe(6);
    expect(textToVideo.fields.duration.maximum).toBe(30);
    expect(textToVideo.fields.duration.default).toBe(6);
    expect(textToVideo.fields.aspect_ratio.enum).toEqual([
      "2:3",
      "3:2",
      "1:1",
      "16:9",
      "9:16",
    ]);

    const imageToVideo = modelInputSchemas["grok-imagine/image-to-video"];
    expect(imageToVideo.type).toBe("video");
    expect(imageToVideo.fields.prompt.description).toContain("4096");
    expect(imageToVideo.fields.mode.enum).toEqual(["fun", "normal", "spicy"]);
    expect(imageToVideo.fields.mode.description).toContain("task_id");
    expect(imageToVideo.fields.duration.type).toBe("integer");
    expect(imageToVideo.fields.duration.minimum).toBe(6);
    expect(imageToVideo.fields.duration.maximum).toBe(30);
    expect(imageToVideo.fields.duration.default).toBe(6);
    expect(imageToVideo.fields.duration.description).toContain("6-30");
    expect(imageToVideo.fields.aspect_ratio.enum).toEqual([
      "2:3",
      "3:2",
      "1:1",
      "16:9",
      "9:16",
    ]);
    expect(imageToVideo.fields.aspect_ratio.enum).not.toContain("auto");

    const preview = modelInputSchemas["grok-imagine-video-1-5-preview"];
    expect(preview.fields.prompt.description).toContain("4096");
    expect(preview.fields.aspect_ratio.enum).toContain("auto");
  });

  it("wan 2.7 videoedit exposes the duration domain", () => {
    const schema = modelInputSchemas["wan/2-7-videoedit"];

    expect(schema.type).toBe("video");
    expect(schema.fields.duration.type).toBe("integer");
    expect(schema.fields.duration.enum).toEqual([
      0, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(schema.fields.duration.minimum).toBe(0);
    expect(schema.fields.duration.maximum).toBe(10);
    expect(schema.fields.duration.default).toBe(0);
  });

  it("gpt-image-2 text-to-image exposes documented aspect ratios", () => {
    const schema = modelInputSchemas["gpt-image-2-text-to-image"];
    expect(schema.type).toBe("image");
    expect(schema.fields.aspect_ratio.enum).toEqual([
      "auto",
      "1:1",
      "3:2",
      "2:3",
      "4:3",
      "3:4",
      "5:4",
      "4:5",
      "9:16",
      "16:9",
      "2:1",
      "1:2",
      "3:1",
      "1:3",
      "21:9",
      "9:21",
    ]);
  });

  it("gpt-image-2 image-to-image exposes documented aspect ratios", () => {
    const schema = modelInputSchemas["gpt-image-2-image-to-image"];
    expect(schema.type).toBe("image");
    expect(schema.fields.aspect_ratio.enum).toEqual([
      "auto",
      "1:1",
      "5:4",
      "9:16",
      "21:9",
      "16:9",
      "4:3",
      "3:2",
      "4:5",
      "3:4",
      "2:3",
    ]);
  });

  it("elevenlabs text-to-audio models expose audio metadata", () => {
    const tts = modelInputSchemas["elevenlabs/text-to-speech-turbo-2-5"];
    expect(tts.type).toBe("audio");
    expect(tts.fields.text.required).toBe(true);
    expect(tts.fields.voice.required).toBe(true);

    const dialogue = modelInputSchemas["elevenlabs/text-to-dialogue-v3"];
    expect(dialogue.type).toBe("audio");
    expect(dialogue.fields.dialogue.required).toBe(true);
  });

  it("volcengine video-to-video lip sync exposes required media fields", () => {
    const schema = modelInputSchemas["volcengine/video-to-video-lip-sync"];

    expect(schema.type).toBe("video");
    expect(schema.fields.mode.required).toBe(true);
    expect(schema.fields.mode.enum).toEqual(["lite", "basic"]);
    expect(schema.fields.video_url.required).toBe(true);
    expect(schema.fields.audio_url.required).toBe(true);
    expect(schema.fields.separate_vocal.type).toBe("boolean");
    expect(schema.fields.open_scenedet.type).toBe("boolean");
    expect(schema.fields.align_audio.type).toBe("boolean");
    expect(schema.fields.align_audio_reverse.type).toBe("boolean");
    expect(schema.fields.templ_start_seconds.type).toBe("number");
  });

  it("omnihuman 1.5 exposes required portrait and audio fields", () => {
    const schema = modelInputSchemas["omnihuman-1-5"];

    expect(schema.type).toBe("video");
    expect(schema.fields.image_url.required).toBe(true);
    expect(schema.fields.audio_url.required).toBe(true);
    expect(schema.fields.mask_url.type).toBe("array");
    expect(schema.fields.mask_url.items).toEqual({ type: "string" });
    expect(schema.fields.prompt.type).toBe("string");
    expect(schema.fields.output_resolution.enum).toEqual(["720", "1080"]);
    expect(schema.fields.pe_fast_mode.type).toBe("boolean");
    expect(schema.fields.seed.type).toBe("integer");
  });
});
