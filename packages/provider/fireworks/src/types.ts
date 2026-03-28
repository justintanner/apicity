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

// Anthropic Messages types (for /v1/messages endpoint)

export type AnthropicRole = "user" | "assistant";

export interface AnthropicBase64ImageSource {
  type: "base64";
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
}

export interface AnthropicUrlImageSource {
  type: "url";
  url: string;
}

export type AnthropicImageSource =
  | AnthropicBase64ImageSource
  | AnthropicUrlImageSource;

export interface AnthropicTextBlock {
  type: "text";
  text: string;
}

export interface AnthropicImageBlock {
  type: "image";
  source: AnthropicImageSource;
}

export interface AnthropicThinkingBlock {
  type: "thinking";
  thinking: string;
  signature: string;
}

export interface AnthropicRedactedThinkingBlock {
  type: "redacted_thinking";
  data: string;
}

export interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content?: string | AnthropicInputContentBlock[];
  is_error?: boolean;
}

export type AnthropicInputContentBlock =
  | AnthropicTextBlock
  | AnthropicImageBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock;

export type AnthropicMessageContent = string | AnthropicInputContentBlock[];

export interface AnthropicInputMessage {
  role: AnthropicRole;
  content: AnthropicMessageContent;
}

export interface AnthropicToolDefinition {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
  strict?: boolean;
}

export interface AnthropicThinkingConfig {
  type: "enabled" | "disabled";
  budget_tokens?: number;
}

export interface AnthropicMessagesRequest {
  model: string;
  messages: AnthropicInputMessage[];
  max_tokens?: number;
  system?: string | { type: "text"; text: string }[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: { user_id?: string };
  thinking?: AnthropicThinkingConfig;
  tools?: AnthropicToolDefinition[];
  tool_choice?:
    | { type: "auto"; disable_parallel_tool_use?: boolean }
    | { type: "any"; disable_parallel_tool_use?: boolean }
    | { type: "none" }
    | {
        type: "tool";
        name: string;
        disable_parallel_tool_use?: boolean;
      };
  raw_output?: boolean;
}

export type AnthropicResponseContentBlock =
  | AnthropicTextBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock
  | AnthropicToolUseBlock;

export type AnthropicStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "tool_use"
  | "pause_turn"
  | "refusal";

export interface AnthropicMessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicResponseContentBlock[];
  model: string;
  stop_reason: AnthropicStopReason | null;
  stop_sequence: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicStreamEvent {
  type: string;
  index?: number;
  delta?: {
    type?: string;
    text?: string;
    thinking?: string;
    signature?: string;
    partial_json?: string;
    stop_reason?: AnthropicStopReason;
    stop_sequence?: string | null;
  };
  content_block?: AnthropicResponseContentBlock;
  message?: AnthropicMessagesResponse;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
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

// Rerank request
export interface FireworksRerankRequest {
  model: string;
  query: string;
  documents: string[];
  top_n?: number;
  return_documents?: boolean;
}

// Rerank response
export interface FireworksRerankResult {
  index: number;
  relevance_score: number;
  document?: string;
}

export interface FireworksRerankUsage {
  prompt_tokens: number;
  total_tokens: number;
  completion_tokens: number;
}

export interface FireworksRerankResponse {
  object: "list";
  model: string;
  data: FireworksRerankResult[];
  usage: FireworksRerankUsage;
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

interface FireworksRerankMethod {
  (
    req: FireworksRerankRequest,
    signal?: AbortSignal
  ): Promise<FireworksRerankResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksMessagesStreamMethod {
  (
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksMessagesMethod {
  (
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessagesResponse>;
  stream: FireworksMessagesStreamMethod;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksV1Namespace {
  chat: FireworksChatNamespace;
  completions: FireworksCompletionsMethod;
  embeddings: FireworksEmbeddingsMethod;
  rerank: FireworksRerankMethod;
  messages: FireworksMessagesMethod;
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
