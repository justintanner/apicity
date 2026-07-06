import { z } from "zod";

export const XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW =
  "grok-imagine-video-1.5-preview";
export const XAI_GROK_IMAGINE_IMAGE_QUALITY = "grok-imagine-image-quality";

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const XaiMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const XaiToolFunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const XaiToolSchema = z.object({
  type: z.literal("function"),
  function: XaiToolFunctionSchema,
});

export const XaiImageReferenceSchema = z
  .object({
    url: z.string().min(1).optional(),
    image_url: z.string().min(1).optional(),
    file_id: z.string().min(1).optional(),
    type: z.enum(["image_url"]).optional(),
  })
  .refine(
    (value) =>
      value.url !== undefined ||
      value.image_url !== undefined ||
      value.file_id !== undefined,
    {
      message: "Either url, image_url, or file_id is required",
    }
  );

export const XaiVideoReferenceSchema = z
  .object({
    url: z.string().min(1).optional(),
    file_id: z.string().min(1).optional(),
  })
  .refine((value) => value.url !== undefined || value.file_id !== undefined, {
    message: "Either url or file_id is required",
  });

export const XaiVideoReferenceInputSchema = z.union([
  z.string().min(1),
  XaiVideoReferenceSchema,
]);

const XaiImagineStoragePublicUrlOptionsSchema = z.object({
  expires_after: z.number().int().min(3600).max(2592000).optional(),
});

export const XaiFilePublicUrlRequestSchema = z.object({
  expires_after: z.number().int().min(3600).max(2592000).optional(),
});

export const XaiImagineStorageOptionsSchema = z.object({
  filename: z.string().min(1),
  expires_after: z.number().int().min(3600).max(2592000).optional(),
  public_url: z
    .union([z.boolean(), XaiImagineStoragePublicUrlOptionsSchema])
    .optional(),
});

export const XaiChunkConfigurationSchema = z.object({
  chars_configuration: z
    .object({
      max_chunk_size_chars: z.number().int().positive(),
      chunk_overlap_chars: z.number().int(),
    })
    .optional(),
  tokens_configuration: z
    .object({
      max_chunk_size_tokens: z.number().int().positive(),
      chunk_overlap_tokens: z.number().int(),
      encoding_name: z.string().optional(),
    })
    .optional(),
  markdown_tokens_configuration: z
    .object({
      max_chunk_size_tokens: z.number().int().positive(),
      chunk_overlap_tokens: z.number().int(),
      encoding_name: z.string().optional(),
    })
    .optional(),
  markdown_chars_configuration: z
    .object({
      max_chunk_size_chars: z.number().int().positive(),
      chunk_overlap_chars: z.number().int(),
    })
    .optional(),
  code_tokens_configuration: z
    .object({
      max_chunk_size_tokens: z.number().int().positive(),
      chunk_overlap_tokens: z.number().int(),
      encoding_name: z.string().optional(),
    })
    .optional(),
  code_chars_configuration: z
    .object({
      max_chunk_size_chars: z.number().int().positive(),
      chunk_overlap_chars: z.number().int(),
    })
    .optional(),
  table_configuration: z
    .object({
      max_chunk_size_tokens: z.number().int().positive(),
      encoding_name: z.string().optional(),
    })
    .optional(),
  bytes_configuration: z
    .object({
      max_chunk_size_bytes: z.number().int().positive(),
      chunk_overlap_bytes: z.number().int(),
    })
    .optional(),
  strip_whitespace: z.boolean().optional(),
  inject_name_into_chunks: z.boolean().optional(),
});

