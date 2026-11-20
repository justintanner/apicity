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

// https://wavespeed.ai/models/heygen/video-1.0/image-to-video (read 2026-11-18).
export const WaveSpeedHeygenVideo1p0ImageToVideoRequestSchema = z.object({
  image: z
    .string()
    .min(1)
    .describe("First-frame image. The output follows its aspect ratio."),
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
    .enum(["480p", "768p", "1080p", "2k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `768p`."),
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

// WaveSpeed model page, read 2026-11-18:
// https://wavespeed.ai/models/google/gemini-omni-1.2-flash/text-to-video
export const WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema =
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
      .max(15)
      .optional()
      .describe("Length of the video in seconds, 3-15. WaveSpeed default: 8."),
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

// alibaba/wan-3.0/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  image: z
    .string()
    .describe("First frame: a public URL or Base64-encoded data."),
  last_image: z
    .string()
    .optional()
    .describe("Last frame: a public URL or Base64-encoded data."),
  resolution: z
    .enum(["480p", "720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  aspect_ratio: z
    .enum(["16:9", "9:16", "1:1", "4:3", "3:4"])
    .optional()
    .describe(
      "Aspect ratio of the video. Omitted, WaveSpeed adapts it to the input image."
    ),
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

// bytedance/seedance-2.0/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Describe the scene, action, camera movement, and mood for the video."
    ),
  image: z.string().describe("Public URL of the start frame."),
  last_image: z.string().optional().describe("Public URL of the last frame."),
  aspect_ratio: z
    .enum(["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"])
    .optional()
    .describe(
      "Aspect ratio of the video. Omitted, WaveSpeed adapts it to the input image."
    ),
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

// black-forest-labs/flux-3/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe("The text prompt describing the video you want to generate."),
  image: z
    .string()
    .describe(
      "Public URL of the image the video starts from (PNG, JPEG or WebP)."
    ),
  aspect_ratio: z
    .enum(["21:9", "2:1", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional()
    .describe("Aspect ratio of the video."),
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

// x-ai/grok-imagine-video-v1.5/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Text description of the desired motion, camera movement, and scene."
      ),
    image: z.string().describe("Public URL of the image to animate."),
    duration: z
      .number()
      .int()
      .min(1)
      .max(15)
      .optional()
      .describe("Length of the video in seconds, 1-15. WaveSpeed default: 6."),
    resolution: z
      .enum(["480p", "720p", "1080p"])
      .optional()
      .describe("Resolution of the video. WaveSpeed default: `720p`."),
  });

// alibaba/happyhorse-1.1/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .max(2500)
    .describe("Text prompt guiding the animation, up to 2500 characters."),
  image: z
    .string()
    .describe(
      "Public URL of the first frame: JPEG, PNG, BMP or WebP, at least 300 px, aspect ratio 1:2.5-2.5:1, at most 10 MB."
    ),
  resolution: z
    .enum(["480p", "720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(3)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 3-15. WaveSpeed default: 5."),
  seed: z.number().int().optional().describe("Random seed."),
});

// alibaba/wan-3.0/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedAlibabaWan3p0VideoEditRequestSchema = z.object({
  prompt: z
    .string()
    .describe("Describe the edit you want applied to the input video."),
  video: z
    .string()
    .describe(
      "URL of the input video to edit. Videos longer than 15 s are trimmed to 15 s."
    ),
  reference_images: z
    .array(z.string())
    .max(10)
    .optional()
    .describe("Public URLs of up to 10 images that guide the edit."),
  reference_audios: z
    .array(z.string())
    .max(5)
    .optional()
    .describe(
      "Public URLs of up to 5 reference audio clips, at most 15 s in all."
    ),
  resolution: z
    .enum(["480p", "720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(2)
    .max(15)
    .optional()
    .describe(
      "Output length in seconds, 2-15. Omitted, WaveSpeed follows the input's length, rounded up into 2-15."
    ),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio for the edit; false keeps the input's audio track. WaveSpeed default: true."
    ),
  enable_prompt_expansion: z
    .boolean()
    .optional()
    .describe(
      "Let WaveSpeed's prompt optimizer rewrite the prompt. WaveSpeed default: false."
    ),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed; -1 picks a random one."),
});

// alibaba/wan-3.0/reference-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "The positive prompt for the generation. Refer to the references as Image 1, Video 1, Audio 1, ..., numbered per type in array order."
    ),
  reference_images: z
    .array(z.string())
    .max(10)
    .optional()
    .describe(
      "Public URLs of up to 10 reference images. At least one reference image, video, or audio is required."
    ),
  reference_videos: z
    .array(z.string())
    .max(5)
    .optional()
    .describe(
      "Public URLs of up to 5 reference videos (MP4 or MOV, 1-15 s each, at most 15 s in all)."
    ),
  reference_audios: z
    .array(z.string())
    .max(5)
    .optional()
    .describe(
      "Public URLs of up to 5 reference audio clips, at most 15 s in all."
    ),
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
    .describe(
      "Length of the video in seconds, 2-30; with reference videos, their length plus this must not exceed 30. WaveSpeed default: 5."
    ),
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

