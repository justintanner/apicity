import { z } from "zod";
import type { PayGateConfig } from "./paygate";

// ---------------------------------------------------------------------------
// Enums / named union types
// ---------------------------------------------------------------------------

export const KieMediaModelSchema = z.enum([
  "kling-3.0/video",
  "kling-3.0/motion-control",
  "kling/v3-turbo-image-to-video",
  "kling/v3-turbo-text-to-video",
  "grok-imagine/text-to-image",
  "grok-imagine/image-to-image",
  "grok-imagine/text-to-video",
  "grok-imagine/image-to-video",
  "grok-imagine-video-1-5-preview",
  "nano-banana-pro",
  "nano-banana-2",
  "gpt-image/1.5-image-to-image",
  "gpt-image-2-image-to-image",
  "gpt-image-2-text-to-image",
  "seedream/5-lite-image-to-image",
  "seedream/5-lite-text-to-image",
  "grok-imagine/extend",
  "grok-imagine/upscale",
  "qwen2/text-to-image",
  "qwen2/image-edit",
  "bytedance/seedance-2-fast",
  "bytedance/seedance-2",
  "bytedance/seedance-2-mini",
  "wan/2-7-image-to-video",
  "wan/2-7-text-to-video",
  "wan/2-7-r2v",
  "wan/2-7-videoedit",
  "wan/2-7-image",
  "wan/2-7-image-pro",
  "happyhorse/text-to-video",
  "happyhorse/image-to-video",
  "happyhorse/reference-to-video",
  "happyhorse/video-edit",
  "happyhorse-1-1/text-to-video",
  "happyhorse-1-1/image-to-video",
  "happyhorse-1-1/reference-to-video",
  "omnihuman-1-5",
  "volcengine/video-to-video-lip-sync",
  "gemini-omni-video",
  "elevenlabs/audio-isolation",
  "elevenlabs/text-to-dialogue-v3",
  "elevenlabs/text-to-speech-multilingual-v2",
  "elevenlabs/text-to-speech-turbo-2-5",
  "elevenlabs/sound-effect-v2",
  "sora-watermark-remover",
]);

export const MediaTypeSchema = z.enum([
  "image",
  "video",
  "audio",
  "transcription",
]);

export const GeminiOmniAudioVoiceIds = [
  "achernar",
  "achird",
  "algenib",
  "algieba",
  "alnilam",
  "aoede",
  "autonoe",
  "callirrhoe",
  "charon",
  "despina",
  "enceladus",
  "erinome",
  "fenrir",
  "gacrux",
  "iapetus",
  "kore",
  "laomedeia",
  "leda",
  "orus",
  "puck",
  "pulcherrima",
  "rasalgethi",
  "sadachbia",
  "sadaltager",
  "schedar",
  "sulafat",
  "umbriel",
  "vindemiatrix",
  "zephyr",
  "zubenelgenubi",
] as const;

export const GeminiOmniAudioVoiceIdSchema = z.enum(GeminiOmniAudioVoiceIds);

export const KieGeminiRoleSchema = z.enum(["user", "model"]);

export const KieGeminiThinkingLevelSchema = z.enum(["low", "high"]);

export const KieGeminiInlineDataSchema = z.object({
  mime_type: z.string().min(1),
  data: z.string().min(1),
});

export const KieGeminiFileDataSchema = z.object({
  mime_type: z.string().min(1),
  file_uri: z.string().min(1),
});

export const KieGeminiPartSchema = z
  .object({
    text: z.string().optional(),
    inline_data: KieGeminiInlineDataSchema.optional(),
    file_data: KieGeminiFileDataSchema.optional(),
  })
  .strict()
  .refine(
    (part) =>
      part.text !== undefined ||
      part.inline_data !== undefined ||
      part.file_data !== undefined,
    {
      message: "parts entries must include text, inline_data, or file_data",
    }
  );

export const KieGeminiContentSchema = z.object({
  role: KieGeminiRoleSchema,
  parts: z.array(KieGeminiPartSchema).min(1),
});

export const KieGeminiFunctionParametersSchema = z
  .object({
    type: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

export const KieGeminiFunctionDeclarationSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGeminiFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGeminiGoogleSearchSchema = z.object({}).strict();

export const KieGeminiGoogleSearchToolSchema = z
  .object({
    googleSearch: KieGeminiGoogleSearchSchema,
  })
  .strict();

export const KieGeminiFunctionDeclarationsToolSchema = z
  .object({
    functionDeclarations: z.array(KieGeminiFunctionDeclarationSchema).min(1),
  })
  .strict();

export const KieGeminiToolSchema = z
  .object({
    googleSearch: KieGeminiGoogleSearchSchema.optional(),
    functionDeclarations: z
      .array(KieGeminiFunctionDeclarationSchema)
      .min(1)
      .optional(),
  })
  .strict()
  .refine(
    (tool) =>
      tool.googleSearch !== undefined ||
      tool.functionDeclarations !== undefined,
    {
      message:
        "tools entries must include googleSearch or functionDeclarations",
    }
  );

export const KieGeminiThinkingConfigSchema = z
  .object({
    includeThoughts: z.boolean().optional(),
    thinkingLevel: KieGeminiThinkingLevelSchema.optional(),
  })
  .strict();

export const KieGeminiGenerationConfigSchema = z
  .object({
    temperature: z.number().optional(),
    topP: z.number().optional(),
    topK: z.number().optional(),
    candidateCount: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    stopSequences: z.array(z.string()).optional(),
    thinkingConfig: KieGeminiThinkingConfigSchema.optional(),
  })
  .passthrough();

export const KieGemini35FlashStreamGenerateContentRequestSchema = z
  .object({
    stream: z.boolean().default(true),
    contents: z.array(KieGeminiContentSchema).min(1),
    tools: z.array(KieGeminiToolSchema).optional(),
    generationConfig: KieGeminiGenerationConfigSchema.optional(),
  })
  .passthrough();

export const KieGemini31ProMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini31ProContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini31ProReasoningEffortSchema = z.enum(["low", "high"]);

export const KieGemini31ProToolTypeSchema = z.enum(["function"]);

export const KieGemini31ProToolFunctionNameSchema = z.enum(["googleSearch"]);

export const KieGemini31ProTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini31ProMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini31ProContentItemSchema = z.discriminatedUnion("type", [
  KieGemini31ProTextContentItemSchema,
  KieGemini31ProMediaContentItemSchema,
]);

export const KieGemini31ProMessageSchema = z
  .object({
    role: KieGemini31ProMessageRoleSchema,
    content: z.array(KieGemini31ProContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini31ProToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

export const KieGemini31ProToolFunctionSchema = z
  .object({
    name: KieGemini31ProToolFunctionNameSchema,
    description: z.string().optional(),
    parameters: KieGemini31ProToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini31ProToolSchema = z
  .object({
    type: KieGemini31ProToolTypeSchema,
    function: KieGemini31ProToolFunctionSchema,
  })
  .strict();

export const KieGemini31ProChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-3.1-pro").optional(),
    messages: z.array(KieGemini31ProMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini31ProToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort: KieGemini31ProReasoningEffortSchema.default("high"),
  })
  .passthrough();

export type KieGemini31ProMessageRole = z.infer<
  typeof KieGemini31ProMessageRoleSchema
>;
export type KieGemini31ProContentItemType = z.infer<
  typeof KieGemini31ProContentItemTypeSchema
>;
export type KieGemini31ProReasoningEffort = z.infer<
  typeof KieGemini31ProReasoningEffortSchema
>;
export type KieGemini31ProToolType = z.infer<
  typeof KieGemini31ProToolTypeSchema
>;
export type KieGemini31ProToolFunctionName = z.infer<
  typeof KieGemini31ProToolFunctionNameSchema
>;
export type KieGemini31ProTextContentItem = z.infer<
  typeof KieGemini31ProTextContentItemSchema
>;
export type KieGemini31ProMediaContentItem = z.infer<
  typeof KieGemini31ProMediaContentItemSchema
>;
export type KieGemini31ProContentItem = z.infer<
  typeof KieGemini31ProContentItemSchema
>;
export type KieGemini31ProMessage = z.infer<typeof KieGemini31ProMessageSchema>;
export type KieGemini31ProToolFunctionParameters = z.infer<
  typeof KieGemini31ProToolFunctionParametersSchema
>;
export type KieGemini31ProToolFunction = z.infer<
  typeof KieGemini31ProToolFunctionSchema
>;
export type KieGemini31ProTool = z.infer<typeof KieGemini31ProToolSchema>;
export type KieGemini31ProChatCompletionsRequest = z.input<
  typeof KieGemini31ProChatCompletionsRequestSchema
>;
export type KieGemini31ProChatCompletionsRequestInput =
  KieGemini31ProChatCompletionsRequest;
export type KieGemini31ProChatCompletionsParsedRequest = z.output<
  typeof KieGemini31ProChatCompletionsRequestSchema
>;

export const KlingDurationSchema = z.enum([
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

export const KlingAspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);

export const KlingModeSchema = z.enum(["std", "pro", "4K"]);

export const KlingV3TurboResolutionSchema = z.enum(["720p", "1080p"]);

export const KlingV3TurboAspectRatioSchema = z.enum(["1:1", "9:16", "16:9"]);

export const KlingV3TurboDurationSchema = z.string().regex(/^[1-9]\d*$/);

export const KlingV3TurboTextToVideoDurationSchema = z.enum([
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

export const GrokTextToVideoModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokImageToVideoModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokImagineModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokTextToVideoAspectRatioSchema = z.enum([
  "2:3",
  "3:2",
  "1:1",
  "16:9",
  "9:16",
]);

export const GrokImageToVideoAspectRatioSchema = z.enum([
  "2:3",
  "3:2",
  "1:1",
  "16:9",
  "9:16",
]);

export const GrokTextToVideoDurationSchema = z.number().int().min(6).max(30);

export const GrokImageToVideoDurationSchema = z.number().int().min(6).max(30);

export const GrokImagineDurationSchema = z.enum(["6", "10"]);

export const GrokImagineResolutionSchema = z.enum(["480p", "720p"]);

const GROK_IMAGINE_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isGrokImagineImageUrl(value: string): boolean {
  try {
    const pathname = new URL(value).pathname.toLowerCase();
    return GROK_IMAGINE_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export const GrokImagineImageUrlSchema = z
  .string()
  .url()
  .refine(isGrokImagineImageUrl, {
    message: "image_urls entries must be JPEG, PNG, or WEBP URLs",
  });

// The current KIE Grok Imagine 1.5 Quick Start still publishes video calls under
// the existing grok-imagine/text-to-video and grok-imagine/image-to-video suite
// slugs. This preview-only slug is kept for compatibility with earlier KIE
// recordings that exposed a separate image-to-video preview model.
export const GrokVideo15AspectRatioSchema = z.enum([
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
]);

export const NanoBananaResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const NanoBananaOutputFormatSchema = z.enum(["png", "jpg"]);

export const GptImageQualitySchema = z.enum(["medium", "high"]);

export const Qwen2ImageSizeSchema = z.enum([
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
]);

export const Wan27ResolutionSchema = z.enum(["720p", "1080p"]);

export const Wan27AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
]);

export const Wan27AudioSettingSchema = z.enum(["auto", "origin"]);

export const Wan27ImageResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const Wan27ImageAspectRatioSchema = z.enum([
  "1:1",
  "16:9",
  "4:3",
  "21:9",
  "3:4",
  "9:16",
  "8:1",
  "1:8",
]);

export const Wan27VideoEditDurationValues = [
  0, 2, 3, 4, 5, 6, 7, 8, 9, 10,
] as const;

export type Wan27VideoEditDuration =
  (typeof Wan27VideoEditDurationValues)[number];

export const Wan27VideoEditDurationSchema = z
  .number()
  .int()
  .min(0)
  .max(10)
  .refine((duration) => duration === 0 || duration >= 2, {
    message: "Duration must be 0 or an integer from 2 to 10.",
  })
  .describe(
    "Duration in seconds, 0 or 2-10."
  ) as z.ZodType<Wan27VideoEditDuration>;

export const HappyHorseResolutionSchema = z.enum(["720p", "1080p"]);

export const HappyHorseAspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
]);

export const HappyHorse11AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "1:1",
  "9:21",
  "21:9",
]);

export const HappyHorseAudioSettingSchema = z.enum(["auto", "origin"]);

export const HAPPYHORSE_DURATION_MIN_SECONDS = 3;
export const HAPPYHORSE_DURATION_MAX_SECONDS = 15;
export const HappyHorseDurationSchema = z
  .number()
  .int()
  .min(HAPPYHORSE_DURATION_MIN_SECONDS)
  .max(HAPPYHORSE_DURATION_MAX_SECONDS);

export const Omnihuman15OutputResolutionSchema = z.enum(["720", "1080"]);

export const VolcengineVideoToVideoLipSyncModeSchema = z.enum([
  "lite",
  "basic",
]);

export const GeminiOmniVideoDurationSchema = z.enum(["4", "6", "8", "10"]);

export const GeminiOmniVideoAspectRatioSchema = z.enum(["16:9", "9:16"]);

export const GeminiOmniVideoResolutionSchema = z.enum(["720p", "1080p", "4k"]);

export const Seedance2MiniResolutionSchema = z.enum(["480p", "720p"]);

export const Seedance2MiniAspectRatioSchema = z.enum([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "adaptive",
]);

export const Seedance2MiniTaskStateSchema = z.enum([
  "waiting",
  "success",
  "fail",
]);

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const KlingElementSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  element_input_urls: z.array(z.string()).optional(),
  element_input_video_urls: z.array(z.string()).optional(),
});

export const MultiShotPromptSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(12),
});

export const Wan27ImageColorPaletteSchema = z.object({
  hex: z.string().min(1),
  ratio: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Media request schemas
// ---------------------------------------------------------------------------

export const KlingVideoRequestSchema = z.object({
  model: z.literal("kling-3.0/video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().optional(),
    image_urls: z.array(z.string()).optional(),
    sound: z.boolean(),
    duration: KlingDurationSchema,
    aspect_ratio: KlingAspectRatioSchema.optional(),
    mode: KlingModeSchema,
    multi_shots: z.boolean(),
    multi_prompt: z.array(MultiShotPromptSchema).optional(),
    kling_elements: z.array(KlingElementSchema).max(3).optional(),
  }),
});

export const KlingV3TurboImageToVideoRequestSchema = z.object({
  model: z.literal("kling/v3-turbo-image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_urls: z.array(z.string().min(1)).min(1).max(1),
    duration: KlingV3TurboDurationSchema,
    resolution: KlingV3TurboResolutionSchema,
  }),
});

export const KlingV3TurboTextToVideoRequestSchema = z.object({
  model: z.literal("kling/v3-turbo-text-to-video"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(2500),
    duration: KlingV3TurboTextToVideoDurationSchema.default("5"),
    aspect_ratio: KlingV3TurboAspectRatioSchema.default("16:9"),
    resolution: KlingV3TurboResolutionSchema.default("720p"),
  }),
});

