import type { PayloadSchema, KieMediaModel, ModelInputSchema } from "./types";

export const createTaskSchema: PayloadSchema = {
  method: "POST",
  path: "/api/v1/jobs/createTask",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (discriminator for input shape)",
    },
    callBackUrl: { type: "string", description: "Webhook callback URL" },
    input: {
      type: "object",
      required: true,
      description: "Model-specific input parameters",
    },
  },
};

export const downloadUrlSchema: PayloadSchema = {
  method: "POST",
  path: "/api/v1/common/download-url",
  contentType: "application/json",
  fields: {
    url: {
      type: "string",
      required: true,
      description: "Kie CDN URL to convert to a temporary download link",
    },
  },
};

export const fileStreamUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/api/file-stream-upload",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "File to upload (Blob)",
    },
    filename: {
      type: "string",
      required: true,
      description: "Filename with extension",
    },
    mimeType: { type: "string", description: "MIME type override" },
  },
};

export const fileUrlUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/api/file-url-upload",
  contentType: "application/json",
  fields: {
    url: {
      type: "string",
      required: true,
      description: "Remote URL of the file to upload",
    },
    uploadPath: {
      type: "string",
      description: "Destination path (auto-generated if omitted)",
    },
  },
};

export const fileBase64UploadSchema: PayloadSchema = {
  method: "POST",
  path: "/api/file-base64-upload",
  contentType: "application/json",
  fields: {
    base64: {
      type: "string",
      required: true,
      description: "Base64-encoded file data",
    },
    filename: {
      type: "string",
      required: true,
      description: "Filename with extension",
    },
    mimeType: { type: "string", description: "MIME type override" },
  },
};

export const veoGenerateSchema: PayloadSchema = {
  method: "POST",
  path: "/api/v1/veo/generate",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for video generation",
    },
    model: {
      type: "string",
      enum: ["veo3", "veo3_fast"],
      description: "Veo model variant",
    },
    aspectRatio: {
      type: "string",
      enum: ["16:9", "9:16", "Auto"],
      description: "Output aspect ratio",
    },
    generationType: {
      type: "string",
      enum: [
        "TEXT_2_VIDEO",
        "REFERENCE_2_VIDEO",
        "FIRST_AND_LAST_FRAMES_2_VIDEO",
      ],
      description: "Generation mode",
    },
    imageUrls: {
      type: "array",
      description: "Reference image URLs",
      items: { type: "string" },
    },
    seeds: { type: "number", description: "Random seed" },
    watermark: { type: "string", description: "Watermark text" },
    enableTranslation: {
      type: "boolean",
      description: "Enable prompt translation",
    },
  },
};

export const veoExtendSchema: PayloadSchema = {
  method: "POST",
  path: "/api/v1/veo/extend",
  contentType: "application/json",
  fields: {
    taskId: {
      type: "string",
      required: true,
      description: "Task ID of the video to extend",
    },
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for extension",
    },
    model: {
      type: "string",
      enum: ["fast", "quality"],
      description: "Extension quality mode",
    },
    seeds: { type: "number", description: "Random seed" },
    watermark: { type: "string", description: "Watermark text" },
  },
};

export const sunoGenerateSchema: PayloadSchema = {
  method: "POST",
  path: "/api/v1/generate",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt or lyrics",
    },
    model: {
      type: "string",
      required: true,
      enum: ["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5"],
      description: "Suno model version",
    },
    instrumental: {
      type: "boolean",
      required: true,
      description: "Generate instrumental (no vocals)",
    },
    customMode: {
      type: "boolean",
      required: true,
      description: "Enable custom mode",
    },
    style: { type: "string", description: "Music style/genre" },
    negativeTags: {
      type: "string",
      description: "Styles to avoid",
    },
    title: { type: "string", description: "Song title" },
  },
};

