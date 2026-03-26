import type { PayloadSchema } from "./types";

export const chatCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/chat/completions",
  contentType: "application/json",
  fields: {
    model: { type: "string", description: "Model ID (e.g. grok-3)" },
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
      description: "Text prompt for image generation",
    },
    model: { type: "string", description: "Model ID" },
    n: { type: "number", description: "Number of images to generate" },
    response_format: {
      type: "string",
      enum: ["url", "b64_json"],
      description: "Response format",
    },
    aspect_ratio: { type: "string", description: "Aspect ratio" },
    resolution: {
      type: "string",
      enum: ["1k", "2k"],
      description: "Output resolution",
    },
  },
};

export const imageEditsSchema: PayloadSchema = {
  method: "POST",
  path: "/images/edits",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Edit instruction",
    },
    model: { type: "string", description: "Model ID" },
    image: {
      type: "object",
      description: "Single image reference",
      properties: {
        url: { type: "string", required: true },
        type: { type: "string", enum: ["image_url"] },
      },
    },
    images: {
      type: "array",
      description: "Multiple image references",
      items: {
        type: "object",
        properties: {
          url: { type: "string", required: true },
          type: { type: "string", enum: ["image_url"] },
        },
      },
    },
    n: { type: "number", description: "Number of images to generate" },
    response_format: {
      type: "string",
      enum: ["url", "b64_json"],
      description: "Response format",
    },
    aspect_ratio: { type: "string", description: "Aspect ratio" },
  },
};

export const videoGenerationsSchema: PayloadSchema = {
  method: "POST",
  path: "/videos/generations",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for video generation",
    },
    model: { type: "string", description: "Model ID" },
    duration: { type: "number", description: "Video duration in seconds" },
    aspect_ratio: {
      type: "string",
      enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
      description: "Aspect ratio",
    },
    resolution: {
      type: "string",
      enum: ["480p", "720p"],
      description: "Output resolution",
    },
    image: {
      type: "object",
      description: "Source image reference",
      properties: { url: { type: "string", required: true } },
    },
    video: {
      type: "object",
      description: "Source video reference",
      properties: { url: { type: "string", required: true } },
    },
    reference_images: {
      type: "array",
      description: "Reference images",
      items: {
        type: "object",
        properties: { url: { type: "string", required: true } },
      },
    },
  },
};

export const videoEditsSchema: PayloadSchema = {
  method: "POST",
  path: "/videos/edits",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for video editing",
    },
    model: { type: "string", description: "Model ID" },
    video: {
      type: "object",
      required: true,
      description: "Source video to edit",
      properties: { url: { type: "string", required: true } },
    },
    output: {
      type: "object",
      description: "Upload destination",
      properties: { upload_url: { type: "string", required: true } },
    },
    user: { type: "string", description: "End-user identifier" },
  },
};

export const batchCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/batches",
  contentType: "application/json",
  fields: {
    name: {
      type: "string",
      required: true,
      description: "The name of the batch to create",
    },
  },
};

export const batchAddRequestsSchema: PayloadSchema = {
  method: "POST",
  path: "/batches/{batch_id}/requests",
  contentType: "application/json",
  fields: {
    batch_requests: {
      type: "array",
      required: true,
      description: "List of batch requests to add",
      items: {
        type: "object",
        properties: {
          batch_request_id: {
            type: "string",
            description: "User-provided identifier, unique within the batch",
          },
          batch_request: {
            type: "object",
            required: true,
            properties: {
              chat_get_completion: {
                type: "object",
                required: true,
                description:
                  "Chat request body for /v1/chat/completions endpoint",
              },
            },
          },
        },
      },
    },
  },
};

export const videoExtensionsSchema: PayloadSchema = {
  method: "POST",
  path: "/videos/extensions",
  contentType: "application/json",
  fields: {
    prompt: {
      type: "string",
      required: true,
      description: "Text prompt for video extension",
    },
    model: { type: "string", description: "Model ID" },
    duration: { type: "number", description: "Extension duration in seconds" },
    video: {
      type: "object",
      required: true,
      description: "Source video to extend",
      properties: { url: { type: "string", required: true } },
    },
  },
};