// bytedance/seedance-2.5/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema = z.object({
  prompt: z
    .string()
    .describe("Describe the edit you want applied to the input video."),
  video: z
    .string()
    .describe(
      "URL of the input video to edit. Videos longer than 30 s are trimmed to 30 s; videos shorter than 4 s are padded to 4 s."
    ),
  reference_images: z
    .array(z.string())
    .max(30)
    .optional()
    .describe(
      "Public URLs of up to 30 images that guide the edit (subject identity, style)."
    ),
  reference_audios: z
    .array(z.string())
    .max(10)
    .optional()
    .describe("Public URLs of up to 10 audio clips that guide the audio."),
  resolution: z
    .enum(["480p", "720p", "1080p", "4k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio for the edit; false keeps the input's audio track. WaveSpeed default: true."
    ),
});

// heygen/video-1.0/reference-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(32000)
    .describe("Describe the scene, action, and camera movement."),
  reference_images: z
    .array(z.string())
    .max(9)
    .optional()
    .describe(
      "Public URLs of up to 9 reference images. Provide reference images or videos, at most 12 references in all."
    ),
  reference_videos: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 reference videos. Only each video's first 5 s guide the generation, but WaveSpeed bills their full length, up to 600 s in all."
    ),
  reference_audios: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 reference audio clips; they need reference images or videos."
    ),
  duration: z
    .number()
    .int()
    .min(5)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 5-15. WaveSpeed default: 5."),
  resolution: z
    .enum(["480p", "768p", "1080p", "2k"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `768p`."),
  aspect_ratio: z
    .enum(["16:9", "9:16"])
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

// google/gemini-omni-1.1-flash/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema = z.object(
  {
    video: z.string().describe("URL of the source video to edit."),
    prompt: z
      .string()
      .describe("Instruction describing how to edit the source video."),
    resolution: z
      .enum(["360p", "720p", "1080p", "4k"])
      .optional()
      .describe("Resolution of the edited video. WaveSpeed default: `720p`."),
  }
);

// google/gemini-omni-1.2-flash/video-edit, from the WaveSpeed model page
// (https://wavespeed.ai/models/google/gemini-omni-1.2-flash/video-edit, read 2026-11-18).
export const WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema = z.object(
  {
    video: z
      .string()
      .describe("URL of the source video to edit (at most 10 seconds)."),
    prompt: z
      .string()
      .describe("Instruction describing how to edit the source video."),
    resolution: z
      .enum(["360p", "720p", "1080p", "4k"])
      .optional()
      .describe("Resolution of the edited video. WaveSpeed default: `720p`."),
  }
);

// minimax/h3/reference-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedMinimaxH3ReferenceToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .max(7000)
    .describe("Text description of the desired video scene and interactions."),
  reference_images: z
    .array(z.string())
    .max(9)
    .optional()
    .describe(
      "Public URLs of up to 9 reference images. At least one reference image or video is required."
    ),
  reference_videos: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 reference videos. Each clip is normalized to 2-15 s, and their combined length is capped at 15 s."
    ),
  reference_audios: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 reference audio clips; audio cannot be provided alone."
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

// wavespeed-ai/minimax-h3/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02). This is WaveSpeed's open-weights
// MiniMax H3: MiniMax's own minimax/h3 has no video edit on WaveSpeed.
export const WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Describe the edit you want applied to the input video: lighting, weather, style, environment, or specific elements."
    ),
  video: z
    .string()
    .describe(
      "URL of the input video to edit. It drives subject identity, composition, and motion."
    ),
  reference_images: z
    .array(z.string())
    .max(9)
    .optional()
    .describe(
      "Public URLs of up to 9 images that guide the edit; refer to them in the prompt as <Picture 1>..<Picture 9>."
    ),
  reference_audios: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "Public URLs of up to 3 audio clips that guide the audio; refer to them in the prompt as <Audio 1>..<Audio 3>."
    ),
  resolution: z
    .enum(["480p", "540p", "768p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `768p`."),
  aspect_ratio: z
    .enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"])
    .optional()
    .describe(
      "Aspect ratio of the video. Omitted, WaveSpeed follows the input video."
    ),
  duration: z
    .number()
    .int()
    .min(3)
    .max(15)
    .optional()
    .describe(
      "Output length in seconds, 3-15. Omitted, WaveSpeed follows the input video."
    ),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio for the edit; false keeps the input's audio track. WaveSpeed default: true."
    ),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed; a negative value picks a random one."),
});

