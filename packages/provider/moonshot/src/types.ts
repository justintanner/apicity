export type Role = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  role: Role;
  content: string;
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

export interface FileObject {
  id: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  status: "uploaded" | "processed" | "error";
  status_details?: string;
}

export interface FileListResponse {
  object: "list";
  data: FileObject[];
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
  encoding_format?: "float" | "base64";
  dimensions?: number;
}

export interface EmbeddingObject {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingObject[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface MoonshotOptions {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export class MoonshotError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MoonshotError";
    this.status = status;
  }
}

export interface MoonshotProvider extends Provider {
  listFiles(): Promise<FileObject[]>;
  uploadFile(
    file: File | Blob | Buffer,
    purpose: string,
    filename?: string
  ): Promise<FileObject>;
  deleteFile(fileId: string): Promise<void>;
  retrieveFile(fileId: string): Promise<FileObject>;
  retrieveFileContent(fileId: string): Promise<string>;

  createEmbedding(
    input: string | string[],
    model?: string,
    options?: {
      encoding_format?: "float" | "base64";
      dimensions?: number;
    }
  ): Promise<EmbeddingResponse>;
}
