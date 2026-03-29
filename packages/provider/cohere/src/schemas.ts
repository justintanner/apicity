import type { PayloadSchema } from "./types";

// ---------------------------------------------------------------------------
// Chat v2 (POST /v2/chat)
// ---------------------------------------------------------------------------

export const chatV2Schema: PayloadSchema = {
  method: "POST",
  path: "/v2/chat",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model name (e.g. command-a-03-2025)",
    },
    messages: {
      type: "array",
      required: true,
      description: "Conversation history",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["system", "user", "assistant", "tool"],
          },
          content: { type: "string", description: "Text content or array" },
        },
      },
    },
    stream: { type: "boolean", description: "Enable SSE streaming" },
    max_tokens: { type: "number", description: "Max output tokens" },
    temperature: { type: "number", description: "Sampling temperature 0-1" },
    seed: { type: "number", description: "Deterministic sampling seed" },
    frequency_penalty: {
      type: "number",
      description: "Frequency penalty 0.0-1.0",
    },
    presence_penalty: {
      type: "number",
      description: "Presence penalty 0.0-1.0",
    },
    k: { type: "number", description: "Top-k sampling 0-500" },
    p: { type: "number", description: "Nucleus sampling 0.01-0.99" },
    stop_sequences: {
      type: "array",
      description: "Up to 5 stop sequences",
      items: { type: "string" },
    },
    logprobs: { type: "boolean", description: "Return logprobs" },
    tools: {
      type: "array",
      description: "Tool definitions",
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
    strict_tools: {
      type: "boolean",
      description: "Force strict schema adherence",
    },
    tool_choice: {
      type: "string",
      enum: ["REQUIRED", "NONE"],
      description: "Tool invocation policy",
    },
    documents: {
      type: "array",
      description: "Context documents for citations",
      items: { type: "object" },
    },
    citation_options: {
      type: "object",
      description: "Citation configuration",
      properties: {
        mode: {
          type: "string",
          enum: ["ENABLED", "DISABLED", "FAST", "ACCURATE", "OFF"],
        },
      },
    },
    response_format: {
      type: "object",
      description: "Response format constraint",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["text", "json_object"],
        },
        json_schema: { type: "object" },
      },
    },
    safety_mode: {
      type: "string",
      enum: ["CONTEXTUAL", "STRICT", "OFF"],
      description: "Safety mode",
    },
    thinking: {
      type: "object",
      description: "Thinking mode configuration",
      properties: {
        enabled: { type: "boolean", required: true },
        budget_tokens: { type: "number" },
      },
    },
    priority: { type: "number", description: "Priority (lower = higher)" },
  },
};

// ---------------------------------------------------------------------------
// Chat v1 (POST /v1/chat) — legacy
// ---------------------------------------------------------------------------

export const chatV1Schema: PayloadSchema = {
  method: "POST",
  path: "/v1/chat",
  contentType: "application/json",
  fields: {
    message: {
      type: "string",
      required: true,
      description: "User message text",
    },
    stream: { type: "boolean", description: "Enable SSE streaming" },
    model: { type: "string", description: "Model ID" },
    preamble: { type: "string", description: "System instructions" },
    chat_history: {
      type: "array",
      description: "Prior conversation messages",
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            required: true,
            enum: ["USER", "CHATBOT", "SYSTEM"],
          },
          message: { type: "string", required: true },
        },
      },
    },
    conversation_id: { type: "string", description: "Persisted conversation" },
    temperature: { type: "number", description: "Sampling temperature" },
    max_tokens: { type: "number", description: "Max output tokens" },
    max_input_tokens: { type: "number", description: "Max input tokens" },
    k: { type: "number", description: "Top-k sampling" },
    p: { type: "number", description: "Nucleus sampling" },
    seed: { type: "number", description: "Deterministic seed" },
    stop_sequences: {
      type: "array",
      description: "Stop sequences",
      items: { type: "string" },
    },
    frequency_penalty: { type: "number", description: "Frequency penalty" },
    presence_penalty: { type: "number", description: "Presence penalty" },
    documents: { type: "array", description: "Documents for RAG" },
    connectors: { type: "array", description: "External connectors" },
    prompt_truncation: {
      type: "string",
      enum: ["OFF", "AUTO", "AUTO_PRESERVE_ORDER"],
    },
    citation_quality: {
      type: "string",
      enum: ["ENABLED", "DISABLED", "FAST", "ACCURATE"],
    },
    tools: { type: "array", description: "Tool definitions" },
    tool_results: { type: "array", description: "Previous tool outputs" },
    force_single_step: { type: "boolean" },
    response_format: { type: "object" },
    safety_mode: {
      type: "string",
      enum: ["CONTEXTUAL", "STRICT", "NONE"],
    },
    raw_prompting: { type: "boolean" },
    search_queries_only: { type: "boolean" },
  },
};

