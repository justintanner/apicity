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
//
// Covers the DashScope wan2.7 video-synthesis protocol for two models:
//   - wan2.7-i2v (image-to-video) accepts media types
//     first_frame/last_frame/driving_audio/first_clip.
//   - wan2.7-videoedit (instruction-based video editing) accepts exactly one
//     `video` media entry plus up to 4 `reference_image` entries.
//
// Per-model business rules (required/allowed media, parameter applicability,
// duration caps) are enforced via outer .refine() so the inner field shapes
// stay introspectable by UI layers.
// ---------------------------------------------------------------------------

export const AlibabaVideoMediaTypeSchema = z.enum([
  "first_frame",
  "last_frame",
  "driving_audio",
  "first_clip",
  "video",
  "reference_image",
]);

export const AlibabaVideoMediaSchema = z.object({
  type: AlibabaVideoMediaTypeSchema,
  url: z.string().min(1),
});

export const AlibabaVideoSynthesisInputSchema = z.object({
  prompt: z.string().max(5000).optional(),
  negative_prompt: z.string().max(500).optional(),
  media: z.array(AlibabaVideoMediaSchema).min(1).max(5),
});

export const AlibabaVideoSynthesisParametersSchema = z.object({
  resolution: z.enum(["720P", "1080P"]).optional(),
  ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).optional(),
  duration: z.number().int().min(2).max(15).optional(),
  audio_setting: z.enum(["auto", "origin"]).optional(),
  prompt_extend: z.boolean().optional(),
  watermark: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
});

export const AlibabaVideoSynthesisRequestSchema = z
  .object({
    model: z.enum(["wan2.7-i2v", "wan2.7-videoedit"]),
    input: AlibabaVideoSynthesisInputSchema,
    parameters: AlibabaVideoSynthesisParametersSchema.optional(),
  })
  .refine(
    (v) => {
      // reference_image may repeat (up to 4); all other types must be unique.
      const nonRef = v.input.media
        .map((m) => m.type)
        .filter((t) => t !== "reference_image");
      return new Set(nonRef).size === nonRef.length;
    },
    {
      message:
        "media entries must have unique `type` values (except reference_image)",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-i2v") return true;
      return v.input.media.some(
        (m) =>
          m.type === "first_frame" ||
          m.type === "last_frame" ||
          m.type === "first_clip"
      );
    },
    {
      message:
        "wan2.7-i2v requires at least one media entry of type first_frame, last_frame, or first_clip",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-i2v") return true;
      const hasFirstClip = v.input.media.some((m) => m.type === "first_clip");
      const hasFrame = v.input.media.some(
        (m) => m.type === "first_frame" || m.type === "last_frame"
      );
      return !(hasFirstClip && hasFrame);
    },
    {
      message:
        "wan2.7-i2v does not accept first_clip combined with first_frame or last_frame",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-i2v") return true;
      return !v.input.media.some(
        (m) => m.type === "video" || m.type === "reference_image"
      );
    },
    {
      message:
        "wan2.7-i2v does not accept media of type video or reference_image",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-videoedit") return true;
      return v.input.media.filter((m) => m.type === "video").length === 1;
    },
    {
      message:
        "wan2.7-videoedit requires exactly one media entry of type video",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-videoedit") return true;
      return (
        v.input.media.filter((m) => m.type === "reference_image").length <= 4
      );
    },
    {
      message:
        "wan2.7-videoedit accepts at most 4 media entries of type reference_image",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-videoedit") return true;
      return v.input.media.every(
        (m) => m.type === "video" || m.type === "reference_image"
      );
    },
    {
      message:
        "wan2.7-videoedit only accepts media of type video or reference_image",
      path: ["input", "media"],
    }
  )
  .refine(
    (v) => {
      if (v.model !== "wan2.7-videoedit") return true;
      const d = v.parameters?.duration;
      return d === undefined || d <= 10;
    },
    {
      message: "wan2.7-videoedit duration must be at most 10 seconds",
      path: ["parameters", "duration"],
    }
  )
  .refine(
    (v) => v.model === "wan2.7-videoedit" || v.parameters?.ratio === undefined,
    {
      message: "ratio is only supported by wan2.7-videoedit",
      path: ["parameters", "ratio"],
    }
  )
  .refine(
    (v) =>
      v.model === "wan2.7-videoedit" ||
      v.parameters?.audio_setting === undefined,
    {
      message: "audio_setting is only supported by wan2.7-videoedit",
      path: ["parameters", "audio_setting"],
    }
  );

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

// UI-hint companion: the wan2.7 image generation endpoint accepts up to 9
// reference images embedded in `input.messages[0].content` alongside the text
// prompt. That messages-shape makes a direct `.max()` impossible on the
// request schema, so this sibling array schema exists purely for Zod
// introspection by UI layers (e.g. clipfirst's readSlotConstraints). It is
// not used to validate outgoing requests — enforcement of the 9-slot cap
// happens in callers that pack the messages payload.
export const AlibabaImageReferenceSlotsSchema = z.array(z.string()).max(9);

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
export type AlibabaVideoMediaType = z.infer<typeof AlibabaVideoMediaTypeSchema>;
export type AlibabaVideoMedia = z.infer<typeof AlibabaVideoMediaSchema>;
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
export type AlibabaImageReferenceSlots = z.infer<
  typeof AlibabaImageReferenceSlotsSchema
>;
export type AlibabaOptions = z.infer<typeof AlibabaOptionsSchema>;
