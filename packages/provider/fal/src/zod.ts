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
// Bytedance Seedance 2.5 shared vocabularies
// ---------------------------------------------------------------------------

const Seedance2p5ResolutionSchema = z.enum(["480p", "720p", "1080p"]);

const Seedance2p5DurationSchema = z.enum([
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
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
]);

const Seedance2p5AspectRatioSchema = z.enum([
  "auto",
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

const Seedance2p5BitrateModeSchema = z.enum(["standard", "high"]);

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.5 text-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p5TextToVideoRequestSchema = z.object({
  prompt: z.string(),
  resolution: Seedance2p5ResolutionSchema.optional(),
  duration: Seedance2p5DurationSchema.optional(),
  aspect_ratio: Seedance2p5AspectRatioSchema.optional(),
  generate_audio: z.boolean().optional(),
  bitrate_mode: Seedance2p5BitrateModeSchema.optional(),
  seed: z.number().int().optional(),
  end_user_id: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.5 image-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p5ImageToVideoRequestSchema =
  FalSeedance2p5TextToVideoRequestSchema.extend({
    image_url: z.string(),
    end_image_url: z.string().optional(),
  });

// ---------------------------------------------------------------------------
// Bytedance Seedance 2.5 reference-to-video
// ---------------------------------------------------------------------------

export const FalSeedance2p5ReferenceToVideoRequestSchema =
  FalSeedance2p5TextToVideoRequestSchema.extend({
    image_urls: z.array(z.string()).max(30).optional(),
    video_urls: z.array(z.string()).max(10).optional(),
    audio_urls: z.array(z.string()).max(10).optional(),
  }).superRefine((value, context) => {
    const imageCount = value.image_urls?.length ?? 0;
    const videoCount = value.video_urls?.length ?? 0;
    const audioCount = value.audio_urls?.length ?? 0;

    if (imageCount + videoCount + audioCount > 50) {
      context.addIssue({
        code: "custom",
        message: "Total reference inputs must not exceed 50",
      });
    }

    if (audioCount > 0 && imageCount === 0 && videoCount === 0) {
      context.addIssue({
        code: "custom",
        path: ["audio_urls"],
        message: "Audio references require at least one image or video",
      });
    }
  });

// ---------------------------------------------------------------------------
// Lightricks LTX-2.5 image-to-video (pro tier)
// ---------------------------------------------------------------------------

export const FalLtx2p5ImageToVideoProRequestSchema = z.object({
  image_url: z.string(),
  // When set, upstream generates a transition between the start and end
  // frames instead of animating the start frame alone.
  end_image_url: z.string().nullable().optional(),
  prompt: z.string().min(1).max(5000),
  // Output length in seconds, or "auto" to let the model choose. A fixed
  // vocabulary, not a model registry, so it stays a closed union.
  duration: z
    .union([z.literal(6), z.literal(8), z.literal(10), z.literal("auto")])
    .optional(),
  resolution: z.enum(["720p", "1080p"]).optional(),
  // "auto" derives the ratio from the start image.
  aspect_ratio: z.enum(["auto", "16:9", "9:16"]).optional(),
  fps: z.union([z.literal(24), z.literal(25), z.literal(50)]).optional(),
  generate_audio: z.boolean().optional(),
  camera_motion: z
    .enum([
      "dolly_in",
      "dolly_out",
      "dolly_left",
      "dolly_right",
      "jib_up",
      "jib_down",
      "static",
      "focus_shift",
    ])
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// Lightricks LTX-2.5 image-to-video (fast tier)
// ---------------------------------------------------------------------------

export const FalLtx2p5ImageToVideoFastRequestSchema = z.object({
  image_url: z.string(),
  // When set, upstream generates a transition between the start and end
  // frames instead of animating the start frame alone.
  end_image_url: z.string().nullable().optional(),
  prompt: z.string().min(1).max(5000),
  // Output length in seconds, or "auto" to let the model choose. The fast
  // tier reaches 20s, twice the pro tier's ceiling. A fixed vocabulary, not a
  // model registry, so it stays a closed union.
  duration: z
    .union([
      z.literal(6),
      z.literal(8),
      z.literal(10),
      z.literal(12),
      z.literal(14),
      z.literal(16),
      z.literal(18),
      z.literal(20),
      z.literal("auto"),
    ])
    .optional(),
  // Upstream couples length to resolution and frame rate: 24/25 fps reaches
  // 20s at 720p/1080p, 48/50 fps and the 1440p/2160p tiers cap at 10s. That
  // is a cross-field rule upstream enforces, not a shape this schema encodes.
  resolution: z.enum(["720p", "1080p", "1440p", "2160p"]).optional(),
  // "auto" derives the ratio from the start image.
  aspect_ratio: z.enum(["auto", "16:9", "9:16"]).optional(),
  fps: z
    .union([z.literal(24), z.literal(25), z.literal(48), z.literal(50)])
    .optional(),
  generate_audio: z.boolean().optional(),
  camera_motion: z
    .enum([
      "dolly_in",
      "dolly_out",
      "dolly_left",
      "dolly_right",
      "jib_up",
      "jib_down",
      "static",
      "focus_shift",
    ])
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana 2 text-to-image
// ---------------------------------------------------------------------------

export const FalNanoBanana2TextToImageRequestSchema = z.object({
  prompt: z.string(),
  num_images: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
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
  // Fal documents no `image_urls` cap (no `maxItems`); leave it unbounded.
  // The consumer-reported 14 and an earlier `.max(9)` are uncited.
  // Docs: https://fal.ai/models/fal-ai/nano-banana-2/edit
  image_urls: z.array(z.string()),
  num_images: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
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

const FalNanoBanana2LiteAspectRatioSchema = z.enum([
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
]);

const FalNanoBanana2LiteOutputFormatSchema = z.enum(["jpeg", "png", "webp"]);

const FalNanoBanana2LiteSafetyToleranceSchema = z.enum([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
]);

const FalNanoBanana2LiteThinkingLevelSchema = z.enum(["minimal", "high"]);

// ---------------------------------------------------------------------------
// Nano Banana 2 Lite text-to-image
// ---------------------------------------------------------------------------

export const FalNanoBanana2LiteTextToImageRequestSchema = z.object({
  prompt: z.string(),
  num_images: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
  aspect_ratio: FalNanoBanana2LiteAspectRatioSchema.optional(),
  output_format: FalNanoBanana2LiteOutputFormatSchema.optional(),
  safety_tolerance: FalNanoBanana2LiteSafetyToleranceSchema.optional(),
  sync_mode: z.boolean().optional(),
  system_prompt: z.string().optional(),
  limit_generations: z.boolean().optional(),
  thinking_level: FalNanoBanana2LiteThinkingLevelSchema.optional(),
});

// ---------------------------------------------------------------------------
// Nano Banana 2 Lite edit
// ---------------------------------------------------------------------------

export const FalNanoBanana2LiteEditRequestSchema =
  FalNanoBanana2LiteTextToImageRequestSchema.extend({
    image_urls: z.array(z.string()).optional(),
  });

// ---------------------------------------------------------------------------
// Google Virtual Try-On
// ---------------------------------------------------------------------------

export const FalVirtualTryOnRequestSchema = z.object({
  person_image_url: z.string(),
  product_image_url: z.string(),
  // Upstream documents 1..4 inclusive, defaulting to 1 when omitted.
  num_images: z.number().int().min(1).max(4).optional(),
});

// ---------------------------------------------------------------------------
// Topaz Precision Image Upscale (Gigapixel)
// ---------------------------------------------------------------------------

// Topaz versions its Gigapixel precision models on its own cadence — the
// endpoint's own prose still lists five while the schema enum already carries
// six ("High Fidelity V3" landed without the prose catching up) — so the enum
// is unioned with a family alias rather than closed or opened to bare
// `z.string()`. The alias matches Topaz's actual id grammar: title-cased words
// with an optional trailing `V<n>` revision, e.g. "High Fidelity V4".
const FalTopazPrecisionModelAliasSchema = z
  .string()
  .regex(
    /^[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)*(?: V\d+)?$/,
    'Expected a listed model or a Topaz precision alias (e.g. "High Fidelity V4")'
  );

export const FalTopazUpscaleImagePrecisionRequestSchema = z.object({
  image_url: z.string().min(1),
  model: z
    .enum([
      "Standard V2",
      "High Fidelity V3",
      "High Fidelity V2",
      "Low Resolution V2",
      "CGI",
      "Text Refine",
    ])
    .or(FalTopazPrecisionModelAliasSchema)
    .optional(),
  // Upstream documents 1..4 inclusive, defaulting to 2 when omitted.
  upscale_factor: z.number().min(1).max(4).optional(),
  crop_to_fill: z.boolean().optional(),
  output_format: z.enum(["jpeg", "png"]).optional(),
  subject_detection: z.enum(["All", "Foreground", "Background"]).optional(),
  face_enhancement: z.boolean().optional(),
  face_enhancement_creativity: z.number().min(0).max(1).optional(),
  face_enhancement_strength: z.number().min(0).max(1).optional(),
  // Upstream types these four as `number | null` with a model-dependent
  // default, so null is an accepted way to ask for the model's own default.
  sharpen: z.number().min(0).max(1).nullable().optional(),
  denoise: z.number().min(0).max(1).nullable().optional(),
  fix_compression: z.number().min(0).max(1).nullable().optional(),
  // Text Refine only; upstream's floor is 0.01, not 0.
  strength: z.number().min(0.01).max(1).nullable().optional(),
});
// Topaz Precision Video Upscale
// ---------------------------------------------------------------------------

// Topaz ships new precision engines and new revisions of existing ones on its
// own cadence — the endpoint's own prose names seven families while the schema
// enum already carries twenty-one concrete ids, and "Proteus Natural" appears
// in neither the prose list nor the older Gigapixel image family — so the enum
// is unioned with a family alias rather than closed or opened to a bare
// `z.string()`. The alias matches Topaz's actual id grammar: title-cased words,
// a literal `&`, and an optional trailing revision number ("Gaia 2",
// "Proteus V3").
const FalTopazPrecisionVideoModelAliasSchema = z
  .string()
  .regex(
    /^[A-Z][A-Za-z]*(?: (?:[A-Z][A-Za-z]*|&))*(?: (?:V\d+|\d+))?$/,
    'Expected a listed model or a Topaz precision alias (e.g. "Proteus V3")'
  );

export const FalTopazUpscaleVideoPrecisionRequestSchema = z.object({
  video_url: z.string(),
  model: z
    .enum([
      "Proteus",
      "Proteus Natural",
      "Iris",
      "Iris Low Quality",
      "Dione DV",
      "Dione TV",
      "Dione Robust",
      "Dione Dehalo",
      "Dione Robust Dehalo",
      "Artemis High Quality",
      "Artemis Medium Quality",
      "Artemis Low Quality",
      "Artemis Strong Halo",
      "Artemis Medium Halo",
      "Artemis Aliasing & Moire",
      "Gaia HQ",
      "Gaia CG",
      "Gaia 2",
      "Rhea",
      "Theia Fine Tune Detail",
      "Theia Fine Tune Fidelity",
    ])
    .or(FalTopazPrecisionVideoModelAliasSchema)
    .optional(),
  // Upstream documents 1..4 inclusive, defaulting to 2 when omitted.
  upscale_factor: z.number().min(1).max(4).optional(),
  // Apollo frame interpolation runs only when this differs from the source FPS.
  target_fps: z.number().int().min(16).max(60).nullable().optional(),
  // Upstream types these enhancement levels as `number | null` with a
  // model-dependent default, so null is an accepted way to ask for the model's
  // own default.
  compression: z.number().min(0).max(1).nullable().optional(),
  noise: z.number().min(0).max(1).nullable().optional(),
  halo: z.number().min(0).max(1).nullable().optional(),
  // Film grain is a 0..0.1 band in 0.01 steps, not the 0..1 of the levels above.
  grain: z.number().min(0).max(0.1).multipleOf(0.01).nullable().optional(),
  recover_detail: z.number().min(0).max(1).nullable().optional(),
  // Output codec toggle; upstream defaults to H265. The field name is
  // upstream's own casing.
  H264_output: z.boolean().optional(),
});
// Meshy-7 image-to-3D
// ---------------------------------------------------------------------------

export const FalMeshyV7ImageTo3dRequestSchema = z.object({
  image_url: z.string(),
  // Mesh generation mode, not a model registry. Upstream's OpenAPI document
  // advertises a third value, "lowpoly", but the endpoint rejects it live:
  // POST /meshy/v7/image-to-3d returns 422 `model_type: lowpoly is not
  // supported for meshy-7` (2026-08-28), so the published enum is wider than
  // the endpoint and only these two are accepted. "smart-topology" routes to
  // Meshy-T2, which caps target_polycount at 15,000 and cannot be combined
  // with ultra_mode.
  model_type: z.enum(["standard", "smart-topology"]).optional(),
  topology: z.enum(["quad", "triangle"]).optional(),
  target_polycount: z.number().int().min(100).max(300000).optional(),
  symmetry_mode: z.enum(["off", "auto", "on"]).optional(),
  should_remesh: z.boolean().optional(),
  should_texture: z.boolean().optional(),
  enable_pbr: z.boolean().optional(),
  // Upstream deprecates is_a_t_pose in favour of pose_mode; the empty string
  // is upstream's own "no specific pose" default.
  is_a_t_pose: z.boolean().optional(),
  pose_mode: z.enum(["a-pose", "t-pose", ""]).optional(),
  texture_prompt: z.string().max(600).optional(),
  texture_image_url: z.string().optional(),
  enable_rigging: z.boolean().optional(),
  rigging_height_meters: z.number().positive().optional(),
  enable_animation: z.boolean().optional(),
  // Meshy animation preset id. Upstream documents 0..696 inclusive (0 is
  // "Idle") and rejects anything outside that window with a 422.
  animation_action_id: z.number().int().min(0).max(696).optional(),
  enable_safety_checker: z.boolean().optional(),
  ultra_mode: z.boolean().optional(),
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
  seed: z.number().int().optional(),
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
  seed: z.number().int().optional(),
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
  num_images: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
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
  // Fal documents no `image_urls` cap (no `maxItems`); leave it unbounded.
  // The consumer-reported 14 and an earlier `.max(9)` are uncited.
  // Docs: https://fal.ai/models/fal-ai/nano-banana-pro/edit
  image_urls: z.array(z.string()),
  num_images: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
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

// Fal documents `auto_4K` as an `image_size` preset (not a standalone boolean)
// on both Seedream 5 Lite surfaces.
// Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/edit
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
    "auto_4K",
  ]),
  z.object({ width: z.number(), height: z.number() }),
]);

// ---------------------------------------------------------------------------
// Bytedance Seedream v5 Lite edit
// ---------------------------------------------------------------------------

export const FalSeedreamV5LiteEditRequestSchema = z.object({
  prompt: z.string(),
  image_urls: z.array(z.string()).min(1).max(10),
  // `auto_4K` is an `image_size` preset, not a boolean; see
  // FalSeedreamV5LiteImageSizeSchema above. `return_byteplus_urls` is
  // documented only on the text-to-image surface, so it is absent here.
  // Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/edit
  image_size: FalSeedreamV5LiteImageSizeSchema.optional(),
  // Fal documents `num_images` and `max_images` as integers in [1, 6].
  // Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/edit
  num_images: z.number().int().min(1).max(6).optional(),
  max_images: z.number().int().min(1).max(6).optional(),
  sync_mode: z.boolean().optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedream v5 Lite text-to-image
// ---------------------------------------------------------------------------

export const FalSeedreamV5LiteTextToImageRequestSchema = z.object({
  prompt: z.string(),
  // `auto_4K` is an `image_size` preset, not a standalone boolean; see
  // FalSeedreamV5LiteImageSizeSchema above.
  // Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/text-to-image
  image_size: FalSeedreamV5LiteImageSizeSchema.optional(),
  // Fal documents `return_byteplus_urls` (boolean, default false), on the
  // text-to-image surface only.
  // Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/text-to-image
  return_byteplus_urls: z.boolean().optional(),
  // Fal documents `num_images` and `max_images` as integers in [1, 6].
  // Docs: https://fal.ai/models/fal-ai/bytedance/seedream/v5/lite/text-to-image
  num_images: z.number().int().min(1).max(6).optional(),
  max_images: z.number().int().min(1).max(6).optional(),
  sync_mode: z.boolean().optional(),
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seedream v5 Pro layerize
// ---------------------------------------------------------------------------

// Decomposes one image into a base image plus independently editable layers.
// `image_url` is the only required field; everything else is optional with an
// upstream default. Docs:
// https://fal.ai/models/bytedance/seedream/v5/pro/layerize/api
export const FalSeedreamV5ProLayerizeRequestSchema = z.object({
  // Upstream constrains the source image to 512x512..6000x6000 total pixels,
  // an aspect ratio within [1/16, 16], and 30 MB. Those are upstream capacity
  // rules over the fetched bytes, not request shape, so they are not encoded.
  image_url: z.string(),
  // Optional instructions naming which elements to separate; the default empty
  // string lets the model pick the major elements. Normalized
  // `<bbox>left top right bottom</bbox>` tags target precise coordinates.
  prompt: z.string().optional(),
  // Resolution tier for the base image and every layer. A fixed vocabulary
  // rather than a model registry, so it stays a closed enum.
  image_size: z.enum(["auto", "auto_1K", "auto_1.5K", "auto_2K"]).optional(),
  // Prompt optimization mode: `standard` favours image quality, `fast` cuts
  // generation time. Also a closed vocabulary.
  enhance_prompt_mode: z.enum(["standard", "fast"]).optional(),
  sync_mode: z.boolean().optional(),
  // Upstream notes that disabling the safety checker requires account
  // authorization; unauthorized requests are checked regardless.
  enable_safety_checker: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Bytedance Seed Speech TTS v2
// ---------------------------------------------------------------------------

const FalSeedSpeechTtsV2VoiceSchema = z.enum([
  "vivi_mixed_en_zh_ja_es_id",
  "mindy_en_es_id_pt_zh",
  "stokie_en",
  "dacey_en",
  "tim_en",
  "kian_en_zh",
  "cedric_en_zh",
  "sophie_en_zh",
  "jean_en_zh",
  "magnus_en_zh",
  "mabel_en_zh",
  "nadia_en_zh",
  "opal_en_zh",
  "pearl_en_zh",
  "quentin_en_zh",
  "vienna_mixed_en_zh",
  "alina_mixed_en_zh",
  "corinne_mixed_en_zh",
  "esther_mixed_en_zh",
  "freya_mixed_en_zh",
  "gigi_mixed_en_zh",
  "holly_mixed_en_zh",
  "lyla_mixed_en_zh",
  "daisy_mixed_en_zh",
  "tracy_es_zh",
  "jess_ja_es_id_pt_en_zh",
  "pinky_es_ko_mixed_en_zh",
  "sweety_ja_es",
  "sandy_es_mixed_en_zh",
  "sven_de",
  "minimi_ja",
  "usseau_fr",
  "felipe_es",
  "han_id",
  "martins_pt",
  "enzo_it",
  "shane_ko",
  "bonnie_zh",
  "felix_zh",
  "celeste_zh",
  "monkey_king_zh",
]);

const FalSeedSpeechTtsV2LanguageSchema = z.enum([
  "zh",
  "en",
  "ja",
  "es-mx",
  "id",
  "pt-br",
  "ko",
  "it",
  "de",
  "fr",
]);

export const FalSeedSpeechTtsV2RequestSchema = z.object({
  text: z.string().max(5000),
  voice: FalSeedSpeechTtsV2VoiceSchema.optional(),
  output_format: z.enum(["mp3", "opus"]).optional(),
  sample_rate: z
    .union([
      z.literal(8000),
      z.literal(16000),
      z.literal(22050),
      z.literal(24000),
      z.literal(32000),
      z.literal(44100),
      z.literal(48000),
    ])
    .optional(),
  speed: z.number().min(0.5).max(2).optional(),
  volume: z.number().min(0.5).max(2).optional(),
  pitch: z.number().int().min(-12).max(12).optional(),
  language: FalSeedSpeechTtsV2LanguageSchema.nullable().optional(),
  voice_instruction: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// MiniMax Music 3
// ---------------------------------------------------------------------------

// Bounds are upstream's own, read on 2026-08-28 from
// https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=minimax/music-3.
// `prompt` and `lyrics` are the only required fields; the rest are closed
// numeric ranges. No field names a model, so the open-enum rule does not apply.
export const FalMinimaxMusic3RequestSchema = z.object({
  prompt: z.string(),
  lyrics: z.string(),
  // Upper bound on the generated audio length in seconds. The model may stop
  // earlier and reports the length it actually produced in the response.
  duration: z.number().min(1).max(300).optional(),
  seed: z.number().int().nullable().optional(),
  // Flow-matching Euler steps per 8-second denoising chunk.
  num_inference_steps: z.number().int().min(1).max(100).optional(),
  guidance_scale: z.number().min(0).max(20).optional(),
});

// ---------------------------------------------------------------------------
// Alibaba Qwen Image 3 text-to-image
// ---------------------------------------------------------------------------

// Fal publishes a total-pixel range of 512x512 through 2048x2048 and a
// per-dimension maximum of 14142. It publishes no per-dimension minimum, so a
// [512, 2048] rule would reject the docs page's own { width: 1280, height: 720 }
// example.
// Docs: https://fal.ai/models/alibaba/qwen-image-3/text-to-image/api
const FalAlibabaQwenImage3ImageSizeSchema = z.union([
  z.enum([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
  ]),
  z
    .object({
      width: z.number().int().positive().max(14142),
      height: z.number().int().positive().max(14142),
    })
    .refine(
      (value) =>
        value.width * value.height >= 512 * 512 &&
        value.width * value.height <= 2048 * 2048,
      {
        message:
          "alibaba/qwen-image-3/text-to-image image_size total pixels must be between 512x512 and 2048x2048",
        path: ["width"],
      }
    ),
]);

export const FalAlibabaQwenImage3TextToImageRequestSchema = z.object({
  // Supports Chinese and English; max 5000 characters.
  prompt: z.string().min(1).max(5000),
  // Upstream default "".
  negative_prompt: z.string().max(500).optional(),
  // Upstream default square_hd.
  image_size: FalAlibabaQwenImage3ImageSizeSchema.optional(),
  // Upstream default true.
  enable_prompt_expansion: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  // Upstream default true. Disabling requires account authorization;
  // unauthorized requests are checked anyway.
  enable_safety_checker: z.boolean().optional(),
  sync_mode: z.boolean().optional(),
  // Upstream default 1; published range 1-6.
  num_images: z.number().int().min(1).max(6).optional(),
  // Upstream default "png".
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
});

// ---------------------------------------------------------------------------
// Alibaba Qwen Image 3 edit
// ---------------------------------------------------------------------------

// Same image_size vocabulary and total-pixel rule as text-to-image; only the
// error message names this endpoint.
// Docs: https://fal.ai/models/alibaba/qwen-image-3/edit/api
const FalAlibabaQwenImage3EditImageSizeSchema = z.union([
  z.enum([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
  ]),
  z
    .object({
      width: z.number().int().positive().max(14142),
      height: z.number().int().positive().max(14142),
    })
    .refine(
      (value) =>
        value.width * value.height >= 512 * 512 &&
        value.width * value.height <= 2048 * 2048,
      {
        message:
          "alibaba/qwen-image-3/edit image_size total pixels must be between 512x512 and 2048x2048",
        path: ["width"],
      }
    ),
]);

export const FalAlibabaQwenImage3EditRequestSchema = z.object({
  // Supports Chinese and English; max 5000 characters. Reference the inputs
  // positionally as "image 1", "image 2", "image 3".
  prompt: z.string().min(1).max(5000),
  // 1-3 reference images, 384-2048px per dimension, 10MB each, JPEG/PNG
  // (no alpha)/WEBP. Order is meaningful.
  image_urls: z.array(z.string()).min(1).max(3),
  // Upstream default "".
  negative_prompt: z.string().max(500).nullable().optional(),
  // Upstream default square_hd.
  image_size: FalAlibabaQwenImage3EditImageSizeSchema.nullable().optional(),
  // Upstream default true.
  enable_prompt_expansion: z.boolean().optional(),
  seed: z.number().int().nullable().optional(),
  // Upstream default true. Disabling requires account authorization;
  // unauthorized requests are checked anyway.
  enable_safety_checker: z.boolean().optional(),
  sync_mode: z.boolean().optional(),
  // Upstream default 1; published range 1-6.
  num_images: z.number().int().min(1).max(6).optional(),
  // Upstream default "png".
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
});

// ---------------------------------------------------------------------------
// Alibaba Wan 3.0 shared vocabularies
// ---------------------------------------------------------------------------

// The base `alibaba/wan-3.0/*` and premium `alibaba/wan-3.0-prime/*` families
// publish byte-identical request schemas per operation — only their billing
// differs (compute-second metering vs a flat $0.05 per output second). Each
// operation therefore defines one schema that both endpoint ids reuse, the
// same way `fal-ai/wan/v2.7/pro/*` reuses its non-pro schemas.
// Docs: https://fal.ai/models/alibaba/wan-3.0/text-to-video/api

const FalWan3p0ResolutionSchema = z.enum(["480p", "720p", "1080p"]);

const FalWan3p0AspectRatioSchema = z.enum([
  "adaptive",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

// Upstream default 5, published range 2-30. An explicit null selects "smart
// duration", where the model picks the length from the prompt and reference
// media, so null is a meaningful value rather than an omission.
const FalWan3p0DurationSchema = z
  .number()
  .int()
  .min(2)
  .max(30)
  .nullable()
  .optional();

const FalWan3p0SeedSchema = z
  .number()
  .int()
  .min(0)
  .max(2147483647)
  .nullable()
  .optional();

// Shared across all three Wan 3.0 operations. Upstream defaults: resolution
// 1080p, aspect_ratio adaptive, audio true, enable_prompt_expansion true,
// enable_thinking false, enable_safety_checker true.
const falWan3p0CommonFields = {
  resolution: FalWan3p0ResolutionSchema.optional(),
  aspect_ratio: FalWan3p0AspectRatioSchema.optional(),
  duration: FalWan3p0DurationSchema,
  audio: z.boolean().optional(),
  enable_prompt_expansion: z.boolean().optional(),
  enable_thinking: z.boolean().optional(),
  seed: FalWan3p0SeedSchema,
  // Disabling requires account authorization; unauthorized requests are
  // checked anyway.
  enable_safety_checker: z.boolean().optional(),
};

// ---------------------------------------------------------------------------
// Alibaba Wan 3.0 text-to-video
// ---------------------------------------------------------------------------

export const FalWan3p0TextToVideoRequestSchema = z.object({
  prompt: z.string().min(1).max(5000),
  ...falWan3p0CommonFields,
});

// ---------------------------------------------------------------------------
// Alibaba Wan 3.0 image-to-video
// ---------------------------------------------------------------------------

export const FalWan3p0ImageToVideoRequestSchema = z.object({
  // Optional here — the start frame alone is a complete request.
  prompt: z.string().max(5000).nullable().optional(),
  start_image_url: z.string().url(),
  end_image_url: z.string().url().nullable().optional(),
  ...falWan3p0CommonFields,
});

// ---------------------------------------------------------------------------
// Alibaba Wan 3.0 reference-to-video
// ---------------------------------------------------------------------------

// Upstream marks every field optional, but a reference-to-video call with no
// reference media and no prompt has nothing to work from. Requiring at least
// one grounding input mirrors the `wan/v2.7/reference-to-video` refinement.
export const FalWan3p0ReferenceToVideoRequestSchema = z
  .object({
    prompt: z.string().max(5000).nullable().optional(),
    reference_image_urls: z.array(z.string().url()).max(10).optional(),
    // Up to 5 clips totaling at most 15 seconds, each at least 16 fps.
    reference_video_urls: z.array(z.string().url()).max(5).optional(),
    // Up to 5 clips totaling at most 15 seconds.
    reference_audio_urls: z.array(z.string().url()).max(5).optional(),
    // Both require enable_thinking=true upstream; web_url must not need login.
    file_url: z.string().url().nullable().optional(),
    web_url: z.string().url().nullable().optional(),
    ...falWan3p0CommonFields,
  })
  .refine(
    (v) =>
      (v.reference_image_urls && v.reference_image_urls.length > 0) ||
      (v.reference_video_urls && v.reference_video_urls.length > 0) ||
      (v.reference_audio_urls && v.reference_audio_urls.length > 0) ||
      Boolean(v.file_url) ||
      Boolean(v.web_url) ||
      Boolean(v.prompt),
    {
      message:
        "alibaba/wan-3.0/reference-to-video requires at least one of reference_image_urls, reference_video_urls, reference_audio_urls, file_url, web_url, or prompt",
      path: ["reference_image_urls"],
    }
  );

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
// xAI Grok Imagine Image v2.0 text-to-image
// ---------------------------------------------------------------------------

const FAL_XAI_GROK_IMAGINE_IMAGE_V2P0_ASPECT_RATIOS = [
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
] as const;

export const FalXaiGrokImagineImageV2p0TextToImageRequestSchema = z.object({
  prompt: z.string().min(1),
  // Upstream default 1. The page publishes no ceiling, so mirror v1's 1-4.
  num_images: z.number().int().min(1).max(4).optional(),
  // Upstream default "1:1".
  aspect_ratio: z
    .enum(FAL_XAI_GROK_IMAGINE_IMAGE_V2P0_ASPECT_RATIOS)
    .optional(),
  // Upstream default "1k".
  resolution: z.enum(["1k", "2k"]).optional(),
  // Upstream default "medium".
  quality: z.enum(["low", "medium"]).optional(),
  // Upstream default "jpeg".
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  sync_mode: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// xAI Grok Imagine Image v2.0 edit
// ---------------------------------------------------------------------------

export const FalXaiGrokImagineImageV2p0EditRequestSchema = z.object({
  prompt: z.string().min(1),
  // Upstream default 1. The page publishes no ceiling, so mirror v1's 1-4.
  num_images: z.number().int().min(1).max(4).optional(),
  // Upstream default "auto".
  aspect_ratio: z
    .enum(["auto", ...FAL_XAI_GROK_IMAGINE_IMAGE_V2P0_ASPECT_RATIOS])
    .optional(),
  // Upstream default "1k".
  resolution: z.enum(["1k", "2k"]).optional(),
  // Upstream default "medium".
  quality: z.enum(["low", "medium"]).optional(),
  // Upstream default "jpeg".
  output_format: z.enum(["jpeg", "png", "webp"]).optional(),
  sync_mode: z.boolean().optional(),
  image_urls: z.array(z.string()).min(1).max(3),
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

export type FalEstimateRequest = z.input<
  typeof FalPricingEstimateRequestSchema
>;
export type FalEstimateRequestInput = FalEstimateRequest;
export type FalEstimateParsedRequest = z.output<
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
export type FalSeedance2p0ImageToVideoRequest = z.input<
  typeof FalSeedance2p0ImageToVideoRequestSchema
>;
export type FalSeedance2p0ImageToVideoRequestInput =
  FalSeedance2p0ImageToVideoRequest;
export type FalSeedance2p0ImageToVideoParsedRequest = z.output<
  typeof FalSeedance2p0ImageToVideoRequestSchema
>;
export type FalSeedance2p0TextToVideoParams = z.infer<
  typeof FalSeedance2p0TextToVideoRequestSchema
>;
export type FalSeedance2p0TextToVideoRequest = z.input<
  typeof FalSeedance2p0TextToVideoRequestSchema
>;
export type FalSeedance2p0TextToVideoRequestInput =
  FalSeedance2p0TextToVideoRequest;
export type FalSeedance2p0TextToVideoParsedRequest = z.output<
  typeof FalSeedance2p0TextToVideoRequestSchema
>;
export type FalSeedance2p0FastImageToVideoParams = z.infer<
  typeof FalSeedance2p0FastImageToVideoRequestSchema
>;
export type FalSeedance2p0FastImageToVideoRequest = z.input<
  typeof FalSeedance2p0FastImageToVideoRequestSchema
>;
export type FalSeedance2p0FastImageToVideoRequestInput =
  FalSeedance2p0FastImageToVideoRequest;
export type FalSeedance2p0FastImageToVideoParsedRequest = z.output<
  typeof FalSeedance2p0FastImageToVideoRequestSchema
>;
export type FalSeedance2p0FastTextToVideoParams = z.infer<
  typeof FalSeedance2p0FastTextToVideoRequestSchema
>;
export type FalSeedance2p0FastTextToVideoRequest = z.input<
  typeof FalSeedance2p0FastTextToVideoRequestSchema
>;
export type FalSeedance2p0FastTextToVideoRequestInput =
  FalSeedance2p0FastTextToVideoRequest;
export type FalSeedance2p0FastTextToVideoParsedRequest = z.output<
  typeof FalSeedance2p0FastTextToVideoRequestSchema
>;
export type FalSeedance2p0ReferenceToVideoParams = z.infer<
  typeof FalSeedance2p0ReferenceToVideoRequestSchema
>;
export type FalSeedance2p0ReferenceToVideoRequest = z.input<
  typeof FalSeedance2p0ReferenceToVideoRequestSchema
>;
export type FalSeedance2p0ReferenceToVideoRequestInput =
  FalSeedance2p0ReferenceToVideoRequest;
export type FalSeedance2p0ReferenceToVideoParsedRequest = z.output<
  typeof FalSeedance2p0ReferenceToVideoRequestSchema
>;
export type FalSeedance2p0FastReferenceToVideoParams = z.infer<
  typeof FalSeedance2p0FastReferenceToVideoRequestSchema
>;
export type FalSeedance2p0FastReferenceToVideoRequest = z.input<
  typeof FalSeedance2p0FastReferenceToVideoRequestSchema
>;
export type FalSeedance2p0FastReferenceToVideoRequestInput =
  FalSeedance2p0FastReferenceToVideoRequest;
export type FalSeedance2p0FastReferenceToVideoParsedRequest = z.output<
  typeof FalSeedance2p0FastReferenceToVideoRequestSchema
>;
export type FalSeedance2p5TextToVideoParams = z.infer<
  typeof FalSeedance2p5TextToVideoRequestSchema
>;
export type FalSeedance2p5TextToVideoRequest = z.input<
  typeof FalSeedance2p5TextToVideoRequestSchema
>;
export type FalSeedance2p5TextToVideoRequestInput =
  FalSeedance2p5TextToVideoRequest;
export type FalSeedance2p5TextToVideoParsedRequest = z.output<
  typeof FalSeedance2p5TextToVideoRequestSchema
>;
export type FalSeedance2p5ImageToVideoParams = z.infer<
  typeof FalSeedance2p5ImageToVideoRequestSchema
>;
export type FalSeedance2p5ImageToVideoRequest = z.input<
  typeof FalSeedance2p5ImageToVideoRequestSchema
>;
export type FalSeedance2p5ImageToVideoRequestInput =
  FalSeedance2p5ImageToVideoRequest;
export type FalSeedance2p5ImageToVideoParsedRequest = z.output<
  typeof FalSeedance2p5ImageToVideoRequestSchema
>;
export type FalSeedance2p5ReferenceToVideoParams = z.infer<
  typeof FalSeedance2p5ReferenceToVideoRequestSchema
>;
export type FalSeedance2p5ReferenceToVideoRequest = z.input<
  typeof FalSeedance2p5ReferenceToVideoRequestSchema
>;
export type FalSeedance2p5ReferenceToVideoRequestInput =
  FalSeedance2p5ReferenceToVideoRequest;
export type FalSeedance2p5ReferenceToVideoParsedRequest = z.output<
  typeof FalSeedance2p5ReferenceToVideoRequestSchema
>;
export type FalLtx2p5ImageToVideoProParams = z.infer<
  typeof FalLtx2p5ImageToVideoProRequestSchema
>;
export type FalLtx2p5ImageToVideoProRequest = z.input<
  typeof FalLtx2p5ImageToVideoProRequestSchema
>;
export type FalLtx2p5ImageToVideoProRequestInput =
  FalLtx2p5ImageToVideoProRequest;
export type FalLtx2p5ImageToVideoProParsedRequest = z.output<
  typeof FalLtx2p5ImageToVideoProRequestSchema
>;
export type FalLtx2p5ImageToVideoFastParams = z.infer<
  typeof FalLtx2p5ImageToVideoFastRequestSchema
>;
export type FalLtx2p5ImageToVideoFastRequest = z.input<
  typeof FalLtx2p5ImageToVideoFastRequestSchema
>;
export type FalLtx2p5ImageToVideoFastRequestInput =
  FalLtx2p5ImageToVideoFastRequest;
export type FalLtx2p5ImageToVideoFastParsedRequest = z.output<
  typeof FalLtx2p5ImageToVideoFastRequestSchema
>;
export type FalNanoBananaProTextToImageParams = z.infer<
  typeof FalNanoBananaProTextToImageRequestSchema
>;
export type FalNanoBananaProTextToImageRequest = z.input<
  typeof FalNanoBananaProTextToImageRequestSchema
>;
export type FalNanoBananaProTextToImageRequestInput =
  FalNanoBananaProTextToImageRequest;
export type FalNanoBananaProTextToImageParsedRequest = z.output<
  typeof FalNanoBananaProTextToImageRequestSchema
>;
export type FalNanoBananaProEditParams = z.infer<
  typeof FalNanoBananaProEditRequestSchema
>;
export type FalNanoBananaProEditRequest = z.input<
  typeof FalNanoBananaProEditRequestSchema
>;
export type FalNanoBananaProEditRequestInput = FalNanoBananaProEditRequest;
export type FalNanoBananaProEditParsedRequest = z.output<
  typeof FalNanoBananaProEditRequestSchema
>;
export type FalNanoBanana2TextToImageParams = z.infer<
  typeof FalNanoBanana2TextToImageRequestSchema
>;
export type FalNanoBanana2TextToImageRequest = z.input<
  typeof FalNanoBanana2TextToImageRequestSchema
>;
export type FalNanoBanana2TextToImageRequestInput =
  FalNanoBanana2TextToImageRequest;
export type FalNanoBanana2TextToImageParsedRequest = z.output<
  typeof FalNanoBanana2TextToImageRequestSchema
>;
export type FalNanoBanana2EditParams = z.infer<
  typeof FalNanoBanana2EditRequestSchema
>;
export type FalNanoBanana2EditRequest = z.input<
  typeof FalNanoBanana2EditRequestSchema
>;
export type FalNanoBanana2EditRequestInput = FalNanoBanana2EditRequest;
export type FalNanoBanana2EditParsedRequest = z.output<
  typeof FalNanoBanana2EditRequestSchema
>;
export type FalNanoBanana2LiteTextToImageParams = z.infer<
  typeof FalNanoBanana2LiteTextToImageRequestSchema
>;
export type FalNanoBanana2LiteTextToImageRequest = z.input<
  typeof FalNanoBanana2LiteTextToImageRequestSchema
>;
export type FalNanoBanana2LiteTextToImageRequestInput =
  FalNanoBanana2LiteTextToImageRequest;
export type FalNanoBanana2LiteTextToImageParsedRequest = z.output<
  typeof FalNanoBanana2LiteTextToImageRequestSchema
>;
export type FalNanoBanana2LiteEditParams = z.infer<
  typeof FalNanoBanana2LiteEditRequestSchema
>;
export type FalNanoBanana2LiteEditRequest = z.input<
  typeof FalNanoBanana2LiteEditRequestSchema
>;
export type FalNanoBanana2LiteEditRequestInput = FalNanoBanana2LiteEditRequest;
export type FalNanoBanana2LiteEditParsedRequest = z.output<
  typeof FalNanoBanana2LiteEditRequestSchema
>;

export type FalVirtualTryOnParams = z.infer<
  typeof FalVirtualTryOnRequestSchema
>;
export type FalVirtualTryOnRequest = z.input<
  typeof FalVirtualTryOnRequestSchema
>;
export type FalVirtualTryOnRequestInput = FalVirtualTryOnRequest;
export type FalVirtualTryOnParsedRequest = z.output<
  typeof FalVirtualTryOnRequestSchema
>;

export type FalTopazUpscaleImagePrecisionParams = z.infer<
  typeof FalTopazUpscaleImagePrecisionRequestSchema
>;
export type FalTopazUpscaleImagePrecisionRequest = z.input<
  typeof FalTopazUpscaleImagePrecisionRequestSchema
>;
export type FalTopazUpscaleImagePrecisionRequestInput =
  FalTopazUpscaleImagePrecisionRequest;
export type FalTopazUpscaleImagePrecisionParsedRequest = z.output<
  typeof FalTopazUpscaleImagePrecisionRequestSchema
>;
export type FalTopazUpscaleVideoPrecisionParams = z.infer<
  typeof FalTopazUpscaleVideoPrecisionRequestSchema
>;
export type FalTopazUpscaleVideoPrecisionRequest = z.input<
  typeof FalTopazUpscaleVideoPrecisionRequestSchema
>;
export type FalTopazUpscaleVideoPrecisionRequestInput =
  FalTopazUpscaleVideoPrecisionRequest;
export type FalTopazUpscaleVideoPrecisionParsedRequest = z.output<
  typeof FalTopazUpscaleVideoPrecisionRequestSchema
>;
export type FalMeshyV7ImageTo3dParams = z.infer<
  typeof FalMeshyV7ImageTo3dRequestSchema
>;
export type FalMeshyV7ImageTo3dRequest = z.input<
  typeof FalMeshyV7ImageTo3dRequestSchema
>;
export type FalMeshyV7ImageTo3dRequestInput = FalMeshyV7ImageTo3dRequest;
export type FalMeshyV7ImageTo3dParsedRequest = z.output<
  typeof FalMeshyV7ImageTo3dRequestSchema
>;
export type FalSeedreamV5LiteEditParams = z.infer<
  typeof FalSeedreamV5LiteEditRequestSchema
>;
export type FalSeedreamV5LiteEditRequest = z.input<
  typeof FalSeedreamV5LiteEditRequestSchema
>;
export type FalSeedreamV5LiteEditRequestInput = FalSeedreamV5LiteEditRequest;
export type FalSeedreamV5LiteEditParsedRequest = z.output<
  typeof FalSeedreamV5LiteEditRequestSchema
>;
export type FalSeedreamV5LiteTextToImageParams = z.infer<
  typeof FalSeedreamV5LiteTextToImageRequestSchema
>;
export type FalSeedreamV5LiteTextToImageRequest = z.input<
  typeof FalSeedreamV5LiteTextToImageRequestSchema
>;
export type FalSeedreamV5LiteTextToImageRequestInput =
  FalSeedreamV5LiteTextToImageRequest;
export type FalSeedreamV5LiteTextToImageParsedRequest = z.output<
  typeof FalSeedreamV5LiteTextToImageRequestSchema
>;
export type FalSeedreamV5ProLayerizeParams = z.infer<
  typeof FalSeedreamV5ProLayerizeRequestSchema
>;
export type FalSeedreamV5ProLayerizeRequest = z.input<
  typeof FalSeedreamV5ProLayerizeRequestSchema
>;
export type FalSeedreamV5ProLayerizeRequestInput =
  FalSeedreamV5ProLayerizeRequest;
export type FalSeedreamV5ProLayerizeParsedRequest = z.output<
  typeof FalSeedreamV5ProLayerizeRequestSchema
>;
export type FalSeedSpeechTtsV2Params = z.infer<
  typeof FalSeedSpeechTtsV2RequestSchema
>;
export type FalSeedSpeechTtsV2Request = z.input<
  typeof FalSeedSpeechTtsV2RequestSchema
>;
export type FalSeedSpeechTtsV2RequestInput = FalSeedSpeechTtsV2Request;
export type FalSeedSpeechTtsV2ParsedRequest = z.output<
  typeof FalSeedSpeechTtsV2RequestSchema
>;
export type FalMinimaxMusic3Params = z.infer<
  typeof FalMinimaxMusic3RequestSchema
>;
export type FalMinimaxMusic3Request = z.input<
  typeof FalMinimaxMusic3RequestSchema
>;
export type FalMinimaxMusic3RequestInput = FalMinimaxMusic3Request;
export type FalMinimaxMusic3ParsedRequest = z.output<
  typeof FalMinimaxMusic3RequestSchema
>;
export type FalElevenlabsSpeechToTextScribeV2Params = z.infer<
  typeof FalElevenlabsSpeechToTextScribeV2RequestSchema
>;
export type FalElevenlabsSpeechToTextScribeV2Request = z.input<
  typeof FalElevenlabsSpeechToTextScribeV2RequestSchema
>;
export type FalElevenlabsSpeechToTextScribeV2RequestInput =
  FalElevenlabsSpeechToTextScribeV2Request;
export type FalElevenlabsSpeechToTextScribeV2ParsedRequest = z.output<
  typeof FalElevenlabsSpeechToTextScribeV2RequestSchema
>;
export type FalAlibabaQwenImage3TextToImageParams = z.infer<
  typeof FalAlibabaQwenImage3TextToImageRequestSchema
>;
export type FalAlibabaQwenImage3TextToImageRequest = z.input<
  typeof FalAlibabaQwenImage3TextToImageRequestSchema
>;
export type FalAlibabaQwenImage3TextToImageRequestInput =
  FalAlibabaQwenImage3TextToImageRequest;
export type FalAlibabaQwenImage3TextToImageParsedRequest = z.output<
  typeof FalAlibabaQwenImage3TextToImageRequestSchema
>;
export type FalAlibabaQwenImage3EditParams = z.infer<
  typeof FalAlibabaQwenImage3EditRequestSchema
>;
export type FalAlibabaQwenImage3EditRequest = z.input<
  typeof FalAlibabaQwenImage3EditRequestSchema
>;
export type FalAlibabaQwenImage3EditRequestInput =
  FalAlibabaQwenImage3EditRequest;
export type FalAlibabaQwenImage3EditParsedRequest = z.output<
  typeof FalAlibabaQwenImage3EditRequestSchema
>;
export type FalWan3p0TextToVideoParams = z.infer<
  typeof FalWan3p0TextToVideoRequestSchema
>;
export type FalWan3p0TextToVideoRequest = z.input<
  typeof FalWan3p0TextToVideoRequestSchema
>;
export type FalWan3p0TextToVideoRequestInput = FalWan3p0TextToVideoRequest;
export type FalWan3p0TextToVideoParsedRequest = z.output<
  typeof FalWan3p0TextToVideoRequestSchema
>;
export type FalWan3p0ImageToVideoParams = z.infer<
  typeof FalWan3p0ImageToVideoRequestSchema
>;
export type FalWan3p0ImageToVideoRequest = z.input<
  typeof FalWan3p0ImageToVideoRequestSchema
>;
export type FalWan3p0ImageToVideoRequestInput = FalWan3p0ImageToVideoRequest;
export type FalWan3p0ImageToVideoParsedRequest = z.output<
  typeof FalWan3p0ImageToVideoRequestSchema
>;
export type FalWan3p0ReferenceToVideoParams = z.infer<
  typeof FalWan3p0ReferenceToVideoRequestSchema
>;
export type FalWan3p0ReferenceToVideoRequest = z.input<
  typeof FalWan3p0ReferenceToVideoRequestSchema
>;
export type FalWan3p0ReferenceToVideoRequestInput =
  FalWan3p0ReferenceToVideoRequest;
export type FalWan3p0ReferenceToVideoParsedRequest = z.output<
  typeof FalWan3p0ReferenceToVideoRequestSchema
>;
export type FalWanV2p7TextToImageParams = z.infer<
  typeof FalWanV2p7TextToImageRequestSchema
>;
export type FalWanV2p7TextToImageRequest = z.input<
  typeof FalWanV2p7TextToImageRequestSchema
>;
export type FalWanV2p7TextToImageRequestInput = FalWanV2p7TextToImageRequest;
export type FalWanV2p7TextToImageParsedRequest = z.output<
  typeof FalWanV2p7TextToImageRequestSchema
>;
export type FalWanV2p7EditParams = z.infer<typeof FalWanV2p7EditRequestSchema>;
export type FalWanV2p7EditRequest = z.input<typeof FalWanV2p7EditRequestSchema>;
export type FalWanV2p7EditRequestInput = FalWanV2p7EditRequest;
export type FalWanV2p7EditParsedRequest = z.output<
  typeof FalWanV2p7EditRequestSchema
>;
export type FalWanV2p7TextToVideoParams = z.infer<
  typeof FalWanV2p7TextToVideoRequestSchema
>;
export type FalWanV2p7TextToVideoRequest = z.input<
  typeof FalWanV2p7TextToVideoRequestSchema
>;
export type FalWanV2p7TextToVideoRequestInput = FalWanV2p7TextToVideoRequest;
export type FalWanV2p7TextToVideoParsedRequest = z.output<
  typeof FalWanV2p7TextToVideoRequestSchema
>;
export type FalWanV2p7ImageToVideoParams = z.infer<
  typeof FalWanV2p7ImageToVideoRequestSchema
>;
export type FalWanV2p7ImageToVideoRequest = z.input<
  typeof FalWanV2p7ImageToVideoRequestSchema
>;
export type FalWanV2p7ImageToVideoRequestInput = FalWanV2p7ImageToVideoRequest;
export type FalWanV2p7ImageToVideoParsedRequest = z.output<
  typeof FalWanV2p7ImageToVideoRequestSchema
>;
export type FalWanV2p7ReferenceToVideoParams = z.infer<
  typeof FalWanV2p7ReferenceToVideoRequestSchema
>;
export type FalWanV2p7ReferenceToVideoRequest = z.input<
  typeof FalWanV2p7ReferenceToVideoRequestSchema
>;
export type FalWanV2p7ReferenceToVideoRequestInput =
  FalWanV2p7ReferenceToVideoRequest;
export type FalWanV2p7ReferenceToVideoParsedRequest = z.output<
  typeof FalWanV2p7ReferenceToVideoRequestSchema
>;
export type FalWanV2p7EditVideoParams = z.infer<
  typeof FalWanV2p7EditVideoRequestSchema
>;
export type FalWanV2p7EditVideoRequest = z.input<
  typeof FalWanV2p7EditVideoRequestSchema
>;
export type FalWanV2p7EditVideoRequestInput = FalWanV2p7EditVideoRequest;
export type FalWanV2p7EditVideoParsedRequest = z.output<
  typeof FalWanV2p7EditVideoRequestSchema
>;
export type FalXaiGrokImagineImageParams = z.infer<
  typeof FalXaiGrokImagineImageRequestSchema
>;
export type FalXaiGrokImagineImageRequest = z.input<
  typeof FalXaiGrokImagineImageRequestSchema
>;
export type FalXaiGrokImagineImageRequestInput = FalXaiGrokImagineImageRequest;
export type FalXaiGrokImagineImageParsedRequest = z.output<
  typeof FalXaiGrokImagineImageRequestSchema
>;
export type FalXaiGrokImagineImageV2p0TextToImageParams = z.infer<
  typeof FalXaiGrokImagineImageV2p0TextToImageRequestSchema
>;
export type FalXaiGrokImagineImageV2p0TextToImageRequest = z.input<
  typeof FalXaiGrokImagineImageV2p0TextToImageRequestSchema
>;
export type FalXaiGrokImagineImageV2p0TextToImageRequestInput =
  FalXaiGrokImagineImageV2p0TextToImageRequest;
export type FalXaiGrokImagineImageV2p0TextToImageParsedRequest = z.output<
  typeof FalXaiGrokImagineImageV2p0TextToImageRequestSchema
>;
export type FalXaiGrokImagineImageV2p0EditParams = z.infer<
  typeof FalXaiGrokImagineImageV2p0EditRequestSchema
>;
export type FalXaiGrokImagineImageV2p0EditRequest = z.input<
  typeof FalXaiGrokImagineImageV2p0EditRequestSchema
>;
export type FalXaiGrokImagineImageV2p0EditRequestInput =
  FalXaiGrokImagineImageV2p0EditRequest;
export type FalXaiGrokImagineImageV2p0EditParsedRequest = z.output<
  typeof FalXaiGrokImagineImageV2p0EditRequestSchema
>;
export type FalXaiGrokImagineImageEditParams = z.infer<
  typeof FalXaiGrokImagineImageEditRequestSchema
>;
export type FalXaiGrokImagineImageEditRequest = z.input<
  typeof FalXaiGrokImagineImageEditRequestSchema
>;
export type FalXaiGrokImagineImageEditRequestInput =
  FalXaiGrokImagineImageEditRequest;
export type FalXaiGrokImagineImageEditParsedRequest = z.output<
  typeof FalXaiGrokImagineImageEditRequestSchema
>;
export type FalQwenImageParams = z.infer<typeof FalQwenImageRequestSchema>;
export type FalQwenImageRequest = z.input<typeof FalQwenImageRequestSchema>;
export type FalQwenImageRequestInput = FalQwenImageRequest;
export type FalQwenImageParsedRequest = z.output<
  typeof FalQwenImageRequestSchema
>;
export type FalQwenImageEditParams = z.infer<
  typeof FalQwenImageEditRequestSchema
>;
export type FalQwenImageEditRequest = z.input<
  typeof FalQwenImageEditRequestSchema
>;
export type FalQwenImageEditRequestInput = FalQwenImageEditRequest;
export type FalQwenImageEditParsedRequest = z.output<
  typeof FalQwenImageEditRequestSchema
>;
export type FalGptImage1p5Params = z.infer<typeof FalGptImage1p5RequestSchema>;
export type FalGptImage1p5Request = z.input<typeof FalGptImage1p5RequestSchema>;
export type FalGptImage1p5RequestInput = FalGptImage1p5Request;
export type FalGptImage1p5ParsedRequest = z.output<
  typeof FalGptImage1p5RequestSchema
>;
export type FalGptImage1p5EditParams = z.infer<
  typeof FalGptImage1p5EditRequestSchema
>;
export type FalGptImage1p5EditRequest = z.input<
  typeof FalGptImage1p5EditRequestSchema
>;
export type FalGptImage1p5EditRequestInput = FalGptImage1p5EditRequest;
export type FalGptImage1p5EditParsedRequest = z.output<
  typeof FalGptImage1p5EditRequestSchema
>;
export type FalNanoBananaTextToImageParams = z.infer<
  typeof FalNanoBananaTextToImageRequestSchema
>;
export type FalNanoBananaTextToImageRequest = z.input<
  typeof FalNanoBananaTextToImageRequestSchema
>;
export type FalNanoBananaTextToImageRequestInput =
  FalNanoBananaTextToImageRequest;
export type FalNanoBananaTextToImageParsedRequest = z.output<
  typeof FalNanoBananaTextToImageRequestSchema
>;
export type FalNanoBananaEditParams = z.infer<
  typeof FalNanoBananaEditRequestSchema
>;
export type FalNanoBananaEditRequest = z.input<
  typeof FalNanoBananaEditRequestSchema
>;
export type FalNanoBananaEditRequestInput = FalNanoBananaEditRequest;
export type FalNanoBananaEditParsedRequest = z.output<
  typeof FalNanoBananaEditRequestSchema
>;
export type FalXaiGrokImagineVideoImageToVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoImageToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoImageToVideoRequest = z.input<
  typeof FalXaiGrokImagineVideoImageToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoImageToVideoRequestInput =
  FalXaiGrokImagineVideoImageToVideoRequest;
export type FalXaiGrokImagineVideoImageToVideoParsedRequest = z.output<
  typeof FalXaiGrokImagineVideoImageToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoReferenceToVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoReferenceToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoReferenceToVideoRequest = z.input<
  typeof FalXaiGrokImagineVideoReferenceToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoReferenceToVideoRequestInput =
  FalXaiGrokImagineVideoReferenceToVideoRequest;
export type FalXaiGrokImagineVideoReferenceToVideoParsedRequest = z.output<
  typeof FalXaiGrokImagineVideoReferenceToVideoRequestSchema
>;
export type FalXaiGrokImagineVideoExtendVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoExtendVideoRequestSchema
>;
export type FalXaiGrokImagineVideoExtendVideoRequest = z.input<
  typeof FalXaiGrokImagineVideoExtendVideoRequestSchema
>;
export type FalXaiGrokImagineVideoExtendVideoRequestInput =
  FalXaiGrokImagineVideoExtendVideoRequest;
export type FalXaiGrokImagineVideoExtendVideoParsedRequest = z.output<
  typeof FalXaiGrokImagineVideoExtendVideoRequestSchema
>;
export type FalXaiGrokImagineVideoEditVideoParams = z.infer<
  typeof FalXaiGrokImagineVideoEditVideoRequestSchema
>;
export type FalXaiGrokImagineVideoEditVideoRequest = z.input<
  typeof FalXaiGrokImagineVideoEditVideoRequestSchema
>;
export type FalXaiGrokImagineVideoEditVideoRequestInput =
  FalXaiGrokImagineVideoEditVideoRequest;
export type FalXaiGrokImagineVideoEditVideoParsedRequest = z.output<
  typeof FalXaiGrokImagineVideoEditVideoRequestSchema
>;
export type FalVeo3p1TextToVideoParams = z.infer<
  typeof FalVeo3p1TextToVideoRequestSchema
>;
export type FalVeo3p1TextToVideoRequest = z.input<
  typeof FalVeo3p1TextToVideoRequestSchema
>;
export type FalVeo3p1TextToVideoRequestInput = FalVeo3p1TextToVideoRequest;
export type FalVeo3p1TextToVideoParsedRequest = z.output<
  typeof FalVeo3p1TextToVideoRequestSchema
>;
export type FalVeo3p1ImageToVideoParams = z.infer<
  typeof FalVeo3p1ImageToVideoRequestSchema
>;
export type FalVeo3p1ImageToVideoRequest = z.input<
  typeof FalVeo3p1ImageToVideoRequestSchema
>;
export type FalVeo3p1ImageToVideoRequestInput = FalVeo3p1ImageToVideoRequest;
export type FalVeo3p1ImageToVideoParsedRequest = z.output<
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
export type FalKlingVideoV3ProImageToVideoRequest = z.input<
  typeof FalKlingVideoV3ProImageToVideoRequestSchema
>;
export type FalKlingVideoV3ProImageToVideoRequestInput =
  FalKlingVideoV3ProImageToVideoRequest;
export type FalKlingVideoV3ProImageToVideoParsedRequest = z.output<
  typeof FalKlingVideoV3ProImageToVideoRequestSchema
>;
export type FalKlingVideoV3ProTextToVideoParams = z.infer<
  typeof FalKlingVideoV3ProTextToVideoRequestSchema
>;
export type FalKlingVideoV3ProTextToVideoRequest = z.input<
  typeof FalKlingVideoV3ProTextToVideoRequestSchema
>;
export type FalKlingVideoV3ProTextToVideoRequestInput =
  FalKlingVideoV3ProTextToVideoRequest;
export type FalKlingVideoV3ProTextToVideoParsedRequest = z.output<
  typeof FalKlingVideoV3ProTextToVideoRequestSchema
>;
export type FalKlingVideoV3StandardImageToVideoParams = z.infer<
  typeof FalKlingVideoV3StandardImageToVideoRequestSchema
>;
export type FalKlingVideoV3StandardImageToVideoRequest = z.input<
  typeof FalKlingVideoV3StandardImageToVideoRequestSchema
>;
export type FalKlingVideoV3StandardImageToVideoRequestInput =
  FalKlingVideoV3StandardImageToVideoRequest;
export type FalKlingVideoV3StandardImageToVideoParsedRequest = z.output<
  typeof FalKlingVideoV3StandardImageToVideoRequestSchema
>;
export type FalKlingVideoV3StandardTextToVideoParams = z.infer<
  typeof FalKlingVideoV3StandardTextToVideoRequestSchema
>;
export type FalKlingVideoV3StandardTextToVideoRequest = z.input<
  typeof FalKlingVideoV3StandardTextToVideoRequestSchema
>;
export type FalKlingVideoV3StandardTextToVideoRequestInput =
  FalKlingVideoV3StandardTextToVideoRequest;
export type FalKlingVideoV3StandardTextToVideoParsedRequest = z.output<
  typeof FalKlingVideoV3StandardTextToVideoRequestSchema
>;
export type FalSora2TextToVideoParams = z.infer<
  typeof FalSora2TextToVideoRequestSchema
>;
export type FalSora2TextToVideoRequest = z.input<
  typeof FalSora2TextToVideoRequestSchema
>;
export type FalSora2TextToVideoRequestInput = FalSora2TextToVideoRequest;
export type FalSora2TextToVideoParsedRequest = z.output<
  typeof FalSora2TextToVideoRequestSchema
>;
export type FalSora2ImageToVideoParams = z.infer<
  typeof FalSora2ImageToVideoRequestSchema
>;
export type FalSora2ImageToVideoRequest = z.input<
  typeof FalSora2ImageToVideoRequestSchema
>;
export type FalSora2ImageToVideoRequestInput = FalSora2ImageToVideoRequest;
export type FalSora2ImageToVideoParsedRequest = z.output<
  typeof FalSora2ImageToVideoRequestSchema
>;
export type FalHunyuanImageV3InstructEditParams = z.infer<
  typeof FalHunyuanImageV3InstructEditRequestSchema
>;
export type FalHunyuanImageV3InstructEditRequest = z.input<
  typeof FalHunyuanImageV3InstructEditRequestSchema
>;
export type FalHunyuanImageV3InstructEditRequestInput =
  FalHunyuanImageV3InstructEditRequest;
export type FalHunyuanImageV3InstructEditParsedRequest = z.output<
  typeof FalHunyuanImageV3InstructEditRequestSchema
>;

// ---------------------------------------------------------------------------
// Kling Video o3 4k image-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoO3p4kImageToVideoRequestSchema = z.object({
  prompt: z.string().optional(),
  image_url: z.string(),
  end_image_url: z.string().optional(),
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
  generate_audio: z.boolean().optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  shot_type: z.string().optional(),
});

export type FalKlingVideoO3p4kImageToVideoParams = z.infer<
  typeof FalKlingVideoO3p4kImageToVideoRequestSchema
>;
export type FalKlingVideoO3p4kImageToVideoRequest = z.input<
  typeof FalKlingVideoO3p4kImageToVideoRequestSchema
>;
export type FalKlingVideoO3p4kImageToVideoRequestInput =
  FalKlingVideoO3p4kImageToVideoRequest;
export type FalKlingVideoO3p4kImageToVideoParsedRequest = z.output<
  typeof FalKlingVideoO3p4kImageToVideoRequestSchema
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
export type FalKlingVideoO3p4kReferenceToVideoRequest = z.input<
  typeof FalKlingVideoO3p4kReferenceToVideoRequestSchema
>;
export type FalKlingVideoO3p4kReferenceToVideoRequestInput =
  FalKlingVideoO3p4kReferenceToVideoRequest;
export type FalKlingVideoO3p4kReferenceToVideoParsedRequest = z.output<
  typeof FalKlingVideoO3p4kReferenceToVideoRequestSchema
>;

// ---------------------------------------------------------------------------
// Kling Video o3 4k text-to-video
// ---------------------------------------------------------------------------

export const FalKlingVideoO3p4kTextToVideoRequestSchema = z.object({
  prompt: z.string().optional(),
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
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  generate_audio: z.boolean().optional(),
  multi_prompt: z
    .array(
      z.object({
        prompt: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  shot_type: z.string().optional(),
});

export type FalKlingVideoO3p4kTextToVideoParams = z.infer<
  typeof FalKlingVideoO3p4kTextToVideoRequestSchema
>;
export type FalKlingVideoO3p4kTextToVideoRequest = z.input<
  typeof FalKlingVideoO3p4kTextToVideoRequestSchema
>;
export type FalKlingVideoO3p4kTextToVideoRequestInput =
  FalKlingVideoO3p4kTextToVideoRequest;
export type FalKlingVideoO3p4kTextToVideoParsedRequest = z.output<
  typeof FalKlingVideoO3p4kTextToVideoRequestSchema
>;

// ---------------------------------------------------------------------------
// FLUX 3 (Black Forest Labs)
// ---------------------------------------------------------------------------

const Flux3AspectRatioSchema = z.enum([
  "auto",
  "21:9",
  "2:1",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

const Flux3ResolutionSchema = z.enum(["720p", "1080p"]);

const Flux3DurationSchema = z.union([
  z.literal("auto"),
  z.number().int().min(5).max(20),
]);

const Flux3NumericDurationSchema = z.number().int().min(5).max(20);

const Flux3VideoRequestBaseSchema = z.object({
  prompt: z.string(),
  aspect_ratio: Flux3AspectRatioSchema.optional(),
  duration: Flux3DurationSchema.optional(),
  generate_audio: z.boolean().optional(),
  resolution: Flux3ResolutionSchema.optional(),
  safety_tolerance: z.number().int().min(0).max(4).optional(),
});

export const FalFlux3TextToVideoRequestSchema = Flux3VideoRequestBaseSchema;

export type FalFlux3TextToVideoParams = z.infer<
  typeof FalFlux3TextToVideoRequestSchema
>;
export type FalFlux3TextToVideoRequest = z.input<
  typeof FalFlux3TextToVideoRequestSchema
>;
export type FalFlux3TextToVideoRequestInput = FalFlux3TextToVideoRequest;
export type FalFlux3TextToVideoParsedRequest = z.output<
  typeof FalFlux3TextToVideoRequestSchema
>;

export const FalFlux3ImageToVideoRequestSchema =
  Flux3VideoRequestBaseSchema.extend({
    image_url: z.string(),
  });

export type FalFlux3ImageToVideoParams = z.infer<
  typeof FalFlux3ImageToVideoRequestSchema
>;
export type FalFlux3ImageToVideoRequest = z.input<
  typeof FalFlux3ImageToVideoRequestSchema
>;
export type FalFlux3ImageToVideoRequestInput = FalFlux3ImageToVideoRequest;
export type FalFlux3ImageToVideoParsedRequest = z.output<
  typeof FalFlux3ImageToVideoRequestSchema
>;

export const FalFlux3FirstLastFrameToVideoRequestSchema =
  Flux3VideoRequestBaseSchema.extend({
    duration: Flux3NumericDurationSchema.optional(),
    start_image_url: z.string(),
    end_image_url: z.string(),
  });

export type FalFlux3FirstLastFrameToVideoParams = z.infer<
  typeof FalFlux3FirstLastFrameToVideoRequestSchema
>;
export type FalFlux3FirstLastFrameToVideoRequest = z.input<
  typeof FalFlux3FirstLastFrameToVideoRequestSchema
>;
export type FalFlux3FirstLastFrameToVideoRequestInput =
  FalFlux3FirstLastFrameToVideoRequest;
export type FalFlux3FirstLastFrameToVideoParsedRequest = z.output<
  typeof FalFlux3FirstLastFrameToVideoRequestSchema
>;

export const FalFlux3KeyframeSchema = z.object({
  image_url: z.string(),
  frame_index: z.number().int().min(0),
});

const Flux3KeyframesSchema = z.array(FalFlux3KeyframeSchema).min(1).max(10);

export const FalFlux3KeyframesToVideoRequestSchema =
  Flux3VideoRequestBaseSchema.extend({
    duration: Flux3NumericDurationSchema.optional(),
    keyframes: Flux3KeyframesSchema,
  });

export type FalFlux3KeyframesToVideoParams = z.infer<
  typeof FalFlux3KeyframesToVideoRequestSchema
>;
export type FalFlux3KeyframesToVideoRequest = z.input<
  typeof FalFlux3KeyframesToVideoRequestSchema
>;
export type FalFlux3KeyframesToVideoRequestInput =
  FalFlux3KeyframesToVideoRequest;
export type FalFlux3KeyframesToVideoParsedRequest = z.output<
  typeof FalFlux3KeyframesToVideoRequestSchema
>;

export const FalFlux3ExtendVideoRequestSchema =
  Flux3VideoRequestBaseSchema.extend({
    video_url: z.string(),
  });

export type FalFlux3ExtendVideoParams = z.infer<
  typeof FalFlux3ExtendVideoRequestSchema
>;
export type FalFlux3ExtendVideoRequest = z.input<
  typeof FalFlux3ExtendVideoRequestSchema
>;
export type FalFlux3ExtendVideoRequestInput = FalFlux3ExtendVideoRequest;
export type FalFlux3ExtendVideoParsedRequest = z.output<
  typeof FalFlux3ExtendVideoRequestSchema
>;

export const FalFluxVideoUpscaleRequestSchema = z.object({
  video_url: z.string(),
  upscale_factor: z.number().min(1.5).max(3).optional(),
  creativity: z.union([z.literal(0), z.literal(1)]).optional(),
  prompt: z.string().nullable().optional(),
  safety_tolerance: z.number().int().min(0).max(4).optional(),
});

export type FalFluxVideoUpscaleParams = z.infer<
  typeof FalFluxVideoUpscaleRequestSchema
>;
export type FalFluxVideoUpscaleRequest = z.input<
  typeof FalFluxVideoUpscaleRequestSchema
>;
export type FalFluxVideoUpscaleRequestInput = FalFluxVideoUpscaleRequest;
export type FalFluxVideoUpscaleParsedRequest = z.output<
  typeof FalFluxVideoUpscaleRequestSchema
>;
export type FalOptions = z.infer<typeof FalOptionsSchema>;

// ---------------------------------------------------------------------------
// Endpoint registry — every jsonBody endpoint path (as sent to queue.submit
// as endpoint_id, i.e. without the leading slash) mapped to its request schema
// ---------------------------------------------------------------------------

export const FAL_ENDPOINT_REQUEST_SCHEMAS = {
  "alibaba/qwen-image-3/text-to-image":
    FalAlibabaQwenImage3TextToImageRequestSchema,
  "blackforestlabs/flux-3/extend-video": FalFlux3ExtendVideoRequestSchema,
  "blackforestlabs/flux-3/first-last-frame-to-video":
    FalFlux3FirstLastFrameToVideoRequestSchema,
  "blackforestlabs/flux-3/image-to-video": FalFlux3ImageToVideoRequestSchema,
  "blackforestlabs/flux-3/keyframes-to-video":
    FalFlux3KeyframesToVideoRequestSchema,
  "blackforestlabs/flux-3/text-to-video": FalFlux3TextToVideoRequestSchema,
  "blackforestlabs/flux-video-upscale": FalFluxVideoUpscaleRequestSchema,
  "bytedance/seedance-2.0/image-to-video":
    FalSeedance2p0ImageToVideoRequestSchema,
  "bytedance/seedance-2.0/text-to-video":
    FalSeedance2p0TextToVideoRequestSchema,
  "bytedance/seedance-2.0/fast/image-to-video":
    FalSeedance2p0FastImageToVideoRequestSchema,
  "bytedance/seedance-2.0/fast/text-to-video":
    FalSeedance2p0FastTextToVideoRequestSchema,
  "bytedance/seedance-2.0/reference-to-video":
    FalSeedance2p0ReferenceToVideoRequestSchema,
  "bytedance/seedance-2.0/fast/reference-to-video":
    FalSeedance2p0FastReferenceToVideoRequestSchema,
  "bytedance/seedance-2.5/text-to-video":
    FalSeedance2p5TextToVideoRequestSchema,
  "bytedance/seedance-2.5/image-to-video":
    FalSeedance2p5ImageToVideoRequestSchema,
  "bytedance/seedance-2.5/reference-to-video":
    FalSeedance2p5ReferenceToVideoRequestSchema,
  "lightricks/ltx-2.5/image-to-video/pro":
    FalLtx2p5ImageToVideoProRequestSchema,
  "lightricks/ltx-2.5/image-to-video/fast":
    FalLtx2p5ImageToVideoFastRequestSchema,
  "fal-ai/nano-banana-pro/edit": FalNanoBananaProEditRequestSchema,
  "fal-ai/nano-banana-pro": FalNanoBananaProTextToImageRequestSchema,
  "fal-ai/nano-banana": FalNanoBananaTextToImageRequestSchema,
  "fal-ai/nano-banana/edit": FalNanoBananaEditRequestSchema,
  "fal-ai/nano-banana-2": FalNanoBanana2TextToImageRequestSchema,
  "fal-ai/nano-banana-2/edit": FalNanoBanana2EditRequestSchema,
  "google/nano-banana-2-lite": FalNanoBanana2LiteTextToImageRequestSchema,
  "google/nano-banana-lite/edit": FalNanoBanana2LiteEditRequestSchema,
  "google/virtual-try-on": FalVirtualTryOnRequestSchema,
  "topaz/upscale/image/precision": FalTopazUpscaleImagePrecisionRequestSchema,
  "topaz/upscale/video/precision": FalTopazUpscaleVideoPrecisionRequestSchema,
  "meshy/v7/image-to-3d": FalMeshyV7ImageTo3dRequestSchema,
  "fal-ai/bytedance/seedream/v5/lite/edit": FalSeedreamV5LiteEditRequestSchema,
  "fal-ai/bytedance/seedream/v5/lite/text-to-image":
    FalSeedreamV5LiteTextToImageRequestSchema,
  "bytedance/seedream/v5/pro/layerize": FalSeedreamV5ProLayerizeRequestSchema,
  "fal-ai/bytedance/seed-speech/tts/v2": FalSeedSpeechTtsV2RequestSchema,
  "minimax/music-3": FalMinimaxMusic3RequestSchema,
  "fal-ai/elevenlabs/speech-to-text/scribe-v2":
    FalElevenlabsSpeechToTextScribeV2RequestSchema,
  "alibaba/qwen-image-3/edit": FalAlibabaQwenImage3EditRequestSchema,
  "alibaba/wan-3.0/text-to-video": FalWan3p0TextToVideoRequestSchema,
  "alibaba/wan-3.0/image-to-video": FalWan3p0ImageToVideoRequestSchema,
  "alibaba/wan-3.0/reference-to-video": FalWan3p0ReferenceToVideoRequestSchema,
  "alibaba/wan-3.0-prime/text-to-video": FalWan3p0TextToVideoRequestSchema,
  "alibaba/wan-3.0-prime/image-to-video": FalWan3p0ImageToVideoRequestSchema,
  "alibaba/wan-3.0-prime/reference-to-video":
    FalWan3p0ReferenceToVideoRequestSchema,
  "fal-ai/wan/v2.7/text-to-image": FalWanV2p7TextToImageRequestSchema,
  "fal-ai/wan/v2.7/edit": FalWanV2p7EditRequestSchema,
  "fal-ai/wan/v2.7/pro/text-to-image": FalWanV2p7TextToImageRequestSchema,
  "fal-ai/wan/v2.7/pro/edit": FalWanV2p7EditRequestSchema,
  "fal-ai/wan/v2.7/text-to-video": FalWanV2p7TextToVideoRequestSchema,
  "fal-ai/wan/v2.7/image-to-video": FalWanV2p7ImageToVideoRequestSchema,
  "fal-ai/wan/v2.7/reference-to-video": FalWanV2p7ReferenceToVideoRequestSchema,
  "fal-ai/wan/v2.7/edit-video": FalWanV2p7EditVideoRequestSchema,
  "xai/grok-imagine-image/edit": FalXaiGrokImagineImageEditRequestSchema,
  "fal-ai/sora-2/text-to-video": FalSora2TextToVideoRequestSchema,
  "fal-ai/sora-2/image-to-video": FalSora2ImageToVideoRequestSchema,
  "fal-ai/hunyuan-image/v3/instruct/edit":
    FalHunyuanImageV3InstructEditRequestSchema,
  "fal-ai/kling-video/v3/pro/image-to-video":
    FalKlingVideoV3ProImageToVideoRequestSchema,
  "fal-ai/kling-video/v3/pro/text-to-video":
    FalKlingVideoV3ProTextToVideoRequestSchema,
  "fal-ai/kling-video/v3/standard/image-to-video":
    FalKlingVideoV3StandardImageToVideoRequestSchema,
  "fal-ai/kling-video/v3/standard/text-to-video":
    FalKlingVideoV3StandardTextToVideoRequestSchema,
  "fal-ai/kling-video/o3/4k/image-to-video":
    FalKlingVideoO3p4kImageToVideoRequestSchema,
  "fal-ai/kling-video/o3/4k/reference-to-video":
    FalKlingVideoO3p4kReferenceToVideoRequestSchema,
  "fal-ai/kling-video/o3/4k/text-to-video":
    FalKlingVideoO3p4kTextToVideoRequestSchema,
  "fal-ai/veo3.1": FalVeo3p1TextToVideoRequestSchema,
  "fal-ai/veo3.1/image-to-video": FalVeo3p1ImageToVideoRequestSchema,
  "xai/grok-imagine-video/image-to-video":
    FalXaiGrokImagineVideoImageToVideoRequestSchema,
  "xai/grok-imagine-video/reference-to-video":
    FalXaiGrokImagineVideoReferenceToVideoRequestSchema,
  "xai/grok-imagine-video/extend-video":
    FalXaiGrokImagineVideoExtendVideoRequestSchema,
  "xai/grok-imagine-video/edit-video":
    FalXaiGrokImagineVideoEditVideoRequestSchema,
  "xai/grok-imagine-image": FalXaiGrokImagineImageRequestSchema,
  "xai/grok-imagine-image/v2.0/edit":
    FalXaiGrokImagineImageV2p0EditRequestSchema,
  "xai/grok-imagine-image/v2.0/text-to-image":
    FalXaiGrokImagineImageV2p0TextToImageRequestSchema,
  "fal-ai/qwen-image-edit": FalQwenImageEditRequestSchema,
  "fal-ai/gpt-image-1.5/edit": FalGptImage1p5EditRequestSchema,
  "fal-ai/gpt-image-1.5": FalGptImage1p5RequestSchema,
  "fal-ai/qwen-image": FalQwenImageRequestSchema,
} as const;

export type FalEndpointId = keyof typeof FAL_ENDPOINT_REQUEST_SCHEMAS;

export type FalEndpointInputMap = {
  [K in FalEndpointId]: z.input<(typeof FAL_ENDPOINT_REQUEST_SCHEMAS)[K]>;
};

export type FalQueueSubmitRequest<Id extends string = string> = Omit<
  FalQueueSubmitParams,
  "endpoint_id" | "input"
> & {
  endpoint_id: Id;
  input: Id extends FalEndpointId
    ? FalEndpointInputMap[Id]
    : Record<string, unknown>;
};