export const chatCompletions55Schema: PayloadSchema = {
  method: "POST",
  path: "/gpt-5.5/v1/chat/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. gpt-5.5)",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of chat messages",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["user", "assistant", "system"],
          },
          content: { type: "string", required: true },
        },
      },
    },
    temperature: { type: "number", description: "Sampling temperature" },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    stream: { type: "boolean", description: "Enable streaming" },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object", "json_schema"],
        },
        json_schema: { type: "object" },
      },
    },
  },
};

export const chatCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/gpt-5-2/v1/chat/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. gpt-5.5)",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of chat messages",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["user", "assistant", "system"],
          },
          content: { type: "string", required: true },
        },
      },
    },
    temperature: { type: "number", description: "Sampling temperature" },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    stream: { type: "boolean", description: "Enable streaming" },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object", "json_schema"],
        },
        json_schema: { type: "object" },
      },
    },
  },
};

export const claudeMessagesSchema: PayloadSchema = {
  method: "POST",
  path: "/claude/v1/messages",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model name",
      enum: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    },
    messages: {
      type: "array",
      required: true,
      description: "Conversation messages in chronological order",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["user", "assistant"],
          },
          content: { type: "string", required: true },
        },
      },
    },
    tools: {
      type: "array",
      description: "Optional callable tools with input_schema",
      items: {
        type: "object",
        properties: {
          name: { type: "string", required: true },
          description: { type: "string", required: true },
          input_schema: { type: "object", required: true },
        },
      },
    },
    thinkingFlag: {
      type: "boolean",
      description: "Project-specific thinking flag",
    },
    stream: {
      type: "boolean",
      description: "If true, response is returned as SSE stream",
    },
  },
};

