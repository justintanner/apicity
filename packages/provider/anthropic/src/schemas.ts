import type { PayloadSchema } from "./types";

export const messagesSchema: PayloadSchema = {
  method: "POST",
  path: "/messages",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID (e.g. claude-sonnet-4-6)",
    },
    max_tokens: {
      type: "number",
      required: true,
      description: "Maximum output tokens",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of messages",
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
    system: { type: "string", description: "System prompt" },
    temperature: { type: "number", description: "Sampling temperature 0-1" },
    top_p: { type: "number", description: "Nucleus sampling" },
    top_k: { type: "number", description: "Top-K sampling" },
    stop_sequences: {
      type: "array",
      description: "Custom stop sequences",
      items: { type: "string" },
    },
    stream: { type: "boolean", description: "Enable SSE streaming" },
    tools: {
      type: "array",
      description: "Tool definitions",
      items: { type: "object" },
    },
    tool_choice: {
      type: "object",
      description: "Tool choice configuration",
      properties: {
        type: {
          type: "string",
          enum: ["auto", "any", "tool", "none"],
        },
        name: { type: "string" },
      },
    },
    thinking: {
      type: "object",
      description: "Extended thinking configuration",
      properties: {
        type: {
          type: "string",
          enum: ["enabled", "disabled", "adaptive"],
        },
        budget_tokens: { type: "number" },
      },
    },
    metadata: {
      type: "object",
      description: "Request metadata",
      properties: {
        user_id: { type: "string" },
      },
    },
    service_tier: {
      type: "string",
      enum: ["auto", "standard_only"],
    },
  },
};

export const countTokensSchema: PayloadSchema = {
  method: "POST",
  path: "/messages/count_tokens",
  contentType: "application/json",
  fields: {
    model: {
      type: "string",
      required: true,
      description: "Model ID",
    },
    messages: {
      type: "array",
      required: true,
      description: "Array of messages",
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
    system: { type: "string", description: "System prompt" },
    tools: {
      type: "array",
      description: "Tool definitions",
      items: { type: "object" },
    },
  },
};

export const batchesCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/messages/batches",
  contentType: "application/json",
  fields: {
    requests: {
      type: "array",
      required: true,
      description: "Array of batch requests (max 100,000)",
      items: {
        type: "object",
        properties: {
          custom_id: { type: "string", required: true },
          params: { type: "object", required: true },
        },
      },
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
      description: "File to upload",
    },
  },
};

export const inviteCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/organizations/invites",
  contentType: "application/json",
  fields: {
    email: {
      type: "string",
      required: true,
      description: "Email address to invite",
    },
    role: {
      type: "string",
      required: true,
      description: "Role for the invited user",
      enum: ["user", "developer", "billing", "claude_code_user", "managed"],
    },
  },
};

export const workspaceCreateSchema: PayloadSchema = {
  method: "POST",
  path: "/organizations/workspaces",
  contentType: "application/json",
  fields: {
    name: {
      type: "string",
      required: true,
      description: "Workspace name",
    },
    data_residency: {
      type: "object",
      description: "Data residency configuration",
    },
  },
};

export const workspaceMemberAddSchema: PayloadSchema = {
  method: "POST",
  path: "/organizations/workspaces/{workspace_id}/members",
  contentType: "application/json",
  fields: {
    user_id: {
      type: "string",
      required: true,
      description: "User ID to add",
    },
    workspace_role: {
      type: "string",
      required: true,
      description: "Role in workspace",
      enum: ["workspace_user", "workspace_developer", "workspace_admin"],
    },
  },
};
