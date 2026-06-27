import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const AnthropicCacheControlSchema = z.object({
  type: z.literal("ephemeral"),
  ttl: z.enum(["5m", "1h"]).optional(),
});

export const AnthropicTextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  cache_control: AnthropicCacheControlSchema.optional(),
});

export const AnthropicImageSourceSchema = z.object({
  type: z.literal("base64"),
  media_type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  data: z.string(),
});

export const AnthropicImageBlockSchema = z.object({
  type: z.literal("image"),
  source: AnthropicImageSourceSchema,
  cache_control: AnthropicCacheControlSchema.optional(),
});

export const AnthropicDocumentSourceSchema = z.object({
  type: z.literal("base64"),
  media_type: z.literal("application/pdf"),
  data: z.string(),
});

export const AnthropicDocumentBlockSchema = z.object({
  type: z.literal("document"),
  source: AnthropicDocumentSourceSchema,
  cache_control: AnthropicCacheControlSchema.optional(),
});

export const AnthropicToolUseBlockSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

export const AnthropicToolResultBlockSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  content: z
    .union([z.string(), z.array(z.lazy(() => AnthropicContentBlockSchema))])
    .optional(),
  is_error: z.boolean().optional(),
});

export const AnthropicThinkingBlockSchema = z.object({
  type: z.literal("thinking"),
  thinking: z.string(),
  signature: z.string(),
});

export const AnthropicRedactedThinkingBlockSchema = z.object({
  type: z.literal("redacted_thinking"),
  data: z.string(),
});

export const AnthropicServerToolUseBlockSchema = z.object({
  type: z.literal("server_tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

export const AnthropicServerToolResultBlockSchema = z.object({
  type: z.literal("server_tool_result"),
  tool_use_id: z.string(),
  content: z.array(z.lazy(() => AnthropicContentBlockSchema)),
});

export const AnthropicFileBlockSchema = z.object({
  type: z.literal("file"),
  source: z.object({
    type: z.literal("file"),
    file_id: z.string(),
  }),
});

export const AnthropicContentBlockSchema: z.ZodType = z.discriminatedUnion(
  "type",
  [
    AnthropicTextBlockSchema,
    AnthropicImageBlockSchema,
    AnthropicDocumentBlockSchema,
    AnthropicToolUseBlockSchema,
    AnthropicToolResultBlockSchema,
    AnthropicThinkingBlockSchema,
    AnthropicRedactedThinkingBlockSchema,
    AnthropicServerToolUseBlockSchema,
    AnthropicServerToolResultBlockSchema,
    AnthropicFileBlockSchema,
  ]
);

export const AnthropicMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(AnthropicContentBlockSchema)]),
});

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------

export const AnthropicToolInputSchemaSchema = z.object({
  type: z.literal("object"),
  properties: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
});

export const AnthropicCustomToolSchema = z.object({
  type: z.literal("custom").optional(),
  name: z.string(),
  description: z.string().optional(),
  input_schema: AnthropicToolInputSchemaSchema,
  cache_control: z.object({ type: z.literal("ephemeral") }).optional(),
});

export const AnthropicBashToolSchema = z.object({
  type: z.literal("bash_20250124"),
  name: z.literal("bash").optional(),
  cache_control: z.object({ type: z.literal("ephemeral") }).optional(),
});

export const AnthropicTextEditorToolSchema = z.object({
  type: z.literal("text_editor_20250124"),
  name: z.literal("str_replace_editor").optional(),
  cache_control: z.object({ type: z.literal("ephemeral") }).optional(),
});

