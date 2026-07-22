import { z } from "zod";

import {
  ChatContentPartSchema,
  ChatImageUrlPartSchema,
  ChatTextPartSchema,
  ChatToolChoiceSchema,
  ChatToolFunctionSchema,
  ChatToolSchema,
} from "./chat-fragments-zod";

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const AlibabaFunctionDefinitionSchema = ChatToolFunctionSchema;

export const AlibabaToolSchema = ChatToolSchema;

export const AlibabaToolCallFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(),
});

export const AlibabaToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: AlibabaToolCallFunctionSchema,
});

export const AlibabaTextPartSchema = ChatTextPartSchema;

export const AlibabaImageUrlPartSchema = ChatImageUrlPartSchema;

export const AlibabaContentPartSchema = ChatContentPartSchema;

export const AlibabaMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(AlibabaContentPartSchema), z.null()]),
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
  tool_choice: ChatToolChoiceSchema.optional(),
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

// Upstream ships new Wan point releases and new task variants on its own
// cadence, so the Wan enums are unioned with an alias escape hatch. DashScope's
// Wan id grammar is `wan<version>` — a dot-separated numeric version attached
// directly to the `wan` prefix — followed by one or more lowercase alphanumeric
// task/tier segments, e.g. wan2.7-i2v, wan2.7-image-pro, wan3.0-videoedit.
// Anchoring the version to the prefix is the load-bearing part: a looser
// `/^wan.*-[a-z0-9-]+$/` would wrongly accept `wan-2.7-i2v` and `wanx-i2v`.
// Anything that is not a versioned Wan id must be added to the enum explicitly.
//
// The video-synthesis enum below and the image-generation request further down
// share this one alias: they are the same Wan family and differ only by task
// segment (`wan2.7-i2v` vs `wan2.7-image-pro`).
const AlibabaWanModelAliasSchema = z
  .string()
  .regex(
    /^wan\d+(?:\.\d+)*-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a versioned Wan alias (e.g. wan3.0-i2v)"
  );

const WAN_VIDEO_SYNTHESIS_MODELS = ["wan2.7-i2v", "wan2.7-videoedit"] as const;

const WAN_VIDEO_SYNTHESIS_MODEL_SET = new Set<string>(
  WAN_VIDEO_SYNTHESIS_MODELS
);

// True only for ids this package lists and that are not wan2.7-videoedit. Ids
// arriving through the alias hatch are deliberately excluded — see the `ratio`
// and `audio_setting` refinements below.
const isListedNonVideoEditWanModel = (model: string): boolean =>
  WAN_VIDEO_SYNTHESIS_MODEL_SET.has(model) && model !== "wan2.7-videoedit";

export const AlibabaVideoSynthesisModelSchema = z
  .enum(WAN_VIDEO_SYNTHESIS_MODELS)
  .or(AlibabaWanModelAliasSchema);

export const AlibabaVideoSynthesisInputSchema = z.object({
  prompt: z.string().max(5000).optional(),
  negative_prompt: z.string().max(500).optional(),
  media: z.array(AlibabaVideoMediaSchema).min(1).max(5),
});

export const AlibabaVideoSynthesisParametersSchema = z.object({
  resolution: z.enum(["720P", "1080P"]).optional(),
  ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).optional(),
  duration: z.union([z.literal(0), z.number().int().min(2).max(10)]).optional(),
  audio_setting: z.enum(["auto", "origin"]).optional(),
  prompt_extend: z.boolean().optional(),
  watermark: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
});

export const AlibabaVideoSynthesisRequestObjectSchema = z.object({
  model: AlibabaVideoSynthesisModelSchema,
  input: AlibabaVideoSynthesisInputSchema,
  parameters: AlibabaVideoSynthesisParametersSchema.optional(),
});

const VideoSynthesisRequest = AlibabaVideoSynthesisRequestObjectSchema;

