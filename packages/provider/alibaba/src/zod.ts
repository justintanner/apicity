import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const AlibabaFunctionDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const AlibabaToolSchema = z.object({
  type: z.literal("function"),
  function: AlibabaFunctionDefinitionSchema,
});

export const AlibabaToolCallFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(),
});

export const AlibabaToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: AlibabaToolCallFunctionSchema,
});

export const AlibabaMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().nullable(),
  name: z.string().optional(),
  tool_calls: z.array(AlibabaToolCallSchema).optional(),
  tool_call_id: z.string().optional(),
});

export const AlibabaStreamOptionsSchema = z.object({
  include_usage: z.boolean().optional(),
});

export const AlibabaResponseFormatSchema = z.object({
  type: z.enum(["text", "json_object"]),
});

// ---------------------------------------------------------------------------
// Chat completions request
// ---------------------------------------------------------------------------

export const AlibabaChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(AlibabaMessageSchema),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  max_tokens: z.number().optional(),
  n: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional(),
  seed: z.number().optional(),
  presence_penalty: z.number().optional(),
  tools: z.array(AlibabaToolSchema).optional(),
  tool_choice: z
    .union([
      z.enum(["auto", "none"]),
      z.object({
        type: z.literal("function"),
        function: z.object({ name: z.string() }),
      }),
    ])
    .optional(),
  stream_options: AlibabaStreamOptionsSchema.optional(),
  response_format: AlibabaResponseFormatSchema.optional(),
  enable_search: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Video synthesis request
// ---------------------------------------------------------------------------

export const AlibabaVideoSynthesisInputSchema = z.object({
  prompt: z.string(),
  media: z
    .array(
      z.object({
        type: z.enum([
          "first_frame",
          "last_frame",
          "driving_audio",
          "first_clip",
          "video",
        ]),
        url: z.string().min(1),
      })
    )
    .min(1),
  audio_url: z.string().optional(),
});

export const AlibabaVideoSynthesisParametersSchema = z.object({
  resolution: z.enum(["480P", "720P", "1080P"]).optional(),
  duration: z.number().optional(),
  shot_type: z.enum(["single", "multi"]).optional(),
  prompt_extend: z.boolean().optional(),
  watermark: z.boolean().optional(),
  audio: z.boolean().optional(),
  seed: z.number().optional(),
  negative_prompt: z.string().optional(),
});

export const AlibabaVideoSynthesisRequestSchema = z.object({
  model: z.string(),
  input: AlibabaVideoSynthesisInputSchema,
  parameters: AlibabaVideoSynthesisParametersSchema.optional(),
});

// ---------------------------------------------------------------------------
// Image generation request (Wan 2.7 — async)
// ---------------------------------------------------------------------------

export const AlibabaImageTextContentSchema = z.object({
  text: z.string().max(5000),
});

export const AlibabaImageImageContentSchema = z.object({
  image: z.string(),
});

export const AlibabaImageContentSchema = z.union([
  AlibabaImageTextContentSchema,
  AlibabaImageImageContentSchema,
]);

export const AlibabaImageGenerationMessageSchema = z.object({
  role: z.literal("user"),
  content: z.array(AlibabaImageContentSchema),
});

export const AlibabaImageGenerationInputSchema = z.object({
  messages: z.array(AlibabaImageGenerationMessageSchema).length(1),
});

export const AlibabaColorPaletteItemSchema = z.object({
  hex: z.string(),
  ratio: z.string(),
});

export const AlibabaImageGenerationParametersSchema = z.object({
  size: z.string().optional(),
  n: z.number().int().min(1).max(12).optional(),
  watermark: z.boolean().optional(),
  thinking_mode: z.boolean().optional(),
  color_palette: z
    .array(AlibabaColorPaletteItemSchema)
    .min(3)
    .max(10)
    .optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_sequential: z.boolean().optional(),
  bbox_list: z.array(z.array(z.array(z.number()))).optional(),
});

export const AlibabaImageGenerationRequestSchema = z.object({
  model: z.enum(["wan2.7-image-pro", "wan2.7-image"]),
  input: AlibabaImageGenerationInputSchema,
  parameters: AlibabaImageGenerationParametersSchema.optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const AlibabaOptionsSchema = z.object({
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

export type AlibabaFunctionDefinition = z.infer<
  typeof AlibabaFunctionDefinitionSchema
>;
export type AlibabaTool = z.infer<typeof AlibabaToolSchema>;
export type AlibabaToolCallFunction = z.infer<
  typeof AlibabaToolCallFunctionSchema
>;
export type AlibabaToolCall = z.infer<typeof AlibabaToolCallSchema>;
export type AlibabaMessage = z.infer<typeof AlibabaMessageSchema>;
export type AlibabaStreamOptions = z.infer<typeof AlibabaStreamOptionsSchema>;
export type AlibabaResponseFormat = z.infer<typeof AlibabaResponseFormatSchema>;
export type AlibabaChatRequest = z.infer<typeof AlibabaChatRequestSchema>;
export type AlibabaVideoSynthesisInput = z.infer<
  typeof AlibabaVideoSynthesisInputSchema
>;
export type AlibabaVideoSynthesisParameters = z.infer<
  typeof AlibabaVideoSynthesisParametersSchema
>;
export type AlibabaVideoSynthesisRequest = z.infer<
  typeof AlibabaVideoSynthesisRequestSchema
>;
export type AlibabaImageTextContent = z.infer<
  typeof AlibabaImageTextContentSchema
>;
export type AlibabaImageImageContent = z.infer<
  typeof AlibabaImageImageContentSchema
>;
export type AlibabaImageContent = z.infer<typeof AlibabaImageContentSchema>;
export type AlibabaImageGenerationMessage = z.infer<
  typeof AlibabaImageGenerationMessageSchema
>;
export type AlibabaImageGenerationInput = z.infer<
  typeof AlibabaImageGenerationInputSchema
>;
export type AlibabaColorPaletteItem = z.infer<
  typeof AlibabaColorPaletteItemSchema
>;
export type AlibabaImageGenerationParameters = z.infer<
  typeof AlibabaImageGenerationParametersSchema
>;
export type AlibabaImageGenerationRequest = z.infer<
  typeof AlibabaImageGenerationRequestSchema
>;
export type AlibabaOptions = z.infer<typeof AlibabaOptionsSchema>;