export const XaiFieldDefinitionSchema = z.object({
  key: z.string().min(1),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  inject_into_chunk: z.boolean().optional(),
  description: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Chat completions
// ---------------------------------------------------------------------------

export const XaiChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(XaiMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  tools: z.array(XaiToolSchema).optional(),
  tool_choice: z
    .union([
      z.enum(["auto", "none"]),
      z.object({
        type: z.literal("function"),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
  deferred: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const XaiImageAspectRatioSchema = z.enum([
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
  "2:1",
  "1:2",
  "19.5:9",
  "9:19.5",
  "20:9",
  "9:20",
  "auto",
]);

export const XaiImageGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  n: z.number().int().min(1).max(10).optional(),
  response_format: z.enum(["url", "b64_json"]).optional(),
  aspect_ratio: XaiImageAspectRatioSchema.optional(),
  resolution: z.enum(["1k", "2k"]).optional(),
  storage_options: XaiImagineStorageOptionsSchema.optional(),
  user: z.string().optional(),
});

export const XaiImageEditRequestSchema = z
  .object({
    prompt: z.string().min(1),
    model: z.string().optional(),
    image: XaiImageReferenceSchema.optional(),
    image_file_id: z.string().min(1).optional(),
    images: z.array(XaiImageReferenceSchema).min(1).max(3).optional(),
    image_file_ids: z.array(z.string().min(1)).min(1).max(3).optional(),
    n: z.number().int().min(1).max(10).optional(),
    response_format: z.enum(["url", "b64_json"]).optional(),
    aspect_ratio: XaiImageAspectRatioSchema.optional(),
    resolution: z.enum(["1k", "2k"]).optional(),
    storage_options: XaiImagineStorageOptionsSchema.optional(),
    user: z.string().optional(),
  })
  .refine(
    (value) =>
      value.image !== undefined ||
      value.image_file_id !== undefined ||
      value.images !== undefined ||
      value.image_file_ids !== undefined,
    {
      message:
        "Either image, image_file_id, images, or image_file_ids is required",
    }
  );

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

const XaiVideoAspectRatioSchema = z.enum([
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
]);

const XaiVideoResolutionSchema = z.enum(["480p", "720p"]);

// Keep finite literal unions so exported request types and MCP schemas show
// the supported second values, not an unbounded number.
const XaiVideoGenerateDurationSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
  z.literal(13),
  z.literal(14),
  z.literal(15),
]);

const XaiVideoExtendDurationSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
]);

export const XaiVideoGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  duration: XaiVideoGenerateDurationSchema.optional(),
  aspect_ratio: XaiVideoAspectRatioSchema.optional(),
  resolution: XaiVideoResolutionSchema.optional(),
  image: XaiVideoReferenceSchema.optional(),
  image_file_id: z.string().min(1).optional(),
  video: XaiVideoReferenceSchema.optional(),
  video_file_id: z.string().min(1).optional(),
  reference_images: z.array(XaiVideoReferenceSchema).optional(),
  reference_image_file_ids: z.array(z.string().min(1)).optional(),
  storage_options: XaiImagineStorageOptionsSchema.optional(),
});

export const XaiGrokImagineVideo15ImageToVideoRequestSchema = z
  .object({
    prompt: z.string().min(1),
    model: z.literal(XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW).optional(),
    image: XaiVideoReferenceInputSchema.optional(),
    image_file_id: z.string().min(1).optional(),
    duration: XaiVideoGenerateDurationSchema.optional(),
    aspect_ratio: XaiVideoAspectRatioSchema.optional(),
    resolution: XaiVideoResolutionSchema.optional(),
    storage_options: XaiImagineStorageOptionsSchema.optional(),
    pollIntervalMs: z.number().int().min(0).optional(),
    maxPolls: z.number().int().positive().optional(),
  })
  .refine(
    (value) => value.image !== undefined || value.image_file_id !== undefined,
    {
      message: "Either image or image_file_id is required",
    }
  );

export const XaiVideoEditRequestSchema = z
  .object({
    prompt: z.string().min(1),
    model: z.string().optional(),
    video: XaiVideoReferenceSchema.optional(),
    video_file_id: z.string().min(1).optional(),
    output: z.object({ upload_url: z.string() }).optional(),
    storage_options: XaiImagineStorageOptionsSchema.optional(),
    user: z.string().optional(),
  })
  .refine(
    (value) => value.video !== undefined || value.video_file_id !== undefined,
    {
      message: "Either video or video_file_id is required",
    }
  );

