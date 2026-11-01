import { z } from "zod";

// Video task types per model, from https://www.machgen.ai/docs/models
// (2026-10-25). Vidu-Upscale-Pro is on the pricebook but not in the models
// table, and MachGen answered HTTP 500 to every request for it that day, so it
// passes unchecked like any other id. SHARPEN is in the TaskInput reference
// (https://www.machgen.ai/docs/reference#taskinput), not the models table;
// MachGen's quote priced it for MiniMax-H3 alone on 2026-10-31.
// MiniMax-H3-Omni is hidden from the models table but has a model page
// (https://www.machgen.ai/models/machgen/minimax-h3-omni) and pricebook rows;
// MachGen's 400s named R2V as its one task type on 2026-11-01.
export const MACHGEN_VIDEO_MODEL_TASK_TYPES = {
  "Wan2.2-A14B": ["T2V", "I2V"],
  "LTX-2.3-Pro": ["T2V", "I2V"],
  "Vidu-Q3-Turbo": ["T2V", "I2V", "R2V"],
  "Vidu-Q3-Pro": ["T2V", "I2V", "R2V"],
  "MiniMax-H3": ["T2V", "I2V", "R2V", "UPSCALE", "SHARPEN"],
  "MiniMax-H3-Turbo": ["T2V", "I2V", "R2V"],
  "MiniMax-H3-Omni": ["R2V"],
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
    T2V: { heights: [480, 768, 1080, 1440], durations: secs(1, 30), ...H3_T2V },
    I2V: { heights: [480, 768, 1080, 1440], durations: secs(1, 30), ...H3_I2V },
    R2V: { heights: [480, 768, 1080, 1440], durations: secs(1, 30), ...H3_R2V },
  },
  "MiniMax-H3-Turbo": {
    T2V: { heights: [480, 768, 1080], durations: secs(4, 15), ...H3_T2V },
    I2V: { heights: [480, 768, 1080], durations: secs(4, 15), ...H3_I2V },
    R2V: { heights: [480, 768, 1080], durations: secs(4, 15), ...H3_R2V },
  },
  // Read from 400s on 2026-11-01
  // (tests/fixtures/machgen-evidence/machgen-omni-2026-11-01.json).
  "MiniMax-H3-Omni": {
    R2V: {
      heights: [768],
      durations: secs(1, 15),
      aspectRatios: ADAPTIVE,
      references: { images: 9, videos: 3, audios: 3, total: 12 },
      visualReference: true,
      operations: ["reference"],
    },
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
  "Nano-Banana-2",
  "Nano-Banana-2.1",
] as const;

export const MachGenImageConfigSchema = z.object({
  height: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  aspect_ratio: z.string().optional(),
  infer_steps: z.number().int().positive().optional(),
  guidance_scale: z.array(z.number()).optional(),
});

export const MachGenGenerateRequestSchema = z
  .object({
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
    image_config: MachGenImageConfigSchema.optional(),
    upscale_config: MachGenUpscaleConfigSchema.optional(),
    enhance_prompt: z.boolean().optional(),
    prompt_enhancement_level: z
      .enum(["DEFAULT", "FAST", "BALANCED", "DEEP"])
      .optional(),
    prompt_enhancer: z.string().optional(),
    seed: z.number().int().optional(),
    optimization_level: z.enum(["STANDARD", "FAST", "EXPRESS"]).optional(),
    adapter: z.string().optional(),
    src_image_urls: z.array(z.string()).max(9).optional(),
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
    const imageModel = (MACHGEN_IMAGE_MODELS as readonly string[]).includes(
      req.model
    );
    if (req.task_type === "T2I" || req.task_type === "I2I") {
      if (Object.hasOwn(MACHGEN_VIDEO_MODEL_TASK_TYPES, req.model))
        issue(["task_type"], `${req.model} does not support ${req.task_type}`);
      if (!req.image_config)
        issue(["image_config"], "image_config is required for image tasks");
      if (
        req.task_type === "I2I" &&
        !images.length &&
        !req.src_task_ids?.length
      )
        issue(["src_image_urls"], "I2I requires a source image or source task");
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
    // SHARPEN takes an owned upload instead; its branch below checks that.
    if (req.task_type !== "SHARPEN")
      videos.forEach((url, i) => {
        if (!isHttpUrl(url))
          issue(
            ["src_video_urls", i],
            "src_video_urls takes public http(s) URLs; reference a MachGen output with src_task_ids"
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