// ---------------------------------------------------------------------------
// Embed v2 (POST /v2/embed)
// ---------------------------------------------------------------------------

export const embedSchema: PayloadSchema = {
  method: "POST",
  path: "/v2/embed",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Embedding model (e.g. embed-v4.0)",
    },
    input_type: {
      type: "string",
      required: true,
      enum: [
        "search_document",
        "search_query",
        "classification",
        "clustering",
        "image",
      ],
      description: "Type of input for optimal embedding",
    },
    texts: {
      type: "array",
      description: "Text strings to embed (max 96)",
      items: { type: "string" },
    },
    images: {
      type: "array",
      description: "Image data URIs (max 1)",
      items: { type: "string" },
    },
    inputs: {
      type: "array",
      description: "Mixed text/image inputs (max 96)",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          image: { type: "string" },
        },
      },
    },
    max_tokens: { type: "number", description: "Truncation threshold" },
    output_dimension: {
      type: "number",
      description: "Output dimension (256, 512, 1024, 1536)",
    },
    embedding_types: {
      type: "array",
      description: "Embedding output formats",
      items: {
        type: "string",
        enum: ["float", "int8", "uint8", "binary", "ubinary", "base64"],
      },
    },
    truncate: {
      type: "string",
      enum: ["NONE", "START", "END"],
      description: "Truncation strategy",
    },
    priority: { type: "number", description: "Priority" },
  },
};

// ---------------------------------------------------------------------------
// Rerank (POST /v2/rerank)
// ---------------------------------------------------------------------------

export const rerankSchema: PayloadSchema = {
  method: "POST",
  path: "/v2/rerank",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Rerank model (e.g. rerank-v3.5)",
    },
    query: {
      type: "string",
      required: true,
      description: "Search query",
    },
    documents: {
      type: "array",
      required: true,
      description: "Documents to rerank (max 1000)",
      items: { type: "string" },
    },
    top_n: { type: "number", description: "Limit returned results" },
    max_tokens_per_doc: {
      type: "number",
      description: "Max tokens per document (default 4096)",
    },
    priority: { type: "number", description: "Priority" },
  },
};

// ---------------------------------------------------------------------------
// Classify (POST /v1/classify)
// ---------------------------------------------------------------------------

export const classifySchema: PayloadSchema = {
  method: "POST",
  path: "/v1/classify",
  contentType: "application/json",
  fields: {
    inputs: {
      type: "array",
      required: true,
      description: "Texts to classify (max 96)",
      items: { type: "string" },
    },
    examples: {
      type: "array",
      description: "Few-shot examples (min 2 per label, max 2500)",
      items: {
        type: "object",
        properties: {
          text: { type: "string", required: true },
          label: { type: "string", required: true },
        },
      },
    },
    model: { type: "string", description: "Model ID" },
    preset: { type: "string", description: "Playground preset ID" },
    truncate: {
      type: "string",
      enum: ["NONE", "START", "END"],
      description: "Truncation strategy",
    },
  },
};

// ---------------------------------------------------------------------------
// Summarize (POST /v1/summarize) — deprecated
// ---------------------------------------------------------------------------

export const summarizeSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/summarize",
  contentType: "application/json",
  fields: {
    text: {
      type: "string",
      required: true,
      description: "Text to summarize (max 100k chars)",
    },
    length: {
      type: "string",
      enum: ["short", "medium", "long"],
      description: "Summary length",
    },
    format: {
      type: "string",
      enum: ["paragraph", "bullets"],
      description: "Summary format",
    },
    model: { type: "string", description: "Model ID" },
    extractiveness: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    temperature: { type: "number", description: "Temperature 0-5" },
    additional_command: {
      type: "string",
      description: "Free-form modifier",
    },
  },
};

// ---------------------------------------------------------------------------
// Tokenize (POST /v1/tokenize)
// ---------------------------------------------------------------------------

export const tokenizeSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/tokenize",
  contentType: "application/json",
  fields: {
    text: {
      type: "string",
      required: true,
      description: "Text to tokenize (1-65536 chars)",
    },
    model: {
      type: "string",
      required: true,
      description: "Tokenizer model",
    },
  },
};

// ---------------------------------------------------------------------------
// Detokenize (POST /v1/detokenize)
// ---------------------------------------------------------------------------

export const detokenizeSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/detokenize",
  contentType: "application/json",
  fields: {
    tokens: {
      type: "array",
      required: true,
      description: "Token IDs to decode",
      items: { type: "number" },
    },
    model: {
      type: "string",
      required: true,
      description: "Tokenizer model",
    },
  },
};

