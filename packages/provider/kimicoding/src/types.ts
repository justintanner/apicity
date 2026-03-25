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

// Namespace types
interface KimiCodingMessagesNamespace {
  (req: ChatRequest, signal?: AbortSignal): Promise<AnthropicMessage>;
  stream(
    req: ChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent>;
}

interface KimiCodingV1Namespace {
  messages: KimiCodingMessagesNamespace;
}

interface KimiCodingCodingNamespace {
  v1: KimiCodingV1Namespace;
}

export interface Provider {
  coding: KimiCodingCodingNamespace;
  getModels(): Promise<string[]>;
  validateModel(modelId: string): boolean;
  getMaxTokens(modelId: string): number;
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
