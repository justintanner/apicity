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

// --- Responses API types ---

// Input content parts
export interface OpenAiResponseInputTextContent {
  type: "input_text";
  text: string;
}

export interface OpenAiResponseInputImageContent {
  type: "input_image";
  image_url?: string;
  file_id?: string;
  detail?: "auto" | "low" | "high";
}

export interface OpenAiResponseInputAudioContent {
  type: "input_audio";
  data: string;
  format: "wav" | "mp3";
}

export type OpenAiResponseInputContent =
  | OpenAiResponseInputTextContent
  | OpenAiResponseInputImageContent
  | OpenAiResponseInputAudioContent;

// Input items
export interface OpenAiResponseInputMessage {
  role: "user" | "assistant" | "system" | "developer";
  content: string | OpenAiResponseInputContent[];
}

export interface OpenAiResponseFunctionCallOutput {
  type: "function_call_output";
  call_id: string;
  output: string;
}

export interface OpenAiResponseItemReference {
  type: "item_reference";
  id: string;
}

export type OpenAiResponseInputItem =
  | OpenAiResponseInputMessage
  | OpenAiResponseFunctionCallOutput
  | OpenAiResponseItemReference;

// Tools for Responses API
export interface OpenAiResponseFunctionTool {
  type: "function";
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  strict?: boolean;
}

export interface OpenAiResponseWebSearchTool {
  type: "web_search_preview" | "web_search_preview_2025_03_11";
  search_context_size?: "low" | "medium" | "high";
  user_location?: {
    type: "approximate";
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
}

export interface OpenAiResponseFileSearchTool {
  type: "file_search";
  vector_store_ids: string[];
  max_num_results?: number;
  ranking_options?: {
    ranker?: string;
    score_threshold?: number;
  };
}

export interface OpenAiResponseCodeInterpreterTool {
  type: "code_interpreter";
}

export type OpenAiResponseTool =
  | OpenAiResponseFunctionTool
  | OpenAiResponseWebSearchTool
  | OpenAiResponseFileSearchTool
  | OpenAiResponseCodeInterpreterTool;

// Text format for structured output
export interface OpenAiResponseTextFormat {
  format:
    | { type: "text" }
    | { type: "json_object" }
    | {
        type: "json_schema";
        name: string;
        schema: Record<string, unknown>;
        description?: string;
        strict?: boolean;
      };
}

// Reasoning config
export interface OpenAiResponseReasoning {
  effort?: "low" | "medium" | "high";
  summary?: "auto" | "concise" | "detailed" | null;
}

// Responses API GET options
export interface OpenAiResponseGetOptions {
  include?: string[];
  stream?: boolean;
}

// Responses API request
export interface OpenAiResponseRequest {
  model: string;
  input: string | OpenAiResponseInputItem[];
  instructions?: string;
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  tools?: OpenAiResponseTool[];
  tool_choice?: "auto" | "none" | "required" | { type: string; name?: string };
  previous_response_id?: string;
  store?: boolean;
  metadata?: Record<string, string>;
  stream?: boolean;
  text?: OpenAiResponseTextFormat;
  truncation?: "auto" | "disabled";
  reasoning?: OpenAiResponseReasoning;
  user?: string;
  include?: string[];
  parallel_tool_calls?: boolean;
}

// Output content types
export interface OpenAiResponseAnnotation {
  type: "url_citation" | "file_citation" | "file_path";
  start_index: number;
  end_index: number;
  url?: string;
  title?: string;
  file_id?: string;
  filename?: string;
}

export interface OpenAiResponseOutputText {
  type: "output_text";
  text: string;
  annotations?: OpenAiResponseAnnotation[];
}

export interface OpenAiResponseRefusal {
  type: "refusal";
  refusal: string;
}

export type OpenAiResponseOutputContent =
  | OpenAiResponseOutputText
  | OpenAiResponseRefusal;

// Output items
export interface OpenAiResponseOutputMessage {
  type: "message";
  id: string;
  role: "assistant";
  content: OpenAiResponseOutputContent[];
  status: "in_progress" | "completed" | "incomplete";
}

export interface OpenAiResponseFunctionCallItem {
  type: "function_call";
  id: string;
  call_id: string;
  name: string;
  arguments: string;
  status: "in_progress" | "completed" | "incomplete";
}

export interface OpenAiResponseWebSearchCallItem {
  type: "web_search_call";
  id: string;
  status: "completed";
}

export interface OpenAiResponseFileSearchCallItem {
  type: "file_search_call";
  id: string;
  status: "completed";
  results?: OpenAiResponseFileSearchResult[];
}

export interface OpenAiResponseFileSearchResult {
  file_id: string;
  filename: string;
  score: number;
  text: string;
}

export type OpenAiResponseOutputItem =
  | OpenAiResponseOutputMessage
  | OpenAiResponseFunctionCallItem
  | OpenAiResponseWebSearchCallItem
  | OpenAiResponseFileSearchCallItem;

// Responses API usage
export interface OpenAiResponseUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: {
    cached_tokens: number;
  };
  output_tokens_details?: {
    reasoning_tokens: number;
  };
}

// Responses API delete response
export interface OpenAiResponseDeleteResponse {
  id: string;
  object: "response.deleted";
  deleted: true;
}

// Responses API response
export interface OpenAiResponseResponse {
  id: string;
  object: "response";
  created_at: number;
  status: "completed" | "failed" | "in_progress" | "incomplete";
  model: string;
  output: OpenAiResponseOutputItem[];
  usage?: OpenAiResponseUsage;
  error?: {
    code: string;
    message: string;
  } | null;
  incomplete_details?: {
    reason: string;
  } | null;
  instructions?: string | null;
  metadata?: Record<string, string>;
  temperature?: number | null;
  top_p?: number | null;
  max_output_tokens?: number | null;
  previous_response_id?: string | null;
  reasoning?: OpenAiResponseReasoning | null;
  text?: OpenAiResponseTextFormat;
  tool_choice?: "auto" | "none" | "required" | { type: string; name?: string };
  tools?: OpenAiResponseTool[];
  truncation?: "auto" | "disabled";
  parallel_tool_calls?: boolean;
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

interface OpenAiResponsesGetMethod {
  (
    id: string,
    opts?: OpenAiResponseGetOptions,
    signal?: AbortSignal
  ): Promise<OpenAiResponseResponse>;
}

interface OpenAiResponsesDeleteMethod {
  (id: string, signal?: AbortSignal): Promise<OpenAiResponseDeleteResponse>;
  payloadSchema: PayloadSchema;
}

interface OpenAiResponsesMethod {
  (
    req: OpenAiResponseRequest,
    signal?: AbortSignal
  ): Promise<OpenAiResponseResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
  get: OpenAiResponsesGetMethod;
  del: OpenAiResponsesDeleteMethod;
}

interface OpenAiV1Namespace {
  chat: OpenAiChatNamespace;
  audio: OpenAiAudioNamespace;
  embeddings: OpenAiEmbeddingsMethod;
  images: OpenAiImagesNamespace;
  responses: OpenAiResponsesMethod;
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
