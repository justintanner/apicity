import type { PayloadSchema } from "./types";

export const chatCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/chat/completions",
  contentType: "application/json",
  fields: {
    model: { type: "string", description: "Model ID (e.g. gpt-4o)" },
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
    temperature: { type: "number", description: "Sampling temperature 0-2" },
    max_tokens: { type: "number", description: "Max tokens to generate" },
    max_completion_tokens: {
      type: "number",
      description: "Max completion tokens",
    },
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
          enum: ["text", "json_object", "json_schema"],
        },
        json_schema: { type: "object" },
      },
    },
  },
};

export const embeddingsSchema: PayloadSchema = {
  method: "POST",
  path: "/embeddings",
  contentType: "application/json",
  fields: {
    input: {
      type: "string",
      required: true,
      description:
        "Input text to embed (string, string[], number[], or number[][])",
    },
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. text-embedding-3-small)",
    },
    encoding_format: {
      type: "string",
      description: "Encoding format for embeddings",
      enum: ["float", "base64"],
    },
    dimensions: {
      type: "number",
      description: "Number of dimensions for the output embeddings",
    },
    user: {
      type: "string",
      description: "Unique identifier for the end-user",
    },
  },
};

export const imageEditsSchema: PayloadSchema = {
  method: "POST",
  path: "/images/edits",
  contentType: "multipart/form-data",
  fields: {
    image: {
      type: "object",
      required: true,
      description: "Source image(s) to edit (Blob or Blob[])",
    },
    prompt: {
      type: "string",
      required: true,
      description: "Text description of the desired edit",
    },
    mask: {
      type: "object",
      description: "Mask image indicating edit regions (Blob)",
    },
    model: {
      type: "string",
      description: "Model ID (e.g. gpt-image-1)",
    },
    n: { type: "number", description: "Number of images to generate (1-10)" },
    size: {
      type: "string",
      description: "Output dimensions",
      enum: [
        "256x256",
        "512x512",
        "1024x1024",
        "1536x1024",
        "1024x1536",
        "auto",
      ],
    },
    quality: {
      type: "string",
      description: "Image quality (GPT models only)",
      enum: ["standard", "low", "medium", "high", "auto"],
    },
    output_format: {
      type: "string",
      description: "Output image format (GPT models only)",
      enum: ["png", "jpeg", "webp"],
    },
    response_format: {
      type: "string",
      description: "Response format (DALL-E 2 only)",
      enum: ["url", "b64_json"],
    },
    background: {
      type: "string",
      description: "Background transparency (GPT models only)",
      enum: ["transparent", "opaque", "auto"],
    },
    input_fidelity: {
      type: "string",
      description: "Input style fidelity (GPT models only)",
      enum: ["high", "low"],
    },
    output_compression: {
      type: "number",
      description: "Compression level 0-100 (GPT models only)",
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
  },
};

export const imageGenerationsSchema: PayloadSchema = {
  method: "POST",
  path: "/images/generations",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text description of the desired image(s)",
    },
    model: {
      type: "string",
      description: "Model ID (e.g. gpt-image-1, dall-e-3)",
    },
    n: {
      type: "number",
      description: "Number of images to generate (1-10)",
    },
    size: {
      type: "string",
      description: "Image dimensions",
      enum: [
        "auto",
        "1024x1024",
        "1536x1024",
        "1024x1536",
        "256x256",
        "512x512",
        "1792x1024",
        "1024x1792",
      ],
    },
    quality: {
      type: "string",
      description: "Image quality level",
      enum: ["auto", "low", "medium", "high", "standard", "hd"],
    },
    response_format: {
      type: "string",
      description: "Response format (dall-e models only)",
      enum: ["url", "b64_json"],
    },
    style: {
      type: "string",
      description: "Image style (dall-e-3 only)",
      enum: ["vivid", "natural"],
    },
    background: {
      type: "string",
      description: "Background type (GPT image models only)",
      enum: ["transparent", "opaque", "auto"],
    },
    moderation: {
      type: "string",
      description: "Moderation level (GPT image models only)",
      enum: ["low", "auto"],
    },
    output_format: {
      type: "string",
      description: "Output image format (GPT image models only)",
      enum: ["png", "jpeg", "webp"],
    },
    output_compression: {
      type: "number",
      description: "Compression level 0-100 (GPT image models only)",
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
  },
};

export const audioSpeechSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/speech",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. tts-1, tts-1-hd, gpt-4o-mini-tts)",
    },
    input: {
      type: "string",
      required: true,
      description: "The text to generate audio for (max 4096 characters)",
    },
    voice: {
      type: "string",
      required: true,
      description: "The voice to use for generation",
      enum: [
        "alloy",
        "ash",
        "coral",
        "echo",
        "fable",
        "onyx",
        "nova",
        "sage",
        "shimmer",
      ],
    },
    response_format: {
      type: "string",
      description: "The audio output format",
      enum: ["mp3", "opus", "aac", "flac", "wav", "pcm"],
    },
    speed: {
      type: "number",
      description: "The speed of the generated audio (0.25 to 4.0)",
    },
    instructions: {
      type: "string",
      description:
        "Instructions for the model to control audio generation (gpt-4o-mini-tts only)",
    },
  },
};