export const AlibabaVideoSynthesisRequestSchema = VideoSynthesisRequest.refine(
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

  // The six refinements above skip for an id that arrives through the alias
  // hatch, which is deliberate: the hatch asserts that an id is well-formed,
  // not that upstream serves it, so upstream stays the authority on the media
  // shapes a new model accepts.
  //
  // The two below deny a parameter rather than requiring one, so the same
  // "unlisted ids fall through" reading has to be written explicitly. Keyed on
  // `v.model === "wan2.7-videoedit"` they would deny `ratio` and
  // `audio_setting` to every hatched id — blocking a future wan3.0-videoedit
  // from the very fields it exists for. Keyed on the *listed* non-videoedit
  // ids, listed models keep exactly today's behaviour and unlisted ids are
  // left to upstream.
  .refine(
    (v) =>
      !isListedNonVideoEditWanModel(v.model) ||
      v.parameters?.ratio === undefined,
    {
      message: "ratio is only supported by wan2.7-videoedit",
      path: ["parameters", "ratio"],
    }
  )
  .refine(
    (v) =>
      !isListedNonVideoEditWanModel(v.model) ||
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
  size: z
    .union([z.enum(["1K", "2K", "4K"]), z.string().regex(/^\d+\*\d+$/)])
    .optional(),
  n: z.number().int().min(1).max(12).optional(),
  negative_prompt: z.string().max(500).optional(),
  prompt_extend: z.boolean().optional(),
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

const WAN_IMAGE_GENERATION_MODELS = [
  "wan2.7-image-pro",
  "wan2.7-image",
] as const;

export const AlibabaImageGenerationRequestSchema = z.object({
  // Same Wan family as AlibabaVideoSynthesisModelSchema, differing only by task
  // segment, so it reuses that alias rather than defining an identical second
  // one.
  model: z.enum(WAN_IMAGE_GENERATION_MODELS).or(AlibabaWanModelAliasSchema),
  input: AlibabaImageGenerationInputSchema,
  parameters: AlibabaImageGenerationParametersSchema.optional(),
});

// UI-hint companion: the wan2.7 image generation endpoint accepts up to 9
// reference images embedded in `input.messages[0].content` alongside the text
// prompt. That messages-shape makes a direct `.max()` impossible on the
// request schema, so this sibling array schema exists purely for Zod
// introspection by UI layers (e.g. videocity's readSlotConstraints). It is
// not used to validate outgoing requests — enforcement of the 9-slot cap
// happens in callers that pack the messages payload.
export const AlibabaImageReferenceSlotsSchema = z.array(z.string()).max(9);

// ---------------------------------------------------------------------------
// Multimodal generation (Qwen image generation/editing — sync)
//
// Covers the DashScope Qwen image multimodal protocol at
// /api/v1/services/aigc/multimodal-generation/generation. Generation-capable
// qwen-image-* models accept one text instruction plus 0-3 optional images.
// Edit-only qwen-image-edit* models require one text instruction plus 1-3
// images. Stable IDs and dated snapshots are kept in separate model schemas so
// downstream tools can expose the two capability surfaces independently.
// ---------------------------------------------------------------------------

const QWEN_IMAGE_GENERATION_MODELS = [
  "qwen-image-2.0-pro",
  "qwen-image-2.0-pro-2026-03-03",
  "qwen-image-2.0",
  "qwen-image-2.0-2026-03-03",
] as const;

const QWEN_IMAGE_GENERATION_STABLE_MODELS = [
  "qwen-image-2.0-pro",
  "qwen-image-2.0",
] as const;

const QWEN_IMAGE_EDIT_MODELS = [
  "qwen-image-edit-max",
  "qwen-image-edit-max-2026-01-16",
  "qwen-image-edit-plus",
  "qwen-image-edit-plus-2025-12-15",
  "qwen-image-edit-plus-2025-10-30",
  "qwen-image-edit",
] as const;

const QWEN_IMAGE_EDIT_STABLE_MODELS = [
  "qwen-image-edit-max",
  "qwen-image-edit-plus",
  "qwen-image-edit",
] as const;

const QWEN_IMAGE_EDIT_MODEL_SET = new Set<string>(QWEN_IMAGE_EDIT_MODELS);

// DashScope ships new qwen-image point releases and dated snapshots before this
// package's enums catch up, so both Qwen enums are unioned with an alias escape
// hatch. The generation grammar is `qwen-image-<version>` — a dot-separated
// numeric version — followed by optional lowercase tier or date segments, e.g.
// qwen-image-3.0, qwen-image-2.1-pro. Requiring a digit immediately after
// `qwen-image-` is what keeps the edit family out of the generation hatch; a
// looser `/^qwen-image(?:-[a-z0-9.]+)*$/` would accept `qwen-image-edit-max`
// here and collapse the two capability surfaces the enums exist to separate.
//
// `abort` is what keeps the two families' error reporting apart. The two
// request schemas below form a union, and zod only surfaces a single branch's
// own issues when exactly one branch is still "live"; a non-aborting model
// mismatch leaves both branches live and collapses a precise
// `input.messages[0].content` issue into a generic union error. Failing this
// family's grammar makes the whole branch inapplicable, so it stops there.
const AlibabaQwenImageGenerationModelAliasSchema = z
  .string()
  .regex(/^qwen-image-\d+(?:\.\d+)*(?:-[a-z0-9]+)*$/, {
    error:
      "Expected a listed model or a versioned qwen-image alias (e.g. qwen-image-3.0)",
    abort: true,
  });

// The edit grammar is the literal `qwen-image-edit` prefix followed by optional
// lowercase tier or date segments, e.g. qwen-image-edit-ultra,
// qwen-image-edit-max-2026-01-16. Requiring a `-` before each segment is what
// rejects near-misses such as `qwen-image-editx`.
// `abort` here for the same reason as the generation alias above.
const AlibabaQwenImageEditModelAliasSchema = z
  .string()
  .regex(/^qwen-image-edit(?:-[a-z0-9]+)*$/, {
    error:
      "Expected a listed model or a qwen-image-edit alias (e.g. qwen-image-edit-ultra)",
    abort: true,
  });

export const AlibabaQwenImageGenerationModelSchema = z
  .enum(QWEN_IMAGE_GENERATION_MODELS)
  .or(AlibabaQwenImageGenerationModelAliasSchema);

// Closed on purpose: a curated stable-only subset that deliberately excludes the
// preview and dated-snapshot ids in QWEN_IMAGE_GENERATION_MODELS. An open alias
// would readmit exactly what the subset exists to exclude.
export const AlibabaQwenImageGenerationStableModelSchema = z.enum(
  QWEN_IMAGE_GENERATION_STABLE_MODELS
);

export const AlibabaQwenImageEditModelSchema = z
  .enum(QWEN_IMAGE_EDIT_MODELS)
  .or(AlibabaQwenImageEditModelAliasSchema);

// Closed on purpose, for the same reason as the generation stable subset above:
// it curates the dated snapshots out, and an alias would put them back.
export const AlibabaQwenImageEditStableModelSchema = z.enum(
  QWEN_IMAGE_EDIT_STABLE_MODELS
);

export const AlibabaQwenImageModelSchema = z.union([
  AlibabaQwenImageGenerationModelSchema,
  AlibabaQwenImageEditModelSchema,
]);

// Stays closed transitively: both members are curated stable-only subsets, so
// admitting an unlisted id here would defeat both of them at once.
export const AlibabaQwenImageStableModelSchema = z.union([
  AlibabaQwenImageGenerationStableModelSchema,
  AlibabaQwenImageEditStableModelSchema,
]);

export const AlibabaQwenImageTextSlotsSchema = z
  .array(z.string())
  .min(1)
  .max(1);

export const AlibabaQwenImageGenerationImageSlotsSchema = z
  .array(z.string())
  .max(3);

export const AlibabaQwenImageEditImageSlotsSchema = z
  .array(z.string())
  .min(1)
  .max(3);

export const AlibabaQwenImageGenerationSlotsSchema = z.object({
  text: AlibabaQwenImageTextSlotsSchema,
  images: AlibabaQwenImageGenerationImageSlotsSchema,
});

export const AlibabaQwenImageEditSlotsSchema = z.object({
  text: AlibabaQwenImageTextSlotsSchema,
  images: AlibabaQwenImageEditImageSlotsSchema,
});

export const AlibabaMultimodalGenerationMessageSchema = z.object({
  role: z.literal("user"),
  content: z.array(AlibabaImageContentSchema).min(1).max(4),
});

export const AlibabaQwenImageGenerationMessageSchema = z.object({
  role: z.literal("user"),
  content: z.array(AlibabaImageContentSchema).min(1).max(4),
});

export const AlibabaQwenImageEditMessageSchema = z.object({
  role: z.literal("user"),
  content: z.array(AlibabaImageContentSchema).min(2).max(4),
});

export const AlibabaMultimodalGenerationInputSchema = z.object({
  messages: z.array(AlibabaMultimodalGenerationMessageSchema).length(1),
});

export const AlibabaQwenImageGenerationInputSchema = z.object({
  messages: z.array(AlibabaQwenImageGenerationMessageSchema).length(1),
});

export const AlibabaQwenImageEditInputSchema = z.object({
  messages: z.array(AlibabaQwenImageEditMessageSchema).length(1),
});

export const AlibabaMultimodalGenerationParametersSchema = z.object({
  n: z.number().int().min(1).max(6).optional(),
  negative_prompt: z.string().max(500).optional(),
  size: z.string().optional(),
  prompt_extend: z.boolean().optional(),
  watermark: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
});

export const AlibabaQwenImageGenerationRequestSchema = z.object({
  model: AlibabaQwenImageGenerationModelSchema,
  input: AlibabaQwenImageGenerationInputSchema,
  parameters: AlibabaMultimodalGenerationParametersSchema.optional(),
});

export const AlibabaQwenImageEditRequestSchema = z.object({
  model: AlibabaQwenImageEditModelSchema,
  input: AlibabaQwenImageEditInputSchema,
  parameters: AlibabaMultimodalGenerationParametersSchema.optional(),
});

const countAlibabaImageContentParts = (
  parts: Array<z.infer<typeof AlibabaImageContentSchema>>
): { text: number; image: number } => ({
  text: parts.filter((p) => "text" in p).length,
  image: parts.filter((p) => "image" in p).length,
});

// A plain union rather than z.discriminatedUnion("model", …): opening the two
// Qwen enums turns each branch's `model` into a union with no finite value set,
// and zod cannot build a discriminator map from that — it throws on every
// parse, listed ids included. The branches stay mutually exclusive by
// construction (the generation alias requires a digit right after
// `qwen-image-`, the edit alias requires the literal `edit`), so exactly one
// branch ever applies to a given id and zod reports that branch's issues with
// their original paths — except where the surviving branch fails with an
// aborting issue (a wrong-typed `input`, which is `invalid_type` on an object
// and therefore fatal). That kills the last live branch, and the union falls
// back to a single pathless `invalid_union` at the root, for listed ids as
// much as for aliased ones. Both shapes are pinned in
// tests/unit/alibaba-zod.test.ts.
export const AlibabaMultimodalGenerationRequestSchema = z
  .union([
    AlibabaQwenImageGenerationRequestSchema,
    AlibabaQwenImageEditRequestSchema,
  ])
  .refine(
    (v) => {
      const parts = v.input.messages[0].content;
      const { text, image } = countAlibabaImageContentParts(parts);
      return text === 1 && image <= 3;
    },
    {
      message: "content must contain exactly 1 text and 0–3 image parts",
      path: ["input", "messages", 0, "content"],
    }
  )
  .refine(
    (v) => {
      if (!QWEN_IMAGE_EDIT_MODEL_SET.has(v.model)) return true;
      const parts = v.input.messages[0].content;
      return countAlibabaImageContentParts(parts).image >= 1;
    },
    {
      message: "qwen-image-edit* models require at least 1 image part",
      path: ["input", "messages", 0, "content"],
    }
  )
  .refine(
    (v) => v.model !== "qwen-image-edit" || (v.parameters?.n ?? 1) === 1,
    {
      message: "qwen-image-edit only supports n=1",
      path: ["parameters", "n"],
    }
  )
  .refine(
    (v) => v.model !== "qwen-image-edit" || v.parameters?.size === undefined,
    {
      message: "qwen-image-edit does not support custom size",
      path: ["parameters", "size"],
    }
  )
  .refine(
    (v) =>
      v.model !== "qwen-image-edit" ||
      v.parameters?.prompt_extend === undefined,
    {
      message: "qwen-image-edit does not support prompt_extend",
      path: ["parameters", "prompt_extend"],
    }
  );

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
export type AlibabaTextPart = z.infer<typeof AlibabaTextPartSchema>;
export type AlibabaImageUrlPart = z.infer<typeof AlibabaImageUrlPartSchema>;
export type AlibabaContentPart = z.infer<typeof AlibabaContentPartSchema>;
export type AlibabaMessage = z.infer<typeof AlibabaMessageSchema>;
export type AlibabaStreamOptions = z.infer<typeof AlibabaStreamOptionsSchema>;
export type AlibabaResponseFormat = z.infer<typeof AlibabaResponseFormatSchema>;
export type AlibabaChatRequest = z.input<typeof AlibabaChatRequestSchema>;
export type AlibabaChatRequestInput = AlibabaChatRequest;
export type AlibabaChatParsedRequest = z.output<
  typeof AlibabaChatRequestSchema
>;
export type AlibabaVideoMediaType = z.infer<typeof AlibabaVideoMediaTypeSchema>;
export type AlibabaVideoMedia = z.infer<typeof AlibabaVideoMediaSchema>;
// Written out rather than `z.infer<typeof AlibabaVideoSynthesisModelSchema>`:
// the schema is `enum | alias`, and `z.infer` over that collapses to bare
// `string`, which silently drops both autocomplete and typo rejection for
// every consumer of this exported name. Restating the listed ids and mirroring
// the runtime hatch with `string & {}` keeps the schema and the type accepting
// the same values while the literals stay visible in editors. Same treatment
// for the two Qwen image model aliases below.
export type AlibabaVideoSynthesisModel =
  | (typeof WAN_VIDEO_SYNTHESIS_MODELS)[number]
  | (string & {});
export type AlibabaVideoSynthesisInput = z.infer<
  typeof AlibabaVideoSynthesisInputSchema
>;
export type AlibabaVideoSynthesisParameters = z.infer<
  typeof AlibabaVideoSynthesisParametersSchema
>;
export type AlibabaVideoSynthesisRequestObject = z.infer<
  typeof AlibabaVideoSynthesisRequestObjectSchema
>;
export type AlibabaVideoSynthesisRequest = z.input<
  typeof AlibabaVideoSynthesisRequestSchema
>;
export type AlibabaVideoSynthesisRequestInput = AlibabaVideoSynthesisRequest;
export type AlibabaVideoSynthesisParsedRequest = z.output<
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
export type AlibabaImageGenerationRequest = z.input<
  typeof AlibabaImageGenerationRequestSchema
>;
export type AlibabaImageGenerationRequestInput = AlibabaImageGenerationRequest;
export type AlibabaImageGenerationParsedRequest = z.output<
  typeof AlibabaImageGenerationRequestSchema
>;
export type AlibabaImageReferenceSlots = z.infer<
  typeof AlibabaImageReferenceSlotsSchema
>;
// Literal ids + hatch rather than `z.infer` — see AlibabaVideoSynthesisModel.
export type AlibabaQwenImageGenerationModel =
  | (typeof QWEN_IMAGE_GENERATION_MODELS)[number]
  | (string & {});
export type AlibabaQwenImageGenerationStableModel = z.infer<
  typeof AlibabaQwenImageGenerationStableModelSchema
>;
// Literal ids + hatch rather than `z.infer` — see AlibabaVideoSynthesisModel.
export type AlibabaQwenImageEditModel =
  | (typeof QWEN_IMAGE_EDIT_MODELS)[number]
  | (string & {});
export type AlibabaQwenImageEditStableModel = z.infer<
  typeof AlibabaQwenImageEditStableModelSchema
>;
export type AlibabaQwenImageModel = z.infer<typeof AlibabaQwenImageModelSchema>;
export type AlibabaQwenImageStableModel = z.infer<
  typeof AlibabaQwenImageStableModelSchema
>;
export type AlibabaQwenImageTextSlots = z.infer<
  typeof AlibabaQwenImageTextSlotsSchema
>;
export type AlibabaQwenImageGenerationImageSlots = z.infer<
  typeof AlibabaQwenImageGenerationImageSlotsSchema
>;
export type AlibabaQwenImageEditImageSlots = z.infer<
  typeof AlibabaQwenImageEditImageSlotsSchema
>;
export type AlibabaQwenImageGenerationSlots = z.infer<
  typeof AlibabaQwenImageGenerationSlotsSchema
>;
export type AlibabaQwenImageEditSlots = z.infer<
  typeof AlibabaQwenImageEditSlotsSchema
>;
export type AlibabaQwenImageGenerationMessage = z.infer<
  typeof AlibabaQwenImageGenerationMessageSchema
>;
export type AlibabaQwenImageEditMessage = z.infer<
  typeof AlibabaQwenImageEditMessageSchema
>;
export type AlibabaQwenImageGenerationInput = z.infer<
  typeof AlibabaQwenImageGenerationInputSchema
>;
export type AlibabaQwenImageEditInput = z.infer<
  typeof AlibabaQwenImageEditInputSchema
>;
export type AlibabaQwenImageGenerationRequest = z.input<
  typeof AlibabaQwenImageGenerationRequestSchema
>;
export type AlibabaQwenImageGenerationRequestInput =
  AlibabaQwenImageGenerationRequest;
export type AlibabaQwenImageGenerationParsedRequest = z.output<
  typeof AlibabaQwenImageGenerationRequestSchema
>;
export type AlibabaQwenImageEditRequest = z.input<
  typeof AlibabaQwenImageEditRequestSchema
>;
export type AlibabaQwenImageEditRequestInput = AlibabaQwenImageEditRequest;
export type AlibabaQwenImageEditParsedRequest = z.output<
  typeof AlibabaQwenImageEditRequestSchema
>;
export type AlibabaMultimodalGenerationMessage = z.infer<
  typeof AlibabaMultimodalGenerationMessageSchema
>;
export type AlibabaMultimodalGenerationInput = z.infer<
  typeof AlibabaMultimodalGenerationInputSchema
>;
export type AlibabaMultimodalGenerationParameters = z.infer<
  typeof AlibabaMultimodalGenerationParametersSchema
>;
export type AlibabaMultimodalGenerationRequest = z.input<
  typeof AlibabaMultimodalGenerationRequestSchema
>;
export type AlibabaMultimodalGenerationRequestInput =
  AlibabaMultimodalGenerationRequest;
export type AlibabaMultimodalGenerationParsedRequest = z.output<
  typeof AlibabaMultimodalGenerationRequestSchema
>;
export type AlibabaOptions = z.infer<typeof AlibabaOptionsSchema>;

// ---------------------------------------------------------------------------
// Response sub-schemas (chat, image-gen, multimodal, video tasks, uploads)
// ---------------------------------------------------------------------------

export const AlibabaRoleSchema = z.enum([
  "system",
  "user",
  "assistant",
  "tool",
]);

export const AlibabaFinishReasonSchema = z
  .enum(["stop", "length", "tool_calls", "content_filter", "null"])
  .or(z.string());

export const AlibabaTaskStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "SUSPENDED",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
  "UNKNOWN",
]);

