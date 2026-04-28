import type { KieMediaModel, ModelInputSchema } from "./types";

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
        enum: ["std", "pro"],
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
        required: true,
        enum: ["720p", "1080p"],
        description: "Output resolution (default 720p)",
      },
      character_orientation: {
        type: "string",
        required: true,
        enum: ["video", "image"],
        description: "Character orientation source (default video)",
      },
    },
  },

  "grok-imagine/text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
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
        description: "Modification prompt (max 390000 chars)",
      },
      image_urls: {
        type: "array",
        required: true,
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

  "grok-imagine/text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
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
        type: "number",
        description: "Duration in seconds (6-30, default 6)",
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
        description: "Video generation prompt (max 5000 chars)",
      },
      image_urls: {
        type: "array",
        description: "Reference image URLs (max 7)",
        items: { type: "string" },
      },
      task_id: {
        type: "string",
        description: "Reference task ID (max 100 chars)",
      },
      index: { type: "number", description: "Frame index (0-5, default 0)" },
      mode: {
        type: "string",
        enum: ["fun", "normal", "spicy"],
        description: "Generation mode (default normal)",
      },
      duration: {
        type: "number",
        description: "Duration in seconds (6-30, default 6)",
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

  "grok-imagine/extend": {
    type: "video",
    fields: {
      task_id: {
        type: "string",
        required: true,
        description: "Video task ID to extend (max 100 chars)",
      },
      prompt: {
        type: "string",
        required: true,
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
        description: "Extension duration in seconds (default '6')",
      },
    },
  },

  "grok-imagine/upscale": {
    type: "video",
    fields: {
      task_id: {
        type: "string",
        required: true,
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

  "nano-banana-2": {
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
          "1:4",
          "1:8",
          "4:1",
          "8:1",
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
        enum: ["auto", "1:1", "16:9", "9:16", "3:2", "2:3"],
        description: "Output aspect ratio (default auto)",
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
        enum: ["auto", "1:1", "16:9", "9:16", "3:2"],
        description: "Output aspect ratio (default auto)",
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

  "qwen2/text-to-image": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Image generation prompt",
      },
      image_size: {
        type: "string",
        enum: [
          "square",
          "square_hd",
          "portrait_4_3",
          "portrait_16_9",
          "landscape_4_3",
          "landscape_16_9",
        ],
        description: "Output image size (default square_hd)",
      },
      num_inference_steps: {
        type: "number",
        description: "Inference steps (2-250, default 30)",
      },
      seed: { type: "number", description: "Random seed" },
      guidance_scale: {
        type: "number",
        description: "Guidance scale (0-20, default 2.5)",
      },
      enable_safety_checker: {
        type: "boolean",
        description: "Content safety filter",
      },
      output_format: {
        type: "string",
        enum: ["png", "jpeg"],
        description: "Image format (default png)",
      },
      negative_prompt: {
        type: "string",
        description: "Negative prompt (max 500 chars)",
      },
      acceleration: {
        type: "string",
        enum: ["none", "regular", "high"],
        description: "Speed vs quality tradeoff (default none)",
      },
    },
  },

  "qwen2/image-edit": {
    type: "image",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Image editing prompt (max 800 chars)",
      },
      image_url: {
        type: "array",
        required: true,
        description:
          "URLs of the images to edit (jpeg/png/webp, max 10MB each)",
        items: { type: "string" },
      },
      image_size: {
        type: "string",
        enum: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        description: "Output image aspect ratio (default 16:9)",
      },
      output_format: {
        type: "string",
        enum: ["png", "jpeg"],
        description: "Image format (default png)",
      },
      seed: {
        type: "number",
        description: "Random seed",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default true)",
      },
    },
  },

  "wan/2-7-image-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
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
        type: "number",
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
        type: "number",
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
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
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
        type: "number",
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
        type: "number",
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
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
        description: "Negative prompt (max 500 chars)",
      },
      reference_image: {
        type: "array",
        description: "Array of reference image URLs (max 5 total with videos)",
      },
      reference_video: {
        type: "array",
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
        type: "number",
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
        type: "number",
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
        description: "Positive prompt (max 5000 chars)",
      },
      negative_prompt: {
        type: "string",
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
        type: "number",
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
        type: "number",
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
        description: "Prompt for image generation or editing (max 5000 chars)",
      },
      input_urls: {
        type: "array",
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
        type: "number",
        description:
          "Number of images to generate: 1-4 when sequential=false (default 4), 1-12 when sequential=true (default 12)",
      },
      resolution: {
        type: "string",
        enum: ["1K", "2K", "4K"],
        description: "Output resolution (default 2K)",
      },
      thinking_mode: {
        type: "boolean",
        description:
          "Enable thinking mode (only when sequential=false and no input_urls, default false)",
      },
      color_palette: {
        type: "array",
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
        type: "number",
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
        description: "Prompt for image generation or editing (max 5000 chars)",
      },
      input_urls: {
        type: "array",
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
        type: "number",
        description:
          "Number of images to generate: 1-4 when sequential=false (default 4), 1-12 when sequential=true (default 12)",
      },
      resolution: {
        type: "string",
        enum: ["1K", "2K", "4K"],
        description:
          "Output resolution (default 2K, 4K only for text-to-image in standard mode)",
      },
      thinking_mode: {
        type: "boolean",
        description:
          "Enable thinking mode (only when sequential=false and no input_urls, default false)",
      },
      color_palette: {
        type: "array",
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
        type: "number",
        description: "Random seed (0-2147483647)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter (default false)",
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
};