export const XaiVideoExtendRequestSchema = z
  .object({
    prompt: z.string().min(1),
    model: z.string().optional(),
    duration: XaiVideoExtendDurationSchema.optional(),
    video: XaiVideoReferenceSchema.optional(),
    video_file_id: z.string().min(1).optional(),
    storage_options: XaiImagineStorageOptionsSchema.optional(),
  })
  .refine(
    (value) => value.video !== undefined || value.video_file_id !== undefined,
    {
      message: "Either video or video_file_id is required",
    }
  );

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

export const XaiBatchCreateRequestSchema = z.object({
  name: z.string().min(1),
});

export const XaiBatchAddRequestsBodySchema = z.object({
  batch_requests: z.array(
    z.object({
      batch_request_id: z.string().nullable().optional(),
      batch_request: z.object({
        chat_get_completion: z.record(z.string(), z.unknown()),
      }),
    })
  ),
});

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export const XaiCollectionCreateRequestSchema = z.object({
  collection_name: z.string().min(1),
  collection_description: z.string().optional(),
  team_id: z.string().optional(),
  index_configuration: z.object({ model_name: z.string() }).optional(),
  chunk_configuration: XaiChunkConfigurationSchema.optional(),
  metric_space: z
    .enum([
      "HNSW_METRIC_UNKNOWN",
      "HNSW_METRIC_COSINE",
      "HNSW_METRIC_EUCLIDEAN",
      "HNSW_METRIC_INNER_PRODUCT",
    ])
    .optional(),
  field_definitions: z.array(XaiFieldDefinitionSchema).optional(),
});

