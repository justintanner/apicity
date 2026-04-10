import type { PayloadSchema } from "./types";

export const chatCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/chat/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model ID (e.g. qwen3-max, qwen3-plus, qwen3-flash, qwen-turbo)",
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
            enum: ["system", "user", "assistant", "tool"],
          },
          content: {
            type: "string",
            required: true,
            description: "Message content",
          },
        },
      },
    },
    temperature: {
      type: "number",
      description: "Sampling temperature (0 to 2)",
    },
    top_p: {
      type: "number",
      description: "Nucleus sampling threshold (0 to 1)",
    },
    max_tokens: {
      type: "number",
      description: "Maximum tokens to generate",
    },
    n: {
      type: "number",
      description: "Number of completions to generate (1-4)",
    },
    stop: {
      type: "string",
      description: "Stop sequence(s)",
    },
    stream: {
      type: "boolean",
      description: "Enable streaming output",
    },
    seed: {
      type: "number",
      description: "Random seed for reproducibility",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty (-2.0 to 2.0)",
    },
    tools: {
      type: "array",
      description: "Tool/function definitions for function calling",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            required: true,
            enum: ["function"],
          },
          function: {
            type: "object",
            required: true,
            properties: {
              name: {
                type: "string",
                required: true,
                description: "Function name",
              },
              description: {
                type: "string",
                description: "Function description",
              },
              parameters: {
                type: "object",
                description: "JSON Schema for function parameters",
              },
            },
          },
        },
      },
    },
    tool_choice: {
      type: "string",
      description: "Tool choice strategy (auto, none, or object)",
    },
    enable_search: {
      type: "boolean",
      description: "Enable web search augmentation (Alibaba-specific)",
    },
    stream_options: {
      type: "object",
      description: "Streaming options",
      properties: {
        include_usage: {
          type: "boolean",
          description: "Include usage statistics in stream",
        },
      },
    },
    response_format: {
      type: "object",
      description: "Response format constraint",
      properties: {
        type: {
          type: "string",
          enum: ["text", "json_object"],
          description: "Response format type",
        },
      },
    },
  },
};

export const videoSynthesisSchema: PayloadSchema = {
  method: "POST",
  path: "/services/aigc/video-generation/video-synthesis",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Wan image-to-video model ID (e.g. wan2.7-i2v, wan2.6-i2v-flash)",
    },
    input: {
      type: "object",
      required: true,
      description: "Prompt + image (and optional audio) inputs",
      properties: {
        prompt: {
          type: "string",
          required: true,
          description: "Text prompt describing the desired motion / scene",
        },
        img_url: {
          type: "string",
          required: true,
          description: "Public HTTPS URL or base64 data URL of the first frame",
        },
        audio_url: {
          type: "string",
          description:
            "Optional public HTTPS URL of an audio track for audio-video sync (wan2.5/2.6/2.7)",
        },
      },
    },
    parameters: {
      type: "object",
      description: "Generation parameters",
      properties: {
        resolution: {
          type: "string",
          enum: ["480P", "720P", "1080P"],
          description: "Output resolution",
        },
        duration: {
          type: "number",
          description: "Video duration in seconds (model-dependent, 2-15s)",
        },
        shot_type: {
          type: "string",
          enum: ["single", "multi"],
          description:
            "Multi-shot narrative mode (wan2.6+ only); default single",
        },
        prompt_extend: {
          type: "boolean",
          description: "Enable intelligent prompt rewriting",
        },
        watermark: {
          type: "boolean",
          description: "Embed a watermark in the output",
        },
        audio: {
          type: "boolean",
          description:
            "For wan2.6-i2v-flash: set false to force silent output (billed at video-without-audio rate)",
        },
        seed: {
          type: "number",
          description: "Random seed for reproducibility",
        },
        negative_prompt: {
          type: "string",
          description: "Negative prompt — things to avoid in the output",
        },
      },
    },
  },
};
