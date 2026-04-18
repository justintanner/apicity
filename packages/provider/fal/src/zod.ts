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
// Bytedance Seedream v5 Lite edit
// ---------------------------------------------------------------------------

export const FalSeedreamV5LiteEditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()),
  image_size: z
    .union([
      z.enum(["auto_2K", "auto_4K"]),
      z.object({ width: z.number(), height: z.number() }),
    ])
    .optional(),
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
  image_size: z
    .union([
      z.enum(["auto_2K", "auto_4K"]),
      z.object({ width: z.number(), height: z.number() }),
    ])
    .optional(),
  num_images: z.number().optional(),
  max_images: z.number().optional(),
  sync_mode: z.boolean().optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 text-to-image
// ---------------------------------------------------------------------------

export const FalWanV2p7TextToImageRequestSchema = z.object({
  prompt: z.string(),
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
  max_images: z.number().int().min(1).max(5).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Wan v2.7 edit (image-to-image)
// ---------------------------------------------------------------------------

export const FalWanV2p7EditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()).min(1).max(4),
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
  num_images: z.number().int().min(1).max(4).optional(),
  enable_prompt_expansion: z.boolean().optional(),
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
export type FalOptions = z.infer<typeof FalOptionsSchema>;