export const KlingMotionControlRequestSchema = z.object({
  model: z.literal("kling-3.0/motion-control"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().optional(),
    input_urls: z.array(z.string()).min(1).max(1),
    video_urls: z.array(z.string()).min(1),
    mode: z.enum(["720p", "1080p"]).optional(),
    character_orientation: z.enum(["video", "image"]).optional(),
    background_source: z.enum(["input_video", "input_image"]).optional(),
  }),
});

export const GrokTextToImageRequestSchema = z.object({
  model: z.literal("grok-imagine/text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    aspect_ratio: z.enum(["2:3", "3:2", "1:1", "16:9", "9:16"]).default("16:9"),
    nsfw_checker: z.boolean().default(false),
    enable_pro: z.boolean().optional(),
  }),
});

export const Qwen2TextToImageRequestSchema = z.object({
  model: z.literal("qwen2/text-to-image"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(800),
    image_size: Qwen2ImageSizeSchema.default("16:9"),
    seed: z.number().int().optional(),
    output_format: z.enum(["jpeg", "png"]).default("png"),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const Qwen2ImageEditRequestSchema = z.object({
  model: z.literal("qwen2/image-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(800),
    image_url: z.string().url(),
    image_size: z
      .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"])
      .default("16:9"),
    output_format: z.enum(["jpeg", "png"]).default("png"),
    seed: z.number().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokImageToImageRequestSchema = z.object({
  model: z.literal("grok-imagine/image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(390000).optional(),
    image_urls: z.tuple([z.string()]),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokTextToVideoRequestSchema = z.object({
  model: z.literal("grok-imagine/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    aspect_ratio: GrokTextToVideoAspectRatioSchema.optional(),
    mode: GrokTextToVideoModeSchema.optional(),
    duration: GrokTextToVideoDurationSchema.optional(),
    resolution: GrokImagineResolutionSchema.optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokImageToVideoRequestSchema = z
  .object({
    model: z.literal("grok-imagine/image-to-video"),
    callBackUrl: z.string().url().optional(),
    input: z.object({
      prompt: z.string().max(4096).optional(),
      image_urls: z
        .array(GrokImagineImageUrlSchema)
        .min(1)
        .max(7, "grok-imagine/image-to-video accepts at most 7 image_urls")
        .optional(),
      task_id: z.string().min(1).max(100).optional(),
      index: z.number().int().min(0).max(5).default(0),
      mode: GrokImageToVideoModeSchema.default("normal"),
      duration: GrokImageToVideoDurationSchema.default(6),
      resolution: GrokImagineResolutionSchema.default("480p"),
      aspect_ratio: GrokImageToVideoAspectRatioSchema.default("16:9"),
      nsfw_checker: z.boolean().default(false),
    }),
  })
  .superRefine((v, ctx) => {
    const hasImageUrls = Boolean(v.input.image_urls?.length);
    const hasTaskId = Boolean(v.input.task_id);

    if (hasImageUrls === hasTaskId) {
      ctx.addIssue({
        code: "custom",
        message:
          "grok-imagine/image-to-video requires exactly one of image_urls or task_id",
        path: ["input", "image_urls"],
      });
    }

    if (hasImageUrls && v.input.mode === "spicy") {
      ctx.addIssue({
        code: "custom",
        message:
          "grok-imagine/image-to-video spicy mode is unavailable with external image_urls",
        path: ["input", "mode"],
      });
    }
  });

// Legacy preview compatibility slug. Current KIE Grok Imagine 1.5 public docs
// use grok-imagine/image-to-video for image-to-video calls.
export const GrokVideo15PreviewRequestSchema = z.object({
  model: z.literal("grok-imagine-video-1-5-preview"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(4096).optional(),
    image_urls: z.array(z.string()).min(1),
    aspect_ratio: GrokVideo15AspectRatioSchema.default("auto"),
    resolution: GrokImagineResolutionSchema.default("480p"),
    duration: z.number().int().min(1).max(15).default(8),
    nsfw_checker: z.boolean().default(true),
  }),
});

export const GrokVideoExtendRequestSchema = z.object({
  model: z.literal("grok-imagine/extend"),
  callBackUrl: z.string().optional(),
  input: z.object({
    task_id: z.string().min(1).max(100),
    prompt: z.string().min(1).max(5000),
    extend_at: z.string(),
    extend_times: GrokImagineDurationSchema,
  }),
});

export const GrokVideoUpscaleRequestSchema = z.object({
  model: z.literal("grok-imagine/upscale"),
  callBackUrl: z.string().optional(),
  input: z.object({
    task_id: z.string().min(1).max(100),
  }),
});

export const NanoBananaProRequestSchema = z.object({
  model: z.literal("nano-banana-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_input: z.array(z.string()).max(8).optional(),
    aspect_ratio: z
      .enum([
        "1:1",
        "2:3",
        "3:2",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "21:9",
        "auto",
      ])
      .default("16:9"),
    resolution: NanoBananaResolutionSchema.default("2K"),
    output_format: NanoBananaOutputFormatSchema.optional(),
  }),
});

// Inner input schema kept unrefined so callers can walk `.shape` for slot
// introspection (see Seedance2InputSchema for full rationale).
export const Seedance2FastInputSchema = z.object({
  prompt: z.string().min(3).max(20000),
  first_frame_url: z.string().optional(),
  last_frame_url: z.string().optional(),
  reference_image_urls: z.array(z.string()).max(9).optional(),
  reference_video_urls: z.array(z.string()).max(3).optional(),
  reference_audio_urls: z.array(z.string()).max(3).optional(),
  /** @deprecated */
  return_last_frame: z.boolean().optional(),
  generate_audio: z.boolean().optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  aspect_ratio: z
    .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"])
    .optional(),
  duration: z.number().int().min(4).max(15).default(5),
  web_search: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

const Seedance2FastRequestObjectSchema = z.object({
  model: z.literal("bytedance/seedance-2-fast"),
  callBackUrl: z.string().optional(),
  input: Seedance2FastInputSchema,
});

// Mirrors the bytedance/seedance-2 mutual-exclusion rule — fast variant
// shares the input shape and the same documented constraint that
// first/last frames and multimodal references are mutually exclusive.
export const Seedance2FastRequestSchema =
  Seedance2FastRequestObjectSchema.refine(
    (v) => {
      const hasReference =
        (v.input.reference_image_urls?.length ?? 0) > 0 ||
        (v.input.reference_video_urls?.length ?? 0) > 0 ||
        (v.input.reference_audio_urls?.length ?? 0) > 0;
      const hasFrame =
        Boolean(v.input.first_frame_url) || Boolean(v.input.last_frame_url);
      return !(hasReference && hasFrame);
    },
    {
      message:
        "bytedance/seedance-2-fast does not accept reference_image_urls, reference_video_urls, or reference_audio_urls combined with first_frame_url or last_frame_url (these scenarios are mutually exclusive)",
      path: ["input", "reference_image_urls"],
    }
  );

// Inner input schema kept unrefined so callers (e.g. videocity) can walk
// `.shape` for slot-constraint introspection — wrapping the request in
// `.refine()` below turns it into ZodEffects and hides `.shape`.
export const Seedance2InputSchema = z.object({
  prompt: z.string().min(3).max(20000),
  first_frame_url: z.string().optional(),
  last_frame_url: z.string().optional(),
  reference_image_urls: z.array(z.string()).max(9).optional(),
  reference_video_urls: z.array(z.string()).max(3).optional(),
  reference_audio_urls: z.array(z.string()).max(3).optional(),
  /** @deprecated */
  return_last_frame: z.boolean().optional(),
  generate_audio: z.boolean().optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  aspect_ratio: z
    .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"])
    .optional(),
  duration: z.number().int().min(4).max(15).default(5),
  web_search: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

const Seedance2RequestObjectSchema = z.object({
  model: z.literal("bytedance/seedance-2"),
  callBackUrl: z.string().optional(),
  input: Seedance2InputSchema,
});

// Per Kie docs, bytedance/seedance-2 has three mutually exclusive scenarios:
// Image-to-Video (first frame), Image-to-Video (first + last frames), and
// Multimodal Reference-to-Video (any of reference_image_urls /
// reference_video_urls / reference_audio_urls). Mixing first/last frames
// with any reference_* field returns "The reference video and the first
// and last frames are mutually exclusive, and only one scene can be
// selected" from createTask. Enforce at the SDK boundary.
export const Seedance2RequestSchema = Seedance2RequestObjectSchema.refine(
  (v) => {
    const hasReference =
      (v.input.reference_image_urls?.length ?? 0) > 0 ||
      (v.input.reference_video_urls?.length ?? 0) > 0 ||
      (v.input.reference_audio_urls?.length ?? 0) > 0;
    const hasFrame =
      Boolean(v.input.first_frame_url) || Boolean(v.input.last_frame_url);
    return !(hasReference && hasFrame);
  },
  {
    message:
      "bytedance/seedance-2 does not accept reference_image_urls, reference_video_urls, or reference_audio_urls combined with first_frame_url or last_frame_url (these scenarios are mutually exclusive)",
    path: ["input", "reference_image_urls"],
  }
);

export const Seedance2MiniInputSchema = z.object({
  prompt: z.string().max(20000).optional(),
  reference_image_urls: z.array(z.string().url()).default([]),
  reference_video_urls: z.array(z.string().url()).max(3).default([]),
  reference_audio_urls: z.array(z.string().url()).max(3).default([]),
  generate_audio: z.boolean().default(true),
  resolution: Seedance2MiniResolutionSchema.default("720p"),
  aspect_ratio: Seedance2MiniAspectRatioSchema.default("16:9"),
  duration: z.number().int().min(4).max(15).default(15),
  web_search: z.boolean().default(false),
  nsfw_checker: z.boolean().default(true),
});

export const Seedance2MiniRequestSchema = z.object({
  model: z.literal("bytedance/seedance-2-mini"),
  callBackUrl: z.string().url().optional(),
  input: Seedance2MiniInputSchema,
});

export const NanoBanana2RequestSchema = z.object({
  model: z.literal("nano-banana-2"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_input: z.array(z.string()).optional(),
    aspect_ratio: z
      .enum([
        "1:1",
        "2:3",
        "3:2",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "21:9",
        "1:4",
        "1:8",
        "4:1",
        "8:1",
        "auto",
      ])
      .default("16:9"),
    resolution: NanoBananaResolutionSchema.default("2K"),
    output_format: NanoBananaOutputFormatSchema.optional(),
    google_search: z.boolean().optional(),
  }),
});

export const GptImageToImageRequestSchema = z.object({
  model: z.literal("gpt-image/1.5-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    input_urls: z.array(z.string()).min(1).max(4),
    prompt: z.string().min(1),
    aspect_ratio: z.enum(["1:1", "2:3", "3:2"]).optional(),
    quality: GptImageQualitySchema.optional(),
  }),
});

export const GptImage2ImageToImageAspectRatioSchema = z.enum([
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

export const GptImage2ImageToImageResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const GptImage2ImageToImageRequestSchema = z.object({
  model: z.literal("gpt-image-2-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    input_urls: z.array(z.string()).min(1).max(16),
    aspect_ratio: GptImage2ImageToImageAspectRatioSchema.default("auto"),
    resolution: GptImage2ImageToImageResolutionSchema.default("1K"),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GptImage2TextToImageAspectRatioSchema = z.enum([
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

export const GptImage2TextToImageResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const GptImage2TextToImageRequestSchema = z.object({
  model: z.literal("gpt-image-2-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    aspect_ratio: GptImage2TextToImageAspectRatioSchema.default("auto"),
    resolution: GptImage2TextToImageResolutionSchema.default("1K"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Kie's seedream/5-lite createTask rejects requests with `"This field is
// required"` when `quality` is missing, even though their docs list it as
// optional with a default. Treat it as required at the SDK boundary so the
// type system forces callers to pick basic/high.
export const SeedreamImageToImageRequestSchema = z.object({
  model: z.literal("seedream/5-lite-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    image_urls: z.array(z.string()).min(1).max(14),
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .default("16:9"),
    quality: z.enum(["basic", "high"]),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const SeedreamTextToImageRequestSchema = z.object({
  model: z.literal("seedream/5-lite-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .default("16:9"),
    quality: z.enum(["basic", "high"]),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const SoraWatermarkRequestSchema = z.object({
  model: z.literal("sora-watermark-remover"),
  callBackUrl: z.string().optional(),
  input: z.object({
    video_url: z.string().min(1),
    upload_method: z.enum(["s3", "oss"]).optional(),
  }),
});

export const HappyHorseTextToVideoRequestSchema = z.object({
  model: z.literal("happyhorse/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    resolution: HappyHorseResolutionSchema.optional(),
    aspect_ratio: HappyHorseAspectRatioSchema.optional(),
    duration: HappyHorseDurationSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorseImageToVideoRequestSchema = z.object({
  model: z.literal("happyhorse/image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).optional(),
    image_urls: z.array(z.string()).min(1).max(1),
    resolution: HappyHorseResolutionSchema.optional(),
    duration: HappyHorseDurationSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorseReferenceToVideoRequestSchema = z.object({
  model: z.literal("happyhorse/reference-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    reference_image: z.array(z.string()).min(1).max(9),
    resolution: HappyHorseResolutionSchema.optional(),
    aspect_ratio: HappyHorseAspectRatioSchema.optional(),
    duration: HappyHorseDurationSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorseVideoEditRequestSchema = z.object({
  model: z.literal("happyhorse/video-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    video_url: z.string().min(1),
    reference_image: z.array(z.string()).max(5).optional(),
    resolution: HappyHorseResolutionSchema.optional(),
    audio_setting: HappyHorseAudioSettingSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorse11TextToVideoRequestSchema = z.object({
  model: z.literal("happyhorse-1-1/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    resolution: HappyHorseResolutionSchema.default("1080p"),
    aspect_ratio: HappyHorse11AspectRatioSchema.default("16:9"),
    duration: HappyHorseDurationSchema.default(5),
  }),
});

export const HappyHorse11ImageToVideoRequestSchema = z.object({
  model: z.literal("happyhorse-1-1/image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).default(""),
    image_urls: z.array(z.string().url()).min(1).max(1),
    resolution: HappyHorseResolutionSchema.default("1080p"),
    duration: HappyHorseDurationSchema.default(5),
  }),
});

export const HappyHorse11ReferenceToVideoRequestSchema = z.object({
  model: z.literal("happyhorse-1-1/reference-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    reference_image: z.array(z.string().url()).min(1).max(9),
    resolution: HappyHorseResolutionSchema.default("1080p"),
    aspect_ratio: HappyHorse11AspectRatioSchema.default("16:9"),
    duration: HappyHorseDurationSchema.default(5),
  }),
});

export const HappyHorse11ResponseCodeSchema = z.union([
  z.literal(200),
  z.literal(401),
  z.literal(402),
  z.literal(404),
  z.literal(422),
  z.literal(429),
  z.literal(433),
  z.literal(455),
  z.literal(500),
  z.literal(501),
  z.literal(505),
]);

export const HappyHorse11ErrorResponseCodeSchema = z.union([
  z.literal(401),
  z.literal(402),
  z.literal(404),
  z.literal(422),
  z.literal(429),
  z.literal(433),
  z.literal(455),
  z.literal(500),
  z.literal(501),
  z.literal(505),
]);

export const HappyHorse11CreateTaskResponseSchema = z.union([
  z.object({
    code: z.literal(200),
    msg: z.string(),
    data: z.object({
      taskId: z.string(),
    }),
  }),
  z.object({
    code: HappyHorse11ErrorResponseCodeSchema,
    msg: z.string(),
    data: z.unknown().optional(),
  }),
]);

export const Omnihuman15RequestSchema = z.object({
  model: z.literal("omnihuman-1-5"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    image_url: z.string().url(),
    mask_url: z.array(z.string().url()).max(5).optional(),
    audio_url: z.string().url(),
    prompt: z.string().max(1000).optional(),
    output_resolution: Omnihuman15OutputResolutionSchema.default("1080"),
    pe_fast_mode: z.boolean().default(false),
    seed: z.number().int().min(-1).default(-1),
  }),
});

export const VolcengineVideoToVideoLipSyncRequestSchema = z.object({
  model: z.literal("volcengine/video-to-video-lip-sync"),
  callBackUrl: z.string().optional(),
  input: z.object({
    mode: VolcengineVideoToVideoLipSyncModeSchema,
    video_url: z.string().min(1),
    audio_url: z.string().min(1),
    separate_vocal: z.boolean().default(false),
    open_scenedet: z.boolean().default(false),
    align_audio: z.boolean().default(true),
    align_audio_reverse: z.boolean().default(false),
    templ_start_seconds: z.number().min(0).default(0),
  }),
});

const GeminiOmniVideoListItemSchema = z
  .object({
    url: z.string().url(),
    start: z.number().min(0),
    ends: z.number().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.ends <= value.start) {
      ctx.addIssue({
        code: "custom",
        message: "ends must be greater than start",
        path: ["ends"],
      });
    }

    if (value.ends - value.start >= 10) {
      ctx.addIssue({
        code: "custom",
        message: "video clip duration must be less than 10 seconds",
        path: ["ends"],
      });
    }
  });

export const GeminiOmniVideoRequestSchema = z
  .object({
    model: z.literal("gemini-omni-video"),
    callBackUrl: z.string().url().optional(),
    input: z.object({
      prompt: z.string().min(1).max(20000),
      image_urls: z.array(z.string().url()).max(7).optional(),
      audio_ids: z.array(z.string().min(1)).max(3).optional(),
      video_list: z.array(GeminiOmniVideoListItemSchema).max(1).optional(),
      character_ids: z.array(z.string().min(1)).max(3).optional(),
      duration: GeminiOmniVideoDurationSchema,
      aspect_ratio: GeminiOmniVideoAspectRatioSchema.optional(),
      seed: z.number().int().min(0).max(2147483647).optional(),
      resolution: GeminiOmniVideoResolutionSchema.default("720p"),
    }),
  })
  .superRefine((value, ctx) => {
    const imageUnits = value.input.image_urls?.length ?? 0;
    const videoUnits = (value.input.video_list?.length ?? 0) * 2;
    const characterUnits = value.input.character_ids?.length ?? 0;
    const quotaUnits = imageUnits + videoUnits + characterUnits;

    if (quotaUnits > 7) {
      ctx.addIssue({
        code: "custom",
        message:
          "gemini-omni-video quota exceeded: image_urls + video_list * 2 + character_ids must be <= 7",
        path: ["input", "image_urls"],
      });
    }
  });

const ElevenLabsTextToSpeechInputSchema = z.object({
  text: z.string().min(1),
  voice: z.string().min(1),
  stability: z.number().optional(),
  similarity_boost: z.number().optional(),
  style: z.number().optional(),
  speed: z.number().optional(),
  timestamps: z.boolean().optional(),
  previous_text: z.string().optional(),
  next_text: z.string().optional(),
  language_code: z.string().optional(),
});

export const ElevenLabsAudioIsolationRequestSchema = z.object({
  model: z.literal("elevenlabs/audio-isolation"),
  callBackUrl: z.string().optional(),
  input: z.object({
    audio_url: z.string().min(1),
  }),
});

export const ElevenLabsTextToDialogueV3RequestSchema = z.object({
  model: z.literal("elevenlabs/text-to-dialogue-v3"),
  callBackUrl: z.string().optional(),
  input: z.object({
    dialogue: z
      .array(
        z.object({
          text: z.string().min(1),
          voice: z.string().min(1),
        })
      )
      .min(1),
    stability: z.number().optional(),
  }),
});

export const ElevenLabsTextToSpeechMultilingualV2RequestSchema = z.object({
  model: z.literal("elevenlabs/text-to-speech-multilingual-v2"),
  callBackUrl: z.string().optional(),
  input: ElevenLabsTextToSpeechInputSchema,
});

export const ElevenLabsTextToSpeechTurbo25RequestSchema = z.object({
  model: z.literal("elevenlabs/text-to-speech-turbo-2-5"),
  callBackUrl: z.string().optional(),
  input: ElevenLabsTextToSpeechInputSchema,
});

export const ElevenLabsSoundEffectV2RequestSchema = z.object({
  model: z.literal("elevenlabs/sound-effect-v2"),
  callBackUrl: z.string().optional(),
  input: z.object({
    text: z.string(),
    loop: z.boolean().optional(),
    prompt_influence: z.number().optional(),
    output_format: z.string().optional(),
  }),
});

// Refines live on the outer request object (not the `input` sub-object) so
// that `input.*` fields remain introspectable by downstream tools that walk
// ZodArray/ZodObject defs (e.g. videocity's readSlotConstraints).
export const Wan27ImageToVideoRequestSchema = z
  .object({
    model: z.literal("wan/2-7-image-to-video"),
    callBackUrl: z.string().optional(),
    input: z.object({
      prompt: z.string().min(1).max(5000),
      negative_prompt: z.string().max(500).optional(),
      first_frame_url: z.string().optional(),
      last_frame_url: z.string().optional(),
      first_clip_url: z.string().optional(),
      driving_audio_url: z.string().optional(),
      resolution: Wan27ResolutionSchema.optional(),
      duration: z.number().int().min(2).max(15).optional(),
      prompt_extend: z.boolean().optional(),
      watermark: z.boolean().optional(),
      seed: z.number().int().min(0).max(2147483647).optional(),
      nsfw_checker: z.boolean().default(false),
    }),
  })
  .refine(
    (v) =>
      Boolean(v.input.first_frame_url) ||
      Boolean(v.input.last_frame_url) ||
      Boolean(v.input.first_clip_url),
    {
      message:
        "wan/2-7-image-to-video requires at least one of first_frame_url, last_frame_url, or first_clip_url",
      path: ["input", "first_frame_url"],
    }
  )
  .refine(
    (v) =>
      !(
        v.input.first_clip_url &&
        (v.input.first_frame_url || v.input.last_frame_url)
      ),
    {
      message:
        "wan/2-7-image-to-video does not accept first_clip_url combined with first_frame_url or last_frame_url",
      path: ["input", "first_clip_url"],
    }
  );

export const Wan27TextToVideoRequestSchema = z.object({
  model: z.literal("wan/2-7-text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    negative_prompt: z.string().max(500).optional(),
    audio_url: z.string().optional(),
    resolution: Wan27ResolutionSchema.optional(),
    ratio: Wan27AspectRatioSchema.optional(),
    duration: z.number().int().min(2).max(15).optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Per-field max(5) on reference_image/reference_video; the combined-≤5 cap is
// enforced by callers (would require a wrapper-level refine, which would
// turn this into ZodEffects and break `.shape` introspection used by
// videocity's slot-constraint readers).
export const Wan27RefToVideoRequestSchema = z.object({
  model: z.literal("wan/2-7-r2v"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    negative_prompt: z.string().max(500).optional(),
    reference_image: z.array(z.string()).max(5).optional(),
    reference_video: z.array(z.string()).max(5).optional(),
    first_frame: z.string().optional(),
    reference_voice: z.string().optional(),
    resolution: Wan27ResolutionSchema.optional(),
    aspect_ratio: Wan27AspectRatioSchema.optional(),
    duration: z.number().int().min(2).max(10).optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const Wan27VideoEditRequestSchema = z.object({
  model: z.literal("wan/2-7-videoedit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).optional(),
    negative_prompt: z.string().max(500).optional(),
    video_url: z.string().min(1),
    reference_image: z.string().optional(),
    resolution: Wan27ResolutionSchema.optional(),
    aspect_ratio: Wan27AspectRatioSchema.optional(),
    duration: Wan27VideoEditDurationSchema.optional(),
    audio_setting: Wan27AudioSettingSchema.optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

const Wan27ImageInputShape = {
  prompt: z.string().min(1).max(5000),
  input_urls: z.array(z.string()).max(9).optional(),
  aspect_ratio: Wan27ImageAspectRatioSchema.default("16:9"),
  enable_sequential: z.boolean().optional(),
  n: z.number().int().min(1).max(12).optional(),
  resolution: Wan27ImageResolutionSchema.default("2K"),
  thinking_mode: z.boolean().optional(),
  color_palette: z
    .array(Wan27ImageColorPaletteSchema)
    .min(3)
    .max(10)
    .optional(),
  bbox_list: z.array(z.array(z.array(z.number()).length(4)).max(2)).optional(),
  watermark: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  nsfw_checker: z.boolean().default(false),
} as const;

const wan27ImageAspectRatioRequiresResolution = (v: {
  input: { aspect_ratio?: unknown; resolution?: unknown };
}): boolean =>
  v.input.aspect_ratio === undefined || v.input.resolution !== undefined;

const wan27ImageAspectRatioRefinement = {
  message: "aspect_ratio requires resolution",
  path: ["input", "resolution"] as Array<string | number>,
};

const wan27Image4KRequiresNonSequentialTextToImage = (v: {
  input: {
    resolution?: unknown;
    enable_sequential?: unknown;
    input_urls?: unknown;
  };
}): boolean => {
  if (v.input.resolution !== "4K") return true;
  if (v.input.enable_sequential === true) return false;
  const urls = v.input.input_urls;
  if (Array.isArray(urls) && urls.length > 0) return false;
  return true;
};

const wan27Image4KRefinement = {
  message: "resolution 4K is only supported for non-sequential text-to-image",
  path: ["input", "resolution"] as Array<string | number>,
};

export const Wan27ImageInputSchema = z.object(Wan27ImageInputShape);

const Wan27ImageRequestObjectSchema = z.object({
  model: z.literal("wan/2-7-image"),
  callBackUrl: z.string().optional(),
  input: Wan27ImageInputSchema,
});

const Wan27ImageProRequestObjectSchema = z.object({
  model: z.literal("wan/2-7-image-pro"),
  callBackUrl: z.string().optional(),
  input: Wan27ImageInputSchema,
});

export const Wan27ImageRequestSchema = Wan27ImageRequestObjectSchema.refine(
  wan27ImageAspectRatioRequiresResolution,
  wan27ImageAspectRatioRefinement
).refine(wan27Image4KRequiresNonSequentialTextToImage, wan27Image4KRefinement);

export const Wan27ImageProRequestSchema =
  Wan27ImageProRequestObjectSchema.refine(
    wan27ImageAspectRatioRequiresResolution,
    wan27ImageAspectRatioRefinement
  ).refine(
    wan27Image4KRequiresNonSequentialTextToImage,
    wan27Image4KRefinement
  );

// ---------------------------------------------------------------------------
// Wan 2.7 task result schemas (parsed from KieTaskInfoData.resultJson)
//
// kie wraps async task results in a JSON envelope on `resultJson`. Both image
// and video Wan 2.7 endpoints return the same shape: an array of result URLs
// (image URLs for image jobs; one video URL for video jobs) plus an optional
// passthrough `resultObject` for endpoint-specific metadata. Consumers should
// `JSON.parse(data.resultJson)` then validate with these.
// ---------------------------------------------------------------------------

export const Wan27TaskResultJsonSchema = z.object({
  resultUrls: z.array(z.string().url()).min(1),
  resultObject: z.record(z.string(), z.unknown()).optional(),
});

export const Wan27VideoResultSchema = Wan27TaskResultJsonSchema;
export const Wan27ImageResultSchema = Wan27TaskResultJsonSchema;

export const Seedance2MiniTaskResultJsonSchema = z
  .object({
    resultUrls: z.array(z.string().url()).optional(),
    resultObject: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => v.resultUrls !== undefined || v.resultObject !== undefined, {
    message: "resultJson must include resultUrls or resultObject",
  });

export const Seedance2MiniRecordInfoDataSchema = z.object({
  taskId: z.string().min(1),
  model: z.literal("bytedance/seedance-2-mini"),
  state: Seedance2MiniTaskStateSchema,
  param: z.string().min(1),
  resultJson: z.string().optional(),
  failCode: z.string().nullable(),
  failMsg: z.string().nullable(),
  costTime: z.number().int().nullable(),
  completeTime: z.number().int().nullable(),
  createTime: z.number().int(),
});

export const Seedance2MiniRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: Seedance2MiniRecordInfoDataSchema.optional(),
});

export const RecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

export const TaskResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: z
    .object({
      taskId: z.string().min(1),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Upload schemas
// ---------------------------------------------------------------------------

const blobSchema = z.instanceof(Blob);

export const UploadMediaRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().min(1),
  uploadPath: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

export const FileUrlUploadRequestSchema = z.object({
  fileUrl: z.string().min(1),
  uploadPath: z.string().min(1),
  fileName: z.string().optional(),
});

export const FileBase64UploadRequestSchema = z.object({
  base64Data: z.string().min(1),
  uploadPath: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Download URL
// ---------------------------------------------------------------------------

export const DownloadUrlRequestSchema = z.object({
  url: z.string().min(1),
});

export const GeminiOmniAudioCreateRequestSchema = z.object({
  audio_id: GeminiOmniAudioVoiceIdSchema,
  name: z.string().min(1).max(210),
  voice_description: z.string().min(1).max(20000).optional(),
  example_dialogue: z.string().min(1).max(120).optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const KieOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  uploadBaseURL: z.string().url().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
  // Pay-gate configuration (shared HMAC secret). Required to call paid
  // endpoints such as createTask; omitting it makes those calls fail closed.
  paygate: z.custom<PayGateConfig>().optional(),
});

const CreateTaskEnvelopeSchema = z.object({
  model: KieMediaModelSchema,
  callBackUrl: z.string().optional(),
  input: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// Sub-provider schemas: Veo
// ---------------------------------------------------------------------------

export const VeoGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["veo3", "veo3_fast"]).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "Auto"]).optional(),
  generationType: z
    .enum([
      "TEXT_2_VIDEO",
      "REFERENCE_2_VIDEO",
      "FIRST_AND_LAST_FRAMES_2_VIDEO",
    ])
    .optional(),
  imageUrls: z.array(z.string()).optional(),
  seeds: z.number().optional(),
  watermark: z.string().optional(),
  enableTranslation: z.boolean().optional(),
});

export const VeoExtendRequestSchema = z.object({
  taskId: z.string().min(1),
  prompt: z.string().min(1),
  model: z.enum(["fast", "quality"]).optional(),
  seeds: z.number().optional(),
  watermark: z.string().optional(),
});

export type VeoGenerateRequest = z.input<typeof VeoGenerateRequestSchema>;
export type VeoGenerateRequestInput = VeoGenerateRequest;
export type VeoGenerateParsedRequest = z.output<
  typeof VeoGenerateRequestSchema
>;
export type VeoExtendRequest = z.input<typeof VeoExtendRequestSchema>;
export type VeoExtendRequestInput = VeoExtendRequest;
export type VeoExtendParsedRequest = z.output<typeof VeoExtendRequestSchema>;
export type VeoModel = "veo3" | "veo3_fast";
export type VeoGenerationType =
  | "TEXT_2_VIDEO"
  | "REFERENCE_2_VIDEO"
  | "FIRST_AND_LAST_FRAMES_2_VIDEO";

// ---------------------------------------------------------------------------
// Sub-provider schemas: Suno
// ---------------------------------------------------------------------------

export const SunoGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"]),
  instrumental: z.boolean(),
  customMode: z.boolean(),
  callBackUrl: z.string().min(1),
  style: z.string().optional(),
  negativeTags: z.string().optional(),
  title: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

export type SunoGenerateRequest = z.input<typeof SunoGenerateRequestSchema>;
export type SunoGenerateRequestInput = SunoGenerateRequest;
export type SunoGenerateParsedRequest = z.output<
  typeof SunoGenerateRequestSchema
>;
export type SunoModel =
  | "V3_5"
  | "V4"
  | "V4_5"
  | "V4_5PLUS"
  | "V4_5ALL"
  | "V5"
  | "V5_5";

// ---------------------------------------------------------------------------
// Sub-provider schemas: Chat (GPT-5.5 / GPT-5.2 via Kie)
// ---------------------------------------------------------------------------

export const KieChatContentPartSchema = z.object({
  type: z.enum(["text", "image_url"]),
  text: z.string().optional(),
  image_url: z.object({ url: z.string() }).optional(),
});

export const KieChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(KieChatContentPartSchema)]),
});

export const KieChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(KieChatMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  response_format: z
    .object({
      type: z.enum(["text", "json_object", "json_schema"]),
      json_schema: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export type KieChatContentPart = z.infer<typeof KieChatContentPartSchema>;
export type KieChatMessage = z.infer<typeof KieChatMessageSchema>;
export type KieChatRequest = z.input<typeof KieChatRequestSchema>;
export type KieChatRequestInput = KieChatRequest;
export type KieChatParsedRequest = z.output<typeof KieChatRequestSchema>;

// ---------------------------------------------------------------------------
// Sub-provider schemas: Responses (GPT-5.5 via Kie)
// ---------------------------------------------------------------------------

export const KieResponsesModelSchema = z.enum(["gpt-5-5"]);

export const KieResponsesReasoningEffortSchema = z.enum([
  "low",
  "medium",
  "high",
  "xhigh",
]);

export const KieResponsesMessageRoleSchema = z.enum([
  "user",
  "assistant",
  "system",
  "developer",
  "tool",
]);

export const KieResponsesInputTextSchema = z.object({
  type: z.literal("input_text"),
  text: z.string().min(1),
});

export const KieResponsesInputImageSchema = z.object({
  type: z.literal("input_image"),
  image_url: z.string().url(),
});

export const KieResponsesInputFileSchema = z.object({
  type: z.literal("input_file"),
  file_url: z.string().url(),
});

export const KieResponsesInputContentSchema = z.discriminatedUnion("type", [
  KieResponsesInputTextSchema,
  KieResponsesInputImageSchema,
  KieResponsesInputFileSchema,
]);

export const KieResponsesInputMessageSchema = z.object({
  role: KieResponsesMessageRoleSchema,
  content: z.array(KieResponsesInputContentSchema).min(1),
});

export const KieResponsesReasoningSchema = z.object({
  effort: KieResponsesReasoningEffortSchema.default("low").optional(),
});

export const KieResponsesWebSearchToolSchema = z.object({
  type: z.literal("web_search"),
});

export const KieResponsesFunctionToolSchema = z.object({
  type: z.literal("function"),
  name: z.string().min(1),
  description: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
});

export const KieResponsesToolSchema = z.discriminatedUnion("type", [
  KieResponsesWebSearchToolSchema,
  KieResponsesFunctionToolSchema,
]);

export const KieResponsesToolsSchema = z
  .array(KieResponsesToolSchema)
  .superRefine((tools, ctx) => {
    const hasWebSearch = tools.some((tool) => tool.type === "web_search");
    const hasFunction = tools.some((tool) => tool.type === "function");
    if (hasWebSearch && hasFunction) {
      ctx.addIssue({
        code: "custom",
        message:
          "web_search and function tools are mutually exclusive for Kie responses",
      });
    }
  });

export const KieResponsesRequestSchema = z.object({
  model: KieResponsesModelSchema,
  stream: z.boolean().default(false).optional(),
  input: z.union([
    z.string().min(1),
    z.array(KieResponsesInputMessageSchema).min(1),
  ]),
  reasoning: KieResponsesReasoningSchema.optional(),
  tools: KieResponsesToolsSchema.optional(),
  tool_choice: z.string().optional(),
});

export type KieResponsesModel = z.infer<typeof KieResponsesModelSchema>;
export type KieResponsesReasoningEffort = z.infer<
  typeof KieResponsesReasoningEffortSchema
>;
export type KieResponsesMessageRole = z.infer<
  typeof KieResponsesMessageRoleSchema
>;
export type KieResponsesInputText = z.infer<typeof KieResponsesInputTextSchema>;
export type KieResponsesInputImage = z.infer<
  typeof KieResponsesInputImageSchema
>;
export type KieResponsesInputFile = z.infer<typeof KieResponsesInputFileSchema>;
export type KieResponsesInputContent = z.infer<
  typeof KieResponsesInputContentSchema
>;
export type KieResponsesInputMessage = z.infer<
  typeof KieResponsesInputMessageSchema
>;
export type KieResponsesReasoning = z.infer<typeof KieResponsesReasoningSchema>;
export type KieResponsesWebSearchTool = z.infer<
  typeof KieResponsesWebSearchToolSchema
>;
export type KieResponsesFunctionTool = z.infer<
  typeof KieResponsesFunctionToolSchema
>;
export type KieResponsesTool = z.infer<typeof KieResponsesToolSchema>;
export type KieResponsesRequest = z.input<typeof KieResponsesRequestSchema>;
export type KieResponsesParsedRequest = z.output<
  typeof KieResponsesRequestSchema
>;

// ---------------------------------------------------------------------------
// Sub-provider schemas: Claude (via Kie)
// ---------------------------------------------------------------------------

export const KieClaudeToolInputSchemaSchema = z.object({
  type: z.string(),
  properties: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
});

export const KieClaudeToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: KieClaudeToolInputSchemaSchema,
});

export const KieClaudeContentPartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

export const KieClaudeMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(KieClaudeContentPartSchema)]),
});

export const KieClaudeRequestSchema = z.object({
  model: z.enum(["claude-sonnet-4-6", "claude-haiku-4-5"]),
  messages: z.array(KieClaudeMessageSchema),
  tools: z.array(KieClaudeToolSchema).optional(),
  thinkingFlag: z.boolean().optional(),
  stream: z.boolean().optional(),
});

export type KieClaudeToolInputSchema = z.infer<
  typeof KieClaudeToolInputSchemaSchema
>;
export type KieClaudeTool = z.infer<typeof KieClaudeToolSchema>;
export type KieClaudeContentPart = z.infer<typeof KieClaudeContentPartSchema>;
export type KieClaudeMessage = z.infer<typeof KieClaudeMessageSchema>;
export type KieClaudeRequest = z.input<typeof KieClaudeRequestSchema>;
export type KieClaudeRequestInput = KieClaudeRequest;
export type KieClaudeParsedRequest = z.output<typeof KieClaudeRequestSchema>;

// ---------------------------------------------------------------------------
// Media generation request (discriminated union on model)
// ---------------------------------------------------------------------------

// Plain union (not discriminatedUnion) so individual members can be refined —
// discriminatedUnion requires ZodObject members, but `.refine()` wraps an
// object in ZodEffects. Parsing cost is slightly higher (tries each member)
// but accepted for the added input-contract validation.
export const MediaGenerationRequestSchema = z.union([
  KlingVideoRequestSchema,
  KlingMotionControlRequestSchema,
  KlingV3TurboImageToVideoRequestSchema,
  KlingV3TurboTextToVideoRequestSchema,
  GrokTextToImageRequestSchema,
  GrokImageToImageRequestSchema,
  GrokTextToVideoRequestSchema,
  GrokImageToVideoRequestSchema,
  GrokVideo15PreviewRequestSchema,
  GrokVideoExtendRequestSchema,
  GrokVideoUpscaleRequestSchema,
  NanoBananaProRequestSchema,
  NanoBanana2RequestSchema,
  GptImageToImageRequestSchema,
  GptImage2ImageToImageRequestSchema,
  GptImage2TextToImageRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  Qwen2TextToImageRequestSchema,
  Qwen2ImageEditRequestSchema,
  Seedance2FastRequestSchema,
  Seedance2RequestSchema,
  Seedance2MiniRequestSchema,
  Wan27ImageToVideoRequestSchema,
  Wan27TextToVideoRequestSchema,
  Wan27RefToVideoRequestSchema,
  Wan27VideoEditRequestSchema,
  Wan27ImageRequestSchema,
  Wan27ImageProRequestSchema,
  HappyHorseTextToVideoRequestSchema,
  HappyHorseImageToVideoRequestSchema,
  HappyHorseReferenceToVideoRequestSchema,
  HappyHorseVideoEditRequestSchema,
  HappyHorse11TextToVideoRequestSchema,
  HappyHorse11ImageToVideoRequestSchema,
  HappyHorse11ReferenceToVideoRequestSchema,
  Omnihuman15RequestSchema,
  VolcengineVideoToVideoLipSyncRequestSchema,
  GeminiOmniVideoRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsTextToDialogueV3RequestSchema,
  ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  ElevenLabsTextToSpeechTurbo25RequestSchema,
  ElevenLabsSoundEffectV2RequestSchema,
  SoraWatermarkRequestSchema,
]);

// ---------------------------------------------------------------------------
// CreateTask request (alias for MediaGenerationRequest — what the createTask
// endpoint actually receives)
// ---------------------------------------------------------------------------

export const CreateTaskRequestSchema = CreateTaskEnvelopeSchema.pipe(
  MediaGenerationRequestSchema
);

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type KieMediaModel = z.infer<typeof KieMediaModelSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;

export type KlingDuration = z.infer<typeof KlingDurationSchema>;
export type KlingAspectRatio = z.infer<typeof KlingAspectRatioSchema>;
export type KlingMode = z.infer<typeof KlingModeSchema>;
export type KlingV3TurboDuration = z.infer<typeof KlingV3TurboDurationSchema>;
export type KlingV3TurboTextToVideoDuration = z.infer<
  typeof KlingV3TurboTextToVideoDurationSchema
>;
export type KlingV3TurboResolution = z.infer<
  typeof KlingV3TurboResolutionSchema
>;
export type KlingV3TurboAspectRatio = z.infer<
  typeof KlingV3TurboAspectRatioSchema
>;
export type GrokImagineMode = z.infer<typeof GrokImagineModeSchema>;
export type GrokTextToVideoMode = z.infer<typeof GrokTextToVideoModeSchema>;
export type GrokImageToVideoMode = z.infer<typeof GrokImageToVideoModeSchema>;
export type GrokTextToVideoAspectRatio = z.infer<
  typeof GrokTextToVideoAspectRatioSchema
>;
export type GrokImageToVideoAspectRatio = z.infer<
  typeof GrokImageToVideoAspectRatioSchema
>;
export type GrokTextToVideoDuration = z.infer<
  typeof GrokTextToVideoDurationSchema
>;
export type GrokImagineDuration = z.infer<typeof GrokImagineDurationSchema>;
export type GrokImageToVideoDuration = z.infer<
  typeof GrokImageToVideoDurationSchema
>;
export type GrokImagineResolution = z.infer<typeof GrokImagineResolutionSchema>;
export type GrokVideo15AspectRatio = z.infer<
  typeof GrokVideo15AspectRatioSchema
>;
export type NanoBananaResolution = z.infer<typeof NanoBananaResolutionSchema>;
export type NanoBananaOutputFormat = z.infer<
  typeof NanoBananaOutputFormatSchema
>;
export type GptImageQuality = z.infer<typeof GptImageQualitySchema>;
export type Qwen2ImageSize = z.infer<typeof Qwen2ImageSizeSchema>;
export type Wan27Resolution = z.infer<typeof Wan27ResolutionSchema>;
export type Wan27AspectRatio = z.infer<typeof Wan27AspectRatioSchema>;
export type Wan27AudioSetting = z.infer<typeof Wan27AudioSettingSchema>;
export type Wan27ImageResolution = z.infer<typeof Wan27ImageResolutionSchema>;
export type Wan27ImageAspectRatio = z.infer<typeof Wan27ImageAspectRatioSchema>;
export type HappyHorseResolution = z.infer<typeof HappyHorseResolutionSchema>;
export type HappyHorseAspectRatio = z.infer<typeof HappyHorseAspectRatioSchema>;
export type HappyHorse11AspectRatio = z.infer<
  typeof HappyHorse11AspectRatioSchema
>;
export type HappyHorseAudioSetting = z.infer<
  typeof HappyHorseAudioSettingSchema
>;
export type HappyHorseDuration = z.infer<typeof HappyHorseDurationSchema>;
export type Omnihuman15OutputResolution = z.infer<
  typeof Omnihuman15OutputResolutionSchema
>;
export type VolcengineVideoToVideoLipSyncMode = z.infer<
  typeof VolcengineVideoToVideoLipSyncModeSchema
>;
export type GeminiOmniVideoDuration = z.infer<
  typeof GeminiOmniVideoDurationSchema
>;
export type GeminiOmniVideoAspectRatio = z.infer<
  typeof GeminiOmniVideoAspectRatioSchema
>;
export type GeminiOmniVideoResolution = z.infer<
  typeof GeminiOmniVideoResolutionSchema
>;
export type Seedance2MiniResolution = z.infer<
  typeof Seedance2MiniResolutionSchema
>;
export type Seedance2MiniAspectRatio = z.infer<
  typeof Seedance2MiniAspectRatioSchema
>;
export type Seedance2MiniTaskState = z.infer<
  typeof Seedance2MiniTaskStateSchema
>;

export type KlingElement = z.infer<typeof KlingElementSchema>;
export type MultiShotPrompt = z.infer<typeof MultiShotPromptSchema>;
export type Wan27ImageColorPalette = z.infer<
  typeof Wan27ImageColorPaletteSchema
>;

export type KlingVideoRequest = z.input<typeof KlingVideoRequestSchema>;
export type KlingVideoRequestInput = KlingVideoRequest;
export type KlingVideoParsedRequest = z.output<typeof KlingVideoRequestSchema>;
export type KlingMotionControlRequest = z.input<
  typeof KlingMotionControlRequestSchema
>;
export type KlingMotionControlRequestInput = KlingMotionControlRequest;
export type KlingMotionControlParsedRequest = z.output<
  typeof KlingMotionControlRequestSchema
>;
export type KlingV3TurboImageToVideoRequest = z.input<
  typeof KlingV3TurboImageToVideoRequestSchema
>;
export type KlingV3TurboImageToVideoRequestInput =
  KlingV3TurboImageToVideoRequest;
export type KlingV3TurboImageToVideoParsedRequest = z.output<
  typeof KlingV3TurboImageToVideoRequestSchema
>;
export type KlingV3TurboTextToVideoRequest = z.input<
  typeof KlingV3TurboTextToVideoRequestSchema
>;
export type KlingV3TurboTextToVideoRequestInput =
  KlingV3TurboTextToVideoRequest;
export type KlingV3TurboTextToVideoParsedRequest = z.output<
  typeof KlingV3TurboTextToVideoRequestSchema
>;
export type GrokTextToImageRequest = z.input<
  typeof GrokTextToImageRequestSchema
>;
export type GrokTextToImageRequestInput = GrokTextToImageRequest;
export type GrokTextToImageParsedRequest = z.output<
  typeof GrokTextToImageRequestSchema
>;
export type Qwen2TextToImageRequest = z.input<
  typeof Qwen2TextToImageRequestSchema
>;
export type Qwen2TextToImageRequestInput = Qwen2TextToImageRequest;
export type Qwen2TextToImageParsedRequest = z.output<
  typeof Qwen2TextToImageRequestSchema
>;
export type Qwen2ImageEditRequest = z.input<typeof Qwen2ImageEditRequestSchema>;
export type Qwen2ImageEditRequestInput = Qwen2ImageEditRequest;
export type Qwen2ImageEditParsedRequest = z.output<
  typeof Qwen2ImageEditRequestSchema
>;
export type GrokImageToImageRequest = z.input<
  typeof GrokImageToImageRequestSchema
>;
export type GrokImageToImageRequestInput = GrokImageToImageRequest;
export type GrokImageToImageParsedRequest = z.output<
  typeof GrokImageToImageRequestSchema
>;
export type GrokTextToVideoRequest = z.input<
  typeof GrokTextToVideoRequestSchema
>;
export type GrokTextToVideoRequestInput = GrokTextToVideoRequest;
export type GrokTextToVideoParsedRequest = z.output<
  typeof GrokTextToVideoRequestSchema
>;
export type GrokImageToVideoRequest = z.input<
  typeof GrokImageToVideoRequestSchema
>;
export type GrokImageToVideoRequestInput = GrokImageToVideoRequest;
export type GrokImageToVideoParsedRequest = z.output<
  typeof GrokImageToVideoRequestSchema
>;
export type GrokVideo15PreviewRequest = z.input<
  typeof GrokVideo15PreviewRequestSchema
>;
export type GrokVideo15PreviewRequestInput = GrokVideo15PreviewRequest;
export type GrokVideo15PreviewParsedRequest = z.output<
  typeof GrokVideo15PreviewRequestSchema
>;
export type GrokVideoExtendRequest = z.input<
  typeof GrokVideoExtendRequestSchema
>;
export type GrokVideoExtendRequestInput = GrokVideoExtendRequest;
export type GrokVideoExtendParsedRequest = z.output<
  typeof GrokVideoExtendRequestSchema
>;
export type GrokVideoUpscaleRequest = z.input<
  typeof GrokVideoUpscaleRequestSchema
>;
export type GrokVideoUpscaleRequestInput = GrokVideoUpscaleRequest;
export type GrokVideoUpscaleParsedRequest = z.output<
  typeof GrokVideoUpscaleRequestSchema
>;
export type NanoBananaProRequest = z.input<typeof NanoBananaProRequestSchema>;
export type NanoBananaProRequestInput = NanoBananaProRequest;
export type NanoBananaProParsedRequest = z.output<
  typeof NanoBananaProRequestSchema
>;
export type Seedance2FastInput = z.infer<typeof Seedance2FastInputSchema>;
export type Seedance2FastRequest = z.input<typeof Seedance2FastRequestSchema>;
export type Seedance2FastRequestInput = Seedance2FastRequest;
export type Seedance2FastParsedRequest = z.output<
  typeof Seedance2FastRequestSchema
>;
export type Seedance2Input = z.infer<typeof Seedance2InputSchema>;
export type Seedance2Request = z.input<typeof Seedance2RequestSchema>;
export type Seedance2RequestInput = Seedance2Request;
export type Seedance2ParsedRequest = z.output<typeof Seedance2RequestSchema>;
export type Seedance2MiniInput = z.infer<typeof Seedance2MiniInputSchema>;
export type Seedance2MiniRequest = z.input<typeof Seedance2MiniRequestSchema>;
export type Seedance2MiniRequestInput = Seedance2MiniRequest;
export type Seedance2MiniParsedRequest = z.output<
  typeof Seedance2MiniRequestSchema
>;
export type NanoBanana2Request = z.input<typeof NanoBanana2RequestSchema>;
export type NanoBanana2RequestInput = NanoBanana2Request;
export type NanoBanana2ParsedRequest = z.output<
  typeof NanoBanana2RequestSchema
>;
export type GptImageToImageRequest = z.input<
  typeof GptImageToImageRequestSchema
>;
export type GptImageToImageRequestInput = GptImageToImageRequest;
export type GptImageToImageParsedRequest = z.output<
  typeof GptImageToImageRequestSchema
>;
export type GptImage2ImageToImageAspectRatio = z.infer<
  typeof GptImage2ImageToImageAspectRatioSchema
>;
export type GptImage2ImageToImageResolution = z.infer<
  typeof GptImage2ImageToImageResolutionSchema
>;
export type GptImage2ImageToImageRequest = z.input<
  typeof GptImage2ImageToImageRequestSchema
>;
export type GptImage2ImageToImageRequestInput = GptImage2ImageToImageRequest;
export type GptImage2ImageToImageParsedRequest = z.output<
  typeof GptImage2ImageToImageRequestSchema
>;
export type GptImage2TextToImageAspectRatio = z.infer<
  typeof GptImage2TextToImageAspectRatioSchema
>;
export type GptImage2TextToImageResolution = z.infer<
  typeof GptImage2TextToImageResolutionSchema
>;
export type GptImage2TextToImageRequest = z.input<
  typeof GptImage2TextToImageRequestSchema
>;
export type GptImage2TextToImageRequestInput = GptImage2TextToImageRequest;
export type GptImage2TextToImageParsedRequest = z.output<
  typeof GptImage2TextToImageRequestSchema
>;
export type SeedreamImageToImageRequest = z.input<
  typeof SeedreamImageToImageRequestSchema
>;
export type SeedreamImageToImageRequestInput = SeedreamImageToImageRequest;
export type SeedreamImageToImageParsedRequest = z.output<
  typeof SeedreamImageToImageRequestSchema
>;
export type SeedreamTextToImageRequest = z.input<
  typeof SeedreamTextToImageRequestSchema
>;
export type SeedreamTextToImageRequestInput = SeedreamTextToImageRequest;
export type SeedreamTextToImageParsedRequest = z.output<
  typeof SeedreamTextToImageRequestSchema
>;
export type SoraWatermarkRequest = z.input<typeof SoraWatermarkRequestSchema>;
export type SoraWatermarkRequestInput = SoraWatermarkRequest;
export type SoraWatermarkParsedRequest = z.output<
  typeof SoraWatermarkRequestSchema
>;
export type Wan27ImageToVideoRequest = z.input<
  typeof Wan27ImageToVideoRequestSchema
>;
export type Wan27ImageToVideoRequestInput = Wan27ImageToVideoRequest;
export type Wan27ImageToVideoParsedRequest = z.output<
  typeof Wan27ImageToVideoRequestSchema
>;
export type Wan27TextToVideoRequest = z.input<
  typeof Wan27TextToVideoRequestSchema
>;
export type Wan27TextToVideoRequestInput = Wan27TextToVideoRequest;
export type Wan27TextToVideoParsedRequest = z.output<
  typeof Wan27TextToVideoRequestSchema
>;
export type Wan27RefToVideoRequest = z.input<
  typeof Wan27RefToVideoRequestSchema
>;
export type Wan27RefToVideoRequestInput = Wan27RefToVideoRequest;
export type Wan27RefToVideoParsedRequest = z.output<
  typeof Wan27RefToVideoRequestSchema
>;
export type Wan27VideoEditRequest = z.input<typeof Wan27VideoEditRequestSchema>;
export type Wan27VideoEditRequestInput = Wan27VideoEditRequest;
export type Wan27VideoEditParsedRequest = z.output<
  typeof Wan27VideoEditRequestSchema
>;
export type Wan27ImageRequest = z.input<typeof Wan27ImageRequestSchema>;
export type Wan27ImageRequestInput = Wan27ImageRequest;
export type Wan27ImageParsedRequest = z.output<typeof Wan27ImageRequestSchema>;
export type Wan27ImageProRequest = z.input<typeof Wan27ImageProRequestSchema>;
export type Wan27ImageProRequestInput = Wan27ImageProRequest;
export type Wan27ImageProParsedRequest = z.output<
  typeof Wan27ImageProRequestSchema
>;
export type HappyHorseTextToVideoRequest = z.input<
  typeof HappyHorseTextToVideoRequestSchema
>;
export type HappyHorseTextToVideoRequestInput = HappyHorseTextToVideoRequest;
export type HappyHorseTextToVideoParsedRequest = z.output<
  typeof HappyHorseTextToVideoRequestSchema
>;
export type HappyHorseImageToVideoRequest = z.input<
  typeof HappyHorseImageToVideoRequestSchema
>;
export type HappyHorseImageToVideoRequestInput = HappyHorseImageToVideoRequest;
export type HappyHorseImageToVideoParsedRequest = z.output<
  typeof HappyHorseImageToVideoRequestSchema
>;
export type HappyHorseReferenceToVideoRequest = z.input<
  typeof HappyHorseReferenceToVideoRequestSchema
>;
export type HappyHorseReferenceToVideoRequestInput =
  HappyHorseReferenceToVideoRequest;
export type HappyHorseReferenceToVideoParsedRequest = z.output<
  typeof HappyHorseReferenceToVideoRequestSchema
>;
export type HappyHorseVideoEditRequest = z.input<
  typeof HappyHorseVideoEditRequestSchema
>;
export type HappyHorseVideoEditRequestInput = HappyHorseVideoEditRequest;
export type HappyHorseVideoEditParsedRequest = z.output<
  typeof HappyHorseVideoEditRequestSchema
>;
export type HappyHorse11TextToVideoRequest = z.input<
  typeof HappyHorse11TextToVideoRequestSchema
>;
export type HappyHorse11TextToVideoRequestInput =
  HappyHorse11TextToVideoRequest;
export type HappyHorse11TextToVideoParsedRequest = z.output<
  typeof HappyHorse11TextToVideoRequestSchema
>;
export type HappyHorse11ImageToVideoRequest = z.input<
  typeof HappyHorse11ImageToVideoRequestSchema
>;
export type HappyHorse11ImageToVideoRequestInput =
  HappyHorse11ImageToVideoRequest;
export type HappyHorse11ImageToVideoParsedRequest = z.output<
  typeof HappyHorse11ImageToVideoRequestSchema
>;
export type HappyHorse11ReferenceToVideoRequest = z.input<
  typeof HappyHorse11ReferenceToVideoRequestSchema
>;
export type HappyHorse11ReferenceToVideoRequestInput =
  HappyHorse11ReferenceToVideoRequest;
export type HappyHorse11ReferenceToVideoParsedRequest = z.output<
  typeof HappyHorse11ReferenceToVideoRequestSchema
>;
export type HappyHorse11CreateTaskResponse = z.infer<
  typeof HappyHorse11CreateTaskResponseSchema
>;
export type Omnihuman15Request = z.input<typeof Omnihuman15RequestSchema>;
export type Omnihuman15RequestInput = Omnihuman15Request;
export type Omnihuman15ParsedRequest = z.output<
  typeof Omnihuman15RequestSchema
>;
export type VolcengineVideoToVideoLipSyncRequest = z.input<
  typeof VolcengineVideoToVideoLipSyncRequestSchema
>;
export type VolcengineVideoToVideoLipSyncRequestInput =
  VolcengineVideoToVideoLipSyncRequest;
export type VolcengineVideoToVideoLipSyncParsedRequest = z.output<
  typeof VolcengineVideoToVideoLipSyncRequestSchema
>;
export type GeminiOmniVideoRequest = z.input<
  typeof GeminiOmniVideoRequestSchema
>;
export type GeminiOmniVideoRequestInput = GeminiOmniVideoRequest;
export type GeminiOmniVideoParsedRequest = z.output<
  typeof GeminiOmniVideoRequestSchema
>;
export type ElevenLabsAudioIsolationRequest = z.input<
  typeof ElevenLabsAudioIsolationRequestSchema
>;
export type ElevenLabsAudioIsolationRequestInput =
  ElevenLabsAudioIsolationRequest;
export type ElevenLabsAudioIsolationParsedRequest = z.output<
  typeof ElevenLabsAudioIsolationRequestSchema
>;
export type ElevenLabsTextToDialogueV3Request = z.input<
  typeof ElevenLabsTextToDialogueV3RequestSchema
>;
export type ElevenLabsTextToDialogueV3RequestInput =
  ElevenLabsTextToDialogueV3Request;
export type ElevenLabsTextToDialogueV3ParsedRequest = z.output<
  typeof ElevenLabsTextToDialogueV3RequestSchema
>;
export type ElevenLabsTextToSpeechMultilingualV2Request = z.input<
  typeof ElevenLabsTextToSpeechMultilingualV2RequestSchema
>;
export type ElevenLabsTextToSpeechMultilingualV2RequestInput =
  ElevenLabsTextToSpeechMultilingualV2Request;
export type ElevenLabsTextToSpeechMultilingualV2ParsedRequest = z.output<
  typeof ElevenLabsTextToSpeechMultilingualV2RequestSchema
>;
export type ElevenLabsTextToSpeechTurbo25Request = z.input<
  typeof ElevenLabsTextToSpeechTurbo25RequestSchema
>;
export type ElevenLabsTextToSpeechTurbo25RequestInput =
  ElevenLabsTextToSpeechTurbo25Request;
export type ElevenLabsTextToSpeechTurbo25ParsedRequest = z.output<
  typeof ElevenLabsTextToSpeechTurbo25RequestSchema
>;
export type ElevenLabsSoundEffectV2Request = z.input<
  typeof ElevenLabsSoundEffectV2RequestSchema
>;
export type ElevenLabsSoundEffectV2RequestInput =
  ElevenLabsSoundEffectV2Request;
export type ElevenLabsSoundEffectV2ParsedRequest = z.output<
  typeof ElevenLabsSoundEffectV2RequestSchema
>;
export type Wan27TaskResultJson = z.infer<typeof Wan27TaskResultJsonSchema>;
export type Wan27VideoResult = z.infer<typeof Wan27VideoResultSchema>;
export type Wan27ImageResult = z.infer<typeof Wan27ImageResultSchema>;
export type Seedance2MiniTaskResultJson = z.infer<
  typeof Seedance2MiniTaskResultJsonSchema
>;
export type Seedance2MiniRecordInfoData = z.infer<
  typeof Seedance2MiniRecordInfoDataSchema
>;
export type Seedance2MiniRecordInfoResponse = z.infer<
  typeof Seedance2MiniRecordInfoResponseSchema
>;
export type RecordInfoRequest = z.input<typeof RecordInfoRequestSchema>;
export type RecordInfoRequestInput = RecordInfoRequest;
export type TaskResponseParsed = z.output<typeof TaskResponseSchema>;

export type UploadMediaRequest = z.input<typeof UploadMediaRequestSchema>;
export type UploadMediaRequestInput = UploadMediaRequest;
export type UploadMediaParsedRequest = z.output<
  typeof UploadMediaRequestSchema
>;
export type FileUrlUploadRequest = z.input<typeof FileUrlUploadRequestSchema>;
export type FileUrlUploadRequestInput = FileUrlUploadRequest;
export type FileUrlUploadParsedRequest = z.output<
  typeof FileUrlUploadRequestSchema
>;
export type FileBase64UploadRequest = z.input<
  typeof FileBase64UploadRequestSchema
>;
export type FileBase64UploadRequestInput = FileBase64UploadRequest;
export type FileBase64UploadParsedRequest = z.output<
  typeof FileBase64UploadRequestSchema
>;
export type DownloadUrlRequest = z.input<typeof DownloadUrlRequestSchema>;
export type DownloadUrlRequestInput = DownloadUrlRequest;
export type DownloadUrlParsedRequest = z.output<
  typeof DownloadUrlRequestSchema
>;
export type GeminiOmniAudioVoiceId = z.infer<
  typeof GeminiOmniAudioVoiceIdSchema
>;
export type GeminiOmniAudioCreateRequest = z.input<
  typeof GeminiOmniAudioCreateRequestSchema
>;
export type GeminiOmniAudioCreateRequestInput = GeminiOmniAudioCreateRequest;
export type GeminiOmniAudioCreateParsedRequest = z.output<
  typeof GeminiOmniAudioCreateRequestSchema
>;
export type KieGeminiRole = z.infer<typeof KieGeminiRoleSchema>;
export type KieGeminiThinkingLevel = z.infer<
  typeof KieGeminiThinkingLevelSchema
>;
export type KieGeminiInlineData = z.infer<typeof KieGeminiInlineDataSchema>;
export type KieGeminiFileData = z.infer<typeof KieGeminiFileDataSchema>;
export type KieGeminiPart = z.infer<typeof KieGeminiPartSchema>;
export type KieGeminiContent = z.infer<typeof KieGeminiContentSchema>;
export type KieGeminiFunctionParameters = z.infer<
  typeof KieGeminiFunctionParametersSchema
>;
export type KieGeminiFunctionDeclaration = z.infer<
  typeof KieGeminiFunctionDeclarationSchema
>;
export type KieGeminiGoogleSearch = z.infer<typeof KieGeminiGoogleSearchSchema>;
export type KieGeminiGoogleSearchTool = z.infer<
  typeof KieGeminiGoogleSearchToolSchema
>;
export type KieGeminiFunctionDeclarationsTool = z.infer<
  typeof KieGeminiFunctionDeclarationsToolSchema
>;
export type KieGeminiTool = z.infer<typeof KieGeminiToolSchema>;
export type KieGeminiThinkingConfig = z.infer<
  typeof KieGeminiThinkingConfigSchema
>;
export type KieGeminiGenerationConfig = z.infer<
  typeof KieGeminiGenerationConfigSchema
>;
export type KieGemini35FlashStreamGenerateContentRequest = z.input<
  typeof KieGemini35FlashStreamGenerateContentRequestSchema
>;
export type KieGemini35FlashStreamGenerateContentParsedRequest = z.output<
  typeof KieGemini35FlashStreamGenerateContentRequestSchema
>;
export type KieOptions = z.infer<typeof KieOptionsSchema>;

export type MediaGenerationRequest = z.input<
  typeof MediaGenerationRequestSchema
>;
export type MediaGenerationRequestInput = MediaGenerationRequest;
export type MediaGenerationParsedRequest = z.output<
  typeof MediaGenerationRequestSchema
>;
