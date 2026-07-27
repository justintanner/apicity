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
  ToolUseContentBlock,
  ToolResultContentBlock,
  ContentBlock,
  SystemPrompt,
  Tool,
  ToolChoice,
  ThinkingConfig,
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
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

// Raw Anthropic content block in response
export interface AnthropicTextContentBlock {
  type: "text";
  text: string;
}

export interface ThinkingContentBlock {
  type: "thinking";
  thinking: string;
  signature?: string;
}

export interface AnthropicRedactedThinkingContentBlock {
  type: "redacted_thinking";
  data: string;
}

export interface AnthropicToolUseContentBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicToolResultContentBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<TextContentBlock | ImageContentBlock>;
  is_error?: boolean;
}

export type AnthropicContentBlock =
  | AnthropicTextContentBlock
  | ThinkingContentBlock
  | AnthropicRedactedThinkingContentBlock
  | AnthropicToolUseContentBlock
  | AnthropicToolResultContentBlock;

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

// Documented Anthropic SSE event types
export type AnthropicStreamEventType =
  | "message_start"
  | "content_block_start"
  | "content_block_delta"
  | "content_block_stop"
  | "message_delta"
  | "message_stop"
  | "ping"
  | "error";

// Documented Anthropic SSE delta types (content_block_delta payloads)
export type AnthropicStreamDeltaType =
  | "text_delta"
  | "thinking_delta"
  | "input_json_delta"
  | "signature_delta";

// Payload of an Anthropic SSE "error" event
export interface AnthropicStreamError {
  type: string;
  message: string;
}

// Raw Anthropic SSE event
export interface AnthropicStreamEvent {
  type: AnthropicStreamEventType;
  index?: number;
  delta?: {
    type?: AnthropicStreamDeltaType;
    text?: string;
    thinking?: string;
    partial_json?: string;
    signature?: string;
    stop_reason?: string | null;
    stop_sequence?: string | null;
  };
  content_block?: AnthropicContentBlock;
  message?: AnthropicMessage;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: AnthropicStreamError;
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

import type {
  ChatRequest,
  EmbeddingRequest,
  CountTokensRequest,
  TextContentBlock,
  ImageContentBlock,
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