// ---------------------------------------------------------------------------
// Connectors (POST /v1/connectors, PATCH /v1/connectors/{id})
// ---------------------------------------------------------------------------

export const connectorCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/connectors",
  contentType: "application/json",
  fields: {
    name: { type: "string", required: true, description: "Connector name" },
    url: {
      type: "string",
      required: true,
      description: "Document search URL",
    },
    description: { type: "string" },
    excludes: { type: "array", items: { type: "string" } },
    active: { type: "boolean" },
    continue_on_failure: { type: "boolean" },
    oauth: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        client_secret: { type: "string" },
        authorize_url: { type: "string" },
        token_url: { type: "string" },
        scope: { type: "string" },
      },
    },
    service_auth: {
      type: "object",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["bearer", "basic", "noscheme"],
        },
        token: { type: "string", required: true },
      },
    },
  },
};

export const connectorUpdateSchema: PayloadSchema = {
  method: "PATCH",
  path: "/v1/connectors/{id}",
  contentType: "application/json",
  fields: {
    name: { type: "string" },
    url: { type: "string" },
    excludes: { type: "array", items: { type: "string" } },
    active: { type: "boolean" },
    continue_on_failure: { type: "boolean" },
    oauth: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        client_secret: { type: "string" },
        authorize_url: { type: "string" },
        token_url: { type: "string" },
        scope: { type: "string" },
      },
    },
    service_auth: {
      type: "object",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["bearer", "basic", "noscheme"],
        },
        token: { type: "string", required: true },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Embed Jobs (POST /v1/embed-jobs)
// ---------------------------------------------------------------------------

export const embedJobCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/embed-jobs",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Embedding model",
    },
    dataset_id: {
      type: "string",
      required: true,
      description: "Source dataset ID",
    },
    input_type: {
      type: "string",
      required: true,
      enum: [
        "search_document",
        "search_query",
        "classification",
        "clustering",
        "image",
      ],
    },
    name: { type: "string", description: "Job name" },
    embedding_types: {
      type: "array",
      items: {
        type: "string",
        enum: ["float", "int8", "uint8", "binary", "ubinary", "base64"],
      },
    },
    truncate: { type: "string", enum: ["START", "END"] },
  },
};

// ---------------------------------------------------------------------------
// Fine-Tuning (POST/PATCH /v1/finetuning/finetuned-models)
// ---------------------------------------------------------------------------

const fineTunedModelSettingsFields: Record<
  string,
  import("./types").PayloadFieldSchema
> = {
  base_model: {
    type: "object",
    required: true,
    properties: {
      base_type: {
        type: "string",
        enum: [
          "BASE_TYPE_UNSPECIFIED",
          "BASE_TYPE_GENERATIVE",
          "BASE_TYPE_CLASSIFICATION",
          "BASE_TYPE_RERANK",
          "BASE_TYPE_CHAT",
        ],
      },
      name: { type: "string" },
      version: { type: "string" },
      strategy: { type: "string" },
    },
  },
  dataset_id: { type: "string", required: true },
  hyperparameters: {
    type: "object",
    properties: {
      early_stopping_patience: { type: "number" },
      early_stopping_threshold: { type: "number" },
      train_batch_size: { type: "number" },
      train_epochs: { type: "number" },
      learning_rate: { type: "number" },
      lora_alpha: { type: "number" },
      lora_rank: { type: "number" },
      lora_target_modules: { type: "string" },
    },
  },
  wandb: {
    type: "object",
    properties: {
      project: { type: "string" },
      api_key: { type: "string" },
      entity: { type: "string" },
    },
  },
};

export const fineTunedModelCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/finetuning/finetuned-models",
  contentType: "application/json",
  fields: {
    name: {
      type: "string",
      required: true,
      description: "Model display name",
    },
    settings: {
      type: "object",
      required: true,
      description: "Training configuration",
      properties: fineTunedModelSettingsFields,
    },
  },
};

export const fineTunedModelUpdateSchema: PayloadSchema = {
  method: "PATCH",
  path: "/v1/finetuning/finetuned-models/{id}",
  contentType: "application/json",
  fields: {
    name: {
      type: "string",
      required: true,
      description: "Updated model name",
    },
    settings: {
      type: "object",
      required: true,
      description: "Updated training configuration",
      properties: fineTunedModelSettingsFields,
    },
  },
};

// ---------------------------------------------------------------------------
// Dataset create (POST /v1/datasets — multipart)
// ---------------------------------------------------------------------------

export const datasetCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/v1/datasets",
  contentType: "multipart/form-data",
  fields: {
    data: {
      type: "string",
      required: true,
      description: "File to upload (binary)",
    },
    eval_data: { type: "string", description: "Evaluation file (binary)" },
  },
};