// bytedance/seedance-2.5/reference-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02).
export const WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Describe the scene, action, camera movement, and mood for the video. Refer to the references as @Image 1, @Video 1, @Audio 1, in upload order."
      ),
    reference_images: z
      .array(z.string())
      .max(30)
      .optional()
      .describe(
        "Public URLs of up to 30 images that keep characters, products, or scenes consistent. Provide at least one reference; with none, the request runs as text-to-video."
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

// alibaba/happyhorse-1.0/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema = z.object({
  prompt: z.string().describe("Text description of the desired edits."),
  video: z.string().describe("URL of the source video to edit."),
  images: z
    .array(z.string())
    .max(5)
    .optional()
    .describe("Public URLs of up to 5 reference images for the edit."),
  resolution: z
    .enum(["720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed for reproducibility."),
});

// bytedance/seedance-2.0/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema = z.object({
  prompt: z
    .string()
    .describe("Describe the edit you want applied to the input video."),
  video: z
    .string()
    .describe(
      "URL of the input video to edit. Videos longer than 15 s are trimmed to 15 s."
    ),
  reference_images: z
    .array(z.string())
    .max(9)
    .optional()
    .describe(
      "Public URLs of up to 9 images that guide the edit (subject identity, style)."
    ),
  reference_audios: z
    .array(z.string())
    .max(3)
    .optional()
    .describe("Public URLs of up to 3 audio clips that guide the audio."),
  aspect_ratio: z
    .enum(["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"])
    .optional()
    .describe(
      "Aspect ratio of the video. Omitted, WaveSpeed follows the input video."
    ),
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
    .describe(
      "Output length in seconds, 4-15. Omitted, WaveSpeed follows the input video. Hidden in WaveSpeed's playground, accepted by its API."
    ),
  enable_web_search: z
    .boolean()
    .optional()
    .describe(
      "Enable web search for real-time information. WaveSpeed default: false."
    ),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Generate native audio for the edit; false keeps the input's audio track. WaveSpeed default: true."
    ),
});

// bytedance/seedance-2.0/reference-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Describe the scene, action, camera movement, and mood for the video. Refer to the references as @Image 1, @Video 1, @Audio 1, in upload order, and say what each is for."
      ),
    reference_images: z
      .array(z.string())
      .max(9)
      .optional()
      .describe(
        "Public URLs of up to 9 images that keep characters, products, or scenes consistent. Provide at least one reference; with none, the request runs as text-to-video."
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
        "Enable web search for real-time information. WaveSpeed default: false."
      ),
    generate_audio: z
      .boolean()
      .optional()
      .describe(
        "Generate native audio synchronized with the video. WaveSpeed default: true."
      ),
  });

// alibaba/wan-2.7/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedAlibabaWan2p7VideoEditRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the edit."),
  video: z.string().describe("URL of the source video to edit."),
  reference_images: z
    .array(z.string())
    .max(3)
    .optional()
    .describe("Public URLs of up to 3 reference images for the edit."),
  negative_prompt: z
    .string()
    .optional()
    .describe("The negative prompt for the edit."),
  resolution: z
    .enum(["720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `720p`."),
  duration: z
    .number()
    .int()
    .min(0)
    .max(10)
    .optional()
    .describe(
      "Output length in seconds: 0 uses the input video's length, up to 10 s; 2-10 trims it from 0 s. WaveSpeed default: 0."
    ),
  audio_setting: z
    .enum(["auto", "origin"])
    .optional()
    .describe(
      "`auto` lets the model decide from the prompt; `origin` keeps the input video's audio. WaveSpeed default: `auto`."
    ),
  enable_prompt_expansion: z
    .boolean()
    .optional()
    .describe("Enable the prompt optimizer. WaveSpeed default: false."),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed; -1 picks a random one."),
});

// google/gemini-omni-1.1-flash/reference-to-video, from WaveSpeed's model
// catalog (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Text prompt describing the video and how the references guide it. Refer to images as <IMAGE_REF_0>, <IMAGE_REF_1>, ... and videos as <VIDEO_REF_0>, ..., numbered from 0 in array order."
      ),
    images: z
      .array(z.string())
      .max(10)
      .optional()
      .describe("Public URLs of up to 10 reference images."),
    reference_videos: z
      .array(z.string())
      .max(3)
      .optional()
      .describe(
        "Public URLs of up to 3 reference videos, each at most 3 s long."
      ),
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

