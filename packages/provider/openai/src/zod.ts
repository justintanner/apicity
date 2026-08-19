import { z } from "zod";

import {
  ChatContentPartSchema,
  ChatImageUrlPartSchema,
  ChatTextPartSchema,
  ChatToolChoiceSchema,
  ChatToolFunctionSchema,
  ChatToolSchema,
} from "./chat-fragments-zod";

export { z };

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const OpenAiTextPartSchema = ChatTextPartSchema;

export const OpenAiImageUrlPartSchema = ChatImageUrlPartSchema;

export const OpenAiContentPartSchema = ChatContentPartSchema;

export const OpenAiMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(OpenAiContentPartSchema)]),
});

export const OpenAiToolFunctionSchema = ChatToolFunctionSchema;

export const OpenAiToolSchema = ChatToolSchema;

// ---------------------------------------------------------------------------
// Chat completions
// ---------------------------------------------------------------------------

export const OpenAiChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(OpenAiMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  max_completion_tokens: z.number().int().positive().optional(),
  tools: z.array(OpenAiToolSchema).optional(),
  tool_choice: ChatToolChoiceSchema.optional(),
  response_format: z
    .object({
      type: z.enum(["text", "json_object", "json_schema"]),
      json_schema: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  store: z.boolean().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const OpenAiStoredCompletionUpdateRequestSchema = z.object({
  metadata: z.record(z.string(), z.string()),
});

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

export const OpenAiCompletionPromptSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.array(z.number())),
]);

export const OpenAiCompletionStreamOptionsSchema = z.object({
  include_obfuscation: z.boolean().optional(),
  include_usage: z.boolean().optional(),
});

