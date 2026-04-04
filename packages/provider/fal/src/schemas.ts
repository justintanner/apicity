import type { PayloadSchema } from "./types";

export const pricingEstimateSchema: PayloadSchema = {
  method: "POST",
  path: "/models/pricing/estimate",
  contentType: "application/json",
  fields: {
    estimate_type: {
      type: "string",
      required: true,
      enum: ["historical_api_price", "unit_price"],
      description: "Type of cost estimate",
    },
    endpoints: {
      type: "object",
      required: true,
      description:
        "Map of endpoint IDs to quantity objects ({ call_quantity } or { unit_quantity })",
    },
  },
};

export const queueSubmitSchema: PayloadSchema = {
  method: "POST",
  path: "/{endpoint_id}",
  contentType: "application/json",
  fields: {
    endpoint_id: {
      type: "string",
      required: true,
      description: "Model endpoint ID (e.g. fal-ai/flux/schnell)",
    },
    input: {
      type: "object",
      required: true,
      description: "Model-specific input payload",
    },
    webhook: {
      type: "string",
      description: "Webhook URL for async notification",
    },
    priority: {
      type: "string",
      enum: ["normal", "low"],
      description: "Queue priority (defaults to normal)",
    },
    timeout: {
      type: "number",
      description: "Server-side request timeout in seconds",
    },
    no_retry: {
      type: "boolean",
      description: "Disable automatic retries",
    },
  },
};

export const logsHistorySchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/logs/history",
  contentType: "application/json",
  fields: {
    limit: {
      type: "number",
      description: "Number of results per page (1-1000)",
    },
    cursor: {
      type: "string",
      description: "Pagination cursor from previous response",
    },
    start: {
      type: "string",
      description: "Start date in ISO8601 (defaults to 24h ago)",
    },
    end: {
      type: "string",
      description: "End date in ISO8601, exclusive (defaults to now)",
    },
    app_id: {
      type: "array",
      items: { type: "string" },
      description: "Filter by app IDs",
    },
    revision: {
      type: "string",
      description: "Filter by revision",
    },
    run_source: {
      type: "string",
      enum: ["grpc-run", "grpc-register", "gateway", "cron"],
      description: "Filter by run source",
    },
    search: {
      type: "string",
      description: "Free-text search",
    },
    level: {
      type: "string",
      description: "Minimum log level",
    },
    job_id: {
      type: "string",
      description: "Filter by job ID",
    },
    request_id: {
      type: "string",
      description: "Filter by request ID",
    },
  },
};

export const logsStreamSchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/logs/stream",
  contentType: "application/json",
  fields: {
    start: {
      type: "string",
      description: "Start date in ISO8601 (defaults to 24h ago)",
    },
    end: {
      type: "string",
      description: "End date in ISO8601, exclusive (defaults to now)",
    },
    app_id: {
      type: "array",
      items: { type: "string" },
      description: "Filter by app IDs",
    },
    revision: {
      type: "string",
      description: "Filter by revision",
    },
    run_source: {
      type: "string",
      enum: ["grpc-run", "grpc-register", "gateway", "cron"],
      description: "Filter by run source",
    },
    search: {
      type: "string",
      description: "Free-text search",
    },
    level: {
      type: "string",
      description: "Minimum log level",
    },
    job_id: {
      type: "string",
      description: "Filter by job ID",
    },
    request_id: {
      type: "string",
      description: "Filter by request ID",
    },
  },
};

export const filesUploadUrlSchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/files/file/url/{file}",
  contentType: "application/json",
  fields: {
    file: {
      type: "string",
      required: true,
      description: "Target file path on fal storage",
    },
    url: {
      type: "string",
      required: true,
      description: "Publicly accessible URL to download the file from",
    },
  },
};

export const filesUploadLocalSchema: PayloadSchema = {
  method: "POST",
  path: "/serverless/files/file/local/{target_path}",
  contentType: "multipart/form-data",
  fields: {
    target_path: {
      type: "string",
      required: true,
      description: "Target file path on fal storage",
    },
    file: {
      type: "object",
      required: true,
      description: "Binary file content (Blob)",
    },
    filename: {
      type: "string",
      description: "Optional filename for the upload",
    },
    unzip: {
      type: "boolean",
      description: "If true and file is a ZIP, extract after upload",
    },
  },
};

export const computeInstanceCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/compute/instances",
  contentType: "application/json",
  fields: {
    instance_type: {
      type: "string",
      required: true,
      enum: ["gpu_8x_h100_sxm5", "gpu_1x_h100_sxm5"],
      description: "GPU instance type",
    },
    ssh_key: {
      type: "string",
      required: true,
      description: "SSH public key for instance access",
    },
    sector: {
      type: "string",
      enum: ["sector_1", "sector_2", "sector_3"],
      description: "Sector assignment (only valid with gpu_8x_h100_sxm5)",
    },
  },
};

export const appsFlushQueueSchema: PayloadSchema = {
  method: "DELETE",
  path: "/serverless/apps/{owner}/{name}/queue",
  contentType: "application/json",
  fields: {
    owner: {
      type: "string",
      required: true,
      description: "Username of the app owner",
    },
    name: {
      type: "string",
      required: true,
      description: "Application name",
    },
    idempotency_key: {
      type: "string",
      description: "Optional idempotency key for safe retries",
    },
  },
};

export const deletePayloadsSchema: PayloadSchema = {
  method: "DELETE",
  path: "/models/requests/{request_id}/payloads",
  contentType: "application/json",
  fields: {
    request_id: {
      type: "string",
      required: true,
      description: "Request ID whose payloads to delete",
    },
    idempotency_key: {
      type: "string",
      description: "Optional idempotency key",
    },
  },
};

export const workflowCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/workflows",
  contentType: "application/json",
  fields: {
    name: {
      type: "string",
      required: true,
      description: "Unique workflow name (URL-safe)",
    },
    title: {
      type: "string",
      description: "Human-readable workflow title",
    },
    description: {
      type: "string",
      description: "Workflow description",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Tags for categorization",
    },
    is_public: {
      type: "boolean",
      description: "Whether the workflow is publicly visible",
    },
    contents: {
      type: "object",
      required: true,
      description: "Workflow definition contents (nodes and edges)",
    },
  },
};
