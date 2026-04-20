import { z } from "zod";

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

export const XaiImageReferenceSchema = z.object({
  url: z.string(),
  type: z.enum(["image_url"]).optional(),
});

export const XaiVideoReferenceSchema = z.object({
  url: z.string(),
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
  n: z.number().int().min(1).optional(),
  response_format: z.enum(["url", "b64_json"]).optional(),
  aspect_ratio: XaiImageAspectRatioSchema.optional(),
  resolution: z.enum(["1k", "2k"]).optional(),
});

export const XaiImageEditRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  image: XaiImageReferenceSchema.optional(),
  images: z.array(XaiImageReferenceSchema).optional(),
  n: z.number().int().min(1).optional(),
  response_format: z.enum(["url", "b64_json"]).optional(),
  aspect_ratio: XaiImageAspectRatioSchema.optional(),
});

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export const XaiVideoGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  duration: z.number().optional(),
  aspect_ratio: z
    .enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"])
    .optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  image: XaiVideoReferenceSchema.optional(),
  video: XaiVideoReferenceSchema.optional(),
  reference_images: z.array(XaiVideoReferenceSchema).optional(),
});

export const XaiVideoEditRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  video: XaiVideoReferenceSchema,
  output: z.object({ upload_url: z.string() }).optional(),
  user: z.string().optional(),
});

export const XaiVideoExtendRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  duration: z.number().optional(),
  video: XaiVideoReferenceSchema,
});

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

export const XaiRealtimeClientSecretRequestSchema = z.object({
  expires_after: z
    .object({
      seconds: z.number().int().min(1).max(3600),
    })
    .optional(),
  session: z.record(z.string(), z.unknown()).nullable().optional(),
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
export type XaiChunkConfiguration = z.infer<typeof XaiChunkConfigurationSchema>;
export type XaiFieldDefinition = z.infer<typeof XaiFieldDefinitionSchema>;
export type XaiChatRequest = z.infer<typeof XaiChatRequestSchema>;
export type XaiImageGenerateRequest = z.infer<
  typeof XaiImageGenerateRequestSchema
>;
export type XaiImageEditRequest = z.infer<typeof XaiImageEditRequestSchema>;
export type XaiVideoGenerateRequest = z.infer<
  typeof XaiVideoGenerateRequestSchema
>;
export type XaiVideoEditRequest = z.infer<typeof XaiVideoEditRequestSchema>;
export type XaiVideoExtendRequest = z.infer<typeof XaiVideoExtendRequestSchema>;
export type XaiBatchCreateRequest = z.infer<typeof XaiBatchCreateRequestSchema>;
export type XaiBatchAddRequestsBody = z.infer<
  typeof XaiBatchAddRequestsBodySchema
>;
export type XaiCollectionCreateRequest = z.infer<
  typeof XaiCollectionCreateRequestSchema
>;
export type XaiCollectionUpdateRequest = z.infer<
  typeof XaiCollectionUpdateRequestSchema
>;
export type XaiDocumentAddRequest = z.infer<typeof XaiDocumentAddRequestSchema>;
export type XaiDocumentSearchRequest = z.infer<
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
export type XaiResponseRequest = z.infer<typeof XaiResponseRequestSchema>;
export type XaiTokenizeTextRequest = z.infer<
  typeof XaiTokenizeTextRequestSchema
>;
export type XaiRealtimeClientSecretRequest = z.infer<
  typeof XaiRealtimeClientSecretRequestSchema
>;