// -- Chat response ----------------------------------------------------------

export const AlibabaChatResponseMessageSchema = z.object({
  role: AlibabaRoleSchema,
  content: z.string().nullable(),
  tool_calls: z.array(AlibabaToolCallSchema).optional(),
});

export const AlibabaChatChoiceSchema = z.object({
  index: z.number().int(),
  message: AlibabaChatResponseMessageSchema,
  finish_reason: AlibabaFinishReasonSchema.nullable(),
});

export const AlibabaUsageSchema = z.object({
  prompt_tokens: z.number().int(),
  completion_tokens: z.number().int(),
  total_tokens: z.number().int(),
});

export const AlibabaChatResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(AlibabaChatChoiceSchema),
  usage: AlibabaUsageSchema.optional(),
});

// -- Streaming response -----------------------------------------------------

export const AlibabaChatStreamDeltaSchema = z.object({
  role: AlibabaRoleSchema.optional(),
  content: z.string().nullable().optional(),
  tool_calls: z.array(AlibabaToolCallSchema).optional(),
});

export const AlibabaChatStreamChoiceSchema = z.object({
  index: z.number().int(),
  delta: AlibabaChatStreamDeltaSchema,
  finish_reason: AlibabaFinishReasonSchema.nullable(),
});

export const AlibabaChatStreamChunkSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(AlibabaChatStreamChoiceSchema),
  usage: AlibabaUsageSchema.optional(),
});

