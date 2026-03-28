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
    deferred: {
      type: "boolean",
      description:
        "If true, returns a request_id immediately; poll GET /v1/chat/deferred-completion/{request_id} for the result",
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

export const collectionCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/collections",
  contentType: "application/json",
  fields: {
    collection_name: {
      type: "string",
      required: true,
      description: "Name of the collection",
    },
    collection_description: {
      type: "string",
      description: "Description of the collection",
    },
    team_id: { type: "string", description: "Team ID" },
    index_configuration: {
      type: "object",
      description: "Index configuration",
      properties: {
        model_name: { type: "string", description: "Embedding model name" },
      },
    },
    chunk_configuration: {
      type: "object",
      description: "Chunk configuration for document processing",
    },
    metric_space: {
      type: "string",
      enum: [
        "HNSW_METRIC_UNKNOWN",
        "HNSW_METRIC_COSINE",
        "HNSW_METRIC_EUCLIDEAN",
        "HNSW_METRIC_INNER_PRODUCT",
      ],
      description: "Distance metric for vector search",
    },
    field_definitions: {
      type: "array",
      description: "Custom field definitions for documents",
      items: {
        type: "object",
        properties: {
          key: { type: "string", required: true },
          required: { type: "boolean" },
          unique: { type: "boolean" },
          inject_into_chunk: { type: "boolean" },
          description: { type: "string" },
        },
      },
    },
  },
};

export const collectionUpdateSchema: PayloadSchema = {
  method: "PUT",
  path: "/collections/{collection_id}",
  contentType: "application/json",
  fields: {
    team_id: { type: "string", description: "Team ID" },
    collection_name: { type: "string", description: "New collection name" },
    collection_description: {
      type: "string",
      description: "New collection description",
    },
    chunk_configuration: {
      type: "object",
      description: "Updated chunk configuration",
    },
    field_definition_updates: {
      type: "array",
      description: "Field definition changes",
      items: {
        type: "object",
        properties: {
          field_definition: {
            type: "object",
            required: true,
            properties: {
              key: { type: "string", required: true },
              required: { type: "boolean" },
              unique: { type: "boolean" },
              inject_into_chunk: { type: "boolean" },
              description: { type: "string" },
            },
          },
          operation: {
            type: "string",
            required: true,
            enum: ["FIELD_DEFINITION_ADD", "FIELD_DEFINITION_DELETE"],
          },
        },
      },
    },
  },
};

export const documentAddSchema: PayloadSchema = {
  method: "POST",
  path: "/collections/{collection_id}/documents/{file_id}",
  contentType: "application/json",
  fields: {
    team_id: { type: "string", description: "Team ID" },
    fields: {
      type: "object",
      description: "Metadata fields matching collection field definitions",
    },
  },
};

export const documentSearchSchema: PayloadSchema = {
  method: "POST",
  path: "/documents/search",
  contentType: "application/json",
  fields: {
    query: {
      type: "string",
      required: true,
      description: "Search query text",
    },
    source: {
      type: "object",
      required: true,
      description: "Source collections to search",
      properties: {
        collection_ids: {
          type: "array",
          required: true,
          description: "Collection IDs to search within",
          items: { type: "string" },
        },
        rag_pipeline: {
          type: "string",
          enum: ["chroma_db", "es"],
          description: "RAG pipeline backend",
        },
      },
    },
    filter: { type: "string", description: "AIP-160 filter expression" },
    instructions: {
      type: "string",
      description: "Custom search instructions",
    },
    limit: { type: "number", description: "Max number of results" },
    ranking_metric: {
      type: "string",
      enum: [
        "RANKING_METRIC_UNKNOWN",
        "RANKING_METRIC_L2_DISTANCE",
        "RANKING_METRIC_COSINE_SIMILARITY",
      ],
      description: "Ranking metric for results",
    },
    group_by: {
      type: "object",
      description: "Grouping configuration",
      properties: {
        keys: {
          type: "array",
          required: true,
          items: { type: "string" },
        },
        aggregate: { type: "object" },
      },
    },
    retrieval_mode: {
      type: "object",
      description: "Retrieval mode configuration",
      properties: {
        type: {
          type: "string",
          required: true,
          enum: ["hybrid", "keyword", "semantic"],
        },
      },
    },
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
      description: "Model ID (e.g. grok-4-fast)",
    },
    input: {
      type: "string",
      required: true,
      description: "Input text or array of input items",
    },
    instructions: {
      type: "string",
      description: "System instructions",
    },
    previous_response_id: {
      type: "string",
      description: "ID of previous response for multi-turn",
    },
    max_output_tokens: {
      type: "number",
      description: "Maximum output tokens (includes reasoning tokens)",
    },
    temperature: {
      type: "number",
      description: "Sampling temperature (0-2)",
    },
    top_p: {
      type: "number",
      description: "Nucleus sampling threshold",
    },
    tools: {
      type: "array",
      description: "Tools available to the model (max 128)",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            required: true,
            enum: [
              "function",
              "web_search",
              "web_search_preview",
              "file_search",
            ],
          },
        },
      },
    },
    tool_choice: {
      type: "string",
      description: "Tool choice strategy",
    },
    store: {
      type: "boolean",
      description: "Whether to persist the response (30 days)",
    },
    stream: {
      type: "boolean",
      description: "Enable SSE streaming",
    },
    search_parameters: {
      type: "object",
      description: "Live web/X search configuration",
      properties: {
        mode: {
          type: "string",
          enum: ["off", "on", "auto"],
          description: "Search mode",
        },
        max_search_results: {
          type: "number",
          description: "Maximum search results",
        },
        return_citations: {
          type: "boolean",
          description: "Include citations in response",
        },
      },
    },
    text: {
      type: "object",
      description: "Output text format configuration",
    },
    reasoning: {
      type: "object",
      description: "Reasoning configuration",
      properties: {
        effort: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
      },
    },
    prompt_cache_key: {
      type: "string",
      description: "Routing key for conversation caching",
    },
    parallel_tool_calls: {
      type: "boolean",
      description: "Allow parallel tool calls",
    },
    user: { type: "string", description: "End user identifier" },
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
export const realtimeClientSecretsSchema: PayloadSchema = {
  method: "POST",
  path: "/realtime/client_secrets",
  contentType: "application/json",
  fields: {
    expires_after: {
      type: "object",
      description: "Expiration configuration for the ephemeral token",
      properties: {
        seconds: {
          type: "number",
          required: true,
          description: "Seconds until expiration (1-3600, default 600)",
        },
      },
    },
    session: {
      type: "object",
      description: "Optional initial session configuration to bind",
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