export const XaiCollectionUpdateRequestSchema = z.object({
  team_id: z.string().optional(),
  collection_name: z.string().optional(),
  collection_description: z.string().optional(),
  chunk_configuration: XaiChunkConfigurationSchema.optional(),
  field_definition_updates: z
    .array(
      z.object({
        field_definition: XaiFieldDefinitionSchema,
        operation: z.enum(["FIELD_DEFINITION_ADD", "FIELD_DEFINITION_DELETE"]),
      })
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const XaiDocumentAddRequestSchema = z.object({
  team_id: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
});

export const XaiDocumentSearchRequestSchema = z.object({
  query: z.string().min(1),
  source: z.object({
    collection_ids: z.array(z.string()),
    rag_pipeline: z.enum(["chroma_db", "es"]).optional(),
  }),
  filter: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  limit: z.number().int().positive().nullable().optional(),
  ranking_metric: z
    .enum([
      "RANKING_METRIC_UNKNOWN",
      "RANKING_METRIC_L2_DISTANCE",
      "RANKING_METRIC_COSINE_SIMILARITY",
    ])
    .optional(),
  group_by: z
    .object({
      keys: z.array(z.string()),
      aggregate: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  retrieval_mode: z
    .object({
      type: z.enum(["hybrid", "keyword", "semantic"]),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Responses API
// ---------------------------------------------------------------------------

export const XaiResponseInputTextContentSchema = z.object({
  type: z.literal("input_text"),
  text: z.string(),
});

export const XaiResponseInputImageContentSchema = z.object({
  type: z.literal("input_image"),
  image_url: z.string().optional(),
  file_id: z.string().optional(),
  detail: z.enum(["auto", "low", "high"]).optional(),
});

export const XaiResponseInputContentSchema = z.discriminatedUnion("type", [
  XaiResponseInputTextContentSchema,
  XaiResponseInputImageContentSchema,
]);

export const XaiResponseInputMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "developer"]),
  content: z.union([z.string(), z.array(XaiResponseInputContentSchema)]),
});

export const XaiResponseFunctionCallOutputSchema = z.object({
  type: z.literal("function_call_output"),
  call_id: z.string(),
  output: z.string(),
});

export const XaiResponseItemReferenceSchema = z.object({
  type: z.literal("item_reference"),
  id: z.string(),
});

export const XaiResponseFunctionToolSchema = z.object({
  type: z.literal("function"),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  strict: z.boolean().optional(),
});

export const XaiResponseWebSearchToolSchema = z.object({
  type: z.enum(["web_search", "web_search_preview"]),
  filters: z
    .object({
      allowed_domains: z.array(z.string()).optional(),
      excluded_domains: z.array(z.string()).optional(),
    })
    .optional(),
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

export const XaiResponseFileSearchToolSchema = z.object({
  type: z.literal("file_search"),
  vector_store_ids: z.array(z.string()),
  max_num_results: z.number().int().positive().optional(),
});

export const XaiResponseToolSchema = z.discriminatedUnion("type", [
  XaiResponseFunctionToolSchema,
  XaiResponseFileSearchToolSchema,
  XaiResponseWebSearchToolSchema.extend({
    type: z.literal("web_search"),
  }),
  XaiResponseWebSearchToolSchema.extend({
    type: z.literal("web_search_preview"),
  }),
]);

export const XaiResponseTextFormatSchema = z.object({
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

export const XaiResponseReasoningSchema = z.object({
  effort: z.enum(["low", "medium", "high"]).optional(),
  summary: z.enum(["auto", "concise", "detailed"]).optional(),
});

export const XaiResponseSearchParametersSchema = z.object({
  mode: z.enum(["off", "on", "auto"]).optional(),
  max_search_results: z.number().int().positive().optional(),
  return_citations: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

export const XaiResponseRequestSchema = z.object({
  model: z.string(),
  input: z.union([
    z.string(),
    z.array(
      z.union([
        XaiResponseInputMessageSchema,
        XaiResponseFunctionCallOutputSchema,
        XaiResponseItemReferenceSchema,
      ])
    ),
  ]),
  instructions: z.string().optional(),
  previous_response_id: z.string().optional(),
  max_output_tokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  tools: z.array(XaiResponseToolSchema).optional(),
  tool_choice: z
    .union([
      z.enum(["auto", "none", "required"]),
      z.object({
        type: z.literal("function"),
        name: z.string(),
      }),
    ])
    .optional(),
  store: z.boolean().optional(),
  stream: z.boolean().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  text: XaiResponseTextFormatSchema.optional(),
  reasoning: XaiResponseReasoningSchema.optional(),
  search_parameters: XaiResponseSearchParametersSchema.optional(),
  prompt_cache_key: z.string().optional(),
  parallel_tool_calls: z.boolean().optional(),
  include: z.array(z.string()).optional(),
  user: z.string().optional(),
});

// Responses API — compaction. Compacts a full input window into a shorter
// canonical window. The request mirrors the `/v1/responses` `input` shape but
// accepts only `model` + `input` (no instructions, tools, sampling, etc.).
export const XaiResponseCompactRequestSchema = z.object({
  model: z.string(),
  input: z.union([
    z.string(),
    z.array(
      z.union([
        XaiResponseInputMessageSchema,
        XaiResponseFunctionCallOutputSchema,
        XaiResponseItemReferenceSchema,
      ])
    ),
  ]),
});

// ---------------------------------------------------------------------------
// Tokenize text
// ---------------------------------------------------------------------------

export const XaiTokenizeTextRequestSchema = z.object({
  model: z.string().min(1),
  text: z.string().min(1),
  user: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Voice (TTS / STT / Custom Voices)
// ---------------------------------------------------------------------------

export const XaiTtsRequestSchema = z.object({
  text: z.string().min(1),
  voice_id: z.string(),
  language: z.string().optional(),
});

export const XaiSttRequestSchema = z.object({
  file: z.instanceof(Blob),
  filename: z.string().optional(),
  language: z.string().optional(),
});

export const XaiCustomVoiceCreateRequestSchema = z.object({
  file: z.instanceof(Blob),
  name: z.string().min(1).optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  gender: z.enum(["male", "female", "neutral"]).optional(),
  accent: z.string().optional(),
  age: z.enum(["young", "middle-aged", "old"]).optional(),
  use_case: z
    .enum([
      "conversational",
      "narration",
      "characters",
      "educational",
      "advertisement",
      "social_media",
      "entertainment",
    ])
    .optional(),
  tone: z
    .enum([
      "warm",
      "casual",
      "professional",
      "friendly",
      "authoritative",
      "expressive",
      "calm",
    ])
    .optional(),
  filename: z.string().optional(),
});

export const XaiCustomVoiceListParamsSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional(),
  pagination_token: z.string().optional(),
});

export const XaiCustomVoiceUpdateRequestSchema = z.object({
  name: z.string().min(1).nullable().optional(),
  description: z.string().min(1).nullable().optional(),
  gender: z.enum(["male", "female", "neutral"]).nullable().optional(),
  accent: z.string().min(1).nullable().optional(),
  age: z.enum(["young", "middle-aged", "old"]).nullable().optional(),
  language: z.string().min(1).nullable().optional(),
  use_case: z
    .enum([
      "conversational",
      "narration",
      "characters",
      "educational",
      "advertisement",
      "social_media",
      "entertainment",
    ])
    .nullable()
    .optional(),
  tone: z
    .enum([
      "warm",
      "casual",
      "professional",
      "friendly",
      "authoritative",
      "expressive",
      "calm",
    ])
    .nullable()
    .optional(),
});

export const XaiRealtimeClientSecretRequestSchema = z.object({
  expires_after: z
    .object({
      seconds: z.number().int().min(1).max(3600),
    })
    .optional(),
  session: z.record(z.string(), z.unknown()).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Management billing
// ---------------------------------------------------------------------------

export const XaiBillingUsageAggregationSchema = z.enum([
  "AGGREGATION_NONE",
  "AGGREGATION_SUM",
  "AGGREGATION_AVG",
  "AGGREGATION_VAR",
  "AGGREGATION_STD",
  "AGGREGATION_MIN",
  "AGGREGATION_MAX",
  "AGGREGATION_P50",
  "AGGREGATION_P90",
  "AGGREGATION_P99",
  "AGGREGATION_P999",
  "AGGREGATION_COUNT",
  "AGGREGATION_COUNT_DISTINCT",
]);

export const XaiBillingUsageTimeUnitSchema = z.enum([
  "TIME_UNIT_INVALID",
  "TIME_UNIT_MONTH",
  "TIME_UNIT_CALENDAR_WEEK",
  "TIME_UNIT_DAY",
  "TIME_UNIT_HOUR",
  "TIME_UNIT_QUARTER_HOUR",
  "TIME_UNIT_MINUTE",
  "TIME_UNIT_SECOND",
  "TIME_UNIT_NONE",
]);

export const XaiBillingUsageRequestSchema = z.object({
  analyticsRequest: z.object({
    timeRange: z.object({
      startTime: z.string(),
      endTime: z.string(),
      timezone: z.string(),
    }),
    timeUnit: XaiBillingUsageTimeUnitSchema.optional(),
    values: z.array(
      z.object({
        name: z.string().min(1),
        aggregation: XaiBillingUsageAggregationSchema,
      })
    ),
    groupBy: z.array(z.string()).optional(),
    filters: z.array(z.string()).optional(),
  }),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const XaiOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  managementApiKey: z.string().optional(),
  managementBaseURL: z.string().url().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
  paygate: z.custom<import("./paygate").PayGateConfig>().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type XaiOptions = z.infer<typeof XaiOptionsSchema>;
export type XaiMessage = z.infer<typeof XaiMessageSchema>;
export type XaiToolFunction = z.infer<typeof XaiToolFunctionSchema>;
export type XaiTool = z.infer<typeof XaiToolSchema>;
export type XaiImageReference = z.infer<typeof XaiImageReferenceSchema>;
export type XaiVideoReference = z.infer<typeof XaiVideoReferenceSchema>;
export type XaiVideoReferenceInput = z.infer<
  typeof XaiVideoReferenceInputSchema
>;
export type XaiImagineStorageOptions = z.infer<
  typeof XaiImagineStorageOptionsSchema
>;
export type XaiFilePublicUrlRequest = z.input<
  typeof XaiFilePublicUrlRequestSchema
>;
export type XaiFilePublicUrlRequestInput = XaiFilePublicUrlRequest;
export type XaiFilePublicUrlParsedRequest = z.output<
  typeof XaiFilePublicUrlRequestSchema
>;
export type XaiChunkConfiguration = z.infer<typeof XaiChunkConfigurationSchema>;
export type XaiFieldDefinition = z.infer<typeof XaiFieldDefinitionSchema>;
export type XaiChatRequest = z.input<typeof XaiChatRequestSchema>;
export type XaiChatRequestInput = XaiChatRequest;
export type XaiChatParsedRequest = z.output<typeof XaiChatRequestSchema>;
export type XaiImageGenerateRequest = z.input<
  typeof XaiImageGenerateRequestSchema
>;
export type XaiImageGenerateRequestInput = XaiImageGenerateRequest;
export type XaiImageGenerateParsedRequest = z.output<
  typeof XaiImageGenerateRequestSchema
>;
export type XaiImageEditRequest = z.input<typeof XaiImageEditRequestSchema>;
export type XaiImageEditRequestInput = XaiImageEditRequest;
export type XaiImageEditParsedRequest = z.output<
  typeof XaiImageEditRequestSchema
>;
export type XaiVideoGenerateRequest = z.input<
  typeof XaiVideoGenerateRequestSchema
>;
export type XaiVideoGenerateRequestInput = XaiVideoGenerateRequest;
export type XaiVideoGenerateParsedRequest = z.output<
  typeof XaiVideoGenerateRequestSchema
>;
export type XaiGrokImagineVideo15ImageToVideoRequest = z.input<
  typeof XaiGrokImagineVideo15ImageToVideoRequestSchema
>;
export type XaiGrokImagineVideo15ImageToVideoRequestInput =
  XaiGrokImagineVideo15ImageToVideoRequest;
export type XaiGrokImagineVideo15ImageToVideoParsedRequest = z.output<
  typeof XaiGrokImagineVideo15ImageToVideoRequestSchema
>;
export type XaiVideoEditRequest = z.input<typeof XaiVideoEditRequestSchema>;
export type XaiVideoEditRequestInput = XaiVideoEditRequest;
export type XaiVideoEditParsedRequest = z.output<
  typeof XaiVideoEditRequestSchema
>;
export type XaiVideoExtendRequest = z.input<typeof XaiVideoExtendRequestSchema>;
export type XaiVideoExtendRequestInput = XaiVideoExtendRequest;
export type XaiVideoExtendParsedRequest = z.output<
  typeof XaiVideoExtendRequestSchema
>;
export type XaiBatchCreateRequest = z.input<typeof XaiBatchCreateRequestSchema>;
export type XaiBatchCreateRequestInput = XaiBatchCreateRequest;
export type XaiBatchCreateParsedRequest = z.output<
  typeof XaiBatchCreateRequestSchema
>;
export type XaiBatchAddRequestsBody = z.infer<
  typeof XaiBatchAddRequestsBodySchema
>;
export type XaiCollectionCreateRequest = z.input<
  typeof XaiCollectionCreateRequestSchema
>;
export type XaiCollectionCreateRequestInput = XaiCollectionCreateRequest;
export type XaiCollectionCreateParsedRequest = z.output<
  typeof XaiCollectionCreateRequestSchema
>;
export type XaiCollectionUpdateRequest = z.input<
  typeof XaiCollectionUpdateRequestSchema
>;
export type XaiCollectionUpdateRequestInput = XaiCollectionUpdateRequest;
export type XaiCollectionUpdateParsedRequest = z.output<
  typeof XaiCollectionUpdateRequestSchema
>;
export type XaiDocumentAddRequest = z.input<typeof XaiDocumentAddRequestSchema>;
export type XaiDocumentAddRequestInput = XaiDocumentAddRequest;
export type XaiDocumentAddParsedRequest = z.output<
  typeof XaiDocumentAddRequestSchema
>;
export type XaiDocumentSearchRequest = z.input<
  typeof XaiDocumentSearchRequestSchema
>;
export type XaiDocumentSearchRequestInput = XaiDocumentSearchRequest;
export type XaiDocumentSearchParsedRequest = z.output<
  typeof XaiDocumentSearchRequestSchema
>;
export type XaiResponseInputTextContent = z.infer<
  typeof XaiResponseInputTextContentSchema
>;
export type XaiResponseInputImageContent = z.infer<
  typeof XaiResponseInputImageContentSchema
>;
export type XaiResponseInputContent = z.infer<
  typeof XaiResponseInputContentSchema
>;
export type XaiResponseInputMessage = z.infer<
  typeof XaiResponseInputMessageSchema
>;
export type XaiResponseFunctionCallOutput = z.infer<
  typeof XaiResponseFunctionCallOutputSchema
>;
export type XaiResponseItemReference = z.infer<
  typeof XaiResponseItemReferenceSchema
>;
export type XaiResponseInputItem =
  | XaiResponseInputMessage
  | XaiResponseFunctionCallOutput
  | XaiResponseItemReference;
export type XaiResponseFunctionTool = z.infer<
  typeof XaiResponseFunctionToolSchema
>;
export type XaiResponseWebSearchTool = z.infer<
  typeof XaiResponseWebSearchToolSchema
>;
export type XaiResponseFileSearchTool = z.infer<
  typeof XaiResponseFileSearchToolSchema
>;
export type XaiResponseTool = z.infer<typeof XaiResponseToolSchema>;
export type XaiResponseTextFormat = z.infer<typeof XaiResponseTextFormatSchema>;
export type XaiResponseReasoning = z.infer<typeof XaiResponseReasoningSchema>;
export type XaiResponseSearchParameters = z.infer<
  typeof XaiResponseSearchParametersSchema
>;
export type XaiResponseRequest = z.input<typeof XaiResponseRequestSchema>;
export type XaiResponseRequestInput = XaiResponseRequest;
export type XaiResponseParsedRequest = z.output<
  typeof XaiResponseRequestSchema
>;
export type XaiResponseCompactRequest = z.input<
  typeof XaiResponseCompactRequestSchema
>;
export type XaiResponseCompactRequestInput = XaiResponseCompactRequest;
export type XaiResponseCompactParsedRequest = z.output<
  typeof XaiResponseCompactRequestSchema
>;
export type XaiTokenizeTextRequest = z.input<
  typeof XaiTokenizeTextRequestSchema
>;
export type XaiTokenizeTextRequestInput = XaiTokenizeTextRequest;
export type XaiTokenizeTextParsedRequest = z.output<
  typeof XaiTokenizeTextRequestSchema
>;
export type XaiRealtimeClientSecretRequest = z.input<
  typeof XaiRealtimeClientSecretRequestSchema
>;
export type XaiRealtimeClientSecretRequestInput =
  XaiRealtimeClientSecretRequest;
export type XaiRealtimeClientSecretParsedRequest = z.output<
  typeof XaiRealtimeClientSecretRequestSchema
>;
export type XaiTtsRequest = z.input<typeof XaiTtsRequestSchema>;
export type XaiTtsRequestInput = XaiTtsRequest;
export type XaiTtsParsedRequest = z.output<typeof XaiTtsRequestSchema>;
export type XaiSttRequest = z.input<typeof XaiSttRequestSchema>;
export type XaiSttRequestInput = XaiSttRequest;
export type XaiSttParsedRequest = z.output<typeof XaiSttRequestSchema>;
export type XaiCustomVoiceCreateRequest = z.input<
  typeof XaiCustomVoiceCreateRequestSchema
>;
export type XaiCustomVoiceCreateRequestInput = XaiCustomVoiceCreateRequest;
export type XaiCustomVoiceCreateParsedRequest = z.output<
  typeof XaiCustomVoiceCreateRequestSchema
>;
export type XaiCustomVoiceListParams = z.input<
  typeof XaiCustomVoiceListParamsSchema
>;
export type XaiCustomVoiceUpdateRequest = z.input<
  typeof XaiCustomVoiceUpdateRequestSchema
>;
export type XaiCustomVoiceUpdateRequestInput = XaiCustomVoiceUpdateRequest;
export type XaiCustomVoiceUpdateParsedRequest = z.output<
  typeof XaiCustomVoiceUpdateRequestSchema
>;
export type XaiBillingUsageRequest = z.input<
  typeof XaiBillingUsageRequestSchema
>;
export type XaiBillingUsageRequestInput = XaiBillingUsageRequest;
export type XaiBillingUsageParsedRequest = z.output<
  typeof XaiBillingUsageRequestSchema
>;