// -- Models -----------------------------------------------------------------

export const AlibabaModelSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  owned_by: z.string(),
});

export const AlibabaModelListResponseSchema = z.object({
  object: z.string(),
  data: z.array(AlibabaModelSchema),
  first_id: z.string(),
  last_id: z.string(),
  has_more: z.boolean(),
});

// -- Image generation (Wan 2.7 — async) -------------------------------------

export const AlibabaImageGenerationContentSchema = z.object({
  type: z.literal("image"),
  image: z.string(),
});

export const AlibabaImageGenerationResultMessageSchema = z.object({
  role: z.literal("assistant"),
  content: z.array(AlibabaImageGenerationContentSchema),
});

export const AlibabaImageGenerationChoiceSchema = z.object({
  finish_reason: AlibabaFinishReasonSchema,
  message: AlibabaImageGenerationResultMessageSchema,
});

export const AlibabaImageGenerationSubmitOutputSchema = z.object({
  task_id: z.string(),
  task_status: AlibabaTaskStatusSchema,
});

export const AlibabaImageGenerationSubmitResponseSchema = z.object({
  output: AlibabaImageGenerationSubmitOutputSchema,
  request_id: z.string(),
});

// -- Multimodal generation (Qwen image editing — sync) ----------------------

export const AlibabaMultimodalGenerationImagePartSchema = z.object({
  image: z.string(),
});

