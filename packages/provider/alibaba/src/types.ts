// ---------------------------------------------------------------------------
// Alibaba Cloud Model Studio (DashScope) – OpenAI-compatible mode types
// ---------------------------------------------------------------------------

// -- Options ----------------------------------------------------------------

export interface AlibabaOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// -- Chat messages ----------------------------------------------------------

export type AlibabaRole = "system" | "user" | "assistant" | "tool";

export interface AlibabaMessage {
  role: AlibabaRole;
  content: string | null;
  name?: string;
  tool_calls?: AlibabaToolCall[];
  tool_call_id?: string;
}

// -- Tools / function calling -----------------------------------------------

export interface AlibabaFunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface AlibabaTool {
  type: "function";
  function: AlibabaFunctionDefinition;
}

export interface AlibabaToolCallFunction {
  name: string;
  arguments: string;
}

export interface AlibabaToolCall {
  id: string;
  type: "function";
  function: AlibabaToolCallFunction;
}

// -- Chat request -----------------------------------------------------------

export interface AlibabaStreamOptions {
  include_usage?: boolean;
}

export interface AlibabaResponseFormat {
  type: "text" | "json_object";
}

export interface AlibabaChatRequest {
  model: string;
  messages: AlibabaMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  stop?: string | string[];
  stream?: boolean;
  seed?: number;
  presence_penalty?: number;
  tools?: AlibabaTool[];
  tool_choice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
  stream_options?: AlibabaStreamOptions;
  response_format?: AlibabaResponseFormat;
  enable_search?: boolean;
}

// -- Chat response ----------------------------------------------------------

export interface AlibabaChatResponseMessage {
  role: string;
  content: string | null;
  tool_calls?: AlibabaToolCall[];
}

export interface AlibabaChatChoice {
  index: number;
  message: AlibabaChatResponseMessage;
  finish_reason: string | null;
}

export interface AlibabaUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AlibabaChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AlibabaChatChoice[];
  usage?: AlibabaUsage;
}

// -- Streaming response -----------------------------------------------------

export interface AlibabaChatStreamDelta {
  role?: string;
  content?: string | null;
  tool_calls?: AlibabaToolCall[];
}

export interface AlibabaChatStreamChoice {
  index: number;
  delta: AlibabaChatStreamDelta;
  finish_reason: string | null;
}

export interface AlibabaChatStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AlibabaChatStreamChoice[];
  usage?: AlibabaUsage;
}

// -- Models -----------------------------------------------------------------

export interface AlibabaModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface AlibabaModelListResponse {
  object: string;
  data: AlibabaModel[];
}

// -- Error ------------------------------------------------------------------

export class AlibabaError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "AlibabaError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Payload validation types -----------------------------------------------

export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface PayloadSchema {
  method: "POST" | "DELETE";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// -- Method interfaces ------------------------------------------------------

export interface AlibabaChatCompletionsMethod {
  (req: AlibabaChatRequest, signal?: AbortSignal): Promise<AlibabaChatResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface AlibabaChatCompletionsStreamMethod {
  (
    req: AlibabaChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<AlibabaChatStreamChunk>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

// -- Namespace interfaces ---------------------------------------------------

export interface AlibabaPostV1ChatNamespace {
  completions: AlibabaChatCompletionsMethod;
}

export interface AlibabaPostV1Namespace {
  chat: AlibabaPostV1ChatNamespace;
}

export interface AlibabaPostStreamV1ChatNamespace {
  completions: AlibabaChatCompletionsStreamMethod;
}

export interface AlibabaPostStreamV1Namespace {
  chat: AlibabaPostStreamV1ChatNamespace;
}

export interface AlibabaPostNamespace {
  v1: AlibabaPostV1Namespace;
  stream: { v1: AlibabaPostStreamV1Namespace };
}

export interface AlibabaGetV1Namespace {
  models: (signal?: AbortSignal) => Promise<AlibabaModelListResponse>;
}

export interface AlibabaGetNamespace {
  v1: AlibabaGetV1Namespace;
}

export interface AlibabaProvider {
  post: AlibabaPostNamespace;
  get: AlibabaGetNamespace;
}
