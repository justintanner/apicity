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
  ChatParsedRequest,
  EmbeddingRequest,
  EmbeddingParsedRequest,
  CountTokensRequest,
  CountTokensParsedRequest,
  KimiCodingOptions,
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

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

import type { ChatRequest, EmbeddingRequest, CountTokensRequest } from "./zod";

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
