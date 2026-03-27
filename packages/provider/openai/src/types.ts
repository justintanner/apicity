// OpenAI provider options
export interface OpenAiOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Content part for vision messages
export interface OpenAiTextPart {
  type: "text";
  text: string;
}

export interface OpenAiImageUrlPart {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
}

export type OpenAiContentPart = OpenAiTextPart | OpenAiImageUrlPart;

// Chat message
export interface OpenAiMessage {
  role: "user" | "assistant" | "system";
  content: string | OpenAiContentPart[];
}

// Transcription request
export interface OpenAiTranscribeRequest {
  file: Blob;
  model: string;
  response_format?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
}

// Transcription response
export interface OpenAiTranscribeResponse {
  text: string;
}

// Translation request
export interface OpenAiTranslateRequest {
  file: Blob;
  model: string;
  response_format?: string;
  prompt?: string;
  temperature?: number;
}

// Translation response
export interface OpenAiTranslateResponse {
  text: string;
}

// Tool function definition
export interface OpenAiToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Tool definition
export interface OpenAiTool {
  type: "function";
  function: OpenAiToolFunction;
}

// Tool call in response
export interface OpenAiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Usage info (raw API shape)
export interface OpenAiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Chat request
export interface OpenAiChatRequest {
  model?: string;
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  tools?: OpenAiTool[];
  tool_choice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: Record<string, unknown>;
  };
}

// Chat response (raw API shape)
export interface OpenAiChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenAiToolCall[];
  };
  finish_reason: string;
}

export interface OpenAiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAiChatChoice[];
  usage?: OpenAiUsage;
  error?: { message?: string; type?: string };
}

// Embeddings request
export interface OpenAiEmbeddingRequest {
  input: string | string[] | number[] | number[][];
  model: string;
  encoding_format?: "float" | "base64";
  dimensions?: number;
  user?: string;
}

// Embeddings response
export interface OpenAiEmbeddingData {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface OpenAiEmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface OpenAiEmbeddingResponse {
  object: "list";
  data: OpenAiEmbeddingData[];
  model: string;
  usage: OpenAiEmbeddingUsage;
}

// Image edit request
export interface OpenAiImageEditRequest {
  image: Blob | Blob[];
  prompt: string;
  mask?: Blob;
  model?: string;
  n?: number;
  size?:
    | "256x256"
    | "512x512"
    | "1024x1024"
    | "1536x1024"
    | "1024x1536"
    | "auto";
  quality?: "standard" | "low" | "medium" | "high" | "auto";
  output_format?: "png" | "jpeg" | "webp";
  response_format?: "url" | "b64_json";
  background?: "transparent" | "opaque" | "auto";
  input_fidelity?: "high" | "low";
  output_compression?: number;
  user?: string;
}

// Image edit response
export interface OpenAiImageData {
  b64_json?: string | null;
  revised_prompt?: string | null;
  url?: string | null;
}

export interface OpenAiImageEditUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens_details?: {
    image_tokens: number;
    text_tokens: number;
  };
}

export interface OpenAiImageEditResponse {
  created: number;
  data?: OpenAiImageData[];
  background?: "transparent" | "opaque" | null;
  output_format?: "png" | "webp" | "jpeg" | null;
  quality?: "low" | "medium" | "high" | null;
  size?: string | null;
  usage?: OpenAiImageEditUsage | null;
}

// Image generation request
export interface OpenAiImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  quality?: string;
  response_format?: "url" | "b64_json";
  style?: "vivid" | "natural";
  background?: "transparent" | "opaque" | "auto";
  moderation?: "low" | "auto";
  output_format?: "png" | "jpeg" | "webp";
  output_compression?: number;
  user?: string;
}

// Image generation response
export interface OpenAiGeneratedImage {
  b64_json?: string;
  url?: string;
  revised_prompt?: string;
}

export interface OpenAiImageGenerationUsage {
  input_tokens: number;
  input_tokens_details: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens: number;
  total_tokens: number;
}

export interface OpenAiImageGenerationResponse {
  created: number;
  data: OpenAiGeneratedImage[];
  usage?: OpenAiImageGenerationUsage;
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
interface OpenAiChatCompletionsMethod {
  (req: OpenAiChatRequest, signal?: AbortSignal): Promise<OpenAiChatResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface OpenAiChatNamespace {
  completions: OpenAiChatCompletionsMethod;
}

interface OpenAiEmbeddingsMethod {
  (
    req: OpenAiEmbeddingRequest,
    signal?: AbortSignal
  ): Promise<OpenAiEmbeddingResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface OpenAiAudioTranscriptionsMethod {
  (
    req: OpenAiTranscribeRequest,
    signal?: AbortSignal
  ): Promise<OpenAiTranscribeResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface OpenAiAudioTranslationsMethod {
  (
    req: OpenAiTranslateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiTranslateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface OpenAiAudioNamespace {
  transcriptions: OpenAiAudioTranscriptionsMethod;
  translations: OpenAiAudioTranslationsMethod;
}

interface OpenAiImagesEditsMethod {
  (
    req: OpenAiImageEditRequest,
    signal?: AbortSignal
  ): Promise<OpenAiImageEditResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface OpenAiImageGenerationsMethod {
  (
    req: OpenAiImageGenerationRequest,
    signal?: AbortSignal
  ): Promise<OpenAiImageGenerationResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface OpenAiImagesNamespace {
  edits: OpenAiImagesEditsMethod;
  generations: OpenAiImageGenerationsMethod;
}

interface OpenAiV1Namespace {
  chat: OpenAiChatNamespace;
  audio: OpenAiAudioNamespace;
  embeddings: OpenAiEmbeddingsMethod;
  images: OpenAiImagesNamespace;
}

// Provider interface
export interface OpenAiProvider {
  v1: OpenAiV1Namespace;
}

// Error class
export class OpenAiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "OpenAiError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
