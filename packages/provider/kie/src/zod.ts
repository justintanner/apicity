import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums / named union types
// ---------------------------------------------------------------------------

export const KieMediaModelSchema = z.enum([
  "kling-3.0/video",
  "kling-3.0/motion-control",
  "grok-imagine/text-to-image",
  "grok-imagine/image-to-image",
  "grok-imagine/text-to-video",
  "grok-imagine/image-to-video",
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
  "wan/2-7-image-to-video",
  "wan/2-7-text-to-video",
  "wan/2-7-r2v",
  "wan/2-7-videoedit",
  "wan/2-7-image",
  "wan/2-7-image-pro",
  "sora-watermark-remover",
]);

export const MediaTypeSchema = z.enum([
  "image",
  "video",
  "audio",
  "transcription",
]);

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

export const KlingModeSchema = z.enum(["std", "pro"]);

export const GrokImagineModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokImagineDurationSchema = z.enum(["6", "10"]);

export const GrokImagineResolutionSchema = z.enum(["480p", "720p"]);

export const NanoBananaResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const NanoBananaOutputFormatSchema = z.enum(["png", "jpg"]);

export const GptImageQualitySchema = z.enum(["medium", "high"]);

export const Qwen2ImageSizeSchema = z.enum([
  "square",
  "square_hd",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
]);

export const Qwen2AccelerationSchema = z.enum(["none", "regular", "high"]);

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
  prompt: z.string().min(1),
  duration: z.number(),
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
    kling_elements: z.array(KlingElementSchema).optional(),
  }),
});

export const KlingMotionControlRequestSchema = z.object({
  model: z.literal("kling-3.0/motion-control"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().optional(),
    input_urls: z.array(z.string()),
    video_urls: z.array(z.string()),
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
    aspect_ratio: z.enum(["2:3", "3:2", "1:1", "16:9", "9:16"]).optional(),
    nsfw_checker: z.boolean().default(false),
    enable_pro: z.boolean().optional(),
  }),
});

export const Qwen2TextToImageRequestSchema = z.object({
  model: z.literal("qwen2/text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_size: Qwen2ImageSizeSchema.optional(),
    num_inference_steps: z.number().optional(),
    seed: z.number().optional(),
    guidance_scale: z.number().optional(),
    enable_safety_checker: z.boolean().optional(),
    output_format: z.enum(["png", "jpeg"]).optional(),
    negative_prompt: z.string().optional(),
    acceleration: Qwen2AccelerationSchema.optional(),
  }),
});