export const AlibabaMultimodalGenerationResultMessageSchema = z.object({
  role: z.literal("assistant"),
  content: z.array(AlibabaMultimodalGenerationImagePartSchema),
});

export const AlibabaMultimodalGenerationChoiceSchema = z.object({
  finish_reason: AlibabaFinishReasonSchema,
  message: AlibabaMultimodalGenerationResultMessageSchema,
});

export const AlibabaMultimodalGenerationOutputSchema = z.object({
  choices: z.array(AlibabaMultimodalGenerationChoiceSchema),
});

export const AlibabaMultimodalGenerationUsageSchema = z.object({
  image_count: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  input_tokens: z.number().int().optional(),
  output_tokens: z.number().int().optional(),
  characters: z.number().int().optional(),
});

export const AlibabaMultimodalGenerationResponseSchema = z.object({
  output: AlibabaMultimodalGenerationOutputSchema,
  usage: AlibabaMultimodalGenerationUsageSchema.optional(),
  request_id: z.string(),
});

// -- Video synthesis (native DashScope /api/v1) -----------------------------

export const AlibabaVideoSynthesisSubmitOutputSchema = z.object({
  task_id: z.string(),
  task_status: AlibabaTaskStatusSchema,
});

export const AlibabaVideoSynthesisSubmitResponseSchema = z.object({
  output: AlibabaVideoSynthesisSubmitOutputSchema,
  request_id: z.string(),
});