// google/gemini-omni-1.2-flash/reference-to-video, from WaveSpeed's model
// catalog (GET /api/v3/models, read 2026-11-18): the 1.1 fields with
// 3-15 s instead of 3-10 s.
export const WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Text prompt describing the video and how the reference media guides it. Refer to images as <IMAGE_REF_0>, <IMAGE_REF_1>, ... and videos as <VIDEO_REF_0>, ..., numbered from 0 in array order."
      ),
    images: z
      .array(z.string())
      .max(10)
      .optional()
      .describe("Public URLs of up to 10 reference images."),
    reference_videos: z
      .array(z.string())
      .max(3)
      .optional()
      .describe(
        "Public URLs of up to 3 reference videos, each at most 3 s long."
      ),
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
      .max(15)
      .optional()
      .describe("Length of the video in seconds, 3-15. WaveSpeed default: 8."),
  });

// runwayml/aleph-2, from WaveSpeed's model catalog (GET /api/v3/models, read
// 2026-11-02 and 2026-11-06).
export const WaveSpeedRunwaymlAleph2RequestSchema = z.object({
  prompt: z.string().describe("Text prompt describing the edit to apply."),
  video: z
    .string()
    .describe("URL of the input video to edit, 2-30 s long and under 16 MB."),
  keyframe_images: z
    .array(z.string())
    .max(5)
    .optional()
    .describe("Public URLs of up to 5 keyframe images."),
  keyframe_positions: z
    .array(z.string())
    .max(5)
    .optional()
    .describe(
      "Position of each keyframe: `first`, `last`, or a timestamp in seconds."
    ),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed for reproducible generation."),
});

// x-ai/grok-imagine-video-v1.5/reference-to-video, from WaveSpeed's model
// catalog (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Text description of the desired motion and scene. Refer to the reference images as <IMAGE_0>, <IMAGE_1>, ..., numbered from 0 in array order."
      ),
    reference_images: z
      .array(z.string())
      .max(7)
      .describe("Public URLs of up to 7 reference images guiding the video."),
    duration: z
      .number()
      .int()
      .min(1)
      .max(15)
      .optional()
      .describe("Length of the video in seconds, 1-15. WaveSpeed default: 6."),
    aspect_ratio: z
      .enum(["16:9", "1:1", "9:16", "3:2", "2:3"])
      .optional()
      .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
    resolution: z
      .enum(["480p", "720p"])
      .optional()
      .describe("Resolution of the video. WaveSpeed default: `720p`."),
  });

// kwaivgi/kling-image-v4.0/edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-20). The model page's parameter table
// matches. Resolution defaults to 2k, the cheapest tier.
export const WaveSpeedKwaivgiKlingImageV4p0EditRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Text prompt describing the image to create from the input images. Refer to the input images as <<<image_1>>>, <<<image_2>>>, etc. in array order."
    ),
  images: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      "Input image URLs, 1-10: subjects, products, styles or scenes to combine or transform. Each one adds to the price."
    ),
  aspect_ratio: z
    .enum(["1:1", "3:2", "2:3", "3:4", "4:3", "9:16", "16:9", "21:9"])
    .optional()
    .describe(
      "Aspect ratio of the generated image. When omitted, WaveSpeed chooses it from the input images."
    ),
  resolution: z
    .enum(["2k", "4k", "8k"])
    .optional()
    .describe(
      "Output resolution. 2k is the cheapest, then 4k, then 8k. WaveSpeed default: `2k`."
    ),
  num_images: z
    .number()
    .int()
    .min(1)
    .max(9)
    .optional()
    .describe(
      "Number of independent output images, 1-9. Each one is billed at the resolution rate. WaveSpeed default: 1."
    ),
  output_format: z
    .enum(["png", "jpeg", "webp"])
    .optional()
    .describe("Output image format. WaveSpeed default: `png`."),
});

