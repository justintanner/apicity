import { z } from "zod";

export const MachGenUploadRequestSchema = z.object({
  file: z
    .instanceof(Blob)
    .describe("SDK Blob input; JSON cannot carry file bytes"),
  filename: z.string().min(1),
});

// Video task types per model, from https://www.machgen.ai/docs/models
// (2026-10-25). Vidu-Upscale-Pro is on the pricebook but not in the models
// table, and MachGen answered HTTP 500 to every request for it that day, so it
// passes unchecked like any other id. SHARPEN is in the TaskInput reference
// (https://www.machgen.ai/docs/reference#taskinput), not the models table;
// MachGen's quote priced it for MiniMax-H3 alone on 2026-10-31.
export const MACHGEN_VIDEO_MODEL_TASK_TYPES = {
  "Wan2.2-A14B": ["T2V", "I2V"],
  "LTX-2.3-Pro": ["T2V", "I2V"],
  "Vidu-Q3-Turbo": ["T2V", "I2V", "R2V"],
  "Vidu-Q3-Pro": ["T2V", "I2V", "R2V"],
  "MiniMax-H3": ["T2V", "I2V", "R2V", "UPSCALE", "SHARPEN"],
  "MiniMax-H3-Turbo": ["T2V", "I2V", "R2V"],
  "Seedance-2.5": ["T2V", "I2V", "R2V"],
  "Seedance-2.0": ["T2V", "I2V", "R2V"],
  "Seedance-2.0-Fast": ["T2V", "I2V", "R2V"],
  "Seedance-2.0-Mini": ["T2V", "I2V", "R2V"],
  "Kling-v3": ["T2V", "I2V"],
  "Kling-o3": ["T2V", "R2V"],
  "Vidu-Q3": ["R2V"],
  "Vidu-Q4-Preview": ["I2V", "R2V"],
  "Vidu-Q3-Pro-Fast": ["I2V"],
  "Alibaba-Wan-3.0": ["T2V", "I2V", "R2V"],
  "Veo-3.1": ["T2V"],
  "Veo-3.1-Fast": ["T2V"],
  "Pixverse-V6": ["T2V", "I2V", "R2V"],
  "Pixverse-C1": ["T2V", "I2V", "R2V"],
  "HappyHorse-1.1": ["T2V", "I2V", "R2V"],
  "HappyHorse-1.0": ["T2V", "I2V", "R2V"],
  "Grok-Imagine-Video": ["T2V"],
  "Grok-Imagine-Video-1.5": ["I2V"],
  // Private on the docs site. This account's GET /api/v0/models listed it
  // on 2026-11-19 (F2F, I2V, R2V, T2V, UPSCALE). F2F is not a generate task
  // type, as with Wan 3.0. A last frame is capped at 10 s; the grid has no
  // field for that cap.
  "Gemini-Omni-1.2-Flash": ["T2V", "I2V", "R2V", "UPSCALE"],
  // On the pricing page and this account's GET /api/v0/models (F2F, I2V,
  // R2V, T2V on 2026-11-25), absent from /docs/models. F2F is not a
  // generate task type.
  "Seedance-2.5-Flash": ["T2V", "I2V", "R2V"],
  "Topaz-Video-Precision": ["UPSCALE"],
  "Topaz-Video-Precision-Animation": ["UPSCALE"],
  "Topaz-Video-Generative": ["UPSCALE"],
  "Topaz-Video-Generative-Fast": ["UPSCALE"],
} as const;

export type MachGenVideoModel = keyof typeof MACHGEN_VIDEO_MODEL_TASK_TYPES;

export interface MachGenVideoGrid {
  heights: readonly number[];
  /** Accepted `duration_secs` values; -1 asks the model for a Smart length. */
  durations: readonly number[];
  /** Accepted `aspect_ratio` values. Empty: the ratio comes from the image. */
  aspectRatios?: readonly string[];
  /** I2V: `src_image_urls` entry 1 is used as the end frame. */
  endFrame?: boolean;
  /** I2V: `keyframe_indices: [-1]` animates toward one image as the end frame. */
  loneEndFrame?: boolean;
  /** R2V: the most references of each kind; 0 means the model takes none. */
  references?: {
    images?: number;
    videos?: number;
    audios?: number;
    /** Images, videos and audio clips together. */
    total?: number;
  };
  /** R2V: an image or video reference is required; audio alone is refused. */
  visualReference?: boolean;
  /** R2V: `reference_video_start_secs` may be non-zero. */
  startOffset?: boolean;
  /** R2V: accepted `reference_video_operation` values. */
  operations?: readonly ("reference" | "edit" | "extend")[];
}

/** UPSCALE target heights (the output's short edge) and engines per model. */
export interface MachGenUpscaleGrid {
  heights: readonly number[];
  /** Accepted `upscale_config.engine` values, when MachGen checks them. */
  engines?: readonly string[];
}

/** SHARPEN heights per model. */
export interface MachGenSharpenGrid {
  heights: readonly number[];
}

const secs = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
const WIDE = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
const ADAPTIVE = ["adaptive", ...WIDE];
const VIDU = ["16:9", "9:16", "1:1", "4:3"];
const SEEDANCE_T2V = {
  durations: [-1, ...secs(4, 15)],
  aspectRatios: ADAPTIVE,
};
const SEEDANCE_I2V = { ...SEEDANCE_T2V, endFrame: true };
// MachGen's height 400s added 540 on 2026-11-18
// (tests/fixtures/machgen-evidence/machgen-h3-heights-2026-11-18.json).
// 540 and 1080 are private heights: the model list omits them and a request
// from an account without access answers 403, so the grids keep them only
// because the 400s list them.
const H3_HEIGHTS = [480, 540, 768, 1080, 1440];
const H3_TURBO_HEIGHTS = [480, 540, 768, 1080];
const H3_T2V = { aspectRatios: WIDE };
const H3_I2V = { aspectRatios: ADAPTIVE, endFrame: true, loneEndFrame: true };
// R2V reference limits come from MachGen's capability contract; the 400s
// in machgen-grids-2026-10-25.json confirm a sample of them.
const H3_R2V = {
  aspectRatios: ADAPTIVE,
  references: { images: 9, videos: 3, audios: 3, total: 15 },
  startOffset: true,
  operations: ["reference"] as const,
};
const SEEDANCE_2_R2V = {
  durations: [-1, ...secs(4, 15)],
  aspectRatios: ADAPTIVE,
  visualReference: true,
  operations: ["reference"] as const,
};
const IMAGES_ONLY = (images: number) => ({
  references: { images, videos: 0, audios: 0 },
});

