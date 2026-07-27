import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  Role,
  Base64ImageSource,
  UrlImageSource,
  ImageSource,
  TextContentBlock,
  ImageContentBlock,
  ContentBlock,
  MessageContent,
  ChatMessage,
  ChatRequest,
  ChatRequestInput,
  ChatParsedRequest,
  EmbeddingRequest,
  EmbeddingRequestInput,
  EmbeddingParsedRequest,
  CountTokensRequest,
  CountTokensRequestInput,
  CountTokensParsedRequest,
  KimiCodingOptions,
  OpenAiChatTextPart,
  OpenAiChatImageUrlPart,
  OpenAiChatContentPart,
  OpenAiChatMessageContent,
  OpenAiChatToolCall,
  OpenAiChatMessage,
  OpenAiToolFunction,
  OpenAiTool,
  OpenAiToolChoice,
  OpenAiChatCompletionRequest,
  OpenAiChatCompletionRequestInput,
  OpenAiChatCompletionParsedRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

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

// Token counting response
export interface CountTokensResponse {
  input_tokens: number;
}

// Usage object on OpenAI chat completions (raw API shape)
export interface OpenAiChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Assistant message inside an OpenAI chat completion choice
export interface OpenAiChatCompletionMessage {
  role: string;
  content: string | null;
  reasoning_content?: string;
  tool_calls?: OpenAiChatToolCall[];
}

export interface OpenAiChatCompletionChoice {
  index: number;
  message: OpenAiChatCompletionMessage;
  finish_reason: string;
}

// Raw OpenAI chat completion response
export interface OpenAiChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: OpenAiChatCompletionChoice[];
  usage?: OpenAiChatUsage;
}

// Tool call delta inside a streaming chunk (partial, reassembles by index)
export interface OpenAiChatToolCallDelta {
  index: number;
  id?: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string;
  };
}

// Delta inside an OpenAI streaming chunk choice
export interface OpenAiChatCompletionDelta {
  role?: string;
  content?: string;
  reasoning_content?: string;
  tool_calls?: OpenAiChatToolCallDelta[];
}

export interface OpenAiChatCompletionChunkChoice {
  index: number;
  delta: OpenAiChatCompletionDelta;
  finish_reason: string | null;
}

// Raw OpenAI chat completion streaming chunk
export interface OpenAiChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: OpenAiChatCompletionChunkChoice[];
  usage?: OpenAiChatUsage;
}

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

import type {
  ChatRequest,
  EmbeddingRequest,
  CountTokensRequest,
  OpenAiChatToolCall,
} from "./zod";

interface KimiCodingStreamMethod {
  (req: ChatRequest, signal?: AbortSignal): AsyncIterable<AnthropicStreamEvent>;
  schema: z.ZodType<ChatRequest>;
}

interface KimiCodingMessagesMethod {
  (req: ChatRequest, signal?: AbortSignal): Promise<AnthropicMessage>;
  schema: z.ZodType<ChatRequest>;
}

interface KimiCodingEmbeddingsMethod {
  (req: EmbeddingRequest, signal?: AbortSignal): Promise<EmbeddingResponse>;
  schema: z.ZodType<EmbeddingRequest>;
}

interface KimiCodingCountTokensMethod {
  (req: CountTokensRequest, signal?: AbortSignal): Promise<CountTokensResponse>;
  schema: z.ZodType<CountTokensRequest>;
}

interface KimiCodingGetV1 {
  models(signal?: AbortSignal): Promise<KimiCodingModelListResponse>;
}

interface KimiCodingPostV1 {
  messages: KimiCodingMessagesMethod;
  embeddings: KimiCodingEmbeddingsMethod;
  countTokens: KimiCodingCountTokensMethod;
}

interface KimiCodingPostStreamV1 {
  messages: KimiCodingStreamMethod;
}

export interface Provider {
  post: {
    coding: { v1: KimiCodingPostV1 };
    stream: { coding: { v1: KimiCodingPostStreamV1 } };
  };
  get: { coding: { v1: KimiCodingGetV1 } };
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

export type KimiCodingProvider = Provider;