// claudeHaiku uses the same schema as claude (same endpoint shape, different base URL)
export const claudeHaikuMessagesSchema: PayloadSchema = claudeMessagesSchema;

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
        description: "Image generation prompt",
      },
      aspect_ratio: {
        type: "string",
        enum: ["2:3", "3:2", "1:1", "16:9", "9:16"],
        description: "Output aspect ratio",
      },
    },
  },

  "grok-imagine/image-to-image": {
    type: "image",
    fields: {
      prompt: { type: "string", description: "Modification prompt" },
      image_urls: {
        type: "array",
        required: true,
        description: "Input image URLs (max 5)",
        items: { type: "string" },
      },
      aspect_ratio: {
        type: "string",
        enum: ["2:3", "3:2", "1:1", "16:9", "9:16"],
        description: "Output aspect ratio",
      },
    },
  },

  "grok-imagine/text-to-video": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Video generation prompt",
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
        type: "string",
        enum: ["6", "10"],
        description: "Duration in seconds (default 6)",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p"],
        description: "Output resolution (default 480p)",
      },
    },
  },

  "grok-imagine/image-to-video": {
    type: "video",
    fields: {
      prompt: { type: "string", description: "Video generation prompt" },
      image_urls: {
        type: "array",
        description: "Reference image URLs (max 7)",
        items: { type: "string" },
      },
      task_id: { type: "string", description: "Reference task ID" },
      index: { type: "number", description: "Frame index (0-5)" },
      mode: {
        type: "string",
        enum: ["fun", "normal", "spicy"],
        description: "Generation mode (default normal)",
      },
      duration: {
        type: "string",
        enum: ["6", "10"],
        description: "Duration in seconds (default 6)",
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
    },
  },

  "grok-imagine/extend": {
    type: "video",
    fields: {
      task_id: {
        type: "string",
        required: true,
        description: "Video task ID to extend",
      },
      prompt: {
        type: "string",
        required: true,
        description: "Extension prompt",
      },
      extend_at: {
        type: "number",
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
        description: "Video task ID to upscale",
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

  "bytedance/seedance-1.5-pro": {
    type: "video",
    fields: {
      prompt: {
        type: "string",
        required: true,
        description: "Video generation prompt (3-2500 chars)",
      },
      input_urls: {
        type: "array",
        description: "Reference image URLs (max 2)",
        items: { type: "string" },
      },
      aspect_ratio: {
        type: "string",
        required: true,
        enum: ["1:1", "21:9", "4:3", "3:4", "16:9", "9:16"],
        description: "Output aspect ratio (default 1:1)",
      },
      resolution: {
        type: "string",
        enum: ["480p", "720p", "1080p"],
        description: "Output resolution (default 720p)",
      },
      duration: {
        type: "number",
        enum: [4, 8, 12],
        description: "Duration in seconds (default 8)",
      },
      fixed_lens: {
        type: "boolean",
        description: "Lock camera movement",
      },
      generate_audio: {
        type: "boolean",
        description: "Generate accompanying audio",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter",
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
        description: "Use online search (default false)",
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
        enum: ["basic", "high"],
        description: "Output quality (basic=2K, high=4K, default basic)",
      },
      nsfw_checker: {
        type: "boolean",
        description: "Content safety filter",
      },
    },
  },

  "elevenlabs/text-to-dialogue-v3": {
    type: "audio",
    fields: {
      dialogue: {
        type: "array",
        required: true,
        description: "Dialogue lines",
        items: {
          type: "object",
          properties: {
            text: { type: "string", required: true },
            voice: {
              type: "string",
              required: true,
              enum: [
                "Adam",
                "Alice",
                "Bill",
                "Brian",
                "Callum",
                "Charlie",
                "Chris",
                "Daniel",
                "Eric",
                "George",
                "Harry",
                "Jessica",
                "Laura",
                "Liam",
                "Lily",
                "Matilda",
                "River",
                "Roger",
                "Sarah",
                "Will",
              ],
            },
          },
        },
      },
      stability: {
        type: "number",
        enum: [0, 0.5, 1.0],
        description: "Voice stability",
      },
      language_code: {
        type: "string",
        description: "Language/locale code",
      },
    },
  },

  "elevenlabs/sound-effect-v2": {
    type: "audio",
    fields: {
      text: {
        type: "string",
        required: true,
        description: "Sound effect description",
      },
      output_format: {
        type: "string",
        enum: [
          "mp3_22050_32",
          "mp3_44100_32",
          "mp3_44100_64",
          "mp3_44100_96",
          "mp3_44100_128",
          "mp3_44100_192",
          "pcm_8000",
          "pcm_16000",
          "pcm_22050",
          "pcm_24000",
          "pcm_44100",
          "pcm_48000",
          "ulaw_8000",
          "alaw_8000",
          "opus_48000_32",
          "opus_48000_64",
          "opus_48000_96",
          "opus_48000_128",
          "opus_48000_192",
        ],
        description: "Audio format (default mp3_44100_128)",
      },
      prompt_influence: {
        type: "number",
        description: "Prompt influence weight (0-1, default 0.3)",
      },
      loop: { type: "boolean", description: "Loop the audio" },
      duration_seconds: {
        type: "number",
        description: "Target duration in seconds",
      },
    },
  },

  "elevenlabs/speech-to-text": {
    type: "transcription",
    fields: {
      audio_url: {
        type: "string",
        required: true,
        description: "URL to audio file",
      },
      tag_audio_events: {
        type: "boolean",
        description: "Tag audio events in transcript",
      },
      diarize: {
        type: "boolean",
        description: "Identify speaker changes",
      },
      language_code: {
        type: "string",
        description: "Language/locale code",
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
        description: "Image editing prompt (max 5000 chars)",
      },
      image_url: {
        type: "array",
        required: true,
        description: "Reference image URLs (max 10MB, jpeg/png/webp)",
        items: { type: "string" },
      },
      image_size: {
        type: "string",
        required: true,
        enum: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        description: "Output image aspect ratio",
      },
      output_format: {
        type: "string",
        required: true,
        enum: ["png", "jpeg"],
        description: "Image format (png or jpeg)",
      },
      seed: {
        type: "number",
        description: "Random seed (default 0)",
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