export const AnthropicWebSearchToolSchema = z.object({
  type: z.literal("web_search_20250305"),
  name: z.literal("web_search").optional(),
  max_uses: z.number().optional(),
  allowed_domains: z.array(z.string()).optional(),
  blocked_domains: z.array(z.string()).optional(),
  user_location: z
    .object({
      type: z.literal("approximate"),
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  cache_control: z.object({ type: z.literal("ephemeral") }).optional(),
});

export const AnthropicCodeExecutionToolSchema = z.object({
  type: z.literal("code_execution_20250522"),
  name: z.literal("code_execution").optional(),
  cache_control: z.object({ type: z.literal("ephemeral") }).optional(),
});

export const AnthropicToolSchema = z.union([
  AnthropicCustomToolSchema,
  AnthropicBashToolSchema,
  AnthropicTextEditorToolSchema,
  AnthropicWebSearchToolSchema,
  AnthropicCodeExecutionToolSchema,
]);

export const AnthropicToolChoiceSchema = z.object({
  type: z.enum(["auto", "any", "tool", "none"]),
  name: z.string().optional(),
  disable_parallel_tool_use: z.boolean().optional(),
});

export const AnthropicThinkingConfigSchema = z.object({
  type: z.enum(["enabled", "disabled", "adaptive"]),
  budget_tokens: z.number().optional(),
  display: z.enum(["summarized", "omitted"]).optional(),
});

export const AnthropicMetadataSchema = z.object({
  user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Messages API request
// ---------------------------------------------------------------------------

export const AnthropicMessageRequestSchema = z.object({
  model: z.string(),
  max_tokens: z.number(),
  messages: z.array(AnthropicMessageSchema),
  system: z.union([z.string(), z.array(AnthropicTextBlockSchema)]).optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  metadata: AnthropicMetadataSchema.optional(),
  tools: z.array(AnthropicToolSchema).optional(),
  tool_choice: AnthropicToolChoiceSchema.optional(),
  thinking: AnthropicThinkingConfigSchema.optional(),
  service_tier: z.enum(["auto", "standard_only"]).optional(),
  container: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Count tokens request
// ---------------------------------------------------------------------------

export const AnthropicCountTokensRequestSchema = z.object({
  model: z.string(),
  messages: z.array(AnthropicMessageSchema),
  system: z.union([z.string(), z.array(AnthropicTextBlockSchema)]).optional(),
  tools: z.array(AnthropicToolSchema).optional(),
  tool_choice: AnthropicToolChoiceSchema.optional(),
  thinking: AnthropicThinkingConfigSchema.optional(),
});

// ---------------------------------------------------------------------------
// Batch create request
// ---------------------------------------------------------------------------

export const AnthropicBatchRequestSchema = z.object({
  custom_id: z.string(),
  params: AnthropicMessageRequestSchema,
});

export const AnthropicBatchCreateRequestSchema = z.object({
  requests: z.array(AnthropicBatchRequestSchema),
});

// ---------------------------------------------------------------------------
// Files upload (multipart — file is a Blob at runtime)
// ---------------------------------------------------------------------------

const blobSchema = z.instanceof(Blob);

export const AnthropicFileUploadRequestSchema = z.object({
  file: blobSchema,
});

// ---------------------------------------------------------------------------
// Skills create
// ---------------------------------------------------------------------------

export const AnthropicSkillFileSchema = z.object({
  data: blobSchema,
  path: z.string(),
});

export const AnthropicSkillsCreateRequestSchema = z.object({
  display_title: z.string(),
  files: z.array(AnthropicSkillFileSchema),
});

// ---------------------------------------------------------------------------
// Skill versions create
// ---------------------------------------------------------------------------

export const AnthropicSkillVersionsCreateRequestSchema = z.object({
  files: z.array(AnthropicSkillFileSchema),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const AnthropicOptionsSchema = z.object({
  apiKey: z.string().min(1),
  // OAuth access token (sk-ant-oat...) for subscription-scoped endpoints such
  // as /api/oauth/usage. Falls back to `apiKey` when omitted.
  oauthToken: z.string().optional(),
  baseURL: z.string().url().optional(),
  timeout: z.number().int().positive().optional(),
  defaultVersion: z.string().optional(),
  defaultBeta: z.array(z.string()).optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type AnthropicCacheControl = z.infer<typeof AnthropicCacheControlSchema>;
export type AnthropicTextBlock = z.infer<typeof AnthropicTextBlockSchema>;
export type AnthropicImageSource = z.infer<typeof AnthropicImageSourceSchema>;
export type AnthropicImageBlock = z.infer<typeof AnthropicImageBlockSchema>;
export type AnthropicDocumentSource = z.infer<
  typeof AnthropicDocumentSourceSchema
>;
export type AnthropicDocumentBlock = z.infer<
  typeof AnthropicDocumentBlockSchema
>;
export type AnthropicToolUseBlock = z.infer<typeof AnthropicToolUseBlockSchema>;
export type AnthropicToolResultBlock = z.infer<
  typeof AnthropicToolResultBlockSchema
>;
export type AnthropicThinkingBlock = z.infer<
  typeof AnthropicThinkingBlockSchema
>;
export type AnthropicRedactedThinkingBlock = z.infer<
  typeof AnthropicRedactedThinkingBlockSchema
>;
export type AnthropicServerToolUseBlock = z.infer<
  typeof AnthropicServerToolUseBlockSchema
>;
export type AnthropicServerToolResultBlock = z.infer<
  typeof AnthropicServerToolResultBlockSchema
>;
export type AnthropicFileBlock = z.infer<typeof AnthropicFileBlockSchema>;
export type AnthropicContentBlock = z.infer<typeof AnthropicContentBlockSchema>;
export type AnthropicMessage = z.infer<typeof AnthropicMessageSchema>;
export type AnthropicToolInputSchema = z.infer<
  typeof AnthropicToolInputSchemaSchema
>;
export type AnthropicCustomTool = z.infer<typeof AnthropicCustomToolSchema>;
export type AnthropicBashTool = z.infer<typeof AnthropicBashToolSchema>;
export type AnthropicTextEditorTool = z.infer<
  typeof AnthropicTextEditorToolSchema
>;
export type AnthropicWebSearchTool = z.infer<
  typeof AnthropicWebSearchToolSchema
>;
export type AnthropicCodeExecutionTool = z.infer<
  typeof AnthropicCodeExecutionToolSchema
>;
export type AnthropicTool = z.infer<typeof AnthropicToolSchema>;
export type AnthropicToolChoice = z.infer<typeof AnthropicToolChoiceSchema>;
export type AnthropicThinkingConfig = z.infer<
  typeof AnthropicThinkingConfigSchema
>;
export type AnthropicMetadata = z.infer<typeof AnthropicMetadataSchema>;
export type AnthropicMessageRequest = z.input<
  typeof AnthropicMessageRequestSchema
>;
export type AnthropicMessageRequestInput = AnthropicMessageRequest;
export type AnthropicMessageParsedRequest = z.output<
  typeof AnthropicMessageRequestSchema
>;
export type AnthropicCountTokensRequest = z.input<
  typeof AnthropicCountTokensRequestSchema
>;
export type AnthropicCountTokensRequestInput = AnthropicCountTokensRequest;
export type AnthropicCountTokensParsedRequest = z.output<
  typeof AnthropicCountTokensRequestSchema
>;
export type AnthropicBatchRequest = z.input<typeof AnthropicBatchRequestSchema>;
export type AnthropicBatchRequestInput = AnthropicBatchRequest;
export type AnthropicBatchParsedRequest = z.output<
  typeof AnthropicBatchRequestSchema
>;
export type AnthropicBatchCreateRequest = z.input<
  typeof AnthropicBatchCreateRequestSchema
>;
export type AnthropicBatchCreateRequestInput = AnthropicBatchCreateRequest;
export type AnthropicBatchCreateParsedRequest = z.output<
  typeof AnthropicBatchCreateRequestSchema
>;
export type AnthropicFileUploadRequest = z.input<
  typeof AnthropicFileUploadRequestSchema
>;
export type AnthropicFileUploadRequestInput = AnthropicFileUploadRequest;
export type AnthropicFileUploadParsedRequest = z.output<
  typeof AnthropicFileUploadRequestSchema
>;
export type AnthropicSkillFile = z.infer<typeof AnthropicSkillFileSchema>;
export type AnthropicSkillsCreateRequest = z.input<
  typeof AnthropicSkillsCreateRequestSchema
>;
export type AnthropicSkillsCreateRequestInput = AnthropicSkillsCreateRequest;
export type AnthropicSkillsCreateParsedRequest = z.output<
  typeof AnthropicSkillsCreateRequestSchema
>;
export type AnthropicSkillVersionsCreateRequest = z.input<
  typeof AnthropicSkillVersionsCreateRequestSchema
>;
export type AnthropicSkillVersionsCreateRequestInput =
  AnthropicSkillVersionsCreateRequest;
export type AnthropicSkillVersionsCreateParsedRequest = z.output<
  typeof AnthropicSkillVersionsCreateRequestSchema
>;
export type AnthropicOptions = z.infer<typeof AnthropicOptionsSchema>;
