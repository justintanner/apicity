// DeepSeek provider options
export interface DeepSeekOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Chat message types
export interface DeepSeekSystemMessage {
  role: "system";
  content: string;
  name?: string;
}

export interface DeepSeekUserMessage {
  role: "user";
  content: string;
  name?: string;
}

export interface DeepSeekAssistantMessage {
  role: "assistant";
  content: string | null;
  name?: string;
  prefix?: boolean;
  reasoning_content?: string | null;
}

export interface DeepSeekToolMessage {
  role: "tool";
  content: string;
  tool_call_id: string;
}

export type DeepSeekMessage =
  | DeepSeekSystemMessage
  | DeepSeekUserMessage
  | DeepSeekAssistantMessage
  | DeepSeekToolMessage;

// Tool definitions
export interface DeepSeekToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface DeepSeekTool {
  type: "function";
  function: DeepSeekToolFunction;
  strict?: boolean;
}

// Tool call in response
export interface DeepSeekToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Logprob types
export interface DeepSeekTokenLogprob {
  token: string;
  logprob: number;
  bytes: number[] | null;
  top_logprobs: {
    token: string;
    logprob: number;
    bytes: number[] | null;
  }[];
}

export interface DeepSeekLogprobs {
  content: DeepSeekTokenLogprob[] | null;
  reasoning_content: DeepSeekTokenLogprob[] | null;
}

// Usage
export interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens: number;
  prompt_cache_miss_tokens: number;
  completion_tokens_details: {
    reasoning_tokens: number;
  };
}

// Chat completion request
export interface DeepSeekChatRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  stream?: boolean;
  stream_options?: {
    include_usage?: boolean;
  };
  stop?: string | string[];
  response_format?: {
    type: "text" | "json_object";
  };
  thinking?: {
    type: "enabled" | "disabled";
  };
  tools?: DeepSeekTool[];
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | { type: "function"; function: { name: string } };
  logprobs?: boolean;
  top_logprobs?: number;
}

// Chat completion choice
export interface DeepSeekChatChoice {
  index: number;
  message: {
    role: "assistant";
    content: string | null;
    reasoning_content: string | null;
    tool_calls?: DeepSeekToolCall[];
  };
  finish_reason:
    | "stop"
    | "length"
    | "content_filter"
    | "tool_calls"
    | "insufficient_system_resource";
  logprobs: DeepSeekLogprobs | null;
}

// Chat completion response
export interface DeepSeekChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: DeepSeekChatChoice[];
  usage: DeepSeekUsage;
}

// Streaming chunk types
export interface DeepSeekChatChunkDelta {
  role?: "assistant" | null;
  content?: string | null;
  reasoning_content?: string | null;
  tool_calls?: DeepSeekToolCall[];
}

export interface DeepSeekChatChunkChoice {
  index: number;
  delta: DeepSeekChatChunkDelta;
  finish_reason: string | null;
  logprobs: DeepSeekLogprobs | null;
}

export interface DeepSeekChatChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: DeepSeekChatChunkChoice[];
  usage: DeepSeekUsage | null;
}

// FIM (Fill-in-the-Middle) completion request (Beta)
export interface DeepSeekFimRequest {
  model: string;
  prompt: string;
  suffix?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  echo?: boolean;
  logprobs?: number;
  stop?: string | string[];
  stream?: boolean;
  stream_options?: {
    include_usage?: boolean;
  };
}

// FIM completion logprobs
export interface DeepSeekFimLogprobs {
  tokens: string[];
  token_logprobs: number[];
  text_offset: number[];
  top_logprobs: Record<string, number>[];
}

// FIM completion choice
export interface DeepSeekFimChoice {
  text: string;
  index: number;
  finish_reason:
    | "stop"
    | "length"
    | "content_filter"
    | "insufficient_system_resource";
  logprobs: DeepSeekFimLogprobs | null;
}

// FIM completion response
export interface DeepSeekFimResponse {
  id: string;
  object: "text_completion";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: DeepSeekFimChoice[];
  usage: DeepSeekUsage;
}

// Models API types
export interface DeepSeekModel {
  id: string;
  object: "model";
  owned_by: string;
}

export interface DeepSeekModelListResponse {
  object: "list";
  data: DeepSeekModel[];
}

// User balance API types
export interface DeepSeekBalanceInfo {
  currency: "CNY" | "USD";
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
}

export interface DeepSeekBalanceResponse {
  is_available: boolean;
  balance_infos: DeepSeekBalanceInfo[];
}

// Payload schema types (shared across nakedapi providers)
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

// Namespace method types

interface DeepSeekChatCompletionsMethod {
  (
    req: DeepSeekChatRequest,
    signal?: AbortSignal
  ): Promise<DeepSeekChatResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface DeepSeekChatNamespace {
  completions: DeepSeekChatCompletionsMethod;
}

interface DeepSeekModelsListMethod {
  (signal?: AbortSignal): Promise<DeepSeekModelListResponse>;
}

interface DeepSeekModelsNamespace {
  list: DeepSeekModelsListMethod;
}

interface DeepSeekV1Namespace {
  chat: DeepSeekChatNamespace;
  models: DeepSeekModelsNamespace;
}

interface DeepSeekBetaCompletionsMethod {
  (req: DeepSeekFimRequest, signal?: AbortSignal): Promise<DeepSeekFimResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface DeepSeekBetaNamespace {
  completions: DeepSeekBetaCompletionsMethod;
}

interface DeepSeekUserBalanceMethod {
  (signal?: AbortSignal): Promise<DeepSeekBalanceResponse>;
}

interface DeepSeekUserNamespace {
  balance: DeepSeekUserBalanceMethod;
}

// Provider interface
export interface DeepSeekProvider {
  v1: DeepSeekV1Namespace;
  beta: DeepSeekBetaNamespace;
  user: DeepSeekUserNamespace;
}

// Error class
export class DeepSeekError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "DeepSeekError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
