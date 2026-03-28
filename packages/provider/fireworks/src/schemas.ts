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
        "Model ID (e.g. accounts/fireworks/models/llama-v3p1-70b-instruct)",
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
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    top_p: { type: "number", description: "Nucleus sampling 0-1" },
    top_k: { type: "number", description: "Top-k token filtering 0-100" },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    max_completion_tokens: {
      type: "number",
      description: "Max completion tokens",
    },
    n: { type: "number", description: "Number of completions to generate" },
    stop: {
      type: "string",
      description: "Stop sequences (string or array, up to 4)",
    },
    stream: { type: "boolean", description: "Enable streaming" },
    tools: {
      type: "array",
      description: "Tool definitions for function calling",
      items: {
        type: "object",
        properties: {
          type: { type: "string", required: true, enum: ["function"] },
          function: {
            type: "object",
            required: true,
            properties: {
              name: { type: "string", required: true },
              description: { type: "string" },
              parameters: { type: "object" },
            },
          },
        },
      },
    },
    tool_choice: { type: "string", description: "Tool choice strategy" },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object", "json_schema", "grammar"],
        },
        json_schema: { type: "object" },
        grammar: { type: "object" },
      },
    },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty -2 to 2",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty -2 to 2",
    },
    logprobs: {
      type: "boolean",
      description: "Include log probabilities",
    },
    top_logprobs: {
      type: "number",
      description: "Top token alternatives 0-5",
    },
    reasoning_effort: {
      type: "string",
      description: "Reasoning effort level",
      enum: ["low", "medium", "high", "none"],
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
  },
};

export const completionsSchema: PayloadSchema = {
  method: "POST",
  path: "/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID",
    },
    prompt: {
      type: "string",
      required: true,
      description:
        "Prompt to generate completions for (string, string[], number[], or number[][])",
    },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    max_completion_tokens: {
      type: "number",
      description: "Max completion tokens",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    top_p: { type: "number", description: "Nucleus sampling 0-1" },
    top_k: { type: "number", description: "Top-k token filtering 0-100" },
    n: {
      type: "number",
      description: "Number of completions to generate (1-128)",
    },
    stop: {
      type: "string",
      description: "Stop sequences (string or array, up to 4)",
    },
    stream: { type: "boolean", description: "Enable streaming" },
    echo: {
      type: "boolean",
      description: "Include prompt in response",
    },
    echo_last: {
      type: "number",
      description: "Echo last N prompt tokens",
    },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty -2 to 2",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty -2 to 2",
    },
    repetition_penalty: {
      type: "number",
      description: "Repetition penalty 0-2",
    },
    logprobs: {
      type: "boolean",
      description: "Include log probabilities",
    },
    top_logprobs: {
      type: "number",
      description: "Top token alternatives 0-5",
    },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object", "json_schema", "grammar"],
        },
        json_schema: { type: "object" },
        grammar: { type: "object" },
      },
    },
    reasoning_effort: {
      type: "string",
      description: "Reasoning effort level",
      enum: ["low", "medium", "high", "none"],
    },
    seed: {
      type: "number",
      description: "Random seed for deterministic sampling",
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
  },
};

export const rerankSchema: PayloadSchema = {
  method: "POST",
  path: "/rerank",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Reranker model ID (e.g. fireworks/qwen3-reranker-8b)",
    },
    query: {
      type: "string",
      required: true,
      description: "The search query to rerank documents against",
    },
    documents: {
      type: "array",
      required: true,
      description: "List of document strings to be ranked",
      items: { type: "string" },
    },
    top_n: {
      type: "number",
      description: "Number of top results to return",
    },
    return_documents: {
      type: "boolean",
      description: "Whether to include document text in the response",
    },
  },
};

export const messagesSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/messages",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model ID (e.g. accounts/fireworks/models/llama-v3p1-70b-instruct)",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of messages (Anthropic Messages format)",
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
    max_tokens: {
      type: "number",
      description: "Maximum tokens to generate",
    },
    system: { type: "string", description: "System prompt" },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-1",
    },
    top_p: { type: "number", description: "Nucleus sampling threshold" },
    top_k: { type: "number", description: "Top-K sampling" },
    stop_sequences: {
      type: "array",
      description: "Custom stop sequences",
      items: { type: "string" },
    },
    stream: { type: "boolean", description: "Enable SSE streaming" },
    metadata: {
      type: "object",
      description: "Request metadata",
      properties: {
        user_id: { type: "string" },
      },
    },
    thinking: {
      type: "object",
      description: "Extended thinking configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["enabled", "disabled"],
        },
        budget_tokens: { type: "number" },
      },
    },
    tools: {
      type: "array",
      description: "Tool definitions",
      items: {
        type: "object",
        properties: {
          name: { type: "string", required: true },
          description: { type: "string" },
          input_schema: { type: "object", required: true },
        },
      },
    },
    tool_choice: {
      type: "object",
      description: "Tool choice strategy",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["auto", "any", "none", "tool"],
        },
        name: { type: "string" },
      },
    },
    raw_output: {
      type: "boolean",
      description: "Return raw model output details (Fireworks extension)",
    },
  },
};