export const AlibabaTaskOutputSchema = z.object({
  task_id: z.string(),
  task_status: AlibabaTaskStatusSchema,
  submit_time: z.string().optional(),
  scheduled_time: z.string().optional(),
  end_time: z.string().optional(),
  video_url: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  orig_prompt: z.string().optional(),
  actual_prompt: z.string().optional(),
  finished: z.boolean().optional(),
  choices: z.array(AlibabaImageGenerationChoiceSchema).optional(),
});

export const AlibabaTaskUsageSchema = z.object({
  duration: z.number().optional(),
  input_video_duration: z.number().optional(),
  output_video_duration: z.number().optional(),
  SR: z.number().optional(),
  video_count: z.number().int().optional(),
  image_count: z.number().int().optional(),
  size: z.string().optional(),
  input_tokens: z.number().int().optional(),
  output_tokens: z.number().int().optional(),
  total_tokens: z.number().int().optional(),
});

export const AlibabaTaskStatusResponseSchema = z.object({
  output: AlibabaTaskOutputSchema,
  usage: AlibabaTaskUsageSchema.optional(),
  request_id: z.string(),
});

// -- Upload policy (native DashScope /api/v1/uploads) -----------------------

export const AlibabaUploadPolicyDataSchema = z.object({
  policy: z.string(),
  signature: z.string(),
  upload_dir: z.string(),
  upload_host: z.string(),
  expire_in_seconds: z.number(),
  oss_access_key_id: z.string(),
  x_oss_object_acl: z.string(),
  x_oss_forbid_overwrite: z.string(),
});

