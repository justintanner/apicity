import { z } from "zod";

export const MACHGEN_VIDEO_MODEL_TASK_TYPES = {
  "MiniMax-H3": ["T2V", "I2V", "R2V"],
  "Seedance-2.5": ["T2V", "I2V", "R2V"],
  "Seedance-2.0": ["T2V", "I2V", "R2V"],
  "Alibaba-Wan-3.0": ["T2V", "I2V", "R2V"],
  "HappyHorse-1.1": ["T2V", "I2V", "R2V"],
  "Grok-Imagine-Video-1.5": ["I2V"],
} as const;

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
});

export const MachGenGenerateRequestSchema = z.object({
  model: z
    .enum(
      Object.keys(MACHGEN_VIDEO_MODEL_TASK_TYPES) as [
        keyof typeof MACHGEN_VIDEO_MODEL_TASK_TYPES,
        ...(keyof typeof MACHGEN_VIDEO_MODEL_TASK_TYPES)[],
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
  keyframe_indices: z.array(z.union([z.literal(0), z.literal(-1)])).optional(),
  src_video_urls: z.array(z.string()).max(3).optional(),
  src_audio_urls: z.array(z.string()).max(3).optional(),
  src_task_ids: z.array(z.string()).optional(),
  src_file_urls: z.array(z.string()).max(1).optional(),
  src_webpage_urls: z.array(z.string()).max(1).optional(),
  reference_video_operation: z.enum(["reference", "edit", "extend"]).optional(),
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
});