export const Qwen2ImageEditRequestSchema = z.object({
  model: z.literal("qwen2/image-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_url: z.array(z.string().min(1)).min(1).max(3),
    image_size: z
      .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"])
      .default("16:9"),
    output_format: z.enum(["png", "jpeg"]).default("png"),
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
    aspect_ratio: z.enum(["2:3", "3:2", "1:1", "16:9", "9:16"]).optional(),
    mode: GrokImagineModeSchema.optional(),
    duration: z.number().int().min(6).max(30).optional(),
    resolution: GrokImagineResolutionSchema.optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokImageToVideoDurationSchema = z.number().int().min(6).max(30);

export const GrokImageToVideoRequestSchema = z.object({
  model: z.literal("grok-imagine/image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).optional(),
    image_urls: z.array(z.string()).max(7).optional(),
    task_id: z.string().max(100).optional(),
    index: z.number().int().min(0).max(5).optional(),
    mode: GrokImagineModeSchema.optional(),
    duration: GrokImageToVideoDurationSchema.optional(),
    resolution: GrokImagineResolutionSchema.optional(),
    aspect_ratio: z.enum(["2:3", "3:2", "1:1", "16:9", "9:16"]).optional(),
    nsfw_checker: z.boolean().default(false),
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
      .optional(),
    resolution: NanoBananaResolutionSchema.optional(),
    output_format: NanoBananaOutputFormatSchema.optional(),
  }),
});

export const Seedance2FastRequestSchema = z.object({
  model: z.literal("bytedance/seedance-2-fast"),
  callBackUrl: z.string().optional(),
  input: z.object({
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
    web_search: z.boolean(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const Seedance2RequestSchema = z.object({
  model: z.literal("bytedance/seedance-2"),
  callBackUrl: z.string().optional(),
  input: z.object({
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
    web_search: z.boolean(),
    nsfw_checker: z.boolean().default(false),
  }),
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
      .optional(),
    resolution: NanoBananaResolutionSchema.optional(),
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
  "16:9",
  "9:16",
  "3:2",
  "2:3",
]);

export const GptImage2ImageToImageRequestSchema = z.object({
  model: z.literal("gpt-image-2-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    input_urls: z.array(z.string()).min(1).max(16),
    aspect_ratio: GptImage2ImageToImageAspectRatioSchema.optional(),
    nsfw_checker: z.boolean().optional(),
  }),
});

export const GptImage2TextToImageAspectRatioSchema = z.enum([
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "3:2",
]);

export const GptImage2TextToImageRequestSchema = z.object({
  model: z.literal("gpt-image-2-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    aspect_ratio: GptImage2TextToImageAspectRatioSchema.optional(),
    nsfw_checker: z.boolean().optional(),
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
      .optional(),
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
      .optional(),
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

// Refines live on the outer request object (not the `input` sub-object) so
// that `input.*` fields remain introspectable by downstream tools that walk
// ZodArray/ZodObject defs (e.g. clipfirst's readSlotConstraints).
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
// clipfirst's slot-constraint readers).
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

export const Wan27VideoEditRequestSchema = z
  .object({
    model: z.literal("wan/2-7-videoedit"),
    callBackUrl: z.string().optional(),
    input: z.object({
      prompt: z.string().max(5000).optional(),
      negative_prompt: z.string().max(500).optional(),
      video_url: z.string().min(1),
      reference_image: z.string().optional(),
      resolution: Wan27ResolutionSchema.optional(),
      aspect_ratio: Wan27AspectRatioSchema.optional(),
      duration: z.number().int().optional(),
      audio_setting: Wan27AudioSettingSchema.optional(),
      prompt_extend: z.boolean().optional(),
      watermark: z.boolean().optional(),
      seed: z.number().int().min(0).max(2147483647).optional(),
      nsfw_checker: z.boolean().default(false),
    }),
  })
  .refine(
    (v) => {
      const d = v.input.duration;
      return d === undefined || d === 0 || (d >= 2 && d <= 10);
    },
    {
      message:
        "wan/2-7-videoedit duration must be 0 (full input) or between 2 and 10 seconds",
      path: ["input", "duration"],
    }
  );

const Wan27ImageInputShape = {
  prompt: z.string().min(1).max(5000),
  input_urls: z.array(z.string()).max(9).optional(),
  aspect_ratio: Wan27ImageAspectRatioSchema.optional(),
  enable_sequential: z.boolean().optional(),
  n: z.number().int().min(1).max(12).optional(),
  resolution: Wan27ImageResolutionSchema.optional(),
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
});

// ---------------------------------------------------------------------------
// CreateTask request (alias for MediaGenerationRequest — what the createTask
// endpoint actually receives)
// ---------------------------------------------------------------------------

export const CreateTaskRequestSchema = z.object({
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

export type VeoGenerateRequest = z.infer<typeof VeoGenerateRequestSchema>;
export type VeoExtendRequest = z.infer<typeof VeoExtendRequestSchema>;
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

export type SunoGenerateRequest = z.infer<typeof SunoGenerateRequestSchema>;
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
export type KieChatRequest = z.infer<typeof KieChatRequestSchema>;

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
export type KieClaudeRequest = z.infer<typeof KieClaudeRequestSchema>;

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
  GrokTextToImageRequestSchema,
  GrokImageToImageRequestSchema,
  GrokTextToVideoRequestSchema,
  GrokImageToVideoRequestSchema,
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
  Wan27ImageToVideoRequestSchema,
  Wan27TextToVideoRequestSchema,
  Wan27RefToVideoRequestSchema,
  Wan27VideoEditRequestSchema,
  Wan27ImageRequestSchema,
  Wan27ImageProRequestSchema,
  SoraWatermarkRequestSchema,
]);

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type KieMediaModel = z.infer<typeof KieMediaModelSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;

export type KlingDuration = z.infer<typeof KlingDurationSchema>;
export type KlingAspectRatio = z.infer<typeof KlingAspectRatioSchema>;
export type KlingMode = z.infer<typeof KlingModeSchema>;
export type GrokImagineMode = z.infer<typeof GrokImagineModeSchema>;
export type GrokImagineDuration = z.infer<typeof GrokImagineDurationSchema>;
export type GrokImageToVideoDuration = z.infer<
  typeof GrokImageToVideoDurationSchema
>;
export type GrokImagineResolution = z.infer<typeof GrokImagineResolutionSchema>;
export type NanoBananaResolution = z.infer<typeof NanoBananaResolutionSchema>;
export type NanoBananaOutputFormat = z.infer<
  typeof NanoBananaOutputFormatSchema
>;
export type GptImageQuality = z.infer<typeof GptImageQualitySchema>;
export type Qwen2ImageSize = z.infer<typeof Qwen2ImageSizeSchema>;
export type Qwen2Acceleration = z.infer<typeof Qwen2AccelerationSchema>;
export type Wan27Resolution = z.infer<typeof Wan27ResolutionSchema>;
export type Wan27AspectRatio = z.infer<typeof Wan27AspectRatioSchema>;
export type Wan27AudioSetting = z.infer<typeof Wan27AudioSettingSchema>;
export type Wan27ImageResolution = z.infer<typeof Wan27ImageResolutionSchema>;
export type Wan27ImageAspectRatio = z.infer<typeof Wan27ImageAspectRatioSchema>;

export type KlingElement = z.infer<typeof KlingElementSchema>;
export type MultiShotPrompt = z.infer<typeof MultiShotPromptSchema>;
export type Wan27ImageColorPalette = z.infer<
  typeof Wan27ImageColorPaletteSchema
>;

export type KlingVideoRequest = z.infer<typeof KlingVideoRequestSchema>;
export type KlingMotionControlRequest = z.infer<
  typeof KlingMotionControlRequestSchema
>;
export type GrokTextToImageRequest = z.infer<
  typeof GrokTextToImageRequestSchema
>;
export type Qwen2TextToImageRequest = z.infer<
  typeof Qwen2TextToImageRequestSchema
>;
export type Qwen2ImageEditRequest = z.infer<typeof Qwen2ImageEditRequestSchema>;
export type GrokImageToImageRequest = z.infer<
  typeof GrokImageToImageRequestSchema
>;
export type GrokTextToVideoRequest = z.infer<
  typeof GrokTextToVideoRequestSchema
>;
export type GrokImageToVideoRequest = z.infer<
  typeof GrokImageToVideoRequestSchema
>;
export type GrokVideoExtendRequest = z.infer<
  typeof GrokVideoExtendRequestSchema
>;
export type GrokVideoUpscaleRequest = z.infer<
  typeof GrokVideoUpscaleRequestSchema
>;
export type NanoBananaProRequest = z.infer<typeof NanoBananaProRequestSchema>;
export type Seedance2FastRequest = z.infer<typeof Seedance2FastRequestSchema>;
export type Seedance2Request = z.infer<typeof Seedance2RequestSchema>;
export type NanoBanana2Request = z.infer<typeof NanoBanana2RequestSchema>;
export type GptImageToImageRequest = z.infer<
  typeof GptImageToImageRequestSchema
>;
export type GptImage2ImageToImageAspectRatio = z.infer<
  typeof GptImage2ImageToImageAspectRatioSchema
>;
export type GptImage2ImageToImageRequest = z.infer<
  typeof GptImage2ImageToImageRequestSchema
>;
export type GptImage2TextToImageAspectRatio = z.infer<
  typeof GptImage2TextToImageAspectRatioSchema
>;
export type GptImage2TextToImageRequest = z.infer<
  typeof GptImage2TextToImageRequestSchema
>;
export type SeedreamImageToImageRequest = z.infer<
  typeof SeedreamImageToImageRequestSchema
>;
export type SeedreamTextToImageRequest = z.infer<
  typeof SeedreamTextToImageRequestSchema
>;
export type SoraWatermarkRequest = z.infer<typeof SoraWatermarkRequestSchema>;
export type Wan27ImageToVideoRequest = z.infer<
  typeof Wan27ImageToVideoRequestSchema
>;
export type Wan27TextToVideoRequest = z.infer<
  typeof Wan27TextToVideoRequestSchema
>;
export type Wan27RefToVideoRequest = z.infer<
  typeof Wan27RefToVideoRequestSchema
>;
export type Wan27VideoEditRequest = z.infer<typeof Wan27VideoEditRequestSchema>;
export type Wan27ImageRequest = z.infer<typeof Wan27ImageRequestSchema>;
export type Wan27ImageProRequest = z.infer<typeof Wan27ImageProRequestSchema>;
export type Wan27TaskResultJson = z.infer<typeof Wan27TaskResultJsonSchema>;
export type Wan27VideoResult = z.infer<typeof Wan27VideoResultSchema>;
export type Wan27ImageResult = z.infer<typeof Wan27ImageResultSchema>;

export type UploadMediaRequest = z.infer<typeof UploadMediaRequestSchema>;
export type FileUrlUploadRequest = z.infer<typeof FileUrlUploadRequestSchema>;
export type FileBase64UploadRequest = z.infer<
  typeof FileBase64UploadRequestSchema
>;
export type DownloadUrlRequest = z.infer<typeof DownloadUrlRequestSchema>;
export type KieOptions = z.infer<typeof KieOptionsSchema>;

export type MediaGenerationRequest = z.infer<
  typeof MediaGenerationRequestSchema
>;