export const AlibabaUploadPolicyResponseSchema = z.object({
  data: AlibabaUploadPolicyDataSchema,
  request_id: z.string(),
});

// -- Inferred response types -----------------------------------------------

export type AlibabaRole = z.infer<typeof AlibabaRoleSchema>;
export type AlibabaFinishReason = z.infer<typeof AlibabaFinishReasonSchema>;
export type AlibabaTaskStatus = z.infer<typeof AlibabaTaskStatusSchema>;
export type AlibabaChatResponseMessage = z.infer<
  typeof AlibabaChatResponseMessageSchema
>;
export type AlibabaChatChoice = z.infer<typeof AlibabaChatChoiceSchema>;
export type AlibabaUsage = z.infer<typeof AlibabaUsageSchema>;
export type AlibabaChatResponse = z.infer<typeof AlibabaChatResponseSchema>;
export type AlibabaChatStreamDelta = z.infer<
  typeof AlibabaChatStreamDeltaSchema
>;
export type AlibabaChatStreamChoice = z.infer<
  typeof AlibabaChatStreamChoiceSchema
>;
export type AlibabaChatStreamChunk = z.infer<
  typeof AlibabaChatStreamChunkSchema
>;
export type AlibabaModel = z.infer<typeof AlibabaModelSchema>;
export type AlibabaModelListResponse = z.infer<
  typeof AlibabaModelListResponseSchema
