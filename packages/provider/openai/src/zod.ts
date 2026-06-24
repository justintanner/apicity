import { z } from "zod";

export { z };

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const OpenAiTextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const OpenAiImageUrlPartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["auto", "low", "high"]).optional(),
  }),
});

export const OpenAiContentPartSchema = z.discriminatedUnion("type", [
  OpenAiTextPartSchema,
  OpenAiImageUrlPartSchema,
]);

export const OpenAiMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(OpenAiContentPartSchema)]),
});

export const OpenAiToolFunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const OpenAiToolSchema = z.object({
  type: z.literal("function"),
  function: OpenAiToolFunctionSchema,
});

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
  tool_choice: z
    .union([
      z.enum(["auto", "none"]),
      z.object({
        type: z.literal("function"),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
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