export const audioTranscriptionsSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/transcriptions",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "Audio file (Blob) or public URL string",
    },
    model: {
      type: "string",
      description: "ASR model (whisper-v3 or whisper-v3-turbo)",
      enum: ["whisper-v3", "whisper-v3-turbo"],
    },
    vad_model: {
      type: "string",
      description: "Voice activity detection model",
      enum: ["silero", "whisperx-pyannet"],
    },
    alignment_model: {
      type: "string",
      description: "Alignment model for timestamps",
      enum: ["mms_fa", "tdnn_ffn"],
    },
    language: { type: "string", description: "Target language code" },
    prompt: {
      type: "string",
      description: "Custom prompt for style or vocabulary",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-1",
    },
    response_format: {
      type: "string",
      description: "Output format",
      enum: ["json", "text", "srt", "verbose_json", "vtt"],
    },
    timestamp_granularities: {
      type: "string",
      description: "Timestamp detail level (word, segment, or both)",
    },
    diarize: {
      type: "string",
      description: "Enable speaker diarization",
      enum: ["true", "false"],
    },
    min_speakers: {
      type: "number",
      description: "Minimum speaker count for diarization",
    },
    max_speakers: {
      type: "number",
      description: "Maximum speaker count for diarization",
    },
    preprocessing: {
      type: "string",
      description: "Audio preprocessing mode",
      enum: ["none", "dynamic", "soft_dynamic", "bass_dynamic"],
    },
  },
};

export const audioTranslationsSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/translations",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "Audio file (Blob) or public URL string",
    },
    model: {
      type: "string",
      description: "ASR model (whisper-v3 or whisper-v3-turbo)",
      enum: ["whisper-v3", "whisper-v3-turbo"],
    },
    vad_model: {
      type: "string",
      description: "Voice activity detection model",
      enum: ["silero", "whisperx-pyannet"],
    },
    alignment_model: {
      type: "string",
      description: "Alignment model for timestamps",
      enum: ["mms_fa", "tdnn_ffn"],
    },
    language: { type: "string", description: "Source language code" },
    prompt: {
      type: "string",
      description: "Custom prompt for style or vocabulary",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-1",
    },
    response_format: {
      type: "string",
      description: "Output format",
      enum: ["json", "text", "srt", "verbose_json", "vtt"],
    },
    timestamp_granularities: {
      type: "string",
      description: "Timestamp detail level (word, segment, or both)",
    },
    preprocessing: {
      type: "string",
      description: "Audio preprocessing mode",
      enum: ["none", "dynamic", "soft_dynamic", "bass_dynamic"],
    },
  },
};

export const textToImageSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows/accounts/fireworks/models/{model}/text_to_image",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for image generation",
    },
    aspect_ratio: {
      type: "string",
      description: "Image aspect ratio",
      enum: [
        "1:1",
        "21:9",
        "16:9",
        "3:2",
        "5:4",
        "4:5",
        "2:3",
        "9:16",
        "9:21",
        "4:3",
        "3:4",
      ],
    },
    guidance_scale: {
      type: "number",
      description: "Classifier-free guidance scale (default 3.5)",
    },
    num_inference_steps: {
      type: "number",
      description: "Number of denoising steps (default 4)",
    },
    seed: {
      type: "number",
      description: "Random seed (0 = random)",
    },
  },
};

export const kontextSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows/accounts/fireworks/models/{model}",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for image generation or editing",
    },
    input_image: {
      type: "string",
      description: "Base64-encoded image or URL for image-to-image editing",
    },
    seed: {
      type: "number",
      description: "Seed for reproducibility (default 42)",
    },
    aspect_ratio: {
      type: "string",
      description: "Aspect ratio (range 21:9 to 9:21)",
    },
    output_format: {
      type: "string",
      description: "Output image format",
      enum: ["png", "jpeg"],
    },
    webhook_url: {
      type: "string",
      description: "URL for webhook notifications",
    },
    webhook_secret: {
      type: "string",
      description: "Secret for webhook signature verification",
    },
    prompt_upsampling: {
      type: "boolean",
      description: "Auto-modify prompt for creative generation",
    },
    safety_tolerance: {
      type: "number",
      description: "Moderation level 0-6 (0=strictest)",
    },
  },
};

export const getResultSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows/accounts/fireworks/models/{model}/get_result",
  contentType: "application/json",
  fields: {
    id: {
      type: "string",
      required: true,
      description: "Request ID from the create request",
    },
  },
};

export const embeddingsSchema: PayloadSchema = {
  method: "POST",
  path: "/embeddings",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Embedding model ID (e.g. nomic-ai/nomic-embed-text-v1.5)",
    },
    input: {
      type: "string",
      required: true,
      description:
        "Input text to embed (string, string[], number[], or number[][])",
    },
    dimensions: {
      type: "number",
      description: "Output embedding dimensionality",
    },
    prompt_template: {
      type: "string",
      description: "Jinja2 template for processing structured input",
    },
    return_logits: {
      type: "array",
      description: "Token indices for raw logits output",
      items: { type: "number" },
    },
    normalize: {
      type: "boolean",
      description:
        "Enable L2 normalization for embeddings or softmax for logits",
    },
  },
};
