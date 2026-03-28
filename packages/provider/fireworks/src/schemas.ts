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
