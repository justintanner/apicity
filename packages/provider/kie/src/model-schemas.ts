import type { KieMediaModel, ModelInputSchema } from "./types";
import {
  HAPPYHORSE_DURATION_MAX_SECONDS,
  HAPPYHORSE_DURATION_MIN_SECONDS,
  Wan27VideoEditDurationValues,
} from "./zod";

const happyHorseDurationField = {
  type: "integer",
  minimum: HAPPYHORSE_DURATION_MIN_SECONDS,
  maximum: HAPPYHORSE_DURATION_MAX_SECONDS,
  default: 5,
  description: `Duration in seconds, ${HAPPYHORSE_DURATION_MIN_SECONDS}-${HAPPYHORSE_DURATION_MAX_SECONDS} (default 5)`,
} as const;

const happyHorse11AspectRatios = [
  "16:9",
  "9:16",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "1:1",
  "9:21",
  "21:9",
] as const;

export const modelInputSchemas: Record<KieMediaModel, ModelInputSchema> = {
  "kling-3.0/video": {
    type: "video",
    fields: {
      prompt: { type: "string", description: "Video generation prompt" },
      image_urls: {
        type: "array",
        description: "Reference image URLs",
        items: { type: "string" },
      },
      sound: {
        type: "boolean",
        description: "Include sound (default false, true when multi_shots)",
      },
      duration: {
        type: "string",
        required: true,
        enum: [
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
        ],
        description: "Duration in seconds",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "9:16", "1:1"],
        description: "Output aspect ratio",
      },
      mode: {
        type: "string",
        required: true,
        enum: ["std", "pro", "4K"],
        description: "Quality mode",
      },
      multi_shots: {
        type: "boolean",
        required: true,
        description: "Enable multi-shot mode",
      },
      multi_prompt: {
        type: "array",
        description: "Per-shot prompts",
        items: {
          type: "object",
          properties: {
            prompt: { type: "string", required: true },
            duration: { type: "number", required: true },
          },
        },
      },
      kling_elements: {
        type: "array",
        description: "Kling elements for generation",
        items: {
          type: "object",
          properties: {
            name: { type: "string", required: true },
            description: { type: "string", required: true },
            element_input_urls: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  },

  "kling-3.0/motion-control": {
    type: "video",
    fields: {
      prompt: { type: "string", description: "Motion control prompt" },
      input_urls: {
        type: "array",
        required: true,
        description: "Input image URLs",
        items: { type: "string" },
      },
      video_urls: {
        type: "array",
        required: true,
        description: "Input video URLs",
        items: { type: "string" },
      },
      mode: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Output resolution (default 720p)",
      },
      character_orientation: {
        type: "string",
        enum: ["video", "image"],
        description: "Character orientation source (default video)",
      },
      background_source: {
        type: "string",
        enum: ["input_video", "input_image"],
        description: "Background source (default input_video)",
      },
    },
  },

  "kling/v3-turbo-image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Video generation prompt",
      },
      image_urls: {
        type: "array",
        required: true,
        description: "Input image URL (exactly 1)",
        items: { type: "string" },
      },
      duration: {
        type: "string",
        required: true,
        description: "Duration in seconds",
      },
      resolution: {
        type: "string",
        required: true,
        enum: ["720p", "1080p"],
        description: "Output resolution",
      },
    },
  },

  "kling/v3-turbo-text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        maxLength: 2500,
        description: "Video generation prompt",
      },
      duration: {
        type: "string",
        enum: [
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
        ],
        default: "5",
        description: "Duration in seconds, 3-15 (default 5)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "9:16", "16:9"],
        default: "16:9",
        description: "Output aspect ratio (default 16:9)",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        default: "720p",
        description: "Output resolution (default 720p)",
      },
    },
  },

  "grok-imagine/text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Image generation prompt (max 5000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["2:3", "3:2", "1:1", "16:9", "9:16"],
        description: "Output aspect ratio (default 1:1)",
      },
      nsfw_checker: {
        type: "boolean",
        description:
          "Enable content filtering (default false; false returns raw model output)",
      },
      enable_pro: {
        type: "boolean",
        description: "Quality mode when true, speed mode when false",
      },
    },
  },

  "grok-imagine/image-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        maxLength: 390000,
        description: "Modification prompt (max 390000 chars)",
      },
      image_urls: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 1,
        description: "Input image URL (exactly 1)",
        items: { type: "string" },
      },
      nsfw_checker: {
        type: "boolean",
        description:
          "Enable content filtering (default false; false returns raw model output)",
      },
    },
  },

  // KIE's current Grok Imagine 1.5 Quick Start keeps video generation on the
  // existing suite slugs rather than a new stable "1.5" model slug.
  "grok-imagine/text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Video generation prompt (max 5000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["2:3", "3:2", "1:1", "16:9", "9:16"],
        description: "Output aspect ratio (default 2:3)",
      },
      mode: {
        type: "string",
        enum: ["fun", "normal", "spicy"],
        description: "Generation mode (default normal)",
      },
      duration: {
        type: "integer",
        acceptedTypes: ["integer", "string"],
        minimum: 6,
        maximum: 30,
        default: 6,
        description:
          "Duration in whole seconds (6-30, default 6); accepts an integer or a canonical decimal string matching ^(?:[6-9]|[12][0-9]|30)$ and preserves the supplied representation",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p"],
        description: "Output resolution (default 480p)",
      },
      nsfw_checker: {
        type: "boolean",
        description:
          "Enable content filtering (default false; false returns raw model output)",
      },
    },
  },

  "grok-imagine/image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        maxLength: 4096,
        description: "Video generation prompt (max 4096 chars)",
      },
      image_urls: {
        type: "array",
        minItems: 1,
        maxItems: 7,
        description:
          "External JPEG/PNG/WEBP image URLs (max 7, 10MB each); mutually exclusive with task_id",
        items: { type: "string" },
      },
      task_id: {
        type: "string",
        description:
          "Grok-generated image task ID; use with index and without image_urls",
      },
      index: {
        type: "integer",
        minimum: 0,
        maximum: 5,
        default: 0,
        description: "Image index (0-5, default 0)",
      },
      mode: {
        type: "string",
        enum: ["fun", "normal", "spicy"],
        description:
          "Generation mode (default normal; spicy requires task_id and is unavailable with external image_urls)",
      },
      duration: {
        type: "integer",
        acceptedTypes: ["integer", "string"],
        minimum: 6,
        maximum: 30,
        default: 6,
        description:
          "Duration in whole seconds (6-30, default 6); accepts an integer or a canonical decimal string matching ^(?:[6-9]|[12][0-9]|30)$ and preserves the supplied representation",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p"],
        description: "Output resolution (default 480p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["2:3", "3:2", "1:1", "16:9", "9:16"],
        description: "Output aspect ratio (default 16:9)",
      },
      nsfw_checker: {
        type: "boolean",
        description:
          "Enable content filtering (default false; false returns raw model output)",
      },
    },
  },

  // Legacy compatibility slug from KIE's earlier Grok Imagine Video 1.5 preview
  // surface. Prefer grok-imagine/image-to-video for the current Quick Start.
  "grok-imagine-video-1-5-preview": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        maxLength: 4096,
        description: "Video generation prompt (max 4096 chars)",
      },
      image_urls: {
        type: "array",
        required: true,
        minItems: 1,
        description: "Input image URLs (jpeg/png/webp, max 20MB each)",
        items: { type: "string" },
      },
      aspect_ratio: {
        type: "string",
        enum: ["auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
        description:
          "Output aspect ratio (default auto; follows image size if unset)",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p"],
        description: "Output resolution (default 480p)",
      },
      duration: {
        type: "integer",
        minimum: 1,
        maximum: 15,
        default: 8,
        description: "Duration in seconds (1-15, default 8)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content filtering (default true)",
      },
    },
  },

  "grok-imagine/extend": {
    type: "video",
    fields: {
      task_id: {
        type: "string",
        required: true,
        maxLength: 100,
        description: "Video task ID to extend (max 100 chars)",
      },
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Extension prompt",
      },
      extend_at: {
        type: "string",
        required: true,
        description: "Starting position for extension",
      },
      extend_times: {
        type: "string",
        required: true,
        enum: ["6", "10"],
        description: "Extension duration in seconds",
      },
    },
  },

  "grok-imagine/upscale": {
    type: "video",
    fields: {
      task_id: {
        type: "string",
        required: true,
        maxLength: 100,
        description: "Video task ID to upscale (max 100 chars)",
      },
    },
  },

  "nano-banana-pro": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Image generation prompt",
      },
      image_input: {
        type: "array",
        description: "Reference images",
        items: { type: "string" },
      },
      aspect_ratio: {
        type: "string",
        enum: [
          "1:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
          "21:9",
          "auto",
        ],
        description: "Output aspect ratio",
      },
      resolution: {
        type: "string",
        enum: ["1K", "2K", "4K"],
        description: "Output resolution",
      },
      output_format: {
        type: "string",
        enum: ["png", "jpg"],
        description: "Image format",
      },
    },
  },

  "bytedance/seedance-2-fast": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Video generation prompt (3-2500 chars)",
      },
      first_frame_url: {
        type: "string",
        description: "First frame image URL or asset://{assetId}",
      },
      last_frame_url: {
        type: "string",
        description: "Last frame image URL or asset://{assetId}",
      },
      reference_image_urls: {
        type: "array",
        description:
          "Reference image URLs or asset:// refs (max 9 total with first+last frames)",
        items: { type: "string" },
      },
      reference_video_urls: {
        type: "array",
        description: "Reference video URLs (max 3, total duration <= 15s)",
        items: { type: "string" },
      },
      reference_audio_urls: {
        type: "array",
        description: "Reference audio URLs (max 3, total duration <= 15s)",
        items: { type: "string" },
      },
      return_last_frame: {
        type: "boolean",
        description:
          "Return the last frame of the video as an image (default false)",
      },
      generate_audio: {
        type: "boolean",
        description: "Generate accompanying audio (default true, higher cost)",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p"],
        description: "Output resolution (default 720p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"],
        description: "Output aspect ratio (default 16:9)",
      },
      duration: {
        type: "number",
        description: "Duration in seconds, 4-15 (default 8)",
      },
      web_search: {
        type: "boolean",
        required: true,
        description: "Use online search",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "bytedance/seedance-2": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Video generation prompt (3-20000 chars)",
      },
      first_frame_url: {
        type: "string",
        description: "First frame image URL or asset://{assetId}",
      },
      last_frame_url: {
        type: "string",
        description: "Last frame image URL or asset://{assetId}",
      },
      reference_image_urls: {
        type: "array",
        description:
          "Reference image URLs or asset:// refs (max 9 total with first+last frames)",
        items: { type: "string" },
      },
      reference_video_urls: {
        type: "array",
        description: "Reference video URLs (max 3, total duration <= 15s)",
        items: { type: "string" },
      },
      reference_audio_urls: {
        type: "array",
        description: "Reference audio URLs (max 3, total duration <= 15s)",
        items: { type: "string" },
      },
      return_last_frame: {
        type: "boolean",
        description:
          "Return the last frame of the video as an image (default false)",
      },
      generate_audio: {
        type: "boolean",
        description: "Generate accompanying audio (default true, higher cost)",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p", "1080p"],
        description: "Output resolution (default 720p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"],
        description: "Output aspect ratio (default 16:9)",
      },
      duration: {
        type: "number",
        description: "Duration in seconds, 4-15 (default 5)",
      },
      web_search: {
        type: "boolean",
        required: true,
        description: "Use online search",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "bytedance/seedance-2-mini": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        maxLength: 20000,
        description: "Text prompt or description for the generated video",
      },
      reference_image_urls: {
        type: "array",
        default: [],
        description:
          "Reference image URLs (JPEG, PNG, WEBP, JPG, or GIF; max 30 MB each)",
        items: { type: "string" },
      },
      reference_video_urls: {
        type: "array",
        maxItems: 3,
        default: [],
        description:
          "Reference video URLs (MP4, MOV, or MKV; up to 3 videos, 15 seconds total)",
        items: { type: "string" },
      },
      reference_audio_urls: {
        type: "array",
        maxItems: 3,
        default: [],
        description:
          "Reference audio URLs (MP3 or WAV; up to 3 clips, 15 seconds total)",
        items: { type: "string" },
      },
      generate_audio: {
        type: "boolean",
        default: true,
        description: "Generate accompanying audio (default true)",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p"],
        default: "720p",
        description: "Output resolution (default 720p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
        default: "16:9",
        description: "Output aspect ratio (default 16:9)",
      },
      duration: {
        type: "integer",
        minimum: 4,
        maximum: 15,
        default: 15,
        description: "Duration in seconds, 4-15 (default 15)",
      },
      web_search: {
        type: "boolean",
        default: false,
        description: "Use online search (default false)",
      },
      nsfw_checker: {
        type: "boolean",
        default: true,
        description: "Content safety filter (default true)",
      },
    },
  },

  "nano-banana-2": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        maxLength: 20000,
        description: "Image generation prompt (max 20000 chars)",
      },
      image_input: {
        type: "array",
        maxItems: 14,
        description: "Reference image URLs (max 14)",
        items: { type: "string" },
      },
      aspect_ratio: {
        type: "string",
        enum: [
          "1:1",
          "1:4",
          "1:8",
          "2:3",
          "3:2",
          "3:4",
          "4:1",
          "4:3",
          "4:5",
          "5:4",
          "8:1",
          "9:16",
          "16:9",
          "21:9",
          "auto",
        ],
        default: "auto",
        description: "Output aspect ratio (default auto)",
      },
      resolution: {
        type: "string",
        enum: ["1K", "2K", "4K"],
        default: "1K",
        description: "Output resolution (default 1K)",
      },
      output_format: {
        type: "string",
        enum: ["png", "jpg"],
        default: "jpg",
        description: "Image format (default jpg)",
      },
    },
  },

  "gpt-image/1.5-image-to-image": {
    type: "image",
    fields: {
      input_urls: {
        type: "array",
        required: true,
        description: "Input image URLs",
        items: { type: "string" },
      },
      prompt: {
        type: "string",
        required: true,
        description: "Modification prompt",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "2:3", "3:2"],
        description: "Output aspect ratio",
      },
      quality: {
        type: "string",
        enum: ["medium", "high"],
        description: "Output quality",
      },
    },
  },

  "gpt-image-2-image-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Modification prompt (max 20000 chars)",
      },
      input_urls: {
        type: "array",
        required: true,
        description: "Input image URLs (max 16)",
        items: { type: "string" },
      },
      aspect_ratio: {
        type: "string",
        enum: [
          "auto",
          "1:1",
          "5:4",
          "9:16",
          "21:9",
          "16:9",
          "4:3",
          "3:2",
          "4:5",
          "3:4",
          "2:3",
        ],
        description: "Output aspect ratio (default auto)",
      },
      resolution: {
        type: "string",
        enum: ["1K", "2K", "4K"],
        description:
          "Output resolution. 1:1 cannot upscale to 4K; auto/unset aspect_ratio is 1K only — other combos fail at task creation.",
      },
      nsfw_checker: {
        type: "boolean",
        description:
          "Enable content filtering (default false; false returns raw model output)",
      },
    },
  },

  "gpt-image-2-text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Image generation prompt (max 20000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: [
          "auto",
          "1:1",
          "3:2",
          "2:3",
          "4:3",
          "3:4",
          "5:4",
          "4:5",
          "9:16",
          "16:9",
          "2:1",
          "1:2",
          "3:1",
          "1:3",
          "21:9",
          "9:21",
        ],
        description: "Output aspect ratio (default auto)",
      },
      resolution: {
        type: "string",
        enum: ["1K", "2K", "4K"],
        description:
          "Output resolution. 1:1 cannot upscale to 4K; auto/unset aspect_ratio is 1K only — other combos fail at task creation.",
      },
      nsfw_checker: {
        type: "boolean",
        description:
          "Enable content filtering (default false; false returns raw model output)",
      },
    },
  },

  "seedream/5-lite-image-to-image": {
    type: "image",
    fields: {
      image_urls: {
        type: "array",
        required: true,
        description: "Input image URLs (max 14)",
        items: { type: "string" },
      },
      prompt: {
        type: "string",
        required: true,
        description: "Modification prompt (3-3000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"],
        description: "Output aspect ratio (default 1:1)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["basic", "high"],
        description:
          "Output quality (basic=2K, high=4K). Required — Kie rejects createTask without it.",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter",
      },
    },
  },

  "seedream/5-lite-text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Text description of the image to generate (3-3000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"],
        description: "Output aspect ratio (default 1:1)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["basic", "high"],
        description:
          "Output quality (basic=2K, high=4K). Required — Kie rejects createTask without it.",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter",
      },
    },
  },

  "seedream/5-pro-image-to-image": {
    type: "image",
    fields: {
      image_urls: {
        type: "array",
        required: true,
        description: "Input image URLs (max 10)",
        items: { type: "string" },
      },
      prompt: {
        type: "string",
        required: true,
        description: "Modification prompt (3-3000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2"],
        description: "Output aspect ratio (default 1:1)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["basic", "high"],
        description:
          "Output quality (basic=1K, high=2K). Required — Kie rejects createTask without it.",
      },
      output_format: {
        type: "string",
        enum: ["png", "jpeg"],
        description: "Output image format (default png)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter",
      },
    },
  },

  "seedream/5-pro-text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Text description of the image to generate (3-3000 chars)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2"],
        description: "Output aspect ratio (default 1:1)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["basic", "high"],
        description:
          "Output quality (basic=1K, high=2K). Required — Kie rejects createTask without it.",
      },
      output_format: {
        type: "string",
        enum: ["png", "jpeg"],
        description: "Output image format (default png)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter",
      },
    },
  },

  "qwen2/text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        maxLength: 800,
        description: "Image generation prompt (max 800 chars)",
      },
      image_size: {
        type: "string",
        enum: ["1:1", "3:4", "4:3", "9:16", "16:9"],
        default: "16:9",
        description: "Output image aspect ratio (default 16:9)",
      },
      seed: { type: "integer", description: "Random seed" },
      output_format: {
        type: "string",
        enum: ["jpeg", "png"],
        default: "png",
        description: "Image format (default png)",
      },
      nsfw_checker: {
        type: "boolean",
        default: false,
        description: "Content safety filter (default false)",
      },
    },
  },

  "qwen2/image-edit": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        maxLength: 800,
        description: "Image editing prompt (max 800 chars)",
      },
      image_url: {
        type: "string",
        required: true,
        description: "Source image URL to edit (JPEG, PNG, or WEBP; max 10MB)",
      },
      image_size: {
        type: "string",
        enum: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        default: "16:9",
        description: "Output image aspect ratio (default 16:9)",
      },
      output_format: {
        type: "string",
        enum: ["jpeg", "png"],
        default: "png",
        description: "Image format (default png)",
      },
      seed: {
        type: "number",
        description: "Random seed",
      },
      nsfw_checker: {
        type: "boolean",
        default: false,
        description: "Content safety filter (default false)",
      },
    },
  },

  "wan/2-7-image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
        maxLength: 500,
        description: "Negative prompt (max 500 chars)",
      },
      first_frame_url: {
        type: "string",
        description: "First frame image URL",
      },
      last_frame_url: {
        type: "string",
        description: "Last frame image URL",
      },
      first_clip_url: {
        type: "string",
        description: "First clip video URL for video continuation",
      },
      driving_audio_url: {
        type: "string",
        description: "Driving audio URL",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Video resolution (default 1080p)",
      },
      duration: {
        type: "integer",
        minimum: 2,
        maximum: 15,
        default: 5,
        description: "Duration in seconds, 2-15 (default 5)",
      },
      prompt_extend: {
        type: "boolean",
        description: "Intelligent prompt rewriting (default true)",
      },
      watermark: {
        type: "boolean",
        description: "AI-generated watermark (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "wan/2-7-text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
        maxLength: 500,
        description: "Negative prompt (max 500 chars)",
      },
      audio_url: {
        type: "string",
        description: "Optional custom audio URL",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Video resolution (default 1080p)",
      },
      ratio: {
        type: "string",
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        description: "Video aspect ratio (default 16:9)",
      },
      duration: {
        type: "integer",
        minimum: 2,
        maximum: 15,
        default: 5,
        description: "Duration in seconds, 2-15 (default 5)",
      },
      prompt_extend: {
        type: "boolean",
        description: "Intelligent prompt rewriting (default true)",
      },
      watermark: {
        type: "boolean",
        description: "AI-generated watermark (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "wan/2-7-r2v": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
        maxLength: 500,
        description: "Negative prompt (max 500 chars)",
      },
      reference_image: {
        type: "array",
        maxItems: 5,
        description: "Array of reference image URLs (max 5 total with videos)",
      },
      reference_video: {
        type: "array",
        maxItems: 5,
        description: "Array of reference video URLs (max 5 total with images)",
      },
      first_frame: {
        type: "string",
        description: "First frame image URL (overrides aspect_ratio)",
      },
      reference_voice: {
        type: "string",
        description: "Audio URL for voice timbre (wav/mp3, 1-10s, max 15MB)",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Video resolution (default 1080p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        description:
          "Video aspect ratio (default 16:9, ignored if first_frame set)",
      },
      duration: {
        type: "integer",
        minimum: 2,
        maximum: 10,
        default: 5,
        description: "Duration in seconds, 2-10 (default 5)",
      },
      prompt_extend: {
        type: "boolean",
        description: "Intelligent prompt rewriting (default true)",
      },
      watermark: {
        type: "boolean",
        description: "AI-generated watermark (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "wan/2-7-videoedit": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        maxLength: 5000,
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
        maxLength: 500,
        description: "Negative prompt (max 500 chars)",
      },
      video_url: {
        type: "string",
        required: true,
        description: "Source video URL (mp4/mov, 2-10s, max 100MB)",
      },
      reference_image: {
        type: "string",
        description: "Reference image URL for style guidance (max 20MB)",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Video resolution (default 1080p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        description: "Output aspect ratio (default matches input video)",
      },
      duration: {
        type: "integer",
        enum: Wan27VideoEditDurationValues,
        minimum: 0,
        maximum: 10,
        default: 0,
        description:
          "Duration in seconds, 0 or 2-10 (default 0 = full input duration)",
      },
      audio_setting: {
        type: "string",
        enum: ["auto", "origin"],
        description:
          "Audio handling: auto (model decides) or origin (keep original)",
      },
      prompt_extend: {
        type: "boolean",
        description: "Intelligent prompt rewriting (default true)",
      },
      watermark: {
        type: "boolean",
        description: "AI-generated watermark (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "wan/2-7-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Prompt for image generation or editing (max 5000 chars)",
      },
      input_urls: {
        type: "array",
        maxItems: 9,
        description: "Array of input image URLs (max 9)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "16:9", "4:3", "21:9", "3:4", "9:16", "8:1", "1:8"],
        description:
          "Output aspect ratio when no image input is provided (default 1:1)",
      },
      enable_sequential: {
        type: "boolean",
        description: "Enable sequential/group image mode (default false)",
      },
      n: {
        type: "integer",
        minimum: 1,
        maximum: 12,
        description:
          "Number of images to generate: 1-4 when sequential=false (default 4), 1-12 when sequential=true (default 12)",
      },
      resolution: {
        type: "string",
        required: true,
        enum: ["1K", "2K", "4K"],
        description:
          "Output resolution; required when aspect_ratio is present, including when the aspect_ratio default is applied",
      },
      thinking_mode: {
        type: "boolean",
        description:
          "Enable thinking mode (only when sequential=false and no input_urls, default false)",
      },
      color_palette: {
        type: "array",
        minItems: 3,
        maxItems: 10,
        description:
          "Custom color theme with 3-10 {hex, ratio} entries (only when sequential=false)",
      },
      bbox_list: {
        type: "array",
        description:
          "Interactive editing bounding boxes, max 2 per image, format [x1, y1, x2, y2]",
      },
      watermark: {
        type: "boolean",
        description: "Add watermark (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "wan/2-7-image-pro": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description: "Prompt for image generation or editing (max 5000 chars)",
      },
      input_urls: {
        type: "array",
        maxItems: 9,
        description: "Array of input image URLs (max 9)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "16:9", "4:3", "21:9", "3:4", "9:16", "8:1", "1:8"],
        description:
          "Output aspect ratio when no image input is provided (default 1:1)",
      },
      enable_sequential: {
        type: "boolean",
        description: "Enable sequential/group image mode (default false)",
      },
      n: {
        type: "integer",
        minimum: 1,
        maximum: 12,
        description:
          "Number of images to generate: 1-4 when sequential=false (default 4), 1-12 when sequential=true (default 12)",
      },
      resolution: {
        type: "string",
        required: true,
        enum: ["1K", "2K", "4K"],
        description:
          "Output resolution; required when aspect_ratio is present, including when the aspect_ratio default is applied; 4K only for text-to-image in standard mode",
      },
      thinking_mode: {
        type: "boolean",
        description:
          "Enable thinking mode (only when sequential=false and no input_urls, default false)",
      },
      color_palette: {
        type: "array",
        minItems: 3,
        maxItems: 10,
        description:
          "Custom color theme with 3-10 {hex, ratio} entries (only when sequential=false)",
      },
      bbox_list: {
        type: "array",
        description:
          "Interactive editing bounding boxes, max 2 per image, format [x1, y1, x2, y2]",
      },
      watermark: {
        type: "boolean",
        description: "Add watermark (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
      },
    },
  },

  "elevenlabs/audio-isolation": {
    type: "audio",
    fields: {
      audio_url: {
        type: "string",
        required: true,
        description: "Source audio URL to isolate speech or foreground audio",
      },
    },
  },

  "elevenlabs/text-to-dialogue-v3": {
    type: "audio",
    fields: {
      dialogue: {
        type: "array",
        required: true,
        description: "Dialogue turns to synthesize",
        items: {
          type: "object",
          properties: {
            text: { type: "string", required: true },
            voice: { type: "string", required: true },
          },
        },
      },
      stability: {
        type: "number",
        description: "Voice stability setting",
      },
    },
  },

  "elevenlabs/text-to-speech-multilingual-v2": {
    type: "audio",
    fields: {
      text: {
        type: "string",
        required: true,
        description: "Text to synthesize",
      },
      voice: {
        type: "string",
        required: true,
        description: "Voice name or voice ID",
      },
      stability: {
        type: "number",
        description: "Voice stability setting",
      },
      similarity_boost: {
        type: "number",
        description: "Voice similarity boost",
      },
      style: {
        type: "number",
        description: "Style exaggeration setting",
      },
      speed: {
        type: "number",
        description: "Speech speed",
      },
      timestamps: {
        type: "boolean",
        description: "Return timestamp metadata when supported",
      },
      previous_text: {
        type: "string",
        description: "Previous context text",
      },
      next_text: {
        type: "string",
        description: "Next context text",
      },
      language_code: {
        type: "string",
        description: "Optional language code",
      },
    },
  },

  "elevenlabs/text-to-speech-turbo-2-5": {
    type: "audio",
    fields: {
      text: {
        type: "string",
        required: true,
        description: "Text to synthesize",
      },
      voice: {
        type: "string",
        required: true,
        description: "Voice name or voice ID",
      },
      stability: {
        type: "number",
        description: "Voice stability setting",
      },
      similarity_boost: {
        type: "number",
        description: "Voice similarity boost",
      },
      style: {
        type: "number",
        description: "Style exaggeration setting",
      },
      speed: {
        type: "number",
        description: "Speech speed",
      },
      timestamps: {
        type: "boolean",
        description: "Return timestamp metadata when supported",
      },
      previous_text: {
        type: "string",
        description: "Previous context text",
      },
      next_text: {
        type: "string",
        description: "Next context text",
      },
      language_code: {
        type: "string",
        description: "Optional language code",
      },
    },
  },

  "elevenlabs/sound-effect-v2": {
    type: "audio",
    fields: {
      text: {
        type: "string",
        required: true,
        description: "Sound effect prompt",
      },
      loop: {
        type: "boolean",
        description: "Generate a loopable sound",
      },
      prompt_influence: {
        type: "number",
        description: "Prompt influence strength",
      },
      output_format: {
        type: "string",
        description: "Requested audio output format",
      },
    },
  },

  "sora-watermark-remover": {
    type: "video",
    fields: {
      video_url: {
        type: "string",
        required: true,
        description: "URL to video for watermark removal",
      },
      upload_method: {
        type: "string",
        enum: ["s3", "oss"],
        description: "Storage destination (default s3, oss for China)",
      },
    },
  },

  "pixverse-v6/text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 3,
        maxLength: 5000,
        description: "Video generation prompt (3-5000 chars)",
      },
      aspect_ratio: {
        type: "string",
        required: true,
        enum: ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"],
        default: "16:9",
        description:
          "Output video aspect ratio (default 16:9; spec-required despite documented default)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["360p", "540p", "720p", "1080p"],
        default: "720p",
        description:
          "Output video resolution (default 720p; spec-required despite documented default)",
      },
      duration: {
        type: "integer",
        required: true,
        minimum: 1,
        maximum: 15,
        default: 5,
        description:
          "Output video duration in seconds, 1-15 (default 5; spec-required despite documented default)",
      },
      generate_audio_switch: {
        type: "boolean",
        default: false,
        description:
          "Generate audio synchronized with the video content (default false)",
      },
      generate_multi_clip_switch: {
        type: "boolean",
        default: false,
        description: "Generate a multi-clip video (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "pixverse-v6/image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 3,
        maxLength: 5000,
        description: "Video generation prompt (3-5000 chars)",
      },
      image_urls: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 2,
        description:
          "Source image URLs (up to 2; JPG/JPEG/PNG/WebP, max 20MB each)",
        items: {
          type: "string",
        },
      },
      quality: {
        type: "string",
        required: true,
        enum: ["360p", "540p", "720p", "1080p"],
        default: "720p",
        description:
          "Output video resolution (default 720p; spec-required despite documented default)",
      },
      duration: {
        type: "integer",
        minimum: 1,
        maximum: 15,
        default: 5,
        description:
          "Output video duration in seconds, 1-15 (default 5; required unless template_id is set, and mutually exclusive with it)",
      },
      template_id: {
        type: "string",
        minLength: 1,
        description:
          "PixVerse effect template; fixes the duration, so duration must be omitted (ids listed at https://docs.kie.ai/market/pixverse/image-to-video)",
      },
      generate_audio_switch: {
        type: "boolean",
        default: false,
        description:
          "Generate audio synchronized with the video content (default false)",
      },
      generate_multi_clip_switch: {
        type: "boolean",
        default: false,
        description: "Generate a multi-clip video (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "pixverse-v6/transition": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 3,
        maxLength: 5000,
        description: "Video generation prompt (3-5000 chars)",
      },
      first_frame_image_url: {
        type: "string",
        required: true,
        description: "First frame image URL (JPG/JPEG/PNG/WebP, max 20MB)",
      },
      last_frame_image_url: {
        type: "string",
        required: true,
        description: "Last frame image URL (JPG/JPEG/PNG/WebP, max 20MB)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["360p", "540p", "720p", "1080p"],
        default: "720p",
        description:
          "Output video resolution (default 720p; spec-required despite documented default)",
      },
      duration: {
        type: "integer",
        required: true,
        minimum: 1,
        maximum: 15,
        default: 5,
        description:
          "Output video duration in seconds, 1-15 (default 5; spec-required despite documented default)",
      },
      generate_audio_switch: {
        type: "boolean",
        default: false,
        description:
          "Generate audio synchronized with the video content (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  // Upstream models `input` as an anyOf of two variants that differ only in
  // the discriminator, so `taskId` and `video_url` are each required in their
  // own variant and neither is required in this flat map. Exactly one must be
  // sent. Unlike its three siblings, `extend` documents no defaults at all.
  "pixverse-v6/extend": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 3,
        maxLength: 5000,
        description: "Video generation prompt (3-5000 chars)",
      },
      taskId: {
        type: "string",
        description:
          "taskId of a successful parent video task to extend; mutually exclusive with video_url",
      },
      video_url: {
        type: "string",
        description:
          "URL of the video to extend; mutually exclusive with taskId",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["360p", "540p", "720p", "1080p"],
        description: "Output video resolution",
      },
      duration: {
        type: "integer",
        required: true,
        minimum: 1,
        maximum: 15,
        description: "Output video duration in seconds, 1-15",
      },
      generate_audio_switch: {
        type: "boolean",
        description: "Generate audio synchronized with the video content",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "pixverse-v6/reference-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 3,
        maxLength: 5000,
        description: "Video generation prompt (3-5000 chars)",
      },
      image_references: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 7,
        description:
          "Reference images (1-7); ref_name values are addressable as @name in the prompt and must be unique within the list",
        items: {
          type: "object",
          properties: {
            image_url: {
              type: "string",
              required: true,
              description: "Reference image URL",
            },
            type: {
              type: "string",
              enum: ["subject", "background"],
              default: "subject",
              description: "How the reference is used",
            },
            ref_name: {
              type: "string",
              minLength: 1,
              maxLength: 30,
              description: "Name referenced in the prompt via @name",
            },
          },
        },
      },
      aspect_ratio: {
        type: "string",
        required: true,
        enum: ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"],
        default: "16:9",
        description:
          "Output video aspect ratio (default 16:9; spec-required despite documented default)",
      },
      quality: {
        type: "string",
        required: true,
        enum: ["360p", "540p", "720p", "1080p"],
        default: "720p",
        description:
          "Output video resolution (default 720p; spec-required despite documented default)",
      },
      duration: {
        type: "integer",
        required: true,
        minimum: 1,
        maximum: 15,
        default: 5,
        description:
          "Output video duration in seconds, 1-15 (default 5; spec-required despite documented default)",
      },
      generate_audio_switch: {
        type: "boolean",
        default: false,
        description:
          "Generate audio synchronized with the video content (default false)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "happyhorse/text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description:
          "Video generation prompt (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Output resolution (default 1080p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        description: "Output aspect ratio (default 16:9)",
      },
      duration: happyHorseDurationField,
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "happyhorse/image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        maxLength: 5000,
        description:
          "Video generation prompt (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      image_urls: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 1,
        description: "First-frame image URL list (exactly 1 image required)",
        items: { type: "string" },
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Output resolution (default 1080p)",
      },
      duration: happyHorseDurationField,
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "happyhorse/reference-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description:
          "Video generation prompt (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      reference_image: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 9,
        description:
          "Reference image URLs (1-9 images; order defines character1, character2, ...)",
        items: { type: "string" },
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Output resolution (default 1080p)",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        description: "Output aspect ratio (default 16:9)",
      },
      duration: happyHorseDurationField,
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  "happyhorse/video-edit": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description:
          "Edit instruction (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      video_url: {
        type: "string",
        required: true,
        description:
          "Source video URL (mp4/mov, 3-60s, max 100MB, longest side <=2160px)",
      },
      reference_image: {
        type: "array",
        maxItems: 5,
        description: "Optional reference image URLs (0-5)",
        items: { type: "string" },
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        description: "Output resolution (default 1080p)",
      },
      audio_setting: {
        type: "string",
        enum: ["auto", "origin"],
        description:
          "Audio handling: auto (model decides) or origin (keep original) (default auto)",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed (0-2147483647)",
      },
    },
  },

  // Sources:
  // - https://docs.kie.ai/market/happyhorse-1-1/image-to-video
  // - https://docs.kie.ai/market/happyhorse-1-1/text-to-video
  // - https://docs.kie.ai/market/happyhorse-1-1/reference-to-video
  // - https://kie.ai/happyhorse-1-1
  "happyhorse-1-1/text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description:
          "Video generation prompt (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        default: "1080p",
        description: "Output resolution (default 1080p)",
      },
      aspect_ratio: {
        type: "string",
        enum: happyHorse11AspectRatios,
        default: "16:9",
        description: "Output aspect ratio (default 16:9)",
      },
      duration: happyHorseDurationField,
    },
  },

  "happyhorse-1-1/image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        maxLength: 5000,
        default: "",
        description:
          "Video generation prompt (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      image_urls: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 1,
        description:
          "First-frame image URL list (exactly 1 JPEG/JPG/PNG/WEBP image, max 20 MB)",
        items: { type: "string" },
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        default: "1080p",
        description: "Output resolution (default 1080p)",
      },
      duration: happyHorseDurationField,
    },
  },

  "happyhorse-1-1/reference-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 5000,
        description:
          "Video generation prompt (max 5000 non-Chinese / 2500 Chinese chars)",
      },
      reference_image: {
        type: "array",
        required: true,
        minItems: 1,
        maxItems: 9,
        description:
          "Reference image URLs (1-9 JPEG/JPG/PNG/WEBP images, max 20 MB each)",
        items: { type: "string" },
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p"],
        default: "1080p",
        description: "Output resolution (default 1080p)",
      },
      aspect_ratio: {
        type: "string",
        enum: happyHorse11AspectRatios,
        default: "16:9",
        description: "Output aspect ratio (default 16:9)",
      },
      duration: happyHorseDurationField,
    },
  },

  "omnihuman-1-5": {
    type: "video",
    fields: {
      image_url: {
        type: "string",
        required: true,
        description:
          "Portrait image URL (jpeg/png/webp, max 10MB; supports people, pets, anime, and other subjects)",
      },
      mask_url: {
        type: "array",
        maxItems: 5,
        description:
          "Optional subject mask image URLs (jpeg/png/webp, max 5, max 10MB each)",
        items: { type: "string" },
      },
      audio_url: {
        type: "string",
        required: true,
        description:
          "Driving audio URL (mp3/wav/aac/ogg/mp4, max 10MB, less than 60 seconds)",
      },
      prompt: {
        type: "string",
        maxLength: 1000,
        description:
          "Optional motion prompt (max 1000 chars; Chinese, English, Japanese, Korean, Spanish, or Indonesian)",
      },
      output_resolution: {
        type: "string",
        enum: ["720", "1080"],
        description: "Output resolution (default 1080)",
      },
      pe_fast_mode: {
        type: "boolean",
        description: "Fast mode trades quality for speed (default false)",
      },
      seed: {
        type: "integer",
        minimum: -1,
        default: -1,
        description: "Random seed (-1 for random, default -1)",
      },
    },
  },

  "volcengine/video-to-video-lip-sync": {
    type: "video",
    fields: {
      mode: {
        type: "string",
        required: true,
        enum: ["lite", "basic"],
        description: "Lip-sync processing mode",
      },
      video_url: {
        type: "string",
        required: true,
        description: "Source video asset URL",
      },
      audio_url: {
        type: "string",
        required: true,
        description: "Target pure vocal audio URL (max 10MB)",
      },
      separate_vocal: {
        type: "boolean",
        description:
          "Separate vocals before lip-sync processing (default false)",
      },
      open_scenedet: {
        type: "boolean",
        description:
          "Enable scene segmentation and speaker identification in basic mode (default false)",
      },
      align_audio: {
        type: "boolean",
        description:
          "Loop video when audio is longer than video in lite mode (default true)",
      },
      align_audio_reverse: {
        type: "boolean",
        description:
          "Loop video backward when align_audio is enabled in lite mode (default false)",
      },
      templ_start_seconds: {
        type: "number",
        description: "Start offset in seconds for lite mode (default 0)",
      },
    },
  },

  "gemini-omni-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 20000,
        description: "Multimodal video generation prompt (max 20000 chars)",
      },
      image_urls: {
        type: "array",
        maxItems: 7,
        description:
          "Reference image URLs (max 7, each image up to 20MB; each counts as 1 quota unit)",
        items: { type: "string" },
      },
      audio_ids: {
        type: "array",
        maxItems: 3,
        description:
          "Audio IDs created by gemini-omni-audio (max 3; does not count toward visual quota)",
        items: { type: "string" },
      },
      video_list: {
        type: "array",
        maxItems: 1,
        description:
          "Reference video clip list (max 1; source video under 100MB and 30s; each clip counts as 2 quota units)",
        items: {
          type: "object",
          properties: {
            url: {
              type: "string",
              required: true,
              description: "Reference video URL",
            },
            start: {
              type: "number",
              required: true,
              minimum: 0,
              description: "Clip start time in seconds",
            },
            ends: {
              type: "number",
              required: true,
              minimum: 0,
              description:
                "Clip end time in seconds; must be greater than start and less than 10 seconds after start",
            },
          },
        },
      },
      character_ids: {
        type: "array",
        maxItems: 3,
        description:
          "Character IDs created by gemini-omni-character (max 3; each counts as 1 quota unit)",
        items: { type: "string" },
      },
      duration: {
        type: "string",
        required: true,
        enum: ["4", "6", "8", "10"],
        description:
          "Output duration in seconds; ignored by Kie when video input is provided",
      },
      aspect_ratio: {
        type: "string",
        enum: ["16:9", "9:16"],
        description: "Output aspect ratio",
      },
      seed: {
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        description: "Random seed",
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p", "4k"],
        default: "720p",
        description: "Output resolution (default 720p)",
      },
    },
  },
};
