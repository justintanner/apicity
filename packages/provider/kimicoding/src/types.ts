export type Role = "user" | "assistant" | "system" | "tool";

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

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  systemPrompt?: string;
  responseFormat?: "text" | "json_object";
  user?: string;
  metadata?: Record<string, unknown>;
  seed?: number;
  logprobs?: boolean;
  logitBias?: Record<string, number>;
  [key: string]: unknown;
}

export interface ChatStreamChunk {
  delta: string;
  done?: boolean;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "tool_calls";
  metadata?: Record<string, unknown>;
}

export interface Provider {
  streamChat(
    req: ChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<ChatStreamChunk>;
  chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>;
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
  constructor(message: string, status: number) {
    super(message);
    this.name = "KimiCodingError";
    this.status = status;
  }
}

export interface KimiCodingProvider extends Provider {}

export interface AnthropicContentBlock {
  type: "text" | "thinking";
  text?: string;
  thinking?: string;
}

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