// kwaivgi/kling-image-v4.0/text-to-image, from WaveSpeed's model catalog
// (GET /api/v3/models) and the model page, both read 2026-11-20 and
// unchanged since the survey. Resolution defaults to 2k, the cheapest
// tier. Aspect ratio defaults to 1:1. There is no images field.
export const WaveSpeedKwaivgiKlingImageV4p0TextToImageRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Text prompt for image generation. Text you quote in the prompt (titles, labels, signs) is rendered in the image."
    ),
  aspect_ratio: z
    .enum(["1:1", "3:2", "2:3", "3:4", "4:3", "9:16", "16:9", "21:9"])
    .optional()
    .describe("Aspect ratio of the generated image. WaveSpeed default: `1:1`."),
  resolution: z
    .enum(["2k", "4k", "8k"])
    .optional()
    .describe(
      "Output resolution. 2k is the cheapest, then 4k, then 8k. WaveSpeed default: `2k`."
    ),
  num_images: z
    .number()
    .int()
    .min(1)
    .max(9)
    .optional()
    .describe(
      "Number of independent output images, 1-9. Each one is billed at the resolution rate. WaveSpeed default: 1."
    ),
  output_format: z
    .enum(["png", "jpeg", "webp"])
    .optional()
    .describe("Output image format. WaveSpeed default: `png`."),
});

// kwaivgi/kling-video-o3-pro/video-edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema = z.object({
  prompt: z
    .string()
    .describe(
      "The positive prompt for the edit. Refer to images as <<<image_1>>>, <<<image_2>>>, ... in array order, the input video as <<<video_1>>> and elements as <<<element_1>>>, <<<element_2>>>, etc."
    ),
  video: z
    .string()
    .describe(
      "URL of the video to edit: .mp4 or .mov, up to 200 MB, 3-15 s (longer videos are trimmed to 15 s), width and height between 700 and 3840 px. The output's length follows it."
    ),
  images: z
    .array(z.string())
    .max(4)
    .optional()
    .describe(
      "Public URLs of up to 4 reference images of the element, scene or style."
    ),
  keep_original_sound: z
    .boolean()
    .optional()
    .describe(
      "Keep the original sound from the video. WaveSpeed default: true."
    ),
  element_list: z
    .array(
      z.object({
        element_id: z
          .string()
          .optional()
          .describe(
            "Element ID returned by kwaivgi/kling-elements or kwaivgi/kling-elements-advanced."
          ),
      })
    )
    .max(3)
    .optional()
    .describe("Up to 3 element references."),
});

// alibaba/happyhorse-1.1/reference-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-02 and 2026-11-06).
export const WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema =
  z.object({
    prompt: z
      .string()
      .describe(
        "Text description of the desired scene. Refer to the reference images as [Image 1], [Image 2], ... in array order."
      ),
    images: z
      .array(z.string())
      .max(9)
      .describe("Public URLs of 1-9 reference images."),
    resolution: z
      .enum(["480p", "720p", "1080p"])
      .optional()
      .describe("Resolution of the video. WaveSpeed default: `720p`."),
    aspect_ratio: z
      .enum(["16:9", "9:16", "1:1", "4:3", "3:4", "4:5", "5:4", "9:21", "21:9"])
      .optional()
      .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
    duration: z
      .number()
      .int()
      .min(3)
      .max(15)
      .optional()
      .describe("Length of the video in seconds, 3-15. WaveSpeed default: 5."),
    seed: z
      .number()
      .int()
      .optional()
      .describe("Random seed for reproducibility."),
  });

// openai/gpt-image-2.6-sunburst/text-to-image, from the request schema on
// WaveSpeed's model page (read 2026-11-16).
export const WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema =
  z.object({
    prompt: z.string().describe("The positive prompt for the generation."),
    aspect_ratio: z
      .enum([
        "1:1",
        "1:2",
        "2:1",
        "1:3",
        "3:1",
        "2:3",
        "3:2",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "9:21",
        "21:9",
      ])
      .optional()
      .describe("Aspect ratio of the image. WaveSpeed default: `1:1`."),
    resolution: z
      .enum(["1k", "2k", "4k"])
      .optional()
      .describe("Resolution of the image. WaveSpeed default: `1k`."),
    quality: z
      .enum(["low", "medium", "high", "xhigh", "max"])
      .optional()
      .describe(
        "Rendering quality. Higher tiers add detail and cost more. WaveSpeed default: `medium`."
      ),
    complexity: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe(
        "How much planning the model does before drawing. It does not change the price. WaveSpeed default: `high`."
      ),
    output_format: z
      .enum(["png", "jpeg", "webp", "gif", "svg"])
      .optional()
      .describe(
        "Format of the output. `gif` returns an animation, `svg` a vector image. WaveSpeed default: `png`."
      ),
    frame_count: z
      .number()
      .int()
      .min(2)
      .max(16)
      .optional()
      .describe(
        "GIF only: number of animation frames, 2-16. WaveSpeed default: 9."
      ),
    frame_duration_ms: z
      .number()
      .int()
      .min(20)
      .max(2000)
      .optional()
      .describe(
        "GIF only: milliseconds per frame, 20-2000. WaveSpeed default: 200."
      ),
  });

