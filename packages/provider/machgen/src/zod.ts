import { z } from "zod";

// Video task types per model, from https://www.machgen.ai/docs/models
// (2026-10-25). UPSCALE is left to the video-to-video catalog.
export const MACHGEN_VIDEO_MODEL_TASK_TYPES = {
  "Wan2.2-A14B": ["T2V", "I2V"],
  "LTX-2.3-Pro": ["T2V", "I2V"],
  "Vidu-Q3-Turbo": ["T2V", "I2V", "R2V"],
  "Vidu-Q3-Pro": ["T2V", "I2V", "R2V"],
  "MiniMax-H3": ["T2V", "I2V", "R2V"],
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

// T2V and I2V grids, read from MachGen's 400 responses to off-grid requests on
// 2026-10-25 (tests/fixtures/machgen-evidence/machgen-grids-2026-10-25.json).
// A T2V-only model's aspect ratios were not probed, so they are not checked.
export const MACHGEN_VIDEO_GRIDS: Readonly<
  Record<string, Readonly<Partial<Record<"T2V" | "I2V", MachGenVideoGrid>>>>
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
  },
  "MiniMax-H3": {
    T2V: { heights: [480, 768, 1080, 1440], durations: secs(1, 30), ...H3_T2V },
    I2V: { heights: [480, 768, 1080, 1440], durations: secs(1, 30), ...H3_I2V },
  },
  "MiniMax-H3-Turbo": {
    T2V: { heights: [480, 768, 1080], durations: secs(4, 15), ...H3_T2V },
    I2V: { heights: [480, 768, 1080], durations: secs(4, 15), ...H3_I2V },
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
  },
  "Seedance-2.0": {
    T2V: { heights: [480, 720, 1080, 2160], ...SEEDANCE_T2V },
    I2V: { heights: [480, 720, 1080, 2160], ...SEEDANCE_I2V },
  },
  "Seedance-2.0-Fast": {
    T2V: { heights: [480, 720], ...SEEDANCE_T2V },
    I2V: { heights: [480, 720], ...SEEDANCE_I2V },
  },
  "Seedance-2.0-Mini": {
    T2V: { heights: [480, 720], ...SEEDANCE_T2V },
    I2V: { heights: [480, 720], ...SEEDANCE_I2V },
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
  "Kling-o3": { T2V: { heights: [720, 1080, 2160], durations: secs(3, 15) } },
  "Vidu-Q4-Preview": {
    I2V: {
      heights: [540, 720, 1080, 1440, 2160],
      durations: secs(3, 16),
      aspectRatios: [],
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
  },
  "Veo-3.1": { T2V: { heights: [720, 1080, 2160], durations: [4, 6, 8] } },
  "Veo-3.1-Fast": { T2V: { heights: [720, 1080, 2160], durations: [4, 6, 8] } },
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
  },
  "HappyHorse-1.1": {
    T2V: {
      heights: [720, 1080],
      durations: secs(3, 15),
      aspectRatios: [...VIDU, "21:9"],
    },
    I2V: { heights: [720, 1080], durations: secs(3, 15), aspectRatios: [] },
  },
  "HappyHorse-1.0": {
    T2V: {
      heights: [720, 1080],
      durations: secs(3, 15),
      aspectRatios: [...VIDU, "21:9"],
    },
    I2V: { heights: [720, 1080], durations: secs(3, 15), aspectRatios: [] },
  },
  "Grok-Imagine-Video": {
    T2V: { heights: [480, 720], durations: secs(1, 15) },
  },
  "Grok-Imagine-Video-1.5": {
    I2V: {
      heights: [480, 720, 1080],
      durations: secs(1, 15),
      aspectRatios: [],
    },
  },
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

const list = (values: readonly unknown[]) => values.join(", ");

export const MachGenGenerateRequestSchema = z
  .object({
    model: z
      .enum(
        Object.keys(MACHGEN_VIDEO_MODEL_TASK_TYPES) as [
          MachGenVideoModel,
          ...MachGenVideoModel[],
        ]
      )
      .or(MachGenModelAliasSchema),
    task_type: z.enum(["T2V", "I2V", "R2V"]),
    prompt: z.string(),
    video_config: MachGenVideoConfigSchema,
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
    reference_video_start_secs: z.number().nonnegative().optional(),
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
    const keyframes = req.keyframe_indices;
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
    if (req.task_type === "R2V") return;
    const grid = MACHGEN_VIDEO_GRIDS[model]?.[req.task_type];
    if (!grid) return;
    const task = req.task_type;
    const { height, aspect_ratio, duration_secs } = req.video_config;
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
    if (duration_secs !== undefined && !grid.durations.includes(duration_secs))
      issue(
        ["video_config", "duration_secs"],
        `${model} does not support ${task} duration_secs=${duration_secs}; allowed durations: ${list(grid.durations)}`
      );
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
