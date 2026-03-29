import type { PayloadSchema } from "./types";

export const chatCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/chat/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (deepseek-chat or deepseek-reasoner)",
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
          content: { type: "string" },
        },
      },
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    top_p: {
      type: "number",
      description: "Nucleus sampling 0-1",
    },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty -2 to 2",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty -2 to 2",
    },
    max_tokens: {
      type: "number",
      description: "Max tokens to generate",
    },
    stream: {
      type: "boolean",
      description: "Enable SSE streaming",
    },
    stream_options: {
      type: "object",
      description: "Streaming options",
      properties: {
        include_usage: {
          type: "boolean",
          description: "Include usage in final chunk",
        },
      },
    },
    stop: {
      type: "string",
      description: "Stop sequences (string or array of up to 16)",
    },
    response_format: {
      type: "object",
      description: "Response format configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object"],
        },
      },
    },
    thinking: {
      type: "object",
      description: "Reasoning mode control",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["enabled", "disabled"],
        },
      },
    },
    tools: {
      type: "array",
      description: "Tool definitions for function calling (max 128)",
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
    tool_choice: {
      type: "string",
      description: "Tool choice strategy (none, auto, required)",
    },
    logprobs: {
      type: "boolean",
      description: "Return log probabilities",
    },
    top_logprobs: {
      type: "number",
      description: "Number of top logprobs per position (0-20)",
    },
  },
};

export const fimCompletionsSchema: PayloadSchema = {
  method: "POST",
  path: "/completions",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (deepseek-chat)",
    },
    prompt: {
      type: "string",
      required: true,
      description: "The prefix text to complete from",
    },
    suffix: {
      type: "string",
      description: "Text that follows the completion (end context)",
    },
    max_tokens: {
      type: "number",
      description: "Max tokens to generate (max 4096)",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature 0-2",
    },
    top_p: {
      type: "number",
      description: "Nucleus sampling 0-1",
    },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty -2 to 2",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty -2 to 2",
    },
    echo: {
      type: "boolean",
      description: "Return prompt concatenated with completion",
    },
    logprobs: {
      type: "number",
      description: "Number of top log probabilities (0-20)",
    },
    stop: {
      type: "string",
      description: "Stop sequences (string or array of up to 16)",
    },
    stream: {
      type: "boolean",
      description: "Enable SSE streaming",
    },
    stream_options: {
      type: "object",
      description: "Streaming options",
      properties: {
        include_usage: {
          type: "boolean",
          description: "Include usage in final chunk",
        },
      },
    },
  },
};