// openai/gpt-image-2.6-sunburst/edit, from the request schema on WaveSpeed's
// model page (read 2026-11-16).
export const WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  images: z
    .array(z.string())
    .max(16)
    .describe("Public URLs of 1-16 input images to edit."),
  mask_image: z
    .string()
    .optional()
    .describe(
      "Mask for the first input image: white marks the area to edit, black the area to keep (a PNG whose transparent area marks the edit is also accepted). Use either `mask_image` or `markup_image`."
    ),
  markup_image: z
    .string()
    .optional()
    .describe(
      "Transparent PNG of annotations (circles, arrows, notes) drawn over the first input image to show where and how to edit it. Use either `mask_image` or `markup_image`."
    ),
  aspect_ratio: z
    .enum([
      "1:1",
      "1:2",
      "2:1",
      "1:3",
      "3:1",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "9:21",
      "21:9",
    ])
    .optional()
    .describe(
      "Aspect ratio of the image. When omitted, it follows the input image."
    ),
  resolution: z
    .enum(["1k", "2k", "4k"])
    .optional()
    .describe("Resolution of the image. WaveSpeed default: `1k`."),
  quality: z
    .enum(["low", "medium", "high", "xhigh", "max"])
    .optional()
    .describe(
      "Rendering quality. Higher tiers add detail and cost more. WaveSpeed default: `medium`."
    ),
  complexity: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe(
      "How much planning the model does before drawing. It does not change the price. WaveSpeed default: `high`."
    ),
  output_format: z
    .enum(["png", "jpeg", "webp", "gif"])
    .optional()
    .describe(
      "Format of the output. `gif` returns an animation. WaveSpeed default: `png`."
    ),
  frame_count: z
    .number()
    .int()
    .min(2)
    .max(16)
    .optional()
    .describe(
      "GIF only: number of animation frames, 2-16. WaveSpeed default: 9."
    ),
  frame_duration_ms: z
    .number()
    .int()
    .min(20)
    .max(2000)
    .optional()
    .describe(
      "GIF only: milliseconds per frame, 20-2000. WaveSpeed default: 200."
    ),
});

// openai/gpt-image-2.6-flare/text-to-image: the model page (read 2026-11-16)
// gives it the same request schema as the Sunburst model.
export const WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema =
  WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema;

// openai/gpt-image-2.6-flare/edit: the model page (read 2026-11-16) gives it
// the same request schema as the Sunburst model.
export const WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema =
  WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema;

// google/nano-banana-2.1/text-to-image, from the request schema on WaveSpeed's
// model page (read 2026-11-16).
export const WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  aspect_ratio: z
    .enum([
      "1:1",
      "3:2",
      "2:3",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "21:9",
      "1:4",
      "4:1",
      "1:8",
      "8:1",
    ])
    .optional()
    .describe("Aspect ratio of the image. WaveSpeed default: `1:1`."),
  resolution: z
    .enum(["1k", "2k", "4k"])
    .optional()
    .describe("Resolution of the image. WaveSpeed default: `1k`."),
  output_format: z
    .enum(["png", "jpeg"])
    .optional()
    .describe("Format of the output image. WaveSpeed default: `png`."),
  enable_web_search: z
    .boolean()
    .optional()
    .describe(
      "Let the model use web search for real-time information. Costs more. WaveSpeed default: false."
    ),
  enable_image_search: z
    .boolean()
    .optional()
    .describe(
      "Let the model use image search for real-time information. Costs more. WaveSpeed default: false."
    ),
});

// google/nano-banana-2.1/edit, from the request schema on WaveSpeed's model
// page (read 2026-11-16).
export const WaveSpeedGoogleNanoBanana2p1EditRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  images: z
    .array(z.string())
    .max(14)
    .describe("Public URLs of 1-14 input images to edit."),
  aspect_ratio: z
    .enum([
      "1:1",
      "3:2",
      "2:3",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "21:9",
      "1:4",
      "4:1",
      "1:8",
      "8:1",
    ])
    .optional()
    .describe(
      "Aspect ratio of the image. When omitted, it follows the input image."
    ),
  resolution: z
    .enum(["1k", "2k", "4k"])
    .optional()
    .describe("Resolution of the image. WaveSpeed default: `1k`."),
  output_format: z
    .enum(["png", "jpeg"])
    .optional()
    .describe("Format of the output image. WaveSpeed default: `png`."),
  enable_web_search: z
    .boolean()
    .optional()
    .describe(
      "Let the model use web search for real-time information. Costs more. WaveSpeed default: false."
    ),
  enable_image_search: z
    .boolean()
    .optional()
    .describe(
      "Let the model use image search for real-time information. Costs more. WaveSpeed default: false."
    ),
});