export const audioTranscriptionsSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/transcriptions",
  contentType: "multipart/form-data",
  fields: {
    file: { type: "object", required: true, description: "Audio file (Blob)" },
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. whisper-1)",
    },
    response_format: { type: "string", description: "Output format" },
    language: { type: "string", description: "ISO 639-1 language code" },
    prompt: { type: "string", description: "Optional prompt to guide model" },
    temperature: { type: "number", description: "Sampling temperature 0-1" },
  },
};

export const responsesSchema: PayloadSchema = {
  method: "POST",
  path: "/responses",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. gpt-4o, o3-mini)",
    },
    input: {
      type: "string",
      required: true,
      description:
        "Text string or array of input items (messages, function outputs)",
    },
    instructions: {
      type: "string",
      description: "System/developer instructions for the model",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    max_output_tokens: {
      type: "number",
      description: "Maximum number of output tokens",
    },
    top_p: {
      type: "number",
      description: "Nucleus sampling parameter 0-1",
    },
    tools: {
      type: "array",
      description:
        "Tools available to the model (function, web_search_preview, file_search, code_interpreter)",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            required: true,
            enum: [
              "function",
              "web_search_preview",
              "web_search_preview_2025_03_11",
              "file_search",
              "code_interpreter",
            ],
          },
        },
      },
    },
    tool_choice: {
      type: "string",
      description:
        "Tool choice strategy: auto, none, required, or specific tool",
    },
    previous_response_id: {
      type: "string",
      description: "ID of a previous response for multi-turn conversations",
    },
    store: {
      type: "boolean",
      description: "Whether to store the response for later retrieval",
    },
    metadata: {
      type: "object",
      description: "Key-value metadata pairs",
    },
    stream: {
      type: "boolean",
      description: "Whether to stream the response",
    },
    text: {
      type: "object",
      description: "Text generation configuration for structured output",
      properties: {
        format: {
          type: "object",
          properties: {
            type: {
              type: "string",
              required: true,
              enum: ["text", "json_object", "json_schema"],
            },
          },
        },
        verbosity: {
          type: "string",
          description:
            "Constrains output verbosity (low=concise, high=verbose)",
          enum: ["low", "medium", "high"],
        },
      },
    },
    truncation: {
      type: "string",
      description: "Truncation strategy for context window",
      enum: ["auto", "disabled"],
    },
    reasoning: {
      type: "object",
      description: "Reasoning configuration for o-series and reasoning models",
      properties: {
        effort: {
          type: "string",
          enum: ["none", "minimal", "low", "medium", "high", "xhigh"],
        },
        summary: {
          type: "string",
          enum: ["auto", "concise", "detailed"],
        },
      },
    },
    user: {
      type: "string",
      description: "End-user identifier for abuse monitoring",
    },
    include: {
      type: "array",
      description: "Additional data to include in the response",
      items: { type: "string" },
    },
    parallel_tool_calls: {
      type: "boolean",
      description: "Whether to enable parallel tool calls",
    },
    conversation: {
      type: "string",
      description:
        "Conversation ID or object associating this response with a conversation",
    },
    background: {
      type: "boolean",
      description: "Whether to run the model response in the background",
    },
    service_tier: {
      type: "string",
      description: "Processing tier for the request",
      enum: ["auto", "default", "flex", "scale", "priority"],
    },
    prompt: {
      type: "object",
      description: "Reference to a prompt template with variable substitution",
      properties: {
        id: {
          type: "string",
          required: true,
          description: "Unique identifier of the prompt template",
        },
        version: {
          type: "string",
          description: "Version of the prompt template",
        },
        variables: {
          type: "object",
          description: "Map of variable substitutions",
        },
      },
    },
    safety_identifier: {
      type: "string",
      description:
        "Stable identifier for detecting policy-violating users (max 64 chars)",
    },
    prompt_cache_key: {
      type: "string",
      description: "Stable identifier for caching similar requests",
    },
    prompt_cache_retention: {
      type: "string",
      description: "Retention policy for prompt cache",
      enum: ["in-memory", "24h"],
    },
    max_tool_calls: {
      type: "number",
      description:
        "Maximum number of total calls to built-in tools in a response",
    },
    context_management: {
      type: "array",
      description: "Context management configuration",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            required: true,
            description: "Context management type",
            enum: ["compaction"],
          },
          compact_threshold: {
            type: "number",
            description: "Token threshold at which compaction is triggered",
          },
        },
      },
    },
  },
};

export const responsesDeleteSchema: PayloadSchema = {
  method: "DELETE",
  path: "/responses/{id}",
  contentType: "application/json",
  fields: {
    id: {
      type: "string",
      required: true,
      description: "The ID of the response to delete",
    },
  },
};

