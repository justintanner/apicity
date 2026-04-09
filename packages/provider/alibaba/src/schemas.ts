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