>;
export type AlibabaImageGenerationContent = z.infer<
  typeof AlibabaImageGenerationContentSchema
>;
export type AlibabaImageGenerationResultMessage = z.infer<
  typeof AlibabaImageGenerationResultMessageSchema
>;
export type AlibabaImageGenerationChoice = z.infer<
  typeof AlibabaImageGenerationChoiceSchema
>;
export type AlibabaImageGenerationSubmitOutput = z.infer<
  typeof AlibabaImageGenerationSubmitOutputSchema
>;
export type AlibabaImageGenerationSubmitResponse = z.infer<
  typeof AlibabaImageGenerationSubmitResponseSchema
>;
export type AlibabaMultimodalGenerationImagePart = z.infer<
  typeof AlibabaMultimodalGenerationImagePartSchema
>;
export type AlibabaMultimodalGenerationResultMessage = z.infer<
  typeof AlibabaMultimodalGenerationResultMessageSchema
>;
export type AlibabaMultimodalGenerationChoice = z.infer<
  typeof AlibabaMultimodalGenerationChoiceSchema
>;
export type AlibabaMultimodalGenerationOutput = z.infer<
  typeof AlibabaMultimodalGenerationOutputSchema
>;
export type AlibabaMultimodalGenerationUsage = z.infer<
  typeof AlibabaMultimodalGenerationUsageSchema
>;
export type AlibabaMultimodalGenerationResponse = z.infer<
  typeof AlibabaMultimodalGenerationResponseSchema
>;
export type AlibabaVideoSynthesisSubmitOutput = z.infer<
  typeof AlibabaVideoSynthesisSubmitOutputSchema
>;
export type AlibabaVideoSynthesisSubmitResponse = z.infer<
  typeof AlibabaVideoSynthesisSubmitResponseSchema
>;
export type AlibabaTaskOutput = z.infer<typeof AlibabaTaskOutputSchema>;
export type AlibabaTaskUsage = z.infer<typeof AlibabaTaskUsageSchema>;
export type AlibabaTaskStatusResponse = z.infer<
  typeof AlibabaTaskStatusResponseSchema
>;
export type AlibabaUploadPolicyData = z.infer<
  typeof AlibabaUploadPolicyDataSchema
>;
export type AlibabaUploadPolicyResponse = z.infer<
  typeof AlibabaUploadPolicyResponseSchema
>;