// T2V, I2V and R2V grids, read from MachGen's 400 responses to off-grid
// requests on 2026-10-25
// (tests/fixtures/machgen-evidence/machgen-grids-2026-10-25.json).
export const MACHGEN_VIDEO_GRIDS: Readonly<
  Record<
    string,
    Readonly<Partial<Record<"T2V" | "I2V" | "R2V", MachGenVideoGrid>>>
  >
> = {
  "Wan2.2-A14B": {
    T2V: { heights: [480, 720], durations: [5], aspectRatios: ["16:9"] },
    I2V: { heights: [480, 720], durations: [5], aspectRatios: ["16:9"] },
  },
  "LTX-2.3-Pro": {
    T2V: {
      heights: [1080, 1440, 2160],
      durations: [6, 8, 10],
      aspectRatios: ["16:9"],
    },
    I2V: {
      heights: [1080, 1440, 2160],
      durations: [6, 8, 10],
      aspectRatios: ["16:9"],
      endFrame: true,
    },
  },
  "Vidu-Q3-Turbo": {
    T2V: { heights: [540, 720], durations: secs(1, 16), aspectRatios: VIDU },
    I2V: {
      heights: [540, 720],
      durations: secs(1, 16),
      aspectRatios: [],
      endFrame: true,
    },
    R2V: {
      heights: [540, 720],
      durations: secs(1, 16),
      aspectRatios: VIDU,
      ...IMAGES_ONLY(7),
    },
  },
  "Vidu-Q3-Pro": {
    T2V: {
      heights: [540, 720, 1080],
      durations: secs(1, 16),
      aspectRatios: VIDU,
    },
    I2V: {
      heights: [540, 720, 1080],
      durations: secs(1, 16),
      aspectRatios: [],
      endFrame: true,
    },
    R2V: {
      heights: [540, 720],
      durations: secs(1, 16),
      aspectRatios: VIDU,
      ...IMAGES_ONLY(7),
    },
  },
  "MiniMax-H3": {
    T2V: { heights: H3_HEIGHTS, durations: secs(1, 30), ...H3_T2V },
    I2V: { heights: H3_HEIGHTS, durations: secs(1, 30), ...H3_I2V },
    R2V: { heights: H3_HEIGHTS, durations: secs(1, 30), ...H3_R2V },
  },
  // 1-15 s since 2026-11-11 (4-15 on 2026-10-25), from the model list and
  // 400s in tests/fixtures/machgen-evidence/machgen-turbo-durations-2026-11-11.json.
  "MiniMax-H3-Turbo": {
    T2V: { heights: H3_TURBO_HEIGHTS, durations: secs(1, 15), ...H3_T2V },
    I2V: { heights: H3_TURBO_HEIGHTS, durations: secs(1, 15), ...H3_I2V },
    R2V: { heights: H3_TURBO_HEIGHTS, durations: secs(1, 15), ...H3_R2V },
  },
  "Seedance-2.5": {
    T2V: {
      heights: [480, 720, 1080],
      durations: [-1, ...secs(4, 30)],
      aspectRatios: ADAPTIVE,
    },
    I2V: {
      heights: [480, 720, 1080],
      durations: [-1, ...secs(4, 30)],
      aspectRatios: ["adaptive"],
      endFrame: true,
    },
    R2V: {
      heights: [480, 720, 1080],
      durations: [-1, ...secs(4, 30)],
      aspectRatios: ADAPTIVE,
      operations: ["reference", "edit", "extend"],
    },
  },
  "Seedance-2.0": {
    T2V: { heights: [480, 720, 1080, 2160], ...SEEDANCE_T2V },
    I2V: { heights: [480, 720, 1080, 2160], ...SEEDANCE_I2V },
    R2V: {
      heights: [480, 720, 1080, 2160],
      ...SEEDANCE_2_R2V,
      references: { images: 9, videos: 3, audios: 3 },
    },
  },
  "Seedance-2.0-Fast": {
    T2V: { heights: [480, 720], ...SEEDANCE_T2V },
    I2V: { heights: [480, 720], ...SEEDANCE_I2V },
    R2V: {
      heights: [480, 720],
      ...SEEDANCE_2_R2V,
      references: { images: 9, videos: 3, audios: 3, total: 12 },
    },
  },
  "Seedance-2.0-Mini": {
    T2V: { heights: [480, 720], ...SEEDANCE_T2V },
    I2V: { heights: [480, 720], ...SEEDANCE_I2V },
    R2V: {
      heights: [480, 720],
      ...SEEDANCE_2_R2V,
      references: { images: 9, videos: 3, audios: 3, total: 12 },
    },
  },
  "Kling-v3": {
    T2V: {
      heights: [720, 1080, 2160],
      durations: secs(3, 15),
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    I2V: {
      heights: [720, 1080, 2160],
      durations: secs(3, 15),
      aspectRatios: [],
      endFrame: true,
    },
  },
  "Kling-o3": {
    T2V: {
      heights: [720, 1080, 2160],
      durations: secs(3, 15),
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    R2V: {
      heights: [720, 1080, 2160],
      durations: secs(3, 15),
      aspectRatios: ["16:9", "9:16", "1:1"],
      ...IMAGES_ONLY(7),
    },
  },
  "Vidu-Q3": {
    R2V: {
      heights: [540, 720, 1080],
      durations: secs(3, 16),
      aspectRatios: VIDU,
      ...IMAGES_ONLY(7),
    },
  },
  "Vidu-Q4-Preview": {
    I2V: {
      heights: [540, 720, 1080, 1440, 2160],
      durations: secs(3, 16),
      aspectRatios: [],
    },
    R2V: {
      heights: [540, 720, 1080, 1440, 2160],
      durations: secs(3, 16),
      aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
      references: { videos: 0, audios: 3 },
    },
  },
  "Vidu-Q3-Pro-Fast": {
    I2V: { heights: [720, 1080], durations: secs(1, 16), aspectRatios: [] },
  },
  "Alibaba-Wan-3.0": {
    T2V: {
      heights: [480, 720, 1080],
      durations: [-1, ...secs(2, 30)],
      aspectRatios: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4"],
    },
    I2V: {
      heights: [480, 720, 1080],
      durations: [-1, ...secs(2, 30)],
      aspectRatios: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4"],
      endFrame: true,
    },
    R2V: {
      heights: [480, 720, 1080],
      durations: [-1, ...secs(2, 30)],
      aspectRatios: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4"],
    },
  },
  "Veo-3.1": {
    T2V: {
      heights: [720, 1080, 2160],
      durations: [4, 6, 8],
      aspectRatios: ["16:9", "9:16"],
    },
  },
  "Veo-3.1-Fast": {
    T2V: {
      heights: [720, 1080, 2160],
      durations: [4, 6, 8],
      aspectRatios: ["16:9", "9:16"],
    },
  },
  "Pixverse-V6": {
    T2V: {
      heights: [360, 540, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: VIDU,
    },
    I2V: {
      heights: [360, 540, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: [],
    },
    R2V: {
      heights: [360, 540, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: VIDU,
      ...IMAGES_ONLY(3),
    },
  },
  "Pixverse-C1": {
    T2V: {
      heights: [360, 540, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: VIDU,
    },
    I2V: {
      heights: [360, 540, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: [],
    },
    R2V: {
      heights: [360, 540, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: VIDU,
      ...IMAGES_ONLY(3),
    },
  },
  "HappyHorse-1.1": {
    T2V: {
      heights: [720, 1080],
      durations: secs(3, 15),
      aspectRatios: [...VIDU, "21:9"],
    },
    I2V: { heights: [720, 1080], durations: secs(3, 15), aspectRatios: [] },
    R2V: {
      heights: [720, 1080],
      durations: secs(3, 15),
      aspectRatios: [...VIDU, "21:9"],
    },
  },
  "HappyHorse-1.0": {
    T2V: {
      heights: [720, 1080],
      durations: secs(3, 15),
      aspectRatios: [...VIDU, "21:9"],
    },
    I2V: { heights: [720, 1080], durations: secs(3, 15), aspectRatios: [] },
    R2V: {
      heights: [720, 1080],
      durations: secs(3, 15),
      aspectRatios: [...VIDU, "21:9"],
    },
  },
  "Grok-Imagine-Video": {
    T2V: { heights: [480, 720], durations: secs(1, 15), aspectRatios: VIDU },
  },
  "Grok-Imagine-Video-1.5": {
    I2V: {
      heights: [480, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: [],
    },
  },
  // GET /api/v0/models, 2026-11-19. R2V edit allows one video and two
  // images, and extend allows one video at 3-10 s; the grid stores the
  // surface maximums (6 images, 3 videos, no audio) and surface durations.
  "Gemini-Omni-1.2-Flash": {
    T2V: {
      heights: [360, 720, 1080, 2160],
      durations: secs(3, 15),
      aspectRatios: ["16:9", "9:16"],
    },
    I2V: {
      heights: [360, 720, 1080, 2160],
      durations: secs(3, 15),
      aspectRatios: ["16:9", "9:16"],
      endFrame: true,
    },
    R2V: {
      heights: [360, 720, 1080, 2160],
      durations: [-1, ...secs(3, 15)],
      aspectRatios: ["adaptive", "16:9", "9:16"],
      references: { images: 6, videos: 3, audios: 0 },
      operations: ["reference", "edit", "extend"],
    },
  },
  // GET /api/v0/models, 2026-11-25. R2V lists 10 images, 5 videos and 5
  // audio clips, as Alibaba-Wan-3.0 does, and no reference_video_operation
  // controls; as there, the documented 9 / 3 / 3 reference ceilings apply.
  "Seedance-2.5-Flash": {
    T2V: {
      heights: [480, 720],
      durations: [-1, ...secs(4, 30)],
      aspectRatios: ADAPTIVE,
    },
    I2V: {
      heights: [480, 720],
      durations: [-1, ...secs(4, 30)],
      aspectRatios: ["adaptive"],
      endFrame: true,
    },
    R2V: {
      heights: [480, 720],
      durations: [-1, ...secs(4, 30)],
      aspectRatios: ADAPTIVE,
    },
  },
};

// UPSCALE target heights, read from 400s of MachGen's upscale quote, and the
// engines it checks (2026-10-25). MachGen also requires a target above the
// source's height, which depends on the source.
export const MACHGEN_VIDEO_UPSCALE: Readonly<
  Record<string, MachGenUpscaleGrid>
> = {
  "MiniMax-H3": { heights: [1440] },
  "Topaz-Video-Precision": {
    heights: [1080, 1440, 2160, 4320],
    engines: [
      "artemis-hq",
      "artemis-lq",
      "artemis-mq",
      "gaia-cg",
      "gaia-hq",
      "proteus",
    ],
  },
  "Topaz-Video-Precision-Animation": {
    heights: [720, 960, 1080, 1440, 2160, 4320],
    engines: ["gaia-2"],
  },
  "Topaz-Video-Generative": {
    heights: [1080, 1440, 2160],
    engines: [
      "starlight-hq",
      "starlight-mini",
      "starlight-precise-2-5",
      "starlight-sharp",
    ],
  },
  "Topaz-Video-Generative-Fast": {
    heights: [1080, 1440, 2160],
    engines: ["starlight-fast-2"],
  },
  // Target heights from GET /api/v0/models on 2026-11-19. No engine list.
  "Gemini-Omni-1.2-Flash": { heights: [720, 1080, 2160] },
};

// SHARPEN heights, read from 400s of MachGen's upscale quote on 2026-10-31
// (tests/fixtures/machgen-evidence/machgen-sharpen-2026-10-31.json). The web
// app's capability contract also lists 1440, which the quote refuses.
export const MACHGEN_VIDEO_SHARPEN: Readonly<
  Record<string, MachGenSharpenGrid>
> = {
  "MiniMax-H3": { heights: [480, 768] },
};

export const MachGenModelAliasSchema = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9.]*(?:-[A-Za-z0-9.]+)+$/);
export const MachGenVideoConfigSchema = z.object({
  height: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  duration_secs: z.number().int().min(-1).optional(),
  num_frames: z.number().int().positive().optional(),
  aspect_ratio: z
    .enum(["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"])
    .optional(),
  fps: z.number().int().positive().optional(),
  audio: z.boolean().optional(),
  bitrate_mode: z.enum(["standard", "high"]).optional(),
  sharpen: z.boolean().optional(),
  infer_steps: z.number().int().positive().optional(),
  guidance_scale: z.array(z.number()).optional(),
  // Kling-v3 and Kling-o3 only.
  multi_prompt: z.array(z.string()).min(1).max(6).optional(),
  shot_type: z.enum(["customize", "intelligence"]).optional(),
  shot_durations: z.array(z.number().int().min(1)).optional(),
  element_ids: z.array(z.number().int()).max(3).optional(),
  element_handles: z.array(z.string()).max(3).optional(),
  // Kling-v3 only.
  negative_prompt: z.string().optional(),
});

// Engine and tuning knobs for UPSCALE; Topaz takes model-specific knobs
// (detail, noise, grain, ...) that MachGen passes through.
export const MachGenUpscaleConfigSchema = z
  .object({ engine: z.string().optional() })
  .passthrough();

const list = (values: readonly unknown[]) => values.join(", ");
const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

/** Frontier image models supported by the existing async generate endpoint. */
export const MACHGEN_IMAGE_MODELS = [
  "GPT-Image-2",
  "GPT-Image-2.5-Sunburst",
  "GPT-Image-2.5-Flare",
  "GPT-Image-2.6-Sunburst",
  "GPT-Image-2.6-Flare",
  "Nano-Banana-2",
  "Nano-Banana-2.1",
  "Seedream-5.5",
] as const;

// The most I2I source images each image model takes: its i2i maxInputImages
// in MachGen's capability contract, read from the
// https://www.machgen.ai/generate bundle on 2026-11-01
// (tests/fixtures/machgen-evidence/machgen-image-caps-2026-11-01.json).
export const MACHGEN_I2I_MAX_IMAGES: Readonly<Record<string, number>> = {
  "GPT-Image-2": 16,
  "GPT-Image-2.5-Sunburst": 16,
  "GPT-Image-2.5-Flare": 16,
  "GPT-Image-2.6-Sunburst": 16,
  "GPT-Image-2.6-Flare": 16,
  "Nano-Banana-2": 14,
  "Nano-Banana-2.1": 14,
  "Seedream-5.5": 10,
};

// MachGen's REST docs cap reference images at 9
// (https://www.machgen.ai/docs/rest_api#reference-video-and-audio). Every
// video task keeps that ceiling; I2V and some R2V grids allow fewer.
const VIDEO_MAX_IMAGES = 9;

const AUTO_SIZE_CONFLICT =
  "Automatic image size requires a supported model and no explicit dimensions or ratio";

export const MachGenImageConfigSchema = z
  .object({
    size_mode: z.literal("explicit").optional(),
    height: z.number().int().positive(),
    width: z.number().int().positive().optional(),
    aspect_ratio: z.string().optional(),
    infer_steps: z.number().int().positive().optional(),
    guidance_scale: z.array(z.number()).optional(),
  })
  .describe(
    "Set height and optionally width or aspect_ratio for explicit sizing (the default)."
  );

const autoDimension = z.never({ error: AUTO_SIZE_CONFLICT }).optional();
export const MachGenImageAutoSizeConfigSchema = MachGenImageConfigSchema.extend(
  {
    size_mode: z.literal("auto"),
    height: autoDimension,
    width: autoDimension,
    aspect_ratio: autoDimension,
    resolution: z.enum(["1K", "1.5K", "2K"]).optional(),
  }
).describe(
  "Let the model choose the size. Omit height, width and aspect_ratio. Seedream 5.5 may set resolution to 1K, 1.5K or 2K. @apicity/cost cannot estimate an automatically sized image."
);

export const MachGenGenerateImageConfigSchema = z.discriminatedUnion(
  "size_mode",
  [MachGenImageConfigSchema, MachGenImageAutoSizeConfigSchema]
);

const baselineQualities = ["auto", "low", "medium", "high"] as const;
const qualities = [...baselineQualities, "xhigh", "max"] as const;
const complexities = ["low", "medium", "high"] as const;
const backgrounds = ["auto", "opaque", "transparent"] as const;
const rasterFormats = ["png", "jpeg", "webp"] as const;
const outputFormats = [...rasterFormats, "svg", "gif"] as const;

export const MachGenImageOutputSchema = z
  .object({
    quality: z
      .enum(qualities)
      .optional()
      .describe(
        "Omitted or auto lets the model choose. GPT Image 2.6 reserves the max price and bills the returned quality."
      ),
    complexity: z
      .enum(complexities)
      .optional()
      .describe("Planning effort before rendering on GPT Image 2.6."),
    background: z
      .enum(backgrounds)
      .optional()
      .describe("Transparent output requires PNG or WebP."),
    output_format: z
      .enum(outputFormats)
      .optional()
      .describe(
        "GPT Image 2 and 2.5 support PNG, JPEG and WebP. GPT Image 2.6 also supports GIF and can generate SVG on T2I."
      ),
    output_compression: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe("Compression setting for JPEG or WebP."),
    frame_count: z
      .number()
      .int()
      .min(2)
      .max(16)
      .optional()
      .describe("Number of frames in a GIF."),
    frame_duration_ms: z
      .number()
      .int()
      .min(20)
      .max(655350)
      .optional()
      .describe("Duration of each GIF frame in milliseconds."),
    partial_images: z
      .number()
      .int()
      .min(0)
      .max(3)
      .optional()
      .describe("Intermediate previews for PNG, JPEG or WebP."),
    svg: z
      .object({
        model: z
          .enum(["gpt-5.5"])
          .or(z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/))
          .describe("SVG author model, for example gpt-5.5."),
        reasoning: z
          .object({
            effort: z
              .enum([
                "none",
                "minimal",
                "low",
                "medium",
                "high",
                "xhigh",
                "max",
              ])
              .optional(),
          })
          .optional(),
      })
      .optional()
      .describe("Author model and reasoning settings for SVG output."),
  })
  // Layers and watermark are not first-class fields. Seedream 5.5 uses both.
  .passthrough();

export interface MachGenImageSurface {
  qualities: readonly string[];
  complexities: readonly string[];
  backgrounds: readonly string[];
  outputFormats: readonly string[];
  defaultOutputFormat?: string;
  autoSize: boolean;
  mask: boolean;
  markup: boolean;
  continuation: boolean;
  safetyIdentifier: boolean;
  /** When set, safety_identifier must be ASCII and no longer than this. */
  safetyIdentifierMax?: number;
  /** Automatic-size resolution tiers. Absent means the field is refused. */
  resolutionTiers?: readonly string[];
}

// GET /api/v0/models?kind=image, 2026-11-18. The web capability contract
// supplies safetyIdentifier. The dated machgen-evidence fixture pins both.
const gptImage2: MachGenImageSurface = {
  qualities: baselineQualities,
  complexities: [],
  backgrounds,
  outputFormats: rasterFormats,
  defaultOutputFormat: "png",
  autoSize: true,
  mask: false,
  markup: false,
  continuation: false,
  safetyIdentifier: true,
};
const gptImage25 = { ...gptImage2, qualities };
const gptImage26 = { ...gptImage25, complexities, outputFormats };
const gptImage25Tasks = {
  T2I: gptImage25,
  I2I: { ...gptImage25, mask: true, markup: true },
};
const gptImage26Tasks = {
  T2I: gptImage26,
  I2I: {
    ...gptImage26,
    outputFormats: [...rasterFormats, "gif"],
    mask: true,
    markup: true,
    continuation: true,
  },
};
const nanoBanana: MachGenImageSurface = {
  qualities: [],
  complexities: [],
  backgrounds: [],
  outputFormats: [],
  autoSize: false,
  mask: false,
  markup: false,
  continuation: false,
  safetyIdentifier: false,
};
const nanoBananaTasks = { T2I: nanoBanana, I2I: nanoBanana };
// Docs and this account's model list, re-read 2026-11-20.
// https://www.machgen.ai/docs/rest_api/models/seedream-5-5
const seedream: MachGenImageSurface = {
  qualities: [],
  complexities: [],
  backgrounds,
  outputFormats: ["png", "jpeg"],
  defaultOutputFormat: "png",
  autoSize: true,
  mask: false,
  markup: false,
  continuation: false,
  safetyIdentifier: true,
  safetyIdentifierMax: 64,
  resolutionTiers: ["1K", "1.5K", "2K"],
};
const seedreamTasks = { T2I: seedream, I2I: seedream };
type ImageModel = (typeof MACHGEN_IMAGE_MODELS)[number];
export const MACHGEN_IMAGE_SURFACES: Readonly<
  Record<ImageModel, Readonly<Record<"T2I" | "I2I", MachGenImageSurface>>>
> = {
  "GPT-Image-2": { T2I: gptImage2, I2I: { ...gptImage2, mask: true } },
  "GPT-Image-2.5-Sunburst": gptImage25Tasks,
  "GPT-Image-2.5-Flare": gptImage25Tasks,
  "GPT-Image-2.6-Sunburst": gptImage26Tasks,
  "GPT-Image-2.6-Flare": gptImage26Tasks,
  "Nano-Banana-2": nanoBananaTasks,
  "Nano-Banana-2.1": nanoBananaTasks,
  "Seedream-5.5": seedreamTasks,
};

const isImageModel = (model: string): model is ImageModel =>
  Object.hasOwn(MACHGEN_IMAGE_SURFACES, model);

const imageSettingsFields = z.object({
  image_config: MachGenGenerateImageConfigSchema.optional(),
  image_output: MachGenImageOutputSchema.optional(),
  src_mask_url: z
    .string()
    .optional()
    .describe("Edit mask for GPT Image 2, 2.5 or 2.6 I2I."),
  src_markup_url: z
    .string()
    .optional()
    .describe(
      "Markup layer for GPT Image 2.5 or 2.6 I2I. Omit the edit mask when using markup."
    ),
  continuation_task_id: z
    .string()
    .optional()
    .describe(
      "Continue a previous GPT Image 2.6 edit by task ID. Counts as an I2I source."
    ),
  safety_identifier: z
    .string()
    .max(128)
    .optional()
    .describe(
      "End-user identifier. GPT Image 2, 2.5 and 2.6 accept 128 characters. Seedream 5.5 accepts 64 ASCII characters."
    ),
});

type ImageSettings = z.infer<typeof imageSettingsFields>;
type ReportIssue = (path: (string | number)[], message: string) => void;

const UNSUPPORTED_MARKUP =
  "This model and task type do not support image markup";
const UNSUPPORTED_CONTINUATION =
  "This model and task type do not support image continuation";
const UNSUPPORTED_SAFETY_IDENTIFIER =
  "This model does not support safety_identifier";

function checkImageSettings(
  req: ImageSettings,
  modelTask: string,
  surface: MachGenImageSurface,
  issue: ReportIssue
) {
  const output = req.image_output ?? {};
  for (const [field, allowed] of [
    ["quality", surface.qualities],
    ["complexity", surface.complexities],
    ["background", surface.backgrounds],
    ["output_format", surface.outputFormats],
  ] as const) {
    const value = output[field];
    if (value !== undefined && !allowed.includes(value))
      issue(
        ["image_output", field],
        `${modelTask} does not support ${field}='${value}'; allowed: ${list(allowed) || "none"}`
      );
  }

  if (req.image_config?.size_mode === "auto" && !surface.autoSize)
    issue(["image_config", "size_mode"], AUTO_SIZE_CONFLICT);
  const mask = req.src_mask_url !== undefined;
  const markup = req.src_markup_url !== undefined;
  const continuation = req.continuation_task_id !== undefined;
  const previews = (output.partial_images ?? 0) > 0;
  if (mask && !surface.mask)
    issue(
      ["src_mask_url"],
      "This model and task type do not support image masks"
    );
  if (markup && !surface.markup) issue(["src_markup_url"], UNSUPPORTED_MARKUP);
  if (continuation && !surface.continuation)
    issue(["continuation_task_id"], UNSUPPORTED_CONTINUATION);
  if (req.safety_identifier !== undefined && !surface.safetyIdentifier)
    issue(["safety_identifier"], UNSUPPORTED_SAFETY_IDENTIFIER);
  if (
    req.safety_identifier !== undefined &&
    surface.safetyIdentifierMax !== undefined &&
    (req.safety_identifier.length > surface.safetyIdentifierMax ||
      [...req.safety_identifier].some((char) => char.charCodeAt(0) > 0x7f))
  )
    issue(
      ["safety_identifier"],
      `safety_identifier must be at most ${surface.safetyIdentifierMax} ASCII characters`
    );
  const resolution = (req.image_config as { resolution?: string } | undefined)
    ?.resolution;
  if (resolution !== undefined) {
    const tiers = surface.resolutionTiers ?? [];
    if (!tiers.includes(resolution))
      issue(
        ["image_config", "resolution"],
        `${modelTask} does not support resolution='${resolution}'${
          tiers.length ? `; allowed: ${list(tiers)}` : ""
        }`
      );
  }
  const layers = (output as { layers?: unknown }).layers;
  if (layers !== undefined && output.background !== undefined)
    issue(
      ["image_output", "background"],
      "Omit background when extracting layers"
    );
  if (mask && markup)
    issue(
      ["src_markup_url"],
      "Image markup cannot be combined with an edit mask"
    );
  if (continuation && (mask || markup))
    issue(
      ["continuation_task_id"],
      "Image continuation cannot be combined with markup or a mask"
    );
  if (continuation && previews)
    issue(
      ["image_output", "partial_images"],
      "Intermediate previews are not supported for continued edits"
    );

  // Nano Banana publishes no default format or format-dependent settings.
  const format = output.output_format ?? surface.defaultOutputFormat;
  if (format === undefined) return;
  if (
    output.background === "transparent" &&
    format !== "png" &&
    format !== "webp"
  )
    issue(
      ["image_output", "background"],
      "Transparent backgrounds require output_format png or webp"
    );
  if (
    output.output_compression !== undefined &&
    format !== "jpeg" &&
    format !== "webp"
  )
    issue(
      ["image_output", "output_compression"],
      "output_compression requires output_format jpeg or webp"
    );
  if (
    (output.frame_count !== undefined ||
      output.frame_duration_ms !== undefined) &&
    format !== "gif"
  )
    issue(
      ["image_output", "output_format"],
      "Animation controls require GIF output"
    );
  if (output.svg !== undefined && format !== "svg")
    issue(
      ["image_output", "svg"],
      "Vector author settings require supported SVG output"
    );
  if (rasterFormats.some((raster) => raster === format)) return;
  if (previews)
    issue(
      ["image_output", "partial_images"],
      "Partial images require PNG, JPEG or WebP output"
    );
  if (mask)
    issue(["src_mask_url"], "Image masks require PNG, JPEG or WebP output");
  if (markup)
    issue(["src_markup_url"], "Image markup requires PNG, JPEG or WebP output");
  if (continuation)
    issue(
      ["continuation_task_id"],
      "Image continuation requires PNG, JPEG or WebP output"
    );
}

export const MachGenGenerateRequestSchema = z
  .object({
    ...imageSettingsFields.shape,
    model: z
      .enum(
        Object.keys(MACHGEN_VIDEO_MODEL_TASK_TYPES) as [
          MachGenVideoModel,
          ...MachGenVideoModel[],
        ]
      )
      .or(z.enum(MACHGEN_IMAGE_MODELS))
      .or(MachGenModelAliasSchema),
    task_type: z.enum([
      "T2V",
      "I2V",
      "R2V",
      "UPSCALE",
      "SHARPEN",
      "T2I",
      "I2I",
    ]),
    prompt: z.string(),
    video_config: MachGenVideoConfigSchema.optional(),
    upscale_config: MachGenUpscaleConfigSchema.optional(),
    enhance_prompt: z.boolean().optional(),
    prompt_enhancement_level: z
      .enum(["DEFAULT", "FAST", "BALANCED", "DEEP"])
      .optional(),
    prompt_enhancer: z.string().optional(),
    seed: z.number().int().optional(),
    optimization_level: z.enum(["STANDARD", "FAST", "EXPRESS"]).optional(),
    adapter: z.string().optional(),
    // The image cap depends on the task and model, so the refinement checks it.
    src_image_urls: z.array(z.string()).optional(),
    keyframe_indices: z
      .array(z.union([z.literal(0), z.literal(-1)]))
      .optional(),
    src_video_urls: z.array(z.string()).max(3).optional(),
    src_audio_urls: z.array(z.string()).max(3).optional(),
    src_task_ids: z.array(z.string()).optional(),
    src_file_urls: z.array(z.string()).max(1).optional(),
    src_webpage_urls: z.array(z.string()).max(1).optional(),
    reference_video_operation: z
      .enum(["reference", "edit", "extend"])
      .optional(),
    // Seconds into each reference video, aligned with src_video_urls.
    reference_video_start_secs: z.array(z.number().nonnegative()).optional(),
    reference_order: z
      .array(
        z.object({
          type: z.enum(["image", "video", "audio"]),
          index: z.number().int().nonnegative(),
        })
      )
      .optional(),
    subject_to_image_ids: z
      .record(z.string(), z.array(z.number().int()))
      .optional(),
    subject_to_video_ids: z
      .record(z.string(), z.array(z.number().int()))
      .optional(),
    subject_to_audio_ids: z
      .record(z.string(), z.array(z.number().int()))
      .optional(),
    moderate: z.boolean().optional(),
    webhook_url: z.string().optional(),
    draft: z.boolean().optional(),
    draft_source_task_id: z.string().optional(),
  })
  // MachGen answers each of these with HTTP 400 before accepting the task;
  // the messages restate its own. Models outside the matrix pass unchecked.
  .superRefine((req, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const images = req.src_image_urls ?? [];
    const videos = req.src_video_urls ?? [];
    const audios = req.src_audio_urls ?? [];
    const keyframes = req.keyframe_indices;
    const imageModel = isImageModel(req.model) ? req.model : undefined;
    if (req.task_type === "T2I" || req.task_type === "I2I") {
      if (Object.hasOwn(MACHGEN_VIDEO_MODEL_TASK_TYPES, req.model))
        issue(["task_type"], `${req.model} does not support ${req.task_type}`);
      if (!req.image_config)
        issue(["image_config"], "image_config is required for image tasks");
      if (
        req.task_type === "I2I" &&
        !images.length &&
        !req.src_task_ids?.length &&
        req.continuation_task_id === undefined
      )
        issue(["src_image_urls"], "I2I requires a source image or source task");
      if (imageModel)
        checkImageSettings(
          req,
          `${imageModel} ${req.task_type}`,
          MACHGEN_IMAGE_SURFACES[imageModel][req.task_type],
          issue
        );
      const cap = imageModel ? MACHGEN_I2I_MAX_IMAGES[imageModel] : undefined;
      if (req.task_type === "I2I" && cap !== undefined && images.length > cap)
        issue(
          ["src_image_urls"],
          `${req.model} I2I accepts at most ${cap} source images; got ${images.length}`
        );
      images.forEach((url, i) => {
        if (!isHttpUrl(url))
          issue(
            ["src_image_urls", i],
            "async image tasks require public http(s) source URLs"
          );
      });
      return;
    }
    if (imageModel)
      issue(["task_type"], `${req.model} supports only T2I and I2I`);
    if (req.image_config?.size_mode === "auto")
      issue(["image_config", "size_mode"], AUTO_SIZE_CONFLICT);
    if (Object.hasOwn(MACHGEN_VIDEO_MODEL_TASK_TYPES, req.model)) {
      if (req.image_output !== undefined)
        issue(["image_output"], "Image output controls require an image task");
      if (req.src_markup_url !== undefined)
        issue(["src_markup_url"], UNSUPPORTED_MARKUP);
      if (req.continuation_task_id !== undefined)
        issue(["continuation_task_id"], UNSUPPORTED_CONTINUATION);
      if (req.safety_identifier !== undefined)
        issue(["safety_identifier"], UNSUPPORTED_SAFETY_IDENTIFIER);
    }
    // I2V and an R2V grid with its own image cap check a lower cap below.
    const r2v = req.task_type === "R2V";
    const gridImageCap = r2v
      ? MACHGEN_VIDEO_GRIDS[req.model]?.R2V?.references?.images
      : undefined;
    if (
      images.length > VIDEO_MAX_IMAGES &&
      req.task_type !== "I2V" &&
      gridImageCap === undefined
    )
      issue(
        ["src_image_urls"],
        `${req.task_type} accepts at most ${VIDEO_MAX_IMAGES} ${r2v ? "reference" : "source"} images; got ${images.length}`
      );
    if (!req.video_config) {
      issue(["video_config"], "video_config is required for video tasks");
      return;
    }
    const { duration_secs, num_frames } = req.video_config;
    if ((duration_secs === undefined) === (num_frames === undefined))
      issue(
        ["video_config"],
        "set exactly one of duration_secs and num_frames"
      );
    // UPSCALE accepts uploaded inputs; SHARPEN checks owned inputs below.
    if (req.task_type !== "SHARPEN")
      videos.forEach((url, i) => {
        if (
          !isHttpUrl(url) &&
          !(
            req.task_type === "UPSCALE" &&
            url.startsWith("@input/") &&
            url.length > 7
          )
        )
          issue(
            ["src_video_urls", i],
            req.task_type === "UPSCALE"
              ? "UPSCALE src_video_urls takes public http(s) URLs or nonempty @input/ references"
              : "src_video_urls takes public http(s) URLs; reference a MachGen output with src_task_ids"
          );
      });
    const subjects = new Map<string, string>();
    for (const [map, refs] of [
      ["subject_to_image_ids", images],
      ["subject_to_video_ids", videos],
      ["subject_to_audio_ids", audios],
    ] as const) {
      for (const [name, indices] of Object.entries(req[map] ?? {})) {
        const seen = subjects.get(name);
        if (seen)
          issue(
            [map, name],
            `subject ${name} appears in both ${seen} and ${map}; a name may appear in only one map`
          );
        subjects.set(name, map);
        // src_task_ids may append outputs after the URLs, so only check URL lists.
        if (!req.src_task_ids?.length)
          for (const index of indices)
            if (index < 0 || index >= refs.length)
              issue(
                [map, name],
                `${map} ${name} points at index ${index}, but there are ${refs.length} references`
              );
      }
    }
    if (req.task_type === "I2V") {
      if (images.length > 2)
        issue(
          ["src_image_urls"],
          `I2V accepts at most 2 source images; got ${images.length}`
        );
      if (keyframes && keyframes.length !== images.length)
        issue(
          ["keyframe_indices"],
          `keyframe_indices has ${keyframes.length} entries for ${images.length} source images; they must align`
        );
    }
    if (!Object.hasOwn(MACHGEN_VIDEO_MODEL_TASK_TYPES, req.model)) return;
    const model = req.model as MachGenVideoModel;
    const tasks: readonly string[] = MACHGEN_VIDEO_MODEL_TASK_TYPES[model];
    if (!tasks.includes(req.task_type)) {
      issue(
        ["task_type"],
        `${model} does not support task_type=${req.task_type}; allowed task types: ${list(tasks)}`
      );
      return;
    }
    const { height, aspect_ratio } = req.video_config;
    if (req.task_type === "UPSCALE") {
      if (!req.src_task_ids?.length && !videos.length && !images.length)
        issue(
          ["src_task_ids"],
          "a source video or image is required for UPSCALE"
        );
      const upscale = MACHGEN_VIDEO_UPSCALE[model];
      if (!upscale) return;
      if (!upscale.heights.includes(height))
        issue(
          ["video_config", "height"],
          `${model} does not support UPSCALE height=${height}; allowed heights: ${list(upscale.heights)}`
        );
      const engine = req.upscale_config?.engine;
      if (
        engine !== undefined &&
        upscale.engines &&
        !upscale.engines.includes(engine)
      )
        issue(
          ["upscale_config", "engine"],
          `${model} does not support UPSCALE engine=${engine}; allowed engines: ${list(upscale.engines)}`
        );
      return;
    }
    if (req.task_type === "SHARPEN") {
      // One owned video: a MachGen task's output, or an upload referenced as
      // @input/<artifact_path>. A public URL is not owned.
      if (videos.some((url) => !url.startsWith("@input/")))
        issue(
          ["src_video_urls"],
          "SHARPEN requires an owned uploaded or generated video"
        );
      const sources = (req.src_task_ids?.length ?? 0) + videos.length;
      if (sources === 0)
        issue(
          ["src_task_ids"],
          "SHARPEN requires an owned uploaded or generated video"
        );
      if (sources > 1)
        issue(["src_task_ids"], "SHARPEN accepts one source video");
      if (num_frames !== undefined)
        issue(
          ["video_config", "num_frames"],
          `${model} SHARPEN does not accept num_frames`
        );
      const sharpen = MACHGEN_VIDEO_SHARPEN[model];
      if (sharpen && !sharpen.heights.includes(height))
        issue(
          ["video_config", "height"],
          `${model} does not support SHARPEN height=${height}; allowed heights: ${list(sharpen.heights)}`
        );
      return;
    }
    const grid = MACHGEN_VIDEO_GRIDS[model]?.[req.task_type];
    if (!grid) return;
    const task = req.task_type;
    if (!grid.heights.includes(height))
      issue(
        ["video_config", "height"],
        `${model} does not support ${task} height=${height}; allowed heights: ${list(grid.heights)}`
      );
    if (
      aspect_ratio !== undefined &&
      grid.aspectRatios &&
      !grid.aspectRatios.includes(aspect_ratio)
    )
      issue(
        ["video_config", "aspect_ratio"],
        grid.aspectRatios.length === 0
          ? `${model} does not support configurable aspect_ratio for ${task}`
          : `${model} does not support ${task} aspect_ratio='${aspect_ratio}'; allowed aspect ratios: ${list(grid.aspectRatios)}`
      );
    // An edit matches the source's length, so MachGen ignores duration_secs.
    if (
      duration_secs !== undefined &&
      req.reference_video_operation !== "edit" &&
      !grid.durations.includes(duration_secs)
    )
      issue(
        ["video_config", "duration_secs"],
        `${model} does not support ${task} duration_secs=${duration_secs}; allowed durations: ${list(grid.durations)}`
      );
    if (task === "R2V") {
      const caps = grid.references ?? {};
      for (const [kind, refs, path, noun] of [
        ["images", images, "src_image_urls", "reference images"],
        ["videos", videos, "src_video_urls", "reference videos"],
        ["audios", audios, "src_audio_urls", "reference audio clips"],
      ] as const) {
        const cap = caps[kind];
        if (cap !== undefined && refs.length > cap)
          issue(
            [path],
            `${model} R2V accepts at most ${cap} ${noun}; got ${refs.length}`
          );
      }
      const total = images.length + videos.length + audios.length;
      if (caps.total !== undefined && total > caps.total)
        issue(
          ["src_image_urls"],
          `${model} R2V accepts at most ${caps.total} reference files; got ${total}`
        );
      if (
        grid.visualReference &&
        audios.length > 0 &&
        !images.length &&
        !videos.length &&
        !req.src_task_ids?.length
      )
        issue(
          ["src_audio_urls"],
          `${model} R2V audio references require at least one image or video reference`
        );
      const starts = req.reference_video_start_secs;
      if (
        starts &&
        !req.src_task_ids?.length &&
        starts.length !== videos.length
      )
        issue(
          ["reference_video_start_secs"],
          `reference_video_start_secs has ${starts.length} entries for ${videos.length} reference videos; they must align`
        );
      if (starts?.some((start) => start > 0) && !grid.startOffset)
        issue(
          ["reference_video_start_secs"],
          `${model} R2V reads every reference video from its start; it does not support reference_video_start_secs`
        );
      const operation = req.reference_video_operation;
      if (
        operation !== undefined &&
        grid.operations &&
        !grid.operations.includes(operation)
      )
        issue(
          ["reference_video_operation"],
          `${model} R2V does not support reference_video_operation='${operation}'; allowed operations: ${list(grid.operations)}`
        );
      return;
    }
    if (task !== "I2V") return;
    if (images.length === 0)
      issue(
        ["src_image_urls"],
        `${model} I2V accepts one source image, or two to pin a start and end frame; got 0`
      );
    if (images.length === 2 && !grid.endFrame)
      issue(
        ["src_image_urls"],
        `${model} I2V accepts one source image; it does not support a last frame`
      );
    if (keyframes?.length === 1 && keyframes[0] === -1 && !grid.loneEndFrame)
      issue(
        ["keyframe_indices"],
        `${model} I2V does not render towards a lone last frame; send the first frame as image 0`
      );
  });

const UPSCALE_MODELS = Object.entries(MACHGEN_VIDEO_MODEL_TASK_TYPES)
  .filter(([, tasks]) => (tasks as readonly string[]).includes("UPSCALE"))
  .map(([model]) => model) as [MachGenVideoModel, ...MachGenVideoModel[]];

// The upscale quote takes generate's task input and keeps its checks, since
// MachGen answers a bad quote with the same 400s (2026-10-25 probes).
export const MachGenUpscaleQuoteRequestSchema =
  MachGenGenerateRequestSchema.safeExtend({
    model: z.enum(UPSCALE_MODELS).or(MachGenModelAliasSchema),
    task_type: z.literal("UPSCALE"),
  }).describe(
    "An UPSCALE task input, as api.v0.generate takes it, priced without " +
      "creating a task. MachGen's REST docs do not list this endpoint " +
      "(read 2026-10-26), so MachGen may change it without notice."
  );

// Custom LoRAs, https://www.machgen.ai/docs/rest_api/custom-loras (read
// 2026-11-11). Free reserve probes that day
// (tests/fixtures/machgen-evidence/machgen-adapter-reserve-2026-11-11.json)
// answered HTTP 400 before reserving anything. They named every field below
// as required, rejected unknown keys in both configs, and set the bounds
// pinned here: size_bytes 9 to 5000000000, a lowercase hex md5, 1 to 1000
// steps, guidance_scale exactly 1, shifts above 0, and the three sampling
// rules the docs list. MachGen's sampler list also names `renoise`, which the
// docs leave out.

/** Lowercase kebab-case base-model ids, the grammar of `minimax-h3`. */
export const MachGenAdapterBaseModelAliasSchema = z
  .string()
  .regex(/^[a-z][a-z0-9.]*(?:-[a-z0-9.]+)+$/);

/** How the weights file was trained and how its tensors are named. */
export const MachGenAdapterConfigSchema = z
  .object({
    base_model: z.enum(["minimax-h3"]).or(MachGenAdapterBaseModelAliasSchema),
    base_partition: z
      .enum(["FL2VA", "Ref2VA"])
      .describe("FL2VA LoRAs serve T2V and I2V; Ref2VA LoRAs serve R2V"),
    export_format: z.enum([
      "machgen-h3-direct-v1",
      "h3-native-v1",
      "h3-comfy-packed-v1",
      "h3-diffusers-hyperflow-v1",
    ]),
    scaling: z.discriminatedUnion("mode", [
      z.object({ mode: z.literal("unit") }),
      z.object({ mode: z.literal("alpha_over_rank"), alpha: z.number() }),
      z.object({ mode: z.literal("alpha_tensor_over_rank") }),
    ]),
  })
  .strict();

/** The sampling recipe the LoRA was trained for. */
export const MachGenAdapterSamplingSchema = z
  .object({
    num_inference_steps: z.number().int().min(1).max(1000),
    guidance_scale: z.literal(1),
    video_shift: z.number().positive(),
    audio_shift: z.number().positive(),
    sampler: z.enum(["euler", "res_multistep", "renoise"]),
    sigma_grid: z.enum(["linspace", "simple", "fixed"]),
    fixed_sigmas: z
      .array(z.number())
      .optional()
      .describe("Fixed grid only: steps + 1 values, strictly from 1 down to 0"),
  })
  .superRefine((sampling, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (
      sampling.sampler === "res_multistep" &&
      sampling.sigma_grid !== "simple"
    )
      issue("sigma_grid", "res_multistep requires the simple sigma grid");
    if (sampling.sigma_grid !== "linspace" && sampling.audio_shift !== 3)
      issue("audio_shift", "simple and fixed grids require audio_shift 3.0");
    const sigmas = sampling.fixed_sigmas ?? [];
    if (
      sampling.sigma_grid === "fixed" &&
      (sigmas.length !== sampling.num_inference_steps + 1 ||
        sigmas[0] !== 1 ||
        sigmas[sigmas.length - 1] !== 0 ||
        sigmas.some((sigma, i) => i > 0 && sigma >= sigmas[i - 1]))
    )
      issue(
        "fixed_sigmas",
        "fixed_sigmas must decrease strictly from 1 to 0 with steps+1 entries"
      );
  });

/** Default strength, trigger phrase and sampling recipe for the LoRA. */
export const MachGenAdapterInferenceConfigSchema = z
  .object({
    default_strength: z.number(),
    trigger_prompt: z
      .string()
      .describe(
        "Prepended to every prompt; empty when there is no trigger word"
      ),
    sampling: MachGenAdapterSamplingSchema,
  })
  .strict();

export const MachGenAdapterCreateRequestSchema = z
  .object({
    model: z
      .enum(["MiniMax-H3"])
      .or(MachGenModelAliasSchema)
      .describe("Sent as the ?model= query parameter"),
    size_bytes: z
      .number()
      .int()
      .min(9)
      .max(5_000_000_000)
      .describe("The weights file's exact size in bytes; at most 5 GB"),
    md5: z
      .string()
      .regex(/^[0-9a-f]{32}$/)
      .describe("The weights file's MD5, lowercase hex"),
    adapter_config: MachGenAdapterConfigSchema,
    inference_config: MachGenAdapterInferenceConfigSchema,
  })
  .describe(
    "Reserves a custom-LoRA upload for MiniMax-H3, the only model with " +
      "custom LoRAs (read 2026-11-11). model goes in the ?model= query and " +
      "the rest in the JSON body. Reserving bills nothing. The response's " +
      "one-time upload_url accepts the .safetensors file by PUT for 7 days, " +
      "and anyone holding it can write the file, so treat it like a password. " +
      "Commit the upload next. The adapter id is derived from the file and " +
      "both configs, so reserving the same upload again returns the same id " +
      "and a fresh upload_url, which retires the previous one."
  );