export const modelsDeleteSchema: PayloadSchema = {
  method: "DELETE",
  path: "/models/{model}",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "The ID of the model to delete (must be a fine-tuned model)",
    },
  },
};

export const moderationsSchema: PayloadSchema = {
  method: "POST",
  path: "/moderations",
  contentType: "application/json",
  fields: {
    input: {
      type: "string",
      required: true,
      description:
        "Input text or array of text/image objects to classify for moderation",
    },
    model: {
      type: "string",
      description:
        "Moderation model ID (e.g. omni-moderation-latest, text-moderation-latest)",
export const batchesCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/batches",
  contentType: "application/json",
  fields: {
    input_file_id: {
      type: "string",
      required: true,
      description: "The ID of an uploaded JSONL file containing batch requests",
    },
    endpoint: {
      type: "string",
      required: true,
      description: "The API endpoint for all requests in the batch",
      enum: [
        "/v1/chat/completions",
        "/v1/embeddings",
        "/v1/completions",
        "/v1/responses",
      ],
    },
    completion_window: {
      type: "string",
      required: true,
      description: "Time frame within which the batch should be processed",
      enum: ["24h"],
    },
    metadata: {
      type: "object",
      description:
        "Key-value pairs for storing additional information (max 16 pairs)",
    },
  },
};

export const batchesCancelSchema: PayloadSchema = {
  method: "POST",
  path: "/batches/{batch_id}/cancel",
  contentType: "application/json",
  fields: {
    batch_id: {
      type: "string",
      required: true,
      description: "The ID of the batch to cancel",
    },
  },
};

export const fineTuningJobsCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/fine_tuning/jobs",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description:
        "Model to fine-tune (e.g. gpt-4o-mini-2024-07-18, gpt-3.5-turbo)",
    },
    training_file: {
      type: "string",
      required: true,
      description: "File ID of the uploaded training data",
    },
    hyperparameters: {
      type: "object",
      description: "Hyperparameters (deprecated, use method instead)",
      properties: {
        batch_size: {
          type: "string",
          description: '"auto" or integer batch size',
        },
        learning_rate_multiplier: {
          type: "string",
          description: '"auto" or number learning rate multiplier',
        },
        n_epochs: {
          type: "string",
          description: '"auto" or integer number of epochs',
        },
      },
    },
    integrations: {
      type: "array",
      description: "Integrations (e.g. WandB)",
      items: {
        type: "object",
        properties: {
          type: { type: "string", required: true, enum: ["wandb"] },
          wandb: {
            type: "object",
            required: true,
            properties: {
              project: { type: "string", required: true },
              entity: { type: "string" },
              name: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    metadata: {
      type: "object",
      description: "Up to 16 key-value pairs of metadata",
    },
    method: {
      type: "object",
      description: "Fine-tuning method configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["supervised", "dpo", "reinforcement"],
        },
        supervised: { type: "object" },
        dpo: { type: "object" },
        reinforcement: { type: "object" },
      },
    },
    seed: {
      type: "number",
      description: "Seed for reproducibility",
    },
    suffix: {
      type: "string",
      description: "Up to 64 chars appended to the fine-tuned model name",
    },
    validation_file: {
      type: "string",
      description: "File ID of validation data",
    },
  },
};

export const checkpointPermissionsCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/fine_tuning/checkpoints/{checkpoint}/permissions",
  contentType: "application/json",
  fields: {
    project_ids: {
      type: "array",
      required: true,
      description: "Project IDs to grant access to",
      items: { type: "string" },
    },
  },
};

export const filesUploadSchema: PayloadSchema = {
  method: "POST",
  path: "/files",
  contentType: "multipart/form-data",
  fields: {
    file: {
      type: "object",
      required: true,
      description: "The file object to upload (Blob)",
    },
    purpose: {
      type: "string",
      required: true,
      description: "Intended purpose of the uploaded file",
      enum: [
        "assistants",
        "batch",
        "fine-tune",
        "vision",
        "user_data",
        "evals",
      ],
    },
    expires_after: {
      type: "object",
      description: "Expiration policy for the file",
      properties: {
        anchor: {
          type: "string",
          required: true,
          enum: ["created_at"],
        },
        seconds: {
          type: "number",
          required: true,
          description: "Seconds after anchor time before expiry (3600-2592000)",
        },
      },
    },
  },
};

export const filesDeleteSchema: PayloadSchema = {
  method: "DELETE",
  path: "/files/{file_id}",
  contentType: "application/json",
  fields: {
    file_id: {
      type: "string",
      required: true,
      description: "The ID of the file to delete",
    },
  },
};

export const audioTranslationsSchema: PayloadSchema = {
  method: "POST",
  path: "/audio/translations",
  contentType: "multipart/form-data",
  fields: {
    file: { type: "object", required: true, description: "Audio file (Blob)" },
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. whisper-1)",
    },
    response_format: { type: "string", description: "Output format" },
    prompt: {
      type: "string",
      description: "Optional prompt to guide model (in English)",
    },
    temperature: { type: "number", description: "Sampling temperature 0-1" },
  },
};
