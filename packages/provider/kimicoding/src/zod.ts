import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const Base64ImageSourceSchema = z.object({
  type: z.literal("base64"),
  media_type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  data: z.string(),
});

export const UrlImageSourceSchema = z.object({
  type: z.literal("url"),
  url: z.string(),
});

export const ImageSourceSchema = z.discriminatedUnion("type", [
  Base64ImageSourceSchema,
  UrlImageSourceSchema,
]);

export const TextContentBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

export const ImageContentBlockSchema = z.object({
  type: z.literal("image"),
  source: ImageSourceSchema,
});

export const ToolUseContentBlockSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

export const ToolResultContentBlockSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  content: z.union([
    z.string(),
    z.array(z.union([TextContentBlockSchema, ImageContentBlockSchema])),
  ]),
  is_error: z.boolean().optional(),
});

export const ContentBlockSchema = z.discriminatedUnion("type", [
  TextContentBlockSchema,
  ImageContentBlockSchema,
  ToolUseContentBlockSchema,
  ToolResultContentBlockSchema,
]);

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(ContentBlockSchema)]),
});

// ---------------------------------------------------------------------------
// Chat / Messages
// ---------------------------------------------------------------------------

export const SystemPromptSchema = z.union([
  z.string(),
  z.array(TextContentBlockSchema),
]);

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  input_schema: z.record(z.string(), z.unknown()),
});

export const ToolChoiceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("auto") }),
  z.object({ type: z.literal("any") }),
  z.object({ type: z.literal("tool"), name: z.string() }),
  z.object({ type: z.literal("none") }),
]);

export const ThinkingConfigSchema = z.object({
  type: z.enum(["enabled", "disabled"]),
  budget_tokens: z.number().int().positive().optional(),
});

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  max_tokens: z.number().int().positive(),
  system: SystemPromptSchema.optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  tools: z.array(ToolSchema).optional(),
  tool_choice: ToolChoiceSchema.optional(),
  thinking: ThinkingConfigSchema.optional(),
});

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export const EmbeddingRequestSchema = z.object({
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
// Token counting
// ---------------------------------------------------------------------------

export const CountTokensRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  system: z.string().optional(),
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        input_schema: z.record(z.string(), z.unknown()),
      })
    )
    .optional(),
  tool_choice: z
    .union([
      z.object({ type: z.string() }),
      z.object({ type: z.literal("tool"), name: z.string() }),
    ])
    .optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const KimiCodingOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  maxRetries: z.number().int().positive().optional(),
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

export type Base64ImageSource = z.infer<typeof Base64ImageSourceSchema>;
export type UrlImageSource = z.infer<typeof UrlImageSourceSchema>;
export type ImageSource = z.infer<typeof ImageSourceSchema>;
export type TextContentBlock = z.infer<typeof TextContentBlockSchema>;
export type ImageContentBlock = z.infer<typeof ImageContentBlockSchema>;
export type ToolUseContentBlock = z.infer<typeof ToolUseContentBlockSchema>;
export type ToolResultContentBlock = z.infer<
  typeof ToolResultContentBlockSchema
>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type SystemPrompt = z.infer<typeof SystemPromptSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type ToolChoice = z.infer<typeof ToolChoiceSchema>;
export type ThinkingConfig = z.infer<typeof ThinkingConfigSchema>;
export type MessageContent = string | ContentBlock[];
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Role = ChatMessage["role"];
export type ChatRequest = z.input<typeof ChatRequestSchema>;
export type ChatRequestInput = ChatRequest;
export type ChatParsedRequest = z.output<typeof ChatRequestSchema>;
export type EmbeddingRequest = z.input<typeof EmbeddingRequestSchema>;
export type EmbeddingRequestInput = EmbeddingRequest;
export type EmbeddingParsedRequest = z.output<typeof EmbeddingRequestSchema>;
export type CountTokensRequest = z.input<typeof CountTokensRequestSchema>;
export type CountTokensRequestInput = CountTokensRequest;
export type CountTokensParsedRequest = z.output<
  typeof CountTokensRequestSchema
>;
export type KimiCodingOptions = z.infer<typeof KimiCodingOptionsSchema>;
