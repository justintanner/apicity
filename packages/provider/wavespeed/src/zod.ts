import { z } from "zod";

// The prediction statuses WaveSpeed documents (Predictions API, read
// 2026-11-02). `completed` carries the outputs; `failed`, `cancelled`,
// `timeout` and `deleted` are terminal failures; the rest are still running.
export const WaveSpeedPredictionStatusSchema = z.enum([
  "created",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "timeout",
  "deleted",
]);

// alibaba/wan-3.0/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedAlibabaWan3p0TextToVideoRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  resolution: z
    .enum(["480p", "720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  aspect_ratio: z
    .enum(["16:9", "9:16", "1:1", "4:3", "3:4"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
  duration: z
    .number()
    .int()
    .min(2)
    .max(30)
    .optional()
    .describe("Length of the video in seconds, 2-30. WaveSpeed default: 5."),
  enable_prompt_expansion: z
    .boolean()
    .optional()
    .describe(
      "Let WaveSpeed's prompt optimizer rewrite the prompt. WaveSpeed default: false."
    ),
  generate_audio: z
    .boolean()
    .optional()
    .describe("Generate an audio track. WaveSpeed default: true."),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed; -1 picks a random one."),
});

// heygen/video-1.0/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedHeygenVideo1p0TextToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe("Describe the scene, action, and camera movement."),
  duration: z
    .number()
    .int()
    .min(5)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 5-15. WaveSpeed default: 5."),
  resolution: z
    .enum(["480p", "768p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `768p`."),
  aspect_ratio: z
    .enum(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
  prompt_enhancement: z
    .enum(["disabled", "turbo", "quality"])
    .optional()
    .describe(
      "Rewrite the prompt before generating. WaveSpeed default: `disabled`."
    ),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .optional()
    .describe("Random seed. Omit for a random result."),
});
