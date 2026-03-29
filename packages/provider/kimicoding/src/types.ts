export type Role = "user" | "assistant";

export interface Base64ImageSource {
  type: "base64";
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
}

export interface UrlImageSource {
  type: "url";
  url: string;
}

export type ImageSource = Base64ImageSource | UrlImageSource;

export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ImageContentBlock {
  type: "image";
  source: ImageSource;
}

export type ContentBlock = TextContentBlock | ImageContentBlock;
export type MessageContent = string | ContentBlock[];

export interface ChatMessage {
  role: Role;
  content: MessageContent;
}

// Raw Anthropic Messages API request shape
export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  [key: string]: unknown;
}

// Raw Anthropic content block in response
export interface AnthropicContentBlock {
  type: "text" | "thinking";
  text?: string;
  thinking?: string;
}

// Raw Anthropic Messages API response
export interface AnthropicMessage {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Raw Anthropic SSE event
export interface AnthropicStreamEvent {
  type: string;
  index?: number;
  delta?: {
    type?: string;
    text?: string;
    stop_reason?: string;
  };
  content_block?: AnthropicContentBlock;
  message?: AnthropicMessage;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// Models API types
export interface KimiCodingModel {
  id: string;
  object: "model";
  created: number;
  created_at: string;
  display_name: string;
  type: string;
  context_length: number;
  supports_reasoning: boolean;
  supports_image_in: boolean;
  supports_video_in: boolean;
}

export interface KimiCodingModelListResponse {
  object: "list";
  data: KimiCodingModel[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

// Embeddings request (OpenAI-compatible)
export interface EmbeddingRequest {
  input: string | string[] | number[] | number[][];
  model: string;
  encoding_format?: "float" | "base64";
  dimensions?: number;
  user?: string;
}

// Embeddings response
export interface EmbeddingData {
  index: number;
  embedding: number[];
}

export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingData[];
  model: string;
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
interface KimiCodingStreamMethod {
  (req: ChatRequest, signal?: AbortSignal): AsyncIterable<AnthropicStreamEvent>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KimiCodingMessagesNamespace {
  (req: ChatRequest, signal?: AbortSignal): Promise<AnthropicMessage>;
  stream: KimiCodingStreamMethod;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KimiCodingModelsListMethod {
  (signal?: AbortSignal): Promise<KimiCodingModelListResponse>;
}

interface KimiCodingModelsNamespace {
  list: KimiCodingModelsListMethod;
}

interface KimiCodingEmbeddingsMethod {
  (req: EmbeddingRequest, signal?: AbortSignal): Promise<EmbeddingResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KimiCodingV1Namespace {
  messages: KimiCodingMessagesNamespace;
  models: KimiCodingModelsNamespace;
  embeddings: KimiCodingEmbeddingsMethod;
}

interface KimiCodingCodingNamespace {
  v1: KimiCodingV1Namespace;
}

export interface Provider {
  coding: KimiCodingCodingNamespace;
}

export interface KimiCodingOptions {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export class KimiCodingError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "KimiCodingError";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface KimiCodingProvider extends Provider {}
