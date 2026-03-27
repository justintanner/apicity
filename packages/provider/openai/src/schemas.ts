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
