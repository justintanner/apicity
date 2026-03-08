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
  model?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
}

// Transcription response
export interface OpenAiTranscribeResponse {
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

// Usage info
export interface OpenAiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Chat request
export interface OpenAiChatRequest {
  model?: string;
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: OpenAiTool[];
  tool_choice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
}

// Chat response
export interface OpenAiChatResponse {
  content: string;
  model: string;
  usage: OpenAiUsage;
  finishReason: string;
  toolCalls?: OpenAiToolCall[];
}

// Provider interface
export interface OpenAiProvider {
  chat(
    req: OpenAiChatRequest,
    signal?: AbortSignal
  ): Promise<OpenAiChatResponse>;
  transcribe(
    req: OpenAiTranscribeRequest,
    signal?: AbortSignal
  ): Promise<OpenAiTranscribeResponse>;
}

// Error class
export class OpenAiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "OpenAiError";
    this.status = status;
    this.code = code;
  }
}
