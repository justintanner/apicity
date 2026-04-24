import { z } from "zod";

// ---------------------------------------------------------------------------
// Pricing estimate
// ---------------------------------------------------------------------------

export const FalPricingEstimateRequestSchema = z.object({
  estimate_type: z.enum(["historical_api_price", "unit_price"]),
  endpoints: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// Queue submit
// ---------------------------------------------------------------------------

export const FalQueueSubmitRequestSchema = z.object({
  endpoint_id: z.string(),
  input: z.record(z.string(), z.unknown()),
  webhook: z.string().optional(),
  priority: z.enum(["normal", "low"]).optional(),
  timeout: z.number().optional(),
  no_retry: z.boolean().optional(),
  runner_hint: z.string().optional(),
  store_io: z.string().optional(),
  object_lifecycle_preference: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Logs stream
// ---------------------------------------------------------------------------

export const FalLogsStreamRequestSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  app_id: z.array(z.string()).optional(),
  revision: z.string().optional(),
  run_source: z
    .enum(["grpc-run", "grpc-register", "gateway", "cron"])
    .optional(),
  traceback: z.boolean().optional(),
  search: z.string().optional(),
  level: z.string().optional(),
  job_id: z.string().optional(),
  request_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Files upload URL
// ---------------------------------------------------------------------------

export const FalFilesUploadUrlRequestSchema = z.object({
  file: z.string(),
  url: z.string(),
});

// ---------------------------------------------------------------------------
// Files upload local
// ---------------------------------------------------------------------------

const blobSchema = z.instanceof(Blob);

export const FalFilesUploadLocalRequestSchema = z.object({
  target_path: z.string(),
  file: blobSchema,
  filename: z.string().optional(),
  unzip: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Delete payloads
// ---------------------------------------------------------------------------

export const FalDeletePayloadsRequestSchema = z.object({
  request_id: z.string(),
  idempotency_key: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.0 image-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p0ImageToVideoRequestSchema = z.object({
  prompt: z.string(),
  image_url: z.string(),
  end_image_url: z.string().optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  duration: z
    .enum([
      "auto",
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
    ])
    .optional(),
  aspect_ratio: z
    .enum(["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional(),
  generate_audio: z.boolean().optional(),
  seed: z.number().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.0 text-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p0TextToVideoRequestSchema = z.object({
  prompt: z.string(),
  resolution: z.enum(["480p", "720p"]).optional(),
  duration: z
    .enum([
      "auto",
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
    ])
    .optional(),
  aspect_ratio: z
    .enum(["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional(),
  generate_audio: z.boolean().optional(),
  seed: z.number().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.0 Fast image-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p0FastImageToVideoRequestSchema = z.object({
  prompt: z.string(),
  image_url: z.string(),
  end_image_url: z.string().optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  duration: z
    .enum([
      "auto",
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
    ])
    .optional(),
  aspect_ratio: z
    .enum(["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional(),
  generate_audio: z.boolean().optional(),
  seed: z.number().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.0 Fast text-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p0FastTextToVideoRequestSchema = z.object({
  prompt: z.string(),
  resolution: z.enum(["480p", "720p"]).optional(),
  duration: z
    .enum([
      "auto",
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
    ])
    .optional(),
  aspect_ratio: z
    .enum(["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional(),
  generate_audio: z.boolean().optional(),
  seed: z.number().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.0 reference-to-video
// ---------------------------------------------------------------------------

const Seedance2p0ReferenceDurationSchema = z.enum([
  "auto",
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

const Seedance2p0ReferenceAspectRatioSchema = z.enum([
  "auto",
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

export const FalSeedance2p0ReferenceToVideoRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()).max(9).optional(),
  video_urls: z.array(z.string()).max(3).optional(),
  audio_urls: z.array(z.string()).max(3).optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  duration: Seedance2p0ReferenceDurationSchema.optional(),
  aspect_ratio: Seedance2p0ReferenceAspectRatioSchema.optional(),
  generate_audio: z.boolean().optional(),
  seed: z.number().int().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.0 Fast reference-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p0FastReferenceToVideoRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()).max(9).optional(),
  video_urls: z.array(z.string()).max(3).optional(),
  audio_urls: z.array(z.string()).max(3).optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  duration: Seedance2p0ReferenceDurationSchema.optional(),
  aspect_ratio: Seedance2p0ReferenceAspectRatioSchema.optional(),
  generate_audio: z.boolean().optional(),
  seed: z.number().int().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana 2 text-to-image
// ---------------------------------------------------------------------------

export const FalNanoBanana2TextToImageRequestSchema = z.object({
  prompt: z.string(),
  num_images: z.number().optional(),
  seed: z.number().optional(),
  aspect_ratio: z
    .enum([
      "auto",
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
      "4:1",
      "1:4",
      "8:1",
      "1:8",
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  sync_mode: z.boolean().optional(),
  resolution: z.enum(["0.5K", "1K", "2K", "4K"]).optional(),
  limit_generations: z.boolean().optional(),
  enable_web_search: z.boolean().optional(),
  thinking_level: z.enum(["minimal", "high"]).optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana 2 edit
// ---------------------------------------------------------------------------

export const FalNanoBanana2EditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()),
  num_images: z.number().optional(),
  seed: z.number().optional(),
  aspect_ratio: z
    .enum([
      "auto",
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
      "4:1",
      "1:4",
      "8:1",
      "1:8",
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  sync_mode: z.boolean().optional(),
  resolution: z.enum(["0.5K", "1K", "2K", "4K"]).optional(),
  limit_generations: z.boolean().optional(),
  enable_web_search: z.boolean().optional(),
  thinking_level: z.enum(["minimal", "high"]).optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana text-to-image
// ---------------------------------------------------------------------------

export const FalNanoBananaTextToImageRequestSchema = z.object({
  prompt: z.string().min(3).max(50000),
  num_images: z.number().int().min(1).max(4).optional(),
  aspect_ratio: z
    .enum([
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  seed: z.number().optional(),
  sync_mode: z.boolean().optional(),
  limit_generations: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana edit
// ---------------------------------------------------------------------------

export const FalNanoBananaEditRequestSchema = z.object({
  prompt: z.string().min(3).max(50000),
  image_urls: z.array(z.string()),
  num_images: z.number().int().min(1).max(4).optional(),
  aspect_ratio: z
    .enum([
      "auto",
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  seed: z.number().optional(),
  sync_mode: z.boolean().optional(),
  limit_generations: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GPT Image 1.5 text-to-image
// ---------------------------------------------------------------------------

export const FalGptImage1p5RequestSchema = z.object({
  prompt: z.string().min(2).max(32000),
  image_size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).optional(),
  num_images: z.number().int().min(1).max(4).optional(),
  background: z.enum(["auto", "transparent", "opaque"]).optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
  sync_mode: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GPT Image 1.5 edit
// ---------------------------------------------------------------------------

export const FalGptImage1p5EditRequestSchema = z.object({
  prompt: z.string().min(2).max(32000),
  image_urls: z.array(z.string()),
  image_size: z
    .enum(["auto", "1024x1024", "1536x1024", "1024x1536"])
    .optional(),
  background: z.enum(["auto", "transparent", "opaque"]).optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
  num_images: z.number().int().min(1).max(4).optional(),
  input_fidelity: z.enum(["low", "high"]).optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  sync_mode: z.boolean().optional(),
  mask_image_url: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Qwen Image text-to-image
// ---------------------------------------------------------------------------

export const FalQwenImageRequestSchema = z.object({
  prompt: z.string(),
  image_size: z
    .union([
      z.enum([
        "square_hd",
        "square",
        "portrait_4_3",
        "portrait_16_9",
        "landscape_4_3",
        "landscape_16_9",
      ]),
      z.object({ width: z.number(), height: z.number() }),
    ])
    .optional(),
  num_inference_steps: z.number().int().min(2).max(250).optional(),
  seed: z.number().int().optional(),
  guidance_scale: z.number().min(0).max(20).optional(),
  num_images: z.number().int().min(1).max(4).optional(),
  output_format: z.enum(["jpeg", "png"]).optional(),
  negative_prompt: z.string().optional(),
  acceleration: z.enum(["none", "regular", "high"]).optional(),
  sync_mode: z.boolean().optional(),
  enable_safety_checker: z.boolean().optional(),
  use_turbo: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Qwen Image edit
// ---------------------------------------------------------------------------

export const FalQwenImageEditRequestSchema = z.object({
  prompt: z.string(),
  image_url: z.string(),
  num_images: z.number().int().min(1).max(4).optional(),
  num_inference_steps: z.number().int().min(2).max(50).optional(),
  guidance_scale: z.number().min(0).max(20).optional(),
  seed: z.number().int().optional(),
  negative_prompt: z.string().optional(),
  image_size: z
    .union([
      z.enum([
        "square_hd",
        "square",
        "portrait_4_3",
        "portrait_16_9",
        "landscape_4_3",
        "landscape_16_9",
      ]),
      z.object({ width: z.number(), height: z.number() }),
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png"]).optional(),
  enable_safety_checker: z.boolean().optional(),
  acceleration: z.enum(["none", "regular", "high"]).optional(),
  sync_mode: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana Pro text-to-image
// ---------------------------------------------------------------------------

export const FalNanoBananaProTextToImageRequestSchema = z.object({
  prompt: z.string(),
  num_images: z.number().optional(),
  seed: z.number().optional(),
  aspect_ratio: z
    .enum([
      "auto",
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  sync_mode: z.boolean().optional(),
  resolution: z.enum(["1K", "2K", "4K"]).optional(),
  limit_generations: z.boolean().optional(),
  enable_web_search: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana Pro edit
// ---------------------------------------------------------------------------

export const FalNanoBananaProEditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()),
  num_images: z.number().optional(),
  seed: z.number().optional(),
  aspect_ratio: z
    .enum([
      "auto",
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
    ])
    .optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
  sync_mode: z.boolean().optional(),
  resolution: z.enum(["1K", "2K", "4K"]).optional(),
  limit_generations: z.boolean().optional(),
  enable_web_search: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedream v5 Lite (shared image_size)
// ---------------------------------------------------------------------------

const FalSeedreamV5LiteImageSizeSchema = z.union([
  z.enum([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
    "auto_2K",
    "auto_3K",
  ]),
  z.object({ width: z.number(), height: z.number() }),
]);

// ---------------------------------------------------------------------------
// Bytedance Seedream v5 Lite edit
// ---------------------------------------------------------------------------

export const FalSeedreamV5LiteEditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()).min(1).max(10),
  image_size: FalSeedreamV5LiteImageSizeSchema.optional(),
  num_images: z.number().optional(),
  max_images: z.number().optional(),
  sync_mode: z.boolean().optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedream v5 Lite text-to-image
// ---------------------------------------------------------------------------

export const FalSeedreamV5LiteTextToImageRequestSchema = z.object({
  prompt: z.string(),
  image_size: FalSeedreamV5LiteImageSizeSchema.optional(),
  num_images: z.number().optional(),
  max_images: z.number().optional(),
  sync_mode: z.boolean().optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 text-to-image
// ---------------------------------------------------------------------------

const FalWanV2p7ImageSizeSchema = z.union([
  z.enum([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
  ]),
  z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
]);

const FalWanV2p7AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
]);
const FalWanV2p7ResolutionSchema = z.enum(["720p", "1080p"]);
const FalWanV2p7AudioSettingSchema = z.enum(["auto", "origin"]);

export const FalWanV2p7TextToImageRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  negative_prompt: z.string().max(500).optional(),
  image_size: FalWanV2p7ImageSizeSchema.optional(),
  max_images: z.number().int().min(1).max(5).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 edit (image-to-image)
// ---------------------------------------------------------------------------

export const FalWanV2p7EditRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  image_urls: z.array(z.string().url()).min(1).max(4),
  negative_prompt: z.string().max(500).optional(),
  image_size: FalWanV2p7ImageSizeSchema.optional(),
  num_images: z.number().int().min(1).max(4).optional(),
  enable_prompt_expansion: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hunyuan Image v3 Instruct Edit (image-to-image)
// ---------------------------------------------------------------------------

const FalHunyuanImageV3ImageSizeSchema = z.union([
  z.enum([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
    "auto",
  ]),
  z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
]);

export const FalHunyuanImageV3InstructEditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string().url()).min(1).max(3),
  image_size: FalHunyuanImageV3ImageSizeSchema.optional(),
  num_images: z.number().int().min(1).max(4).optional(),
  guidance_scale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional(),
  enable_safety_checker: z.boolean().optional(),
  sync_mode: z.boolean().optional(),
  output_format: z.enum(["jpeg", "png"]).optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 text-to-video
// ---------------------------------------------------------------------------

export const FalWanV2p7TextToVideoRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  audio_url: z.string().url().optional(),
  aspect_ratio: FalWanV2p7AspectRatioSchema.optional(),
  resolution: FalWanV2p7ResolutionSchema.optional(),
  duration: z.number().int().min(2).max(15).optional(),
  negative_prompt: z.string().max(500).optional(),
  enable_prompt_expansion: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 image-to-video
// ---------------------------------------------------------------------------

export const FalWanV2p7ImageToVideoRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  image_url: z.string().url(),
  end_image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  audio_url: z.string().url().optional(),
  resolution: FalWanV2p7ResolutionSchema.optional(),
  duration: z.number().int().min(2).max(15).optional(),
  negative_prompt: z.string().max(500).optional(),
  enable_prompt_expansion: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 reference-to-video
// ---------------------------------------------------------------------------

export const FalWanV2p7ReferenceToVideoRequestSchema = z
  .object({
    prompt: z.string().min(1).max(5000),
    reference_image_urls: z.array(z.string().url()).max(4).optional(),
    reference_video_urls: z.array(z.string().url()).max(4).optional(),
    negative_prompt: z.string().max(500).optional(),
    aspect_ratio: FalWanV2p7AspectRatioSchema.optional(),
    resolution: FalWanV2p7ResolutionSchema.optional(),
    duration: z.number().int().min(2).max(10).optional(),
    multi_shots: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    enable_safety_checker: z.boolean().optional(),
  })
  .refine(
    (v) =>
      (v.reference_image_urls && v.reference_image_urls.length > 0) ||
      (v.reference_video_urls && v.reference_video_urls.length > 0),
    {
      message:
        "wan/v2.7/reference-to-video requires at least one of reference_image_urls or reference_video_urls",
      path: ["reference_image_urls"],
    }
  );

// ---------------------------------------------------------------------------
// Wan v2.7 edit-video
// ---------------------------------------------------------------------------

export const FalWanV2p7EditVideoRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  video_url: z.string().url(),
  reference_image_url: z.string().url().optional(),
  resolution: FalWanV2p7ResolutionSchema.optional(),
  aspect_ratio: FalWanV2p7AspectRatioSchema.optional(),
  duration: z.number().int().min(0).max(10).optional(),
  audio_setting: FalWanV2p7AudioSettingSchema.optional(),
  negative_prompt: z.string().max(500).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Image
// ---------------------------------------------------------------------------

export const FalXaiGrokImagineImageRequestSchema = z.object({
  prompt: z.string(),
  num_images: z.number().int().min(1).max(4).optional(),
  aspect_ratio: z
    .enum([
      "2:1",
      "20:9",
      "19.5:9",
      "16:9",
      "4:3",
      "3:2",
      "1:1",
      "2:3",
      "3:4",
      "9:16",
      "9:19.5",
      "9:20",
      "1:2",
    ])
    .optional(),
  resolution: z.enum(["1k", "2k"]).optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  sync_mode: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Image edit
// ---------------------------------------------------------------------------

export const FalXaiGrokImagineImageEditRequestSchema = z.object({
  prompt: z.string(),
  num_images: z.number().int().min(1).max(4).optional(),
  resolution: z.enum(["1k", "2k"]).optional(),
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  sync_mode: z.boolean().optional(),
  image_urls: z.array(z.string()).max(3).optional(),
});

// ---------------------------------------------------------------------------
// Sora 2 text-to-video
// ---------------------------------------------------------------------------

export const FalSora2TextToVideoRequestSchema = z.object({
  prompt: z.string().max(5000),
  model: z
    .enum(["sora-2", "sora-2-2025-12-08", "sora-2-2025-10-06"])
    .optional(),
  resolution: z.enum(["720p"]).optional(),
  aspect_ratio: z.enum(["9:16", "16:9"]).optional(),
  duration: z
    .union([
      z.literal(4),
      z.literal(8),
      z.literal(12),
      z.literal(16),
      z.literal(20),
    ])
    .optional(),
  delete_video: z.boolean().optional(),
  character_ids: z.array(z.string()).max(2).optional(),
  detect_and_block_ip: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Sora 2 image-to-video
// ---------------------------------------------------------------------------

export const FalSora2ImageToVideoRequestSchema = z.object({
  prompt: z.string().max(5000),
  image_url: z.string(),
  model: z
    .enum(["sora-2", "sora-2-2025-12-08", "sora-2-2025-10-06"])
    .optional(),
  resolution: z.enum(["auto", "720p"]).optional(),
  aspect_ratio: z.enum(["auto", "9:16", "16:9"]).optional(),
  duration: z
    .union([
      z.literal(4),
      z.literal(8),
      z.literal(12),
      z.literal(16),
      z.literal(20),
    ])
    .optional(),
  delete_video: z.boolean().optional(),
  character_ids: z.array(z.string()).max(2).optional(),
  detect_and_block_ip: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Kling Video v3 Pro image-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoV3ProImageToVideoRequestSchema = z.object({
  start_image_url: z.string(),
  prompt: z.string().max(2500).optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  end_image_url: z.string().optional(),
  duration: z.string().optional(),
  generate_audio: z.boolean().optional(),
  shot_type: z.enum(["customize"]).optional(),
  negative_prompt: z.string().max(2500).optional(),
  cfg_scale: z.number().min(0).max(1).optional(),
  elements: z
    .array(
      z.object({
        frontal_image_url: z.string().optional(),
        reference_image_urls: z.array(z.string()).optional(),
        video_url: z.string().optional(),
        voice_id: z.string().optional(),
      })
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Storage upload (CDN) — initiate single PUT and multipart
// ---------------------------------------------------------------------------

const FalStorageLifecycleSchema = z.object({
  expiration_duration_seconds: z.number().int().positive(),
  allow_io_storage: z.boolean().optional(),
});

export const FalStorageUploadInitiateRequestSchema = z.object({
  file_name: z.string(),
  content_type: z.string(),
  storage_type: z.literal("fal-cdn-v3").optional(),
  lifecycle: FalStorageLifecycleSchema.optional(),
});

export const FalStorageUploadInitiateMultipartRequestSchema = z.object({
  file_name: z.string(),
  content_type: z.string(),
  storage_type: z.literal("fal-cdn-v3").optional(),
  lifecycle: FalStorageLifecycleSchema.optional(),
});

export const FalStorageUploadCompleteMultipartRequestSchema = z.object({
  upload_url: z.string(),
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().positive(),
        etag: z.string(),
      })
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// Kling Video v3 Pro text-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoV3ProTextToVideoRequestSchema = z.object({
  prompt: z.string().max(2500).optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  duration: z.string().optional(),
  generate_audio: z.boolean().optional(),
  shot_type: z.enum(["customize", "intelligent"]).optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  negative_prompt: z.string().max(2500).optional(),
  cfg_scale: z.number().min(0).max(2).optional(),
});

// ---------------------------------------------------------------------------
// Kling Video v3 Standard image-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoV3StandardImageToVideoRequestSchema = z.object({
  start_image_url: z.string(),
  prompt: z.string().max(2500).optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  end_image_url: z.string().optional(),
  duration: z.string().optional(),
  generate_audio: z.boolean().optional(),
  shot_type: z.enum(["customize", "intelligent"]).optional(),
  negative_prompt: z.string().max(2500).optional(),
  cfg_scale: z.number().min(0).max(2).optional(),
  elements: z
    .array(
      z.object({
        frontal_image_url: z.string().optional(),
        reference_image_urls: z.array(z.string()).optional(),
        video_url: z.string().optional(),
        voice_id: z.string().optional(),
      })
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Kling Video v3 Standard text-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoV3StandardTextToVideoRequestSchema = z.object({
  prompt: z.string().max(2500).optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  duration: z.string().optional(),
  generate_audio: z.boolean().optional(),
  shot_type: z.enum(["customize", "intelligent"]).optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  negative_prompt: z.string().max(2500).optional(),
  cfg_scale: z.number().min(0).max(2).optional(),
});

// ---------------------------------------------------------------------------
// Veo 3.1 text-to-video
// ---------------------------------------------------------------------------

export const FalVeo3p1TextToVideoRequestSchema = z.object({
  prompt: z.string().max(20000),
  aspect_ratio: z.enum(["16:9", "9:16"]).optional(),
  duration: z.enum(["4s", "6s", "8s"]).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  generate_audio: z.boolean().optional(),
  negative_prompt: z.string().optional(),
  seed: z.number().int().optional(),
  auto_fix: z.boolean().optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
});

// ---------------------------------------------------------------------------
// Veo 3.1 image-to-video
// ---------------------------------------------------------------------------

export const FalVeo3p1ImageToVideoRequestSchema = z.object({
  prompt: z.string().max(20000),
  image_url: z.string(),
  aspect_ratio: z.enum(["auto", "16:9", "9:16"]).optional(),
  duration: z.enum(["4s", "6s", "8s"]).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  generate_audio: z.boolean().optional(),
  negative_prompt: z.string().optional(),
  seed: z.number().int().optional(),
  auto_fix: z.boolean().optional(),
  safety_tolerance: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Video image-to-video
// ---------------------------------------------------------------------------

export const FalXaiGrokImagineVideoImageToVideoRequestSchema = z.object({
  prompt: z.string().max(4096),
  image_url: z.string(),
  duration: z.number().int().min(1).max(15).optional(),
  aspect_ratio: z
    .enum(["auto", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"])
    .optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Video reference-to-video
// ---------------------------------------------------------------------------

export const FalXaiGrokImagineVideoReferenceToVideoRequestSchema = z.object({
  prompt: z.string(),
  reference_image_urls: z.array(z.string()).max(7),
  duration: z.number().int().min(1).max(10).optional(),
  aspect_ratio: z
    .enum(["16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"])
    .optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Video extend-video
// ---------------------------------------------------------------------------

// Upstream server-side invariant: source video length + `duration` must be
// <= 15 seconds total, else it 422s with `video_duration_too_long`. Source
// length isn't a request parameter, so this can't be validated client-side;
// it's captured in `.describe()` below.
export const FalXaiGrokImagineVideoExtendVideoRequestSchema = z.object({
  prompt: z.string(),
  video_url: z
    .string()
    .describe(
      "Source video URL. MP4 (H.264/H.265/AV1), 2-15s. Source length + `duration` must not exceed 15s total."
    ),
  duration: z
    .number()
    .int()
    .min(2)
    .max(10)
    .optional()
    .describe(
      "Extension length in seconds (2-10, default 6). Source video length + this value must not exceed 15s total (server-enforced)."
    ),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Video edit-video
// ---------------------------------------------------------------------------

export const FalXaiGrokImagineVideoEditVideoRequestSchema = z.object({
  prompt: z.string(),
  video_url: z.string(),
  resolution: z.enum(["auto", "480p", "720p"]).optional(),
});

// ---------------------------------------------------------------------------
// ElevenLabs Speech to Text Scribe V2
// ---------------------------------------------------------------------------

export const FalElevenlabsSpeechToTextScribeV2RequestSchema = z.object({
  audio_url: z.string(),
  language_code: z.string().optional(),
  tag_audio_events: z.boolean().optional(),
  diarize: z.boolean().optional(),
  keyterms: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const FalOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  queueBaseURL: z.string().url().optional(),
  runBaseURL: z.string().url().optional(),
  restBaseURL: z.string().url().optional(),
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

export type FalEstimateRequest = z.infer<
  typeof FalPricingEstimateRequestSchema
>;
export type FalQueueSubmitParams = z.infer<typeof FalQueueSubmitRequestSchema>;
export type FalLogsStreamParams = z.infer<typeof FalLogsStreamRequestSchema>;
export type FalFilesUploadUrlParams = z.infer<
  typeof FalFilesUploadUrlRequestSchema
>;
export type FalFilesUploadLocalParams = z.infer<
  typeof FalFilesUploadLocalRequestSchema
>;
export type FalDeletePayloadsParams = z.infer<
  typeof FalDeletePayloadsRequestSchema
>;
export type FalSeedance2p0ImageToVideoParams = z.infer<
  typeof FalSeedance2p0ImageToVideoRequestSchema
>;
export type FalSeedance2p0TextToVideoParams = z.infer<
  typeof FalSeedance2p0TextToVideoRequestSchema
>;
export type FalSeedance2p0FastImageToVideoParams = z.infer<
  typeof FalSeedance2p0FastImageToVideoRequestSchema
>;
export type FalSeedance2p0FastTextToVideoParams = z.infer<
  typeof FalSeedance2p0FastTextToVideoRequestSchema
>;
export type FalSeedance2p0ReferenceToVideoParams = z.infer<
  typeof FalSeedance2p0ReferenceToVideoRequestSchema
>;
export type FalSeedance2p0FastReferenceToVideoParams = z.infer<
  typeof FalSeedance2p0FastReferenceToVideoRequestSchema
>;
export type FalNanoBananaProTextToImageParams = z.infer<
  typeof FalNanoBananaProTextToImageRequestSchema
>;
export type FalNanoBananaProEditParams = z.infer<
  typeof FalNanoBananaProEditRequestSchema
>;
export type FalNanoBanana2TextToImageParams = z.infer<
  typeof FalNanoBanana2TextToImageRequestSchema
>;
export type FalNanoBanana2EditParams = z.infer<
  typeof FalNanoBanana2EditRequestSchema
>;
export type FalSeedreamV5LiteEditParams = z.infer<
  typeof FalSeedreamV5LiteEditRequestSchema
>;
export type FalSeedreamV5LiteTextToImageParams = z.infer<
  typeof FalSeedreamV5LiteTextToImageRequestSchema
>;
export type FalElevenlabsSpeechToTextScribeV2Params = z.infer<
  typeof FalElevenlabsSpeechToTextScribeV2RequestSchema
>;
export type FalWanV2p7TextToImageParams = z.infer<
  typeof FalWanV2p7TextToImageRequestSchema
>;
export type FalWanV2p7EditParams = z.infer<typeof FalWanV2p7EditRequestSchema>;
export type FalWanV2p7TextToVideoParams = z.infer<
  typeof FalWanV2p7TextToVideoRequestSchema
>;
export type FalWanV2p7ImageToVideoParams = z.infer<
  typeof FalWanV2p7ImageToVideoRequestSchema
>;
export type FalWanV2p7ReferenceToVideoParams = z.infer<
  typeof FalWanV2p7ReferenceToVideoRequestSchema
>;
export type FalWanV2p7EditVideoParams = z.infer<
  typeof FalWanV2p7EditVideoRequestSchema
>;
export type FalXaiGrokImagineImageParams = z.infer<
  typeof FalXaiGrokImagineImageRequestSchema
>;
export type FalXaiGrokImagineImageEditParams = z.infer<
  typeof FalXaiGrokImagineImageEditRequestSchema
>;
export type FalQwenImageParams = z.infer<typeof FalQwenImageRequestSchema>;
export type FalQwenImageEditParams = z.infer<
  typeof FalQwenImageEditRequestSchema
>;
export type FalGptImage1p5Params = z.infer<typeof FalGptImage1p5RequestSchema>;
export type FalGptImage1p5EditParams = z.infer<
  typeof FalGptImage1p5EditRequestSchema
>;
export type FalNanoBananaTextToImageParams = z.infer<
  typeof FalNanoBananaTextToImageRequestSchema
>;
export type FalNanoBananaEditParams = z.infer<
  typeof FalNanoBananaEditRequestSchema
>;
export type FalXaiGrokImagineVideoImageToVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoImageToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoReferenceToVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoReferenceToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoExtendVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoExtendVideoRequestSchema
>;
export type FalXaiGrokImagineVideoEditVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoEditVideoRequestSchema
>;
export type FalVeo3p1TextToVideoParams = z.infer<
  typeof FalVeo3p1TextToVideoRequestSchema
>;
export type FalVeo3p1ImageToVideoParams = z.infer<
  typeof FalVeo3p1ImageToVideoRequestSchema
>;
export type FalStorageUploadInitiateParams = z.infer<
  typeof FalStorageUploadInitiateRequestSchema
>;
export type FalStorageUploadInitiateMultipartParams = z.infer<
  typeof FalStorageUploadInitiateMultipartRequestSchema
>;
export type FalStorageUploadCompleteMultipartParams = z.infer<
  typeof FalStorageUploadCompleteMultipartRequestSchema
>;
export type FalKlingVideoV3ProImageToVideoParams = z.infer<
  typeof FalKlingVideoV3ProImageToVideoRequestSchema
>;
export type FalKlingVideoV3ProTextToVideoParams = z.infer<
  typeof FalKlingVideoV3ProTextToVideoRequestSchema
>;
export type FalKlingVideoV3StandardImageToVideoParams = z.infer<
  typeof FalKlingVideoV3StandardImageToVideoRequestSchema
>;
export type FalKlingVideoV3StandardTextToVideoParams = z.infer<
  typeof FalKlingVideoV3StandardTextToVideoRequestSchema
>;
export type FalSora2TextToVideoParams = z.infer<
  typeof FalSora2TextToVideoRequestSchema
>;
export type FalSora2ImageToVideoParams = z.infer<
  typeof FalSora2ImageToVideoRequestSchema
>;
export type FalHunyuanImageV3InstructEditParams = z.infer<
  typeof FalHunyuanImageV3InstructEditRequestSchema
>;

// ---------------------------------------------------------------------------
// Kling Video o3 4k reference-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoO3p4kReferenceToVideoRequestSchema = z.object({
  prompt: z.string().optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  start_image_url: z.string().optional(),
  end_image_url: z.string().optional(),
  image_urls: z.array(z.string()).optional(),
  elements: z
    .array(
      z.object({
        frontal_image_url: z.string().optional(),
        reference_image_urls: z.array(z.string()).optional(),
        video_url: z.string().optional(),
        voice_id: z.string().optional(),
      })
    )
    .optional(),
  generate_audio: z.boolean().optional(),
  duration: z
    .enum([
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
    ])
    .optional(),
  shot_type: z.string().optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
});

export type FalKlingVideoO3p4kReferenceToVideoParams = z.infer<
  typeof FalKlingVideoO3p4kReferenceToVideoRequestSchema
>;
export type FalOptions = z.infer<typeof FalOptionsSchema>;
