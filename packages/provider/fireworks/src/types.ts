// Fireworks AI provider options
export interface FireworksOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Chat message
export interface FireworksMessage {
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: FireworksToolCall[];
  tool_call_id?: string;
  name?: string;
}

// Tool function definition
export interface FireworksToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Tool definition
export interface FireworksTool {
  type: "function";
  function: FireworksToolFunction;
}

// Tool call in response
export interface FireworksToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Usage info
export interface FireworksUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Chat request
export interface FireworksChatRequest {
  model: string;
  messages: FireworksMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  n?: number;
  stop?: string | string[];
  stream?: boolean;
  tools?: FireworksTool[];
  tool_choice?:
    | "auto"
    | "none"
    | "required"
    | { type: "function"; function: { name: string } };
  response_format?: {
    type: "text" | "json_object" | "json_schema" | "grammar";
    json_schema?: Record<string, unknown>;
    grammar?: Record<string, unknown>;
  };
  frequency_penalty?: number;
  presence_penalty?: number;
  logprobs?: boolean;
  top_logprobs?: number;
  reasoning_effort?: "low" | "medium" | "high" | "none";
  user?: string;
}

// Chat response
export interface FireworksChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: FireworksToolCall[];
  };
  finish_reason: string;
}

export interface FireworksChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: FireworksChatChoice[];
  usage?: FireworksUsage;
}

// Completions request
export interface FireworksCompletionRequest {
  model: string;
  prompt: string | string[] | number[] | number[][];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  n?: number;
  stop?: string | string[];
  stream?: boolean;
  echo?: boolean;
  echo_last?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  logprobs?: boolean | number;
  top_logprobs?: number;
  response_format?: {
    type: "text" | "json_object" | "json_schema" | "grammar";
    json_schema?: Record<string, unknown>;
    grammar?: Record<string, unknown>;
  };
  reasoning_effort?: "low" | "medium" | "high" | "none";
  seed?: number;
  user?: string;
}

// Completions response
export interface FireworksCompletionChoice {
  index: number;
  text: string;
  finish_reason: string;
  logprobs?: Record<string, unknown> | null;
}

export interface FireworksCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: FireworksCompletionChoice[];
  usage?: FireworksUsage;
}

// Embeddings request
export interface FireworksEmbeddingRequest {
  model: string;
  input: string | string[] | number[] | number[][];
  dimensions?: number;
  prompt_template?: string;
  return_logits?: number[];
  normalize?: boolean;
}

// Embeddings response
export interface FireworksEmbeddingData {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface FireworksEmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface FireworksEmbeddingResponse {
  object: "list";
  data: FireworksEmbeddingData[];
  model: string;
  usage: FireworksEmbeddingUsage;
}

// Payload schema types
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

// Namespace types
interface FireworksChatCompletionsMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): Promise<FireworksChatResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksChatNamespace {
  completions: FireworksChatCompletionsMethod;
}

interface FireworksCompletionsMethod {
  (
    req: FireworksCompletionRequest,
    signal?: AbortSignal
  ): Promise<FireworksCompletionResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksEmbeddingsMethod {
  (
    req: FireworksEmbeddingRequest,
    signal?: AbortSignal
  ): Promise<FireworksEmbeddingResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksV1Namespace {
  chat: FireworksChatNamespace;
  completions: FireworksCompletionsMethod;
  embeddings: FireworksEmbeddingsMethod;
}

// Provider interface
export interface FireworksProvider {
  v1: FireworksV1Namespace;
}

// Error class
export class FireworksError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "FireworksError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