// openai/gpt-image-2.5-sunburst/text-to-image, from the request schema on
// WaveSpeed's model page (read 2026-11-16). Unlike GPT Image 2.6 it has no
// `complexity`, no gif or svg output and no frame controls.
export const WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema =
  z.object({
    prompt: z.string().describe("The positive prompt for the generation."),
    aspect_ratio: z
      .enum([
        "1:1",
        "1:2",
        "2:1",
        "1:3",
        "3:1",
        "2:3",
        "3:2",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "9:21",
        "21:9",
      ])
      .optional()
      .describe("Aspect ratio of the image. WaveSpeed default: `1:1`."),
    resolution: z
      .enum(["1k", "2k", "4k"])
      .optional()
      .describe("Resolution of the image. WaveSpeed default: `1k`."),
    quality: z
      .enum(["low", "medium", "high", "xhigh", "max"])
      .optional()
      .describe(
        "Rendering quality. Higher tiers add detail and cost more. WaveSpeed default: `medium`."
      ),
    output_format: z
      .enum(["png", "jpeg", "webp"])
      .optional()
      .describe("Format of the output image. WaveSpeed default: `png`."),
  });

// openai/gpt-image-2.5-flare/text-to-image: the model page (read 2026-11-16)
// gives it the same request schema as the Sunburst model.
export const WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema =
  WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema;

// openai/gpt-image-2.5-sunburst/edit, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-20). Unlike the GPT Image 2.6 edit it has
// no `markup_image`, no `complexity`, no gif output and no frame controls.
export const WaveSpeedOpenaiGptImage2p5SunburstEditRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  images: z
    .array(z.string())
    .max(16)
    .describe("Public URLs of 1-16 input images to edit."),
  mask_image: z
    .string()
    .optional()
    .describe(
      "Mask for the first input image: white marks the area to edit, black the area to keep (a PNG whose transparent area marks the edit is also accepted). It is resized to the first image."
    ),
  aspect_ratio: z
    .enum([
      "1:1",
      "1:2",
      "2:1",
      "1:3",
      "3:1",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "9:21",
      "21:9",
    ])
    .optional()
    .describe(
      "Aspect ratio of the image. When omitted, it follows the input image."
    ),
  resolution: z
    .enum(["1k", "2k", "4k"])
    .optional()
    .describe("Resolution of the image. WaveSpeed default: `1k`."),
  quality: z
    .enum(["low", "medium", "high", "xhigh", "max"])
    .optional()
    .describe(
      "Rendering quality. Higher tiers add detail and cost more. WaveSpeed default: `medium`."
    ),
  output_format: z
    .enum(["png", "jpeg", "webp"])
    .optional()
    .describe("Format of the output image. WaveSpeed default: `png`."),
});

// pruna-ai/p-video-2-pro/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-18).
export const WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .describe("Text prompt describing the video to generate."),
  image: z
    .string()
    .min(1)
    .describe(
      "First frame: a public URL of the reference image, which sets the output canvas."
    ),
  last_image: z
    .string()
    .min(1)
    .optional()
    .describe("Last frame: a public URL of an optional reference image."),
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
  mode: z
    .enum(["speed", "quality", "cost"])
    .optional()
    .describe(
      "Generation mode: `cost` bills less at the quality of `speed`, `speed` renders faster, and `quality` renders at higher quality. WaveSpeed default: `speed`."
    ),
  prompt_upsampler: z
    .enum(["off", "turbo", "max"])
    .optional()
    .describe(
      "Prompt expansion, independent of `mode`; it does not change the price. WaveSpeed default: `turbo`."
    ),
  seed: z
    .number()
    .int()
    .optional()
    .describe("Random seed for reproducible output. Omit for a random seed."),
});

// openai/gpt-image-2/text-to-image, from the request schema on WaveSpeed's
// model page (read 2026-11-16): the GPT Image 2.5 fields with three quality
// tiers instead of five.
export const WaveSpeedOpenaiGptImage2TextToImageRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  aspect_ratio: z
    .enum([
      "1:1",
      "1:2",
      "2:1",
      "1:3",
      "3:1",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "9:21",
      "21:9",
    ])
    .optional()
    .describe("Aspect ratio of the image. WaveSpeed default: `1:1`."),
  resolution: z
    .enum(["1k", "2k", "4k"])
    .optional()
    .describe("Resolution of the image. WaveSpeed default: `1k`."),
  quality: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe(
      "Quality of the image. Higher quality costs more. WaveSpeed default: `medium`."
    ),
  output_format: z
    .enum(["png", "jpeg", "webp"])
    .optional()
    .describe("Format of the output image. WaveSpeed default: `png`."),
});

