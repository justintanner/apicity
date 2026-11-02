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
    .min(1)
    .max(32000)
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

// minimax/h3/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedMinimaxH3TextToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .max(7000)
    .describe(
      "Text description of the video scene, action, camera movement, and style."
    ),
  aspect_ratio: z
    .enum(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
  resolution: z
    .enum(["768p", "2k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `768p`."),
  duration: z
    .number()
    .int()
    .min(4)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 4-15. WaveSpeed default: 5."),
});

// bytedance/seedance-2.5/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Describe the scene, action, camera movement, and mood for the video."
    ),
  reference_images: z
    .array(z.string())
    .max(30)
    .optional()
    .describe(
      "Public URLs of up to 30 images that guide visual style, characters, or scene composition."
    ),
  reference_videos: z
    .array(z.string())
    .max(10)
    .optional()
    .describe(
      "Public URLs of up to 10 reference videos, at most 30 s in all. They bill by their length."
    ),
  reference_audios: z
    .array(z.string())
    .max(10)
    .optional()
    .describe(
      "Public URLs of up to 10 reference audio clips, at most 30 s in all."
    ),
  aspect_ratio: z
    .enum(["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
  resolution: z
    .enum(["480p", "720p", "1080p", "4k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(4)
    .max(30)
    .optional()
    .describe("Length of the video in seconds, 4-30. WaveSpeed default: 5."),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio synchronized with the video. WaveSpeed default: true."
    ),
});

// black-forest-labs/flux-3/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe("The text prompt describing the video you want to generate."),
  aspect_ratio: z
    .enum(["21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `9:16`."),
  resolution: z
    .enum(["720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(5)
    .max(20)
    .optional()
    .describe("Length of the video in seconds, 5-20. WaveSpeed default: 5."),
  generate_audio: z
    .boolean()
    .optional()
    .describe("Generate an audio track. WaveSpeed default: true."),
});

// bytedance/seedance-2.0/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Describe the scene, action, camera movement, and mood for the video."
    ),
  reference_images: z
    .array(z.string())
    .max(9)
    .optional()
    .describe(
      "Public URLs of up to 9 images that guide visual style, characters, or scene composition."
    ),
  reference_videos: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 reference videos, at most 15 s in all. They bill by their length."
    ),
  reference_audios: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 reference audio clips, at most 15 s in all."
    ),
  aspect_ratio: z
    .enum(["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
  resolution: z
    .enum(["480p", "720p", "1080p", "4k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(4)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 4-15. WaveSpeed default: 5."),
  enable_web_search: z
    .boolean()
    .optional()
    .describe(
      "Search the web for real-time information. WaveSpeed default: false."
    ),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio synchronized with the video. WaveSpeed default: true."
    ),
});

// google/gemini-omni-1.1-flash/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe("Text prompt describing the video to generate."),
    aspect_ratio: z
      .enum(["16:9", "9:16"])
      .optional()
      .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
    resolution: z
      .enum(["360p", "720p", "1080p", "4k"])
      .optional()
      .describe("Resolution of the video. WaveSpeed default: `720p`."),
    duration: z
      .number()
      .int()
      .min(3)
      .max(10)
      .optional()
      .describe("Length of the video in seconds, 3-10. WaveSpeed default: 8."),
  });

// minimax/h3/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedMinimaxH3ImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .max(7000)
    .describe("Text description of the desired motion and scene."),
  image: z
    .string()
    .describe(
      "First frame: a public URL or Base64 data, 256-5760 px per side, aspect ratio 0.4-2.5."
    ),
  last_image: z
    .string()
    .optional()
    .describe("Last frame: a public URL or Base64 data."),
  resolution: z
    .enum(["768p", "2k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `768p`."),
  duration: z
    .number()
    .int()
    .min(4)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 4-15. WaveSpeed default: 5."),
});

// bytedance/seedance-2.5/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Describe the scene, action, camera movement, and mood for the video."
    ),
  image: z.string().describe("Public URL of the start frame."),
  last_image: z.string().optional().describe("Public URL of the last frame."),
  resolution: z
    .enum(["480p", "720p", "1080p", "4k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(4)
    .max(30)
    .optional()
    .describe("Length of the video in seconds, 4-30. WaveSpeed default: 5."),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio synchronized with the video. WaveSpeed default: true."
    ),
});

// google/gemini-omni-1.1-flash/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema =
  z.object({
    image: z.string().describe("Public URL of the image to animate."),
    last_image: z
      .string()
      .optional()
      .describe(
        "Public URL of an end frame; the video then runs from the first image to it."
      ),
    prompt: z
      .string()
      .describe("Text prompt describing how the image should be animated."),
    aspect_ratio: z
      .enum(["16:9", "9:16"])
      .optional()
      .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
    resolution: z
      .enum(["360p", "720p", "1080p", "4k"])
      .optional()
      .describe("Resolution of the video. WaveSpeed default: `720p`."),
    duration: z
      .number()
      .int()
      .min(3)
      .max(10)
      .optional()
      .describe("Length of the video in seconds, 3-10. WaveSpeed default: 8."),
  });
