// XAI provider options
export interface XaiOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Chat message
export interface XaiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Tool function definition
export interface XaiToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Tool definition
export interface XaiTool {
  type: "function";
  function: XaiToolFunction;
}

// Tool call in response
export interface XaiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Usage info (raw API shape)
export interface XaiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Chat request
export interface XaiChatRequest {
  model?: string;
  messages: XaiMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: XaiTool[];
  tool_choice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
}

// Chat response (raw API shape)
export interface XaiChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: XaiToolCall[];
  };
  finish_reason: string;
}

export interface XaiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: XaiChatChoice[];
  usage?: XaiUsage;
  error?: { message?: string; type?: string };
}

// Image generation request
export interface XaiImageGenerateRequest {
  prompt: string;
  model?: string;
  n?: number;
  response_format?: "url" | "b64_json";
  aspect_ratio?: string;
  resolution?: "1k" | "2k";
}

// Image reference for editing
export interface XaiImageReference {
  url: string;
  type?: "image_url";
}

// Image editing request
export interface XaiImageEditRequest {
  prompt: string;
  model?: string;
  image?: XaiImageReference;
  images?: XaiImageReference[];
  n?: number;
  response_format?: "url" | "b64_json";
  aspect_ratio?: string;
}

// Single generated image data
export interface XaiGeneratedImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
  respect_moderation?: boolean;
}

// Image response
export interface XaiImageResponse {
  created?: number;
  model?: string;
  data: XaiGeneratedImage[];
}

// File upload response
export interface XaiFileObject {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

// File list response
export interface XaiFileListResponse {
  data: XaiFileObject[];
  object: string;
}

// Video reference (image-to-video, editing, extension, reference images)
export interface XaiVideoReference {
  url: string;
}

// Video generation request — matches API body for /v1/videos/generations
export interface XaiVideoGenerateRequest {
  prompt: string;
  model?: string;
  duration?: number;
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";
  resolution?: "480p" | "720p";
  image?: XaiVideoReference;
  video?: XaiVideoReference;
  reference_images?: XaiVideoReference[];
}

// Video extension request — matches API body for /v1/videos/extensions
export interface XaiVideoExtendRequest {
  prompt: string;
  model?: string;
  duration?: number;
  video: XaiVideoReference;
}

// Video async response (returned from generate/edit)
export interface XaiVideoAsyncResponse {
  request_id: string;
}

// Video data in poll response
export interface XaiVideoData {
  url: string;
  duration: number;
  respect_moderation: boolean;
}

// Video result (returned from polling)
export interface XaiVideoResult {
  status: "pending" | "done" | "expired" | "failed";
  progress?: number;
  request_id?: string;
  video?: XaiVideoData;
  model?: string;
}

// Model info (GET /v1/models)
export interface XaiModel {
  id: string;
  created: number;
  object: string;
  owned_by: string;
}

export interface XaiModelListResponse {
  data: XaiModel[];
  object: string;
}

// Language model (GET /v1/language-models)
export interface XaiLanguageModel {
  id: string;
  fingerprint: string;
  created: number;
  object: string;
  owned_by: string;
  version: string;
  input_modalities: string[];
  output_modalities: string[];
  prompt_text_token_price: number;
  cached_prompt_text_token_price?: number;
  prompt_image_token_price?: number;
  completion_text_token_price: number;
  search_price?: number;
  aliases: string[];
}

export interface XaiLanguageModelListResponse {
  models: XaiLanguageModel[];
}

// Image generation model (GET /v1/image-generation-models)
export interface XaiImageGenerationModel {
  id: string;
  fingerprint: string;
  created: number;
  object: string;
  owned_by: string;
  version: string;
  max_prompt_length: number;
  prompt_text_token_price?: number;
  prompt_image_token_price?: number;
  generated_image_token_price?: number;
  image_price?: number;
  input_modalities?: string[];
  output_modalities?: string[];
  aliases: string[];
}

export interface XaiImageGenerationModelListResponse {
  models: XaiImageGenerationModel[];
}

// Video generation model (GET /v1/video-generation-models)
export interface XaiVideoGenerationModel {
  id: string;
  fingerprint: string;
  created: number;
  object: string;
  owned_by: string;
  version: string;
  input_modalities: string[];
  output_modalities: string[];
  aliases: string[];
}

export interface XaiVideoGenerationModelListResponse {
  models: XaiVideoGenerationModel[];
}

// Namespace types
interface XaiChatCompletionsMethod {
  (req: XaiChatRequest, signal?: AbortSignal): Promise<XaiChatResponse>;
}

interface XaiChatNamespace {
  completions: XaiChatCompletionsMethod;
}

interface XaiImagesNamespace {
  generations(
    req: XaiImageGenerateRequest,
    signal?: AbortSignal
  ): Promise<XaiImageResponse>;
  edits(
    req: XaiImageEditRequest,
    signal?: AbortSignal
  ): Promise<XaiImageResponse>;
}

interface XaiVideosNamespace {
  (requestId: string, signal?: AbortSignal): Promise<XaiVideoResult>;
  generations(
    req: XaiVideoGenerateRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  extensions(
    req: XaiVideoExtendRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
}

interface XaiFilesNamespace {
  upload(
    file: Blob,
    filename: string,
    purpose?: string,
    signal?: AbortSignal
  ): Promise<XaiFileObject>;
  list(signal?: AbortSignal): Promise<XaiFileListResponse>;
  get(fileId: string, signal?: AbortSignal): Promise<XaiFileObject>;
  delete(
    fileId: string,
    signal?: AbortSignal
  ): Promise<{ id: string; deleted: boolean }>;
}

interface XaiModelsNamespace {
  (signal?: AbortSignal): Promise<XaiModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiModel>;
}

interface XaiLanguageModelsNamespace {
  (signal?: AbortSignal): Promise<XaiLanguageModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiLanguageModel>;
}

interface XaiImageGenerationModelsNamespace {
  (signal?: AbortSignal): Promise<XaiImageGenerationModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiImageGenerationModel>;
}

interface XaiVideoGenerationModelsNamespace {
  (signal?: AbortSignal): Promise<XaiVideoGenerationModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiVideoGenerationModel>;
}

interface XaiV1Namespace {
  chat: XaiChatNamespace;
  images: XaiImagesNamespace;
  videos: XaiVideosNamespace;
  files: XaiFilesNamespace;
  models: XaiModelsNamespace;
  languageModels: XaiLanguageModelsNamespace;
  imageGenerationModels: XaiImageGenerationModelsNamespace;
  videoGenerationModels: XaiVideoGenerationModelsNamespace;
}

// Provider interface
export interface XaiProvider {
  v1: XaiV1Namespace;
}

// Error class
export class XaiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "XaiError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