export const OpenAiCompletionRequestSchema = z.object({
  model: z.string(),
  prompt: OpenAiCompletionPromptSchema,
  best_of: z.number().int().min(0).max(20).optional(),
  echo: z.boolean().optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  logit_bias: z.record(z.string(), z.number().min(-100).max(100)).optional(),
  logprobs: z.number().int().min(0).max(5).optional(),
  max_tokens: z.number().int().min(0).optional(),
  n: z.number().int().min(1).max(128).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  seed: z.number().int().optional(),
  stop: z.union([z.string(), z.array(z.string()).max(4)]).optional(),
  stream: z.boolean().optional(),
  stream_options: OpenAiCompletionStreamOptionsSchema.optional(),
  suffix: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  user: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export const OpenAiEmbeddingRequestSchema = z.object({
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.array(z.number())),
  ]),
  model: z.string(),
  encoding_format: z.enum(["float", "base64"]).optional(),
  dimensions: z.number().int().positive().optional(),
  user: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const blobSchema = z.instanceof(Blob);

export const OpenAiImageEditRequestSchema = z.object({
  image: z.union([blobSchema, z.array(blobSchema)]),
  prompt: z.string().min(1),
  mask: blobSchema.optional(),
  model: z.string().optional(),
  n: z.number().int().min(1).max(10).optional(),
  size: z
    .enum(["256x256", "512x512", "1024x1024", "1536x1024", "1024x1536", "auto"])
    .optional(),
  quality: z.enum(["standard", "low", "medium", "high", "auto"]).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional(),
  response_format: z.enum(["url", "b64_json"]).optional(),
  background: z.enum(["transparent", "opaque", "auto"]).optional(),
  input_fidelity: z.enum(["high", "low"]).optional(),
  output_compression: z.number().min(0).max(100).optional(),
  user: z.string().optional(),
});

export const OpenAiImageGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  n: z.number().int().min(1).max(10).optional(),
  size: z.string().optional(),
  quality: z.string().optional(),
  response_format: z.enum(["url", "b64_json"]).optional(),
  style: z.enum(["vivid", "natural"]).optional(),
  background: z.enum(["transparent", "opaque", "auto"]).optional(),
  moderation: z.enum(["low", "auto"]).optional(),
  output_format: z.enum(["png", "jpeg", "webp"]).optional(),
  output_compression: z.number().min(0).max(100).optional(),
  user: z.string().optional(),
});
export const OpenAiImageVariationRequestSchema = z.object({
  image: blobSchema,
  model: z.string().optional(),
  n: z.number().int().min(1).max(10).optional(),
  response_format: z.enum(["url", "b64_json"]).optional(),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).optional(),
  user: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export const OpenAiSpeechRequestSchema = z.object({
  model: z.string(),
  input: z.string().min(1).max(4096),
  voice: z.enum([
    "alloy",
    "ash",
    "coral",
    "echo",
    "fable",
    "onyx",
    "nova",
    "sage",
    "shimmer",
  ]),
  response_format: z
    .enum(["mp3", "opus", "aac", "flac", "wav", "pcm"])
    .optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
  instructions: z.string().optional(),
});

export const OpenAiTranscribeRequestSchema = z.object({
  file: blobSchema,
  model: z.string(),
  response_format: z.string().optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

export const OpenAiTranslateRequestSchema = z.object({
  file: blobSchema,
  model: z.string(),
  response_format: z.string().optional(),
  prompt: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

// ---------------------------------------------------------------------------
// Moderations
// ---------------------------------------------------------------------------

export const OpenAiModerationTextInputSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const OpenAiModerationImageUrlInputSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({ url: z.string() }),
});

export const OpenAiModerationMultiModalInputSchema = z.discriminatedUnion(
  "type",
  [OpenAiModerationTextInputSchema, OpenAiModerationImageUrlInputSchema]
);

export const OpenAiModerationRequestSchema = z.object({
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.array(OpenAiModerationMultiModalInputSchema),
  ]),
  model: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export const OpenAiFileUploadRequestSchema = z.object({
  file: blobSchema,
  purpose: z.enum([
    "assistants",
    "batch",
    "fine-tune",
    "vision",
    "user_data",
    "evals",
  ]),
  expires_after: z
    .object({
      anchor: z.literal("created_at"),
      seconds: z.number().int().min(3600).max(2592000),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

export const OpenAiContainerMemoryLimitSchema = z.enum([
  "1g",
  "4g",
  "16g",
  "64g",
]);

export const OpenAiContainerNetworkPolicyDomainSecretSchema = z.object({
  domain: z.string().min(1),
  name: z.string().min(1),
  value: z.string().min(1).max(10485760),
});

export const OpenAiContainerNetworkPolicyDisabledSchema = z.object({
  type: z.literal("disabled"),
});

export const OpenAiContainerNetworkPolicyAllowlistSchema = z.object({
  allowed_domains: z.array(z.string()),
  type: z.literal("allowlist"),
  domain_secrets: z
    .array(OpenAiContainerNetworkPolicyDomainSecretSchema)
    .optional(),
});

export const OpenAiContainerNetworkPolicySchema = z.discriminatedUnion("type", [
  OpenAiContainerNetworkPolicyDisabledSchema,
  OpenAiContainerNetworkPolicyAllowlistSchema,
]);

export const OpenAiContainerSkillReferenceSchema = z.object({
  skill_id: z.string().min(1).max(64),
  type: z.literal("skill_reference"),
  version: z.string().optional(),
});

export const OpenAiContainerInlineSkillSourceSchema = z.object({
  data: z.string().min(1).max(70254592),
  media_type: z.literal("application/zip"),
  type: z.literal("base64"),
});

export const OpenAiContainerInlineSkillSchema = z.object({
  description: z.string(),
  name: z.string(),
  source: OpenAiContainerInlineSkillSourceSchema,
  type: z.literal("inline"),
});

export const OpenAiContainerSkillSchema = z.discriminatedUnion("type", [
  OpenAiContainerSkillReferenceSchema,
  OpenAiContainerInlineSkillSchema,
]);

export const OpenAiContainerCreateRequestSchema = z.object({
  name: z.string(),
  expires_after: z
    .object({
      anchor: z.literal("last_active_at"),
      minutes: z.number(),
    })
    .optional(),
  file_ids: z.array(z.string()).optional(),
  memory_limit: OpenAiContainerMemoryLimitSchema.optional(),
  network_policy: OpenAiContainerNetworkPolicySchema.optional(),
  skills: z.array(OpenAiContainerSkillSchema).optional(),
});

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

export const OpenAiUploadCreateRequestSchema = z.object({
  bytes: z.number().int().nonnegative(),
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  purpose: z.enum(["assistants", "batch", "fine-tune", "vision"]),
  expires_after: z
    .object({
      anchor: z.literal("created_at"),
      seconds: z.number().int().min(3600).max(2592000),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

export const OpenAiBatchCreateRequestSchema = z.object({
  input_file_id: z.string(),
  endpoint: z.string(),
  completion_window: z.string(),
  metadata: z.record(z.string(), z.string()).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Responses API
// ---------------------------------------------------------------------------

export const OpenAiResponseInputTextContentSchema = z.object({
  type: z.literal("input_text"),
  text: z.string(),
});

export const OpenAiResponseInputImageContentSchema = z.object({
  type: z.literal("input_image"),
  image_url: z.string().optional(),
  file_id: z.string().optional(),
  detail: z.enum(["auto", "low", "high"]).optional(),
});

export const OpenAiResponseInputAudioContentSchema = z.object({
  type: z.literal("input_audio"),
  data: z.string(),
  format: z.enum(["wav", "mp3"]),
});

export const OpenAiResponseInputContentSchema = z.discriminatedUnion("type", [
  OpenAiResponseInputTextContentSchema,
  OpenAiResponseInputImageContentSchema,
  OpenAiResponseInputAudioContentSchema,
]);

export const OpenAiResponseInputMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "developer"]),
  content: z.union([z.string(), z.array(OpenAiResponseInputContentSchema)]),
});

export const OpenAiResponseFunctionCallOutputSchema = z.object({
  type: z.literal("function_call_output"),
  call_id: z.string(),
  output: z.string(),
});

export const OpenAiResponseItemReferenceSchema = z.object({
  type: z.literal("item_reference"),
  id: z.string(),
});

export const OpenAiResponseInputItemSchema = z.discriminatedUnion("type", [
  OpenAiResponseInputMessageSchema.extend({
    type: z.literal("message").optional(),
  }),
  OpenAiResponseFunctionCallOutputSchema,
  OpenAiResponseItemReferenceSchema,
]);

// Response API tools
export const OpenAiResponseFunctionToolSchema = z.object({
  type: z.literal("function"),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  strict: z.boolean().optional(),
});

export const OpenAiResponseWebSearchToolSchema = z.object({
  type: z.enum(["web_search_preview", "web_search_preview_2025_03_11"]),
  search_context_size: z.enum(["low", "medium", "high"]).optional(),
  user_location: z
    .object({
      type: z.literal("approximate"),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

export const OpenAiResponseFileSearchToolSchema = z.object({
  type: z.literal("file_search"),
  vector_store_ids: z.array(z.string()),
  max_num_results: z.number().int().positive().optional(),
  ranking_options: z
    .object({
      ranker: z.string().optional(),
      score_threshold: z.number().optional(),
    })
    .optional(),
});

export const OpenAiResponseCodeInterpreterToolSchema = z.object({
  type: z.literal("code_interpreter"),
});

export const OpenAiResponseToolSchema = z.discriminatedUnion("type", [
  OpenAiResponseFunctionToolSchema,
  OpenAiResponseFileSearchToolSchema,
  OpenAiResponseCodeInterpreterToolSchema,
  // web_search has two type variants — use a union for those
  OpenAiResponseWebSearchToolSchema.extend({
    type: z.literal("web_search_preview"),
  }),
  OpenAiResponseWebSearchToolSchema.extend({
    type: z.literal("web_search_preview_2025_03_11"),
  }),
]);

export const OpenAiResponseTextFormatSchema = z.object({
  format: z.union([
    z.object({ type: z.literal("text") }),
    z.object({ type: z.literal("json_object") }),
    z.object({
      type: z.literal("json_schema"),
      name: z.string(),
      schema: z.record(z.string(), z.unknown()),
      description: z.string().optional(),
      strict: z.boolean().optional(),
    }),
  ]),
});

export const OpenAiResponseReasoningSchema = z.object({
  effort: z.enum(["low", "medium", "high"]).optional(),
  summary: z.enum(["auto", "concise", "detailed"]).nullable().optional(),
});

export const OpenAiResponseRequestSchema = z.object({
  model: z.string(),
  input: z.union([
    z.string(),
    z.array(
      z.union([
        OpenAiResponseInputMessageSchema,
        OpenAiResponseFunctionCallOutputSchema,
        OpenAiResponseItemReferenceSchema,
      ])
    ),
  ]),
  instructions: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_output_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  tools: z.array(OpenAiResponseToolSchema).optional(),
  tool_choice: z
    .union([
      z.enum(["auto", "none", "required"]),
      z.object({
        type: z.string(),
        name: z.string().optional(),
      }),
    ])
    .optional(),
  previous_response_id: z.string().optional(),
  store: z.boolean().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  stream: z.boolean().optional(),
  text: OpenAiResponseTextFormatSchema.optional(),
  truncation: z.enum(["auto", "disabled"]).optional(),
  reasoning: OpenAiResponseReasoningSchema.optional(),
  user: z.string().optional(),
  include: z.array(z.string()).optional(),
  parallel_tool_calls: z.boolean().optional(),
});

export const OpenAiResponseCompactRequestSchema = z.object({
  model: z.string(),
  input: z
    .union([
      z.string(),
      z.array(
        z.union([
          OpenAiResponseInputMessageSchema,
          OpenAiResponseFunctionCallOutputSchema,
          OpenAiResponseItemReferenceSchema,
        ])
      ),
    ])
    .nullable()
    .optional(),
  instructions: z.string().nullable().optional(),
  previous_response_id: z.string().nullable().optional(),
  prompt_cache_key: z.string().nullable().optional(),
});

export const OpenAiResponseInputTokensRequestSchema = z.object({
  model: z.string().nullable().optional(),
  input: z
    .union([
      z.string(),
      z.array(
        z.union([
          OpenAiResponseInputMessageSchema,
          OpenAiResponseFunctionCallOutputSchema,
          OpenAiResponseItemReferenceSchema,
        ])
      ),
    ])
    .nullable()
    .optional(),
  instructions: z.string().nullable().optional(),
  conversation: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .nullable()
    .optional(),
  previous_response_id: z.string().nullable().optional(),
  tools: z.array(OpenAiResponseToolSchema).nullable().optional(),
  tool_choice: z
    .union([
      z.enum(["auto", "none", "required"]),
      z.object({
        type: z.string(),
        name: z.string().optional(),
      }),
    ])
    .nullable()
    .optional(),
  parallel_tool_calls: z.boolean().nullable().optional(),
  reasoning: OpenAiResponseReasoningSchema.nullable().optional(),
  text: OpenAiResponseTextFormatSchema.nullable().optional(),
  truncation: z.enum(["auto", "disabled"]).optional(),
});

// ---------------------------------------------------------------------------
// Evals
// ---------------------------------------------------------------------------

export const OpenAiEvalCustomDataSourceConfigSchema = z.object({
  type: z.literal("custom"),
  item_schema: z.record(z.string(), z.unknown()),
  include_sample_schema: z.boolean().optional(),
});

export const OpenAiEvalLogsDataSourceConfigSchema = z.object({
  type: z.literal("logs"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const OpenAiEvalStoredCompletionsDataSourceConfigSchema = z.object({
  type: z.literal("stored_completions"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const OpenAiEvalDataSourceConfigSchema = z.discriminatedUnion("type", [
  OpenAiEvalCustomDataSourceConfigSchema,
  OpenAiEvalLogsDataSourceConfigSchema,
  OpenAiEvalStoredCompletionsDataSourceConfigSchema,
]);

export const OpenAiEvalOutputTextContentSchema = z.object({
  type: z.literal("output_text"),
  text: z.string(),
});

export const OpenAiEvalInputImageContentSchema = z.object({
  type: z.literal("input_image"),
  image_url: z.string(),
  detail: z.enum(["auto", "low", "high"]).optional(),
});

export const OpenAiEvalInputAudioContentSchema = z.object({
  type: z.literal("input_audio"),
  input_audio: z.object({
    data: z.string(),
    format: z.enum(["mp3", "wav"]),
  }),
});

export const OpenAiEvalMessageContentPartSchema = z.discriminatedUnion("type", [
  OpenAiResponseInputTextContentSchema,
  OpenAiEvalOutputTextContentSchema,
  OpenAiEvalInputImageContentSchema,
  OpenAiEvalInputAudioContentSchema,
]);

export const OpenAiEvalMessageContentSchema = z.union([
  z.string(),
  OpenAiEvalMessageContentPartSchema,
  z.array(OpenAiEvalMessageContentPartSchema),
]);

export const OpenAiEvalSimpleInputMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
});

export const OpenAiEvalMessageObjectSchema = z.object({
  role: z.enum(["user", "assistant", "system", "developer"]),
  content: OpenAiEvalMessageContentSchema,
  type: z.literal("message").optional(),
});

export const OpenAiEvalInputMessageSchema = z.union([
  OpenAiEvalSimpleInputMessageSchema,
  OpenAiEvalMessageObjectSchema,
]);

export const OpenAiEvalLabelModelGraderSchema = z.object({
  type: z.literal("label_model"),
  name: z.string(),
  model: z.string(),
  input: z.array(OpenAiEvalInputMessageSchema),
  labels: z.array(z.string()),
  passing_labels: z.array(z.string()),
});

export const OpenAiEvalStringCheckGraderSchema = z.object({
  type: z.literal("string_check"),
  name: z.string(),
  input: z.string(),
  operation: z.enum(["eq", "ne", "like", "ilike"]),
  reference: z.string(),
});

export const OpenAiEvalTextSimilarityGraderSchema = z.object({
  type: z.literal("text_similarity"),
  name: z.string(),
  input: z.string(),
  reference: z.string(),
  evaluation_metric: z.string(),
  pass_threshold: z.number(),
});

export const OpenAiEvalPythonGraderSchema = z.object({
  type: z.literal("python"),
  name: z.string(),
  source: z.string(),
  image_tag: z.string().optional(),
  pass_threshold: z.number().optional(),
});

export const OpenAiEvalScoreModelGraderSchema = z.object({
  type: z.literal("score_model"),
  name: z.string(),
  model: z.string(),
  input: z.array(OpenAiEvalInputMessageSchema),
  pass_threshold: z.number().optional(),
  range: z.array(z.number()).optional(),
  sampling_params: z.record(z.string(), z.unknown()).optional(),
});

export const OpenAiEvalGraderSchema = z.discriminatedUnion("type", [
  OpenAiEvalLabelModelGraderSchema,
  OpenAiEvalStringCheckGraderSchema,
  OpenAiEvalTextSimilarityGraderSchema,
  OpenAiEvalPythonGraderSchema,
  OpenAiEvalScoreModelGraderSchema,
]);

export const OpenAiEvalCreateRequestSchema = z.object({
  data_source_config: OpenAiEvalDataSourceConfigSchema,
  testing_criteria: z.array(OpenAiEvalGraderSchema),
  metadata: z.record(z.string(), z.string()).optional(),
  name: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export const OpenAiConversationCreateRequestSchema = z.object({
  // Initial items to seed the conversation context (max 20). Reuses the
  // Responses input-item shapes — messages, function call outputs, references.
  items: z.array(OpenAiResponseInputItemSchema).max(20).nullable().optional(),
  // Up to 16 key/value string pairs attached to the conversation.
  metadata: z.record(z.string(), z.string()).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

export const OpenAiRealtimeAudioFormatSchema = z.union([
  z.object({
    type: z.literal("audio/pcm").optional(),
    rate: z.literal(24000).optional(),
  }),
  z.object({ type: z.literal("audio/pcmu").optional() }),
  z.object({ type: z.literal("audio/pcma").optional() }),
]);

export const OpenAiRealtimeNoiseReductionSchema = z
  .object({
    type: z.enum(["near_field", "far_field"]).optional(),
  })
  .nullable();

export const OpenAiRealtimeAudioTranscriptionSchema = z
  .object({
    delay: z.enum(["minimal", "low", "medium", "high", "xhigh"]).optional(),
    language: z.string().optional(),
    model: z.string().optional(),
    prompt: z.string().optional(),
  })
  .nullable();

export const OpenAiRealtimeServerVadSchema = z.object({
  type: z.literal("server_vad"),
  create_response: z.boolean().optional(),
  idle_timeout_ms: z.number().int().min(5000).max(30000).optional(),
  interrupt_response: z.boolean().optional(),
  prefix_padding_ms: z.number().optional(),
  silence_duration_ms: z.number().optional(),
  threshold: z.number().min(0).max(1).optional(),
});

export const OpenAiRealtimeSemanticVadSchema = z.object({
  type: z.literal("semantic_vad"),
  create_response: z.boolean().optional(),
  eagerness: z.enum(["low", "medium", "high", "auto"]).optional(),
  interrupt_response: z.boolean().optional(),
});

export const OpenAiRealtimeTurnDetectionSchema = z
  .discriminatedUnion("type", [
    OpenAiRealtimeServerVadSchema,
    OpenAiRealtimeSemanticVadSchema,
  ])
  .nullable();

export const OpenAiRealtimeAudioInputSchema = z.object({
  format: OpenAiRealtimeAudioFormatSchema.optional(),
  noise_reduction: OpenAiRealtimeNoiseReductionSchema.optional(),
  transcription: OpenAiRealtimeAudioTranscriptionSchema.optional(),
  turn_detection: OpenAiRealtimeTurnDetectionSchema.optional(),
});

export const OpenAiRealtimeVoiceSchema = z.union([
  z.string(),
  z.object({ id: z.string() }),
]);

export const OpenAiRealtimeAudioOutputSchema = z.object({
  format: OpenAiRealtimeAudioFormatSchema.optional(),
  speed: z.number().min(0.25).max(1.5).optional(),
  voice: OpenAiRealtimeVoiceSchema.optional(),
});

export const OpenAiRealtimeAudioConfigSchema = z.object({
  input: OpenAiRealtimeAudioInputSchema.optional(),
  output: OpenAiRealtimeAudioOutputSchema.optional(),
});

export const OpenAiRealtimePromptSchema = z.object({
  id: z.string(),
  variables: z.record(z.string(), z.unknown()).optional(),
  version: z.string().optional(),
});

export const OpenAiRealtimeReasoningSchema = z.object({
  effort: z.enum(["minimal", "low", "medium", "high", "xhigh"]).optional(),
});

export const OpenAiRealtimeToolChoiceSchema = z.union([
  z.enum(["none", "auto", "required"]),
  z.object({
    type: z.literal("function"),
    name: z.string(),
  }),
  z.object({
    type: z.literal("mcp"),
    server_label: z.string(),
    name: z.string().optional(),
  }),
]);

export const OpenAiRealtimeFunctionToolSchema = z.object({
  type: z.literal("function").optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const OpenAiRealtimeMcpToolFilterSchema = z.object({
  read_only: z.boolean().optional(),
  tool_names: z.array(z.string()).optional(),
});

export const OpenAiRealtimeMcpApprovalSchema = z.union([
  z.enum(["always", "never"]),
  z.object({
    always: OpenAiRealtimeMcpToolFilterSchema.optional(),
    never: OpenAiRealtimeMcpToolFilterSchema.optional(),
  }),
]);

export const OpenAiRealtimeMcpToolSchema = z.object({
  type: z.literal("mcp"),
  server_label: z.string(),
  allowed_tools: z
    .union([z.array(z.string()), OpenAiRealtimeMcpToolFilterSchema])
    .optional(),
  authorization: z.string().optional(),
  connector_id: z.string().optional(),
  defer_loading: z.boolean().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  require_approval: OpenAiRealtimeMcpApprovalSchema.optional(),
  server_description: z.string().optional(),
  server_url: z.string().url().optional(),
  tunnel_id: z.string().optional(),
});

export const OpenAiRealtimeToolSchema = z.union([
  OpenAiRealtimeFunctionToolSchema,
  OpenAiRealtimeMcpToolSchema,
]);

export const OpenAiRealtimeTracingSchema = z
  .union([
    z.literal("auto"),
    z.object({
      group_id: z.string().optional(),
      metadata: z.unknown().optional(),
      workflow_name: z.string().optional(),
    }),
  ])
  .nullable();

export const OpenAiRealtimeTruncationSchema = z.union([
  z.enum(["auto", "disabled"]),
  z.object({
    type: z.literal("retention_ratio"),
    retention_ratio: z.number().min(0).max(1),
    token_limits: z
      .object({
        post_instructions: z.number().min(0).optional(),
      })
      .optional(),
  }),
]);

export const OpenAiRealtimeSessionCreateRequestSchema = z.object({
  type: z.literal("realtime"),
  audio: OpenAiRealtimeAudioConfigSchema.optional(),
  include: z
    .array(z.literal("item.input_audio_transcription.logprobs"))
    .optional(),
  instructions: z.string().optional(),
  max_output_tokens: z
    .union([z.number().int().min(1).max(4096), z.literal("inf")])
    .optional(),
  model: z.string().optional(),
  output_modalities: z.array(z.enum(["text", "audio"])).optional(),
  parallel_tool_calls: z.boolean().optional(),
  prompt: OpenAiRealtimePromptSchema.optional(),
  reasoning: OpenAiRealtimeReasoningSchema.optional(),
  tool_choice: OpenAiRealtimeToolChoiceSchema.optional(),
  tools: z.array(OpenAiRealtimeToolSchema).optional(),
  tracing: OpenAiRealtimeTracingSchema.optional(),
  truncation: OpenAiRealtimeTruncationSchema.optional(),
});

export const OpenAiRealtimeTranscriptionSessionCreateRequestSchema = z.object({
  type: z.literal("transcription"),
  audio: z
    .object({
      input: OpenAiRealtimeAudioInputSchema.optional(),
    })
    .optional(),
  include: z
    .array(z.literal("item.input_audio_transcription.logprobs"))
    .optional(),
});

export const OpenAiRealtimeClientSecretRequestSchema = z.object({
  expires_after: z
    .object({
      anchor: z.literal("created_at").optional(),
      seconds: z.number().int().min(10).max(7200).optional(),
    })
    .optional(),
  session: z
    .discriminatedUnion("type", [
      OpenAiRealtimeSessionCreateRequestSchema,
      OpenAiRealtimeTranscriptionSessionCreateRequestSchema,
    ])
    .optional(),
});

// ---------------------------------------------------------------------------
// Vector stores
// ---------------------------------------------------------------------------

export const OpenAiVectorStoreExpirationPolicySchema = z.object({
  anchor: z.literal("last_active_at"),
  days: z.number().int().min(1).max(365),
});

export const OpenAiVectorStoreAutoChunkingStrategySchema = z.object({
  type: z.literal("auto"),
});

export const OpenAiVectorStoreStaticChunkingStrategySchema = z.object({
  static: z.object({
    chunk_overlap_tokens: z.number().int().min(0),
    max_chunk_size_tokens: z.number().int().min(100).max(4096),
  }),
  type: z.literal("static"),
});

export const OpenAiVectorStoreChunkingStrategySchema = z.discriminatedUnion(
  "type",
  [
    OpenAiVectorStoreAutoChunkingStrategySchema,
    OpenAiVectorStoreStaticChunkingStrategySchema,
  ]
);

export const OpenAiVectorStoreCreateRequestSchema = z.object({
  chunking_strategy: OpenAiVectorStoreChunkingStrategySchema.optional(),
  description: z.string().optional(),
  expires_after: OpenAiVectorStoreExpirationPolicySchema.optional(),
  file_ids: z.array(z.string()).optional(),
  metadata: z.record(z.string().max(64), z.string().max(512)).optional(),
  name: z.string().optional(),
});

export const OpenAiVectorStoreSearchComparisonFilterSchema = z.object({
  key: z.string(),
  type: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin"]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
  ]),
});

export const OpenAiVectorStoreSearchCompoundFilterSchema: z.ZodType<OpenAiVectorStoreSearchCompoundFilter> =
  z.object({
    type: z.enum(["and", "or"]),
    filters: z.array(z.lazy(() => OpenAiVectorStoreSearchFilterSchema)),
  });

export const OpenAiVectorStoreSearchFilterSchema: z.ZodType<OpenAiVectorStoreSearchFilter> =
  z.union([
    OpenAiVectorStoreSearchComparisonFilterSchema,
    OpenAiVectorStoreSearchCompoundFilterSchema,
  ]);

export const OpenAiVectorStoreSearchRankingOptionsSchema = z.object({
  ranker: z
    .enum(["auto", "default-2024-11-15"])
    .or(z.string().regex(/^[a-z0-9][a-z0-9._-]*$/))
    .optional(),
  score_threshold: z.number().min(0).max(1).optional(),
});

export const OpenAiVectorStoreSearchRequestSchema = z.object({
  query: z.union([z.string(), z.array(z.string())]),
  max_num_results: z.number().int().min(1).max(50).optional(),
  filters: OpenAiVectorStoreSearchFilterSchema.optional(),
  ranking_options: OpenAiVectorStoreSearchRankingOptionsSchema.optional(),
  rewrite_query: z.boolean().optional(),
});

export const OpenAiVectorStoreFileAttributesSchema = z.record(
  z.string().max(256),
  z.union([z.string().max(512), z.number(), z.boolean()])
);

export const OpenAiVectorStoreFileCreateRequestSchema = z.object({
  attributes: OpenAiVectorStoreFileAttributesSchema.optional(),
  chunking_strategy: OpenAiVectorStoreChunkingStrategySchema.optional(),
  file_id: z.string(),
});

// ---------------------------------------------------------------------------
// Fine-tuning
// ---------------------------------------------------------------------------

export const OpenAiFineTuningHyperparametersSchema = z.object({
  batch_size: z
    .union([z.literal("auto"), z.number()])
    .nullable()
    .optional(),
  learning_rate_multiplier: z
    .union([z.literal("auto"), z.number()])
    .nullable()
    .optional(),
  n_epochs: z
    .union([z.literal("auto"), z.number()])
    .nullable()
    .optional(),
});

export const OpenAiFineTuningSupervisedMethodSchema = z.object({
  hyperparameters: z
    .object({
      batch_size: z.union([z.literal("auto"), z.number()]).optional(),
      learning_rate_multiplier: z
        .union([z.literal("auto"), z.number()])
        .optional(),
      n_epochs: z.union([z.literal("auto"), z.number()]).optional(),
    })
    .optional(),
});

export const OpenAiFineTuningDpoMethodSchema = z.object({
  hyperparameters: z
    .object({
      batch_size: z.union([z.literal("auto"), z.number()]).optional(),
      beta: z.union([z.literal("auto"), z.number()]).optional(),
      learning_rate_multiplier: z
        .union([z.literal("auto"), z.number()])
        .optional(),
      n_epochs: z.union([z.literal("auto"), z.number()]).optional(),
    })
    .optional(),
});

export const OpenAiFineTuningReinforcementMethodSchema = z.object({
  grader: z.record(z.string(), z.unknown()),
  hyperparameters: z
    .object({
      batch_size: z.union([z.literal("auto"), z.number()]).optional(),
      compute_multiplier: z.union([z.literal("auto"), z.number()]).optional(),
      eval_interval: z.union([z.literal("auto"), z.number()]).optional(),
      eval_samples: z.union([z.literal("auto"), z.number()]).optional(),
      learning_rate_multiplier: z
        .union([z.literal("auto"), z.number()])
        .optional(),
      n_epochs: z.union([z.literal("auto"), z.number()]).optional(),
      reasoning_effort: z.enum(["default", "low", "medium", "high"]).optional(),
    })
    .optional(),
});

export const OpenAiFineTuningMethodSchema = z.object({
  type: z.enum(["supervised", "dpo", "reinforcement"]),
  supervised: OpenAiFineTuningSupervisedMethodSchema.nullable().optional(),
  dpo: OpenAiFineTuningDpoMethodSchema.nullable().optional(),
  reinforcement:
    OpenAiFineTuningReinforcementMethodSchema.nullable().optional(),
});

export const OpenAiFineTuningWandbConfigSchema = z.object({
  project: z.string(),
  entity: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const OpenAiFineTuningIntegrationSchema = z.object({
  type: z.literal("wandb"),
  wandb: OpenAiFineTuningWandbConfigSchema,
});

export const OpenAiFineTuningJobCreateRequestSchema = z.object({
  model: z.string(),
  training_file: z.string(),
  hyperparameters: OpenAiFineTuningHyperparametersSchema.optional(),
  integrations: z
    .array(OpenAiFineTuningIntegrationSchema)
    .nullable()
    .optional(),
  metadata: z.record(z.string(), z.string()).nullable().optional(),
  method: OpenAiFineTuningMethodSchema.optional(),
  seed: z.number().nullable().optional(),
  suffix: z.string().max(64).nullable().optional(),
  validation_file: z.string().nullable().optional(),
});

export const OpenAiCheckpointPermissionCreateRequestSchema = z.object({
  project_ids: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Organization usage / costs / limits
// ---------------------------------------------------------------------------

export const OpenAiOrganizationUsageQuerySchema = z.object({
  start_time: z.number().int(),
  end_time: z.number().int().optional(),
  bucket_width: z.enum(["1m", "1h", "1d"]).optional(),
  project_ids: z.array(z.string()).optional(),
  user_ids: z.array(z.string()).optional(),
  api_key_ids: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
  group_by: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  page: z.string().optional(),
  batch: z.boolean().optional(),
  sizes: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
});

export const OpenAiOrganizationCostsQuerySchema = z.object({
  start_time: z.number().int(),
  end_time: z.number().int().optional(),
  bucket_width: z.literal("1d").optional(),
  project_ids: z.array(z.string()).optional(),
  group_by: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  page: z.string().optional(),
});

export const OpenAiOrganizationProjectListQuerySchema = z.object({
  after: z.string().optional(),
  include_archived: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
});

export const OpenAiOrganizationProjectRateLimitListQuerySchema = z.object({
  after: z.string().optional(),
  before: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const OpenAiOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  /**
   * Base URL for the Codex/ChatGPT backend that serves the usage endpoint
   * (`get.codex.usage`). Defaults to https://chatgpt.com/backend-api.
   */
  codexBaseURL: z.string().url().optional(),
  /**
   * ChatGPT account id, sent as the `ChatGPT-Account-Id` header on Codex
   * backend requests (e.g. `get.codex.usage`). Optional.
   */
  chatgptAccountId: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type OpenAiTextPart = z.infer<typeof OpenAiTextPartSchema>;
export type OpenAiImageUrlPart = z.infer<typeof OpenAiImageUrlPartSchema>;
export type OpenAiContentPart = z.infer<typeof OpenAiContentPartSchema>;
export type OpenAiMessage = z.infer<typeof OpenAiMessageSchema>;
export type OpenAiToolFunction = z.infer<typeof OpenAiToolFunctionSchema>;
export type OpenAiTool = z.infer<typeof OpenAiToolSchema>;
export type OpenAiChatRequest = z.input<typeof OpenAiChatRequestSchema>;
export type OpenAiChatRequestInput = OpenAiChatRequest;
export type OpenAiChatParsedRequest = z.output<typeof OpenAiChatRequestSchema>;
export type OpenAiStoredCompletionUpdateRequest = z.input<
  typeof OpenAiStoredCompletionUpdateRequestSchema
>;
export type OpenAiStoredCompletionUpdateRequestInput =
  OpenAiStoredCompletionUpdateRequest;
export type OpenAiStoredCompletionUpdateParsedRequest = z.output<
  typeof OpenAiStoredCompletionUpdateRequestSchema
>;
export type OpenAiCompletionRequest = z.input<
  typeof OpenAiCompletionRequestSchema
>;
export type OpenAiCompletionRequestInput = OpenAiCompletionRequest;
export type OpenAiCompletionParsedRequest = z.output<
  typeof OpenAiCompletionRequestSchema
>;
export type OpenAiEmbeddingRequest = z.input<
  typeof OpenAiEmbeddingRequestSchema
>;
export type OpenAiEmbeddingRequestInput = OpenAiEmbeddingRequest;
export type OpenAiEmbeddingParsedRequest = z.output<
  typeof OpenAiEmbeddingRequestSchema
>;
export type OpenAiImageEditRequest = z.input<
  typeof OpenAiImageEditRequestSchema
>;
export type OpenAiImageEditRequestInput = OpenAiImageEditRequest;
export type OpenAiImageEditParsedRequest = z.output<
  typeof OpenAiImageEditRequestSchema
>;
export type OpenAiImageGenerationRequest = z.input<
  typeof OpenAiImageGenerationRequestSchema
>;
export type OpenAiImageGenerationRequestInput = OpenAiImageGenerationRequest;
export type OpenAiImageGenerationParsedRequest = z.output<
  typeof OpenAiImageGenerationRequestSchema
>;
export type OpenAiImageVariationRequest = z.input<
  typeof OpenAiImageVariationRequestSchema
>;
export type OpenAiImageVariationRequestInput = OpenAiImageVariationRequest;
export type OpenAiImageVariationParsedRequest = z.output<
  typeof OpenAiImageVariationRequestSchema
>;
export type OpenAiSpeechRequest = z.input<typeof OpenAiSpeechRequestSchema>;
export type OpenAiSpeechRequestInput = OpenAiSpeechRequest;
export type OpenAiSpeechParsedRequest = z.output<
  typeof OpenAiSpeechRequestSchema
>;
export type OpenAiTranscribeRequest = z.input<
  typeof OpenAiTranscribeRequestSchema
>;
export type OpenAiTranscribeRequestInput = OpenAiTranscribeRequest;
export type OpenAiTranscribeParsedRequest = z.output<
  typeof OpenAiTranscribeRequestSchema
>;
export type OpenAiTranslateRequest = z.input<
  typeof OpenAiTranslateRequestSchema
>;
export type OpenAiTranslateRequestInput = OpenAiTranslateRequest;
export type OpenAiTranslateParsedRequest = z.output<
  typeof OpenAiTranslateRequestSchema
>;
export type OpenAiModerationTextInput = z.infer<
  typeof OpenAiModerationTextInputSchema
>;
export type OpenAiModerationImageUrlInput = z.infer<
  typeof OpenAiModerationImageUrlInputSchema
>;
export type OpenAiModerationMultiModalInput = z.infer<
  typeof OpenAiModerationMultiModalInputSchema
>;
export type OpenAiModerationRequest = z.input<
  typeof OpenAiModerationRequestSchema
>;
export type OpenAiModerationRequestInput = OpenAiModerationRequest;
export type OpenAiModerationParsedRequest = z.output<
  typeof OpenAiModerationRequestSchema
>;
export type OpenAiFileUploadRequest = z.input<
  typeof OpenAiFileUploadRequestSchema
>;
export type OpenAiFileUploadRequestInput = OpenAiFileUploadRequest;
export type OpenAiFileUploadParsedRequest = z.output<
  typeof OpenAiFileUploadRequestSchema
>;
export type OpenAiContainerMemoryLimit = z.infer<
  typeof OpenAiContainerMemoryLimitSchema
>;
export type OpenAiContainerNetworkPolicyDomainSecret = z.infer<
  typeof OpenAiContainerNetworkPolicyDomainSecretSchema
>;
export type OpenAiContainerNetworkPolicyDisabled = z.infer<
  typeof OpenAiContainerNetworkPolicyDisabledSchema
>;
export type OpenAiContainerNetworkPolicyAllowlist = z.infer<
  typeof OpenAiContainerNetworkPolicyAllowlistSchema
>;
export type OpenAiContainerNetworkPolicy = z.infer<
  typeof OpenAiContainerNetworkPolicySchema
>;
export type OpenAiContainerSkillReference = z.infer<
  typeof OpenAiContainerSkillReferenceSchema
>;
export type OpenAiContainerInlineSkillSource = z.infer<
  typeof OpenAiContainerInlineSkillSourceSchema
>;
export type OpenAiContainerInlineSkill = z.infer<
  typeof OpenAiContainerInlineSkillSchema
>;
export type OpenAiContainerSkill = z.infer<typeof OpenAiContainerSkillSchema>;
export type OpenAiContainerCreateRequest = z.input<
  typeof OpenAiContainerCreateRequestSchema
>;
export type OpenAiContainerCreateRequestInput = OpenAiContainerCreateRequest;
export type OpenAiContainerCreateParsedRequest = z.output<
  typeof OpenAiContainerCreateRequestSchema
>;
export type OpenAiUploadCreateRequest = z.input<
  typeof OpenAiUploadCreateRequestSchema
>;
export type OpenAiUploadCreateRequestInput = OpenAiUploadCreateRequest;
export type OpenAiUploadCreateParsedRequest = z.output<
  typeof OpenAiUploadCreateRequestSchema
>;
export type OpenAiBatchCreateRequest = z.input<
  typeof OpenAiBatchCreateRequestSchema
>;
export type OpenAiBatchCreateRequestInput = OpenAiBatchCreateRequest;
export type OpenAiBatchCreateParsedRequest = z.output<
  typeof OpenAiBatchCreateRequestSchema
>;
export type OpenAiResponseInputTextContent = z.infer<
  typeof OpenAiResponseInputTextContentSchema
>;
export type OpenAiResponseInputImageContent = z.infer<
  typeof OpenAiResponseInputImageContentSchema
>;
export type OpenAiResponseInputAudioContent = z.infer<
  typeof OpenAiResponseInputAudioContentSchema
>;
export type OpenAiResponseInputContent = z.infer<
  typeof OpenAiResponseInputContentSchema
>;
export type OpenAiResponseInputMessage = z.infer<
  typeof OpenAiResponseInputMessageSchema
>;
export type OpenAiResponseFunctionCallOutput = z.infer<
  typeof OpenAiResponseFunctionCallOutputSchema
>;
export type OpenAiResponseItemReference = z.infer<
  typeof OpenAiResponseItemReferenceSchema
>;
export type OpenAiResponseInputItem = z.infer<
  typeof OpenAiResponseInputItemSchema
>;
export type OpenAiResponseFunctionTool = z.infer<
  typeof OpenAiResponseFunctionToolSchema
>;
export type OpenAiResponseWebSearchTool = z.infer<
  typeof OpenAiResponseWebSearchToolSchema
>;
export type OpenAiResponseFileSearchTool = z.infer<
  typeof OpenAiResponseFileSearchToolSchema
>;
export type OpenAiResponseCodeInterpreterTool = z.infer<
  typeof OpenAiResponseCodeInterpreterToolSchema
>;
export type OpenAiResponseTool = z.infer<typeof OpenAiResponseToolSchema>;
export type OpenAiResponseTextFormat = z.infer<
  typeof OpenAiResponseTextFormatSchema
>;
export type OpenAiResponseReasoning = z.infer<
  typeof OpenAiResponseReasoningSchema
>;
export type OpenAiResponseRequest = z.input<typeof OpenAiResponseRequestSchema>;
export type OpenAiResponseRequestInput = OpenAiResponseRequest;
export type OpenAiResponseParsedRequest = z.output<
  typeof OpenAiResponseRequestSchema
>;
export type OpenAiResponseCompactRequest = z.input<
  typeof OpenAiResponseCompactRequestSchema
>;
export type OpenAiResponseCompactRequestInput = OpenAiResponseCompactRequest;
export type OpenAiResponseCompactParsedRequest = z.output<
  typeof OpenAiResponseCompactRequestSchema
>;
export type OpenAiResponseInputTokensRequest = z.input<
  typeof OpenAiResponseInputTokensRequestSchema
>;
export type OpenAiResponseInputTokensRequestInput =
  OpenAiResponseInputTokensRequest;
export type OpenAiResponseInputTokensParsedRequest = z.output<
  typeof OpenAiResponseInputTokensRequestSchema
>;
export type OpenAiEvalCustomDataSourceConfig = z.infer<
  typeof OpenAiEvalCustomDataSourceConfigSchema
>;
export type OpenAiEvalLogsDataSourceConfig = z.infer<
  typeof OpenAiEvalLogsDataSourceConfigSchema
>;
export type OpenAiEvalStoredCompletionsDataSourceConfig = z.infer<
  typeof OpenAiEvalStoredCompletionsDataSourceConfigSchema
>;
export type OpenAiEvalDataSourceConfig = z.infer<
  typeof OpenAiEvalDataSourceConfigSchema
>;
export type OpenAiEvalOutputTextContent = z.infer<
  typeof OpenAiEvalOutputTextContentSchema
>;
export type OpenAiEvalInputImageContent = z.infer<
  typeof OpenAiEvalInputImageContentSchema
>;
export type OpenAiEvalInputAudioContent = z.infer<
  typeof OpenAiEvalInputAudioContentSchema
>;
export type OpenAiEvalMessageContentPart = z.infer<
  typeof OpenAiEvalMessageContentPartSchema
>;
export type OpenAiEvalMessageContent = z.infer<
  typeof OpenAiEvalMessageContentSchema
>;
export type OpenAiEvalSimpleInputMessage = z.infer<
  typeof OpenAiEvalSimpleInputMessageSchema
>;
export type OpenAiEvalMessageObject = z.infer<
  typeof OpenAiEvalMessageObjectSchema
>;
export type OpenAiEvalInputMessage = z.infer<
  typeof OpenAiEvalInputMessageSchema
>;
export type OpenAiEvalLabelModelGrader = z.infer<
  typeof OpenAiEvalLabelModelGraderSchema
>;
export type OpenAiEvalStringCheckGrader = z.infer<
  typeof OpenAiEvalStringCheckGraderSchema
>;
export type OpenAiEvalTextSimilarityGrader = z.infer<
  typeof OpenAiEvalTextSimilarityGraderSchema
>;
export type OpenAiEvalPythonGrader = z.infer<
  typeof OpenAiEvalPythonGraderSchema
>;
export type OpenAiEvalScoreModelGrader = z.infer<
  typeof OpenAiEvalScoreModelGraderSchema
>;
export type OpenAiEvalGrader = z.infer<typeof OpenAiEvalGraderSchema>;
export type OpenAiEvalCreateRequest = z.input<
  typeof OpenAiEvalCreateRequestSchema
>;
export type OpenAiEvalCreateRequestInput = OpenAiEvalCreateRequest;
export type OpenAiEvalCreateParsedRequest = z.output<
  typeof OpenAiEvalCreateRequestSchema
>;
export type OpenAiConversationCreateRequest = z.input<
  typeof OpenAiConversationCreateRequestSchema
>;
export type OpenAiConversationCreateRequestInput =
  OpenAiConversationCreateRequest;
export type OpenAiConversationCreateParsedRequest = z.output<
  typeof OpenAiConversationCreateRequestSchema
>;
export type OpenAiRealtimeAudioFormat = z.infer<
  typeof OpenAiRealtimeAudioFormatSchema
>;
export type OpenAiRealtimeNoiseReduction = z.infer<
  typeof OpenAiRealtimeNoiseReductionSchema
>;
export type OpenAiRealtimeAudioTranscription = z.infer<
  typeof OpenAiRealtimeAudioTranscriptionSchema
>;
export type OpenAiRealtimeServerVad = z.infer<
  typeof OpenAiRealtimeServerVadSchema
>;
export type OpenAiRealtimeSemanticVad = z.infer<
  typeof OpenAiRealtimeSemanticVadSchema
>;
export type OpenAiRealtimeTurnDetection = z.infer<
  typeof OpenAiRealtimeTurnDetectionSchema
>;
export type OpenAiRealtimeAudioInput = z.infer<
  typeof OpenAiRealtimeAudioInputSchema
>;
export type OpenAiRealtimeVoice = z.infer<typeof OpenAiRealtimeVoiceSchema>;
export type OpenAiRealtimeAudioOutput = z.infer<
  typeof OpenAiRealtimeAudioOutputSchema
>;
export type OpenAiRealtimeAudioConfig = z.infer<
  typeof OpenAiRealtimeAudioConfigSchema
>;
export type OpenAiRealtimePrompt = z.infer<typeof OpenAiRealtimePromptSchema>;
export type OpenAiRealtimeReasoning = z.infer<
  typeof OpenAiRealtimeReasoningSchema
>;
export type OpenAiRealtimeToolChoice = z.infer<
  typeof OpenAiRealtimeToolChoiceSchema
>;
export type OpenAiRealtimeFunctionTool = z.infer<
  typeof OpenAiRealtimeFunctionToolSchema
>;
export type OpenAiRealtimeMcpTool = z.infer<typeof OpenAiRealtimeMcpToolSchema>;
export type OpenAiRealtimeTool = z.infer<typeof OpenAiRealtimeToolSchema>;
export type OpenAiRealtimeTracing = z.infer<typeof OpenAiRealtimeTracingSchema>;
export type OpenAiRealtimeTruncation = z.infer<
  typeof OpenAiRealtimeTruncationSchema
>;
export type OpenAiRealtimeSessionCreateRequest = z.input<
  typeof OpenAiRealtimeSessionCreateRequestSchema
>;
export type OpenAiRealtimeSessionCreateParsedRequest = z.output<
  typeof OpenAiRealtimeSessionCreateRequestSchema
>;
export type OpenAiRealtimeTranscriptionSessionCreateRequest = z.input<
  typeof OpenAiRealtimeTranscriptionSessionCreateRequestSchema
>;
export type OpenAiRealtimeTranscriptionSessionCreateParsedRequest = z.output<
  typeof OpenAiRealtimeTranscriptionSessionCreateRequestSchema
>;
export type OpenAiRealtimeClientSecretRequest = z.input<
  typeof OpenAiRealtimeClientSecretRequestSchema
>;
export type OpenAiRealtimeClientSecretRequestInput =
  OpenAiRealtimeClientSecretRequest;
export type OpenAiRealtimeClientSecretParsedRequest = z.output<
  typeof OpenAiRealtimeClientSecretRequestSchema
>;
export type OpenAiVectorStoreExpirationPolicy = z.infer<
  typeof OpenAiVectorStoreExpirationPolicySchema
>;
export type OpenAiVectorStoreAutoChunkingStrategy = z.infer<
  typeof OpenAiVectorStoreAutoChunkingStrategySchema
>;
export type OpenAiVectorStoreStaticChunkingStrategy = z.infer<
  typeof OpenAiVectorStoreStaticChunkingStrategySchema
>;
export type OpenAiVectorStoreChunkingStrategy = z.infer<
  typeof OpenAiVectorStoreChunkingStrategySchema
>;
export type OpenAiVectorStoreCreateRequest = z.input<
  typeof OpenAiVectorStoreCreateRequestSchema
>;
export type OpenAiVectorStoreCreateRequestInput =
  OpenAiVectorStoreCreateRequest;
export type OpenAiVectorStoreCreateParsedRequest = z.output<
  typeof OpenAiVectorStoreCreateRequestSchema
>;
export type OpenAiVectorStoreSearchComparisonFilter = z.infer<
  typeof OpenAiVectorStoreSearchComparisonFilterSchema
>;
export interface OpenAiVectorStoreSearchCompoundFilter {
  type: "and" | "or";
  filters: OpenAiVectorStoreSearchFilter[];
}
export type OpenAiVectorStoreSearchFilter =
  | OpenAiVectorStoreSearchComparisonFilter
  | OpenAiVectorStoreSearchCompoundFilter;
export type OpenAiVectorStoreSearchRankingOptions = z.infer<
  typeof OpenAiVectorStoreSearchRankingOptionsSchema
>;
export type OpenAiVectorStoreSearchRequest = z.input<
  typeof OpenAiVectorStoreSearchRequestSchema
>;
export type OpenAiVectorStoreSearchRequestInput =
  OpenAiVectorStoreSearchRequest;
export type OpenAiVectorStoreSearchParsedRequest = z.output<
  typeof OpenAiVectorStoreSearchRequestSchema
>;
export type OpenAiVectorStoreFileAttributes = z.infer<
  typeof OpenAiVectorStoreFileAttributesSchema
>;
export type OpenAiVectorStoreFileCreateRequest = z.input<
  typeof OpenAiVectorStoreFileCreateRequestSchema
>;
export type OpenAiVectorStoreFileCreateRequestInput =
  OpenAiVectorStoreFileCreateRequest;
export type OpenAiVectorStoreFileCreateParsedRequest = z.output<
  typeof OpenAiVectorStoreFileCreateRequestSchema
>;
export type OpenAiFineTuningHyperparameters = z.infer<
  typeof OpenAiFineTuningHyperparametersSchema
>;
export type OpenAiFineTuningSupervisedHyperparameters = z.infer<
  typeof OpenAiFineTuningSupervisedMethodSchema
>["hyperparameters"];
export type OpenAiFineTuningSupervisedMethod = z.infer<
  typeof OpenAiFineTuningSupervisedMethodSchema
>;
export type OpenAiFineTuningDpoHyperparameters = z.infer<
  typeof OpenAiFineTuningDpoMethodSchema
>["hyperparameters"];
export type OpenAiFineTuningDpoMethod = z.infer<
  typeof OpenAiFineTuningDpoMethodSchema
>;
export type OpenAiFineTuningReinforcementHyperparameters = z.infer<
  typeof OpenAiFineTuningReinforcementMethodSchema
>["hyperparameters"];
export type OpenAiFineTuningReinforcementMethod = z.infer<
  typeof OpenAiFineTuningReinforcementMethodSchema
>;
export type OpenAiFineTuningMethod = z.infer<
  typeof OpenAiFineTuningMethodSchema
>;
export type OpenAiFineTuningWandbConfig = z.infer<
  typeof OpenAiFineTuningWandbConfigSchema
>;
export type OpenAiFineTuningIntegration = z.infer<
  typeof OpenAiFineTuningIntegrationSchema
>;
export type OpenAiFineTuningJobCreateRequest = z.input<
  typeof OpenAiFineTuningJobCreateRequestSchema
>;
export type OpenAiFineTuningJobCreateRequestInput =
  OpenAiFineTuningJobCreateRequest;
export type OpenAiFineTuningJobCreateParsedRequest = z.output<
  typeof OpenAiFineTuningJobCreateRequestSchema
>;
export type OpenAiCheckpointPermissionCreateRequest = z.input<
  typeof OpenAiCheckpointPermissionCreateRequestSchema
>;
export type OpenAiCheckpointPermissionCreateRequestInput =
  OpenAiCheckpointPermissionCreateRequest;
export type OpenAiCheckpointPermissionCreateParsedRequest = z.output<
  typeof OpenAiCheckpointPermissionCreateRequestSchema
>;
export type OpenAiOrganizationUsageQuery = z.infer<
  typeof OpenAiOrganizationUsageQuerySchema
>;
export type OpenAiOrganizationCostsQuery = z.infer<
  typeof OpenAiOrganizationCostsQuerySchema
>;
export type OpenAiOrganizationProjectListQuery = z.infer<
  typeof OpenAiOrganizationProjectListQuerySchema
>;
export type OpenAiOrganizationProjectRateLimitListQuery = z.infer<
  typeof OpenAiOrganizationProjectRateLimitListQuerySchema
>;
export type OpenAiOptions = z.infer<typeof OpenAiOptionsSchema>;