// x-ai/grok-imagine-image-v2.0/text-to-image, from the request schema on
// WaveSpeed's model page (read 2026-11-16).
export const WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema =
  z.object({
    prompt: z
      .string()
      .min(1)
      .describe("Text description of the image to generate."),
    aspect_ratio: z
      .enum([
        "1:1",
        "16:9",
        "9:16",
        "4:3",
        "3:4",
        "3:2",
        "2:3",
        "2:1",
        "1:2",
        "19.5:9",
        "9:19.5",
        "20:9",
        "9:20",
      ])
      .optional()
      .describe("Aspect ratio of the image. WaveSpeed default: `1:1`."),
    resolution: z
      .enum(["1k", "2k"])
      .optional()
      .describe(
        "Resolution tier of the image. WaveSpeed default: `2k`, the more expensive tier."
      ),
    quality: z
      .enum(["low", "medium"])
      .optional()
      .describe(
        "Quality tier. WaveSpeed default: `medium`, the more expensive tier."
      ),
  });

// bytedance/seedream-v5.5/edit, from the request schema on WaveSpeed's model
// page (read 2026-11-16).
export const WaveSpeedBytedanceSeedreamV5p5EditRequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for the generation."),
  images: z
    .array(z.string())
    .max(10)
    .describe(
      "URLs of the images to edit, up to 10. Each one adds to the price."
    ),
  aspect_ratio: z
    .enum([
      "1:1",
      "1:2",
      "2:1",
      "1:3",
      "3:1",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "9:21",
      "21:9",
    ])
    .optional()
    .describe(
      "Aspect ratio of the image. When omitted, it follows the input image."
    ),
  resolution: z
    .enum(["1k", "1.5k", "2k"])
    .optional()
    .describe(
      "Resolution tier. 1k and 1.5k cost the same; 2k is the highest and costs more. WaveSpeed default: `1k`."
    ),
  output_format: z
    .enum(["jpeg", "png"])
    .optional()
    .describe(
      "Format of the output image. A transparent background always returns a png. WaveSpeed default: `png`."
    ),
  background: z
    .enum(["auto", "transparent", "opaque"])
    .optional()
    .describe(
      "`transparent` returns a png with an alpha channel, `opaque` a solid background, and `auto` lets the model decide from the prompt and output format. WaveSpeed default: `auto`."
    ),
});

// skywork-ai/skyreels-v4/text-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-18).
export const WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema = z.object({
  prompt: z.string().describe("The prompt describing the video to generate."),
  duration: z
    .number()
    .int()
    .min(3)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 3-15. WaveSpeed default: 5."),
  aspect_ratio: z
    .enum(["16:9", "9:16", "1:1"])
    .optional()
    .describe("Aspect ratio of the video. WaveSpeed default: `16:9`."),
  resolution: z
    .enum(["480p", "720p", "1080p"])
    .optional()
    .describe("Resolution of the video. WaveSpeed default: `1080p`."),
  sound: z
    .boolean()
    .optional()
    .describe(
      "Generate sound effects with the video. WaveSpeed default: false."
    ),
  mode: z
    .enum(["std", "fast"])
    .optional()
    .describe(
      "Quality/performance mode. `fast` currently requires `sound` false. WaveSpeed default: `std`."
    ),
});

// skywork-ai/skyreels-v4/image-to-video, from WaveSpeed's model catalog
// (GET /api/v3/models, read 2026-11-20). The first-frame image sets the
// framing, so there is no aspect_ratio; last_image and images add frames.
export const WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequestSchema = z.object({
  prompt: z
    .string()
    .describe("The prompt describing the video motion or camera behavior."),
  image: z.string().describe("First frame image URL."),
  last_image: z.string().optional().describe("Optional end frame image URL."),
  images: z
    .array(z.string())
    .max(6)
    .optional()
    .describe("Optional middle frame image URLs. Upload up to 6 images."),
  duration: z
    .number()
    .int()
    .min(3)
    .max(15)
    .optional()
    .describe("Length of the video in seconds, 3-15. WaveSpeed default: 5."),
  resolution: z
    .enum(["480p", "720p", "1080p"])
    .optional()
    .describe("Output video resolution. WaveSpeed default: `1080p`."),
  sound: z
    .boolean()
    .optional()
    .describe(
      "Whether to generate sound effects with the video. WaveSpeed default: false."
    ),
  mode: z
    .enum(["std", "fast"])
    .optional()
    .describe(
      "Quality/performance mode. `fast` currently requires `sound` false. WaveSpeed default: `std`."
    ),
});
