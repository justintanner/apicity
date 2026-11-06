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
