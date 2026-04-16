import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  AlibabaOptions,
  AlibabaMessage,
  AlibabaFunctionDefinition,
  AlibabaTool,
  AlibabaToolCallFunction,
  AlibabaToolCall,
  AlibabaStreamOptions,
  AlibabaResponseFormat,
  AlibabaChatRequest,
  AlibabaVideoSynthesisInput,
  AlibabaVideoSynthesisParameters,
  AlibabaVideoSynthesisRequest,
  AlibabaImageTextContent,
  AlibabaImageImageContent,
  AlibabaImageContent,
  AlibabaImageGenerationMessage,
  AlibabaImageGenerationInput,
  AlibabaColorPaletteItem,
  AlibabaImageGenerationParameters,
  AlibabaImageGenerationRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

// -- Chat messages ----------------------------------------------------------

export type AlibabaRole = "system" | "user" | "assistant" | "tool";

// -- Chat response ----------------------------------------------------------

import type { AlibabaToolCall } from "./zod";

export interface AlibabaChatResponseMessage {
  role: string;
  content: string | null;
  tool_calls?: AlibabaToolCall[];
}

export interface AlibabaChatChoice {
  index: number;
  message: AlibabaChatResponseMessage;
  finish_reason: string | null;
}

export interface AlibabaUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AlibabaChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AlibabaChatChoice[];
  usage?: AlibabaUsage;
}

// -- Streaming response -----------------------------------------------------

export interface AlibabaChatStreamDelta {
  role?: string;
  content?: string | null;
  tool_calls?: AlibabaToolCall[];
}

export interface AlibabaChatStreamChoice {
  index: number;
  delta: AlibabaChatStreamDelta;
  finish_reason: string | null;
}

export interface AlibabaChatStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AlibabaChatStreamChoice[];
  usage?: AlibabaUsage;
}

// -- Models -----------------------------------------------------------------

export interface AlibabaModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface AlibabaModelListResponse {
  object: string;
  data: AlibabaModel[];
}

// -- Image generation (Wan 2.7 — async) --------------------------------------

export interface AlibabaImageGenerationContent {
  type: "image";
  image: string;
}

export interface AlibabaImageGenerationResultMessage {
  role: "assistant";
  content: AlibabaImageGenerationContent[];
}

export interface AlibabaImageGenerationChoice {
  finish_reason: string;
  message: AlibabaImageGenerationResultMessage;
}

export interface AlibabaImageGenerationSubmitOutput {
  task_id: string;
  task_status: AlibabaTaskStatus;
}

export interface AlibabaImageGenerationSubmitResponse {
  output: AlibabaImageGenerationSubmitOutput;
  request_id: string;
}

// -- Video synthesis (native DashScope /api/v1) -----------------------------

export type AlibabaTaskStatus =
  | "PENDING"
  | "RUNNING"
  | "SUSPENDED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "UNKNOWN";

export interface AlibabaVideoSynthesisSubmitOutput {
  task_id: string;
  task_status: AlibabaTaskStatus;
}

export interface AlibabaVideoSynthesisSubmitResponse {
  output: AlibabaVideoSynthesisSubmitOutput;
  request_id: string;
}

export interface AlibabaTaskOutput {
  task_id: string;
  task_status: AlibabaTaskStatus;
  submit_time?: string;
  scheduled_time?: string;
  end_time?: string;
  video_url?: string;
  code?: string;
  message?: string;
  orig_prompt?: string;
  actual_prompt?: string;
  finished?: boolean;
  choices?: AlibabaImageGenerationChoice[];
}

export interface AlibabaTaskUsage {
  duration?: number;
  input_video_duration?: number;
  output_video_duration?: number;
  SR?: number;
  video_count?: number;
  image_count?: number;
  size?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface AlibabaTaskStatusResponse {
  output: AlibabaTaskOutput;
  usage?: AlibabaTaskUsage;
  request_id: string;
}

// -- Error ------------------------------------------------------------------

export class AlibabaError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "AlibabaError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Method interfaces ------------------------------------------------------

import type {
  AlibabaChatRequest,
  AlibabaVideoSynthesisRequest,
  AlibabaImageGenerationRequest,
} from "./zod";

export interface AlibabaChatCompletionsMethod {
  (req: AlibabaChatRequest, signal?: AbortSignal): Promise<AlibabaChatResponse>;
  schema: z.ZodType<AlibabaChatRequest>;
}

export interface AlibabaChatCompletionsStreamMethod {
  (
    req: AlibabaChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<AlibabaChatStreamChunk>;
  schema: z.ZodType<AlibabaChatRequest>;
}

export interface AlibabaVideoSynthesisMethod {
  (
    req: AlibabaVideoSynthesisRequest,
    signal?: AbortSignal
  ): Promise<AlibabaVideoSynthesisSubmitResponse>;
  schema: z.ZodType<AlibabaVideoSynthesisRequest>;
}

export interface AlibabaImageGenerationMethod {
  (
    req: AlibabaImageGenerationRequest,
    signal?: AbortSignal
  ): Promise<AlibabaImageGenerationSubmitResponse>;
  schema: z.ZodType<AlibabaImageGenerationRequest>;
}

// -- Namespace interfaces ---------------------------------------------------

export interface AlibabaPostV1ChatNamespace {
  completions: AlibabaChatCompletionsMethod;
}

export interface AlibabaPostV1Namespace {
  chat: AlibabaPostV1ChatNamespace;
}

export interface AlibabaPostStreamV1ChatNamespace {
  completions: AlibabaChatCompletionsStreamMethod;
}

export interface AlibabaPostStreamV1Namespace {
  chat: AlibabaPostStreamV1ChatNamespace;
}

export interface AlibabaPostApiV1VideoGenerationNamespace {
  videoSynthesis: AlibabaVideoSynthesisMethod;
}

export interface AlibabaPostApiV1ImageGenerationNamespace {
  generation: AlibabaImageGenerationMethod;
}

export interface AlibabaPostApiV1AigcNamespace {
  videoGeneration: AlibabaPostApiV1VideoGenerationNamespace;
  imageGeneration: AlibabaPostApiV1ImageGenerationNamespace;
}

export interface AlibabaPostApiV1ServicesNamespace {
  aigc: AlibabaPostApiV1AigcNamespace;
}

export interface AlibabaPostApiV1Namespace {
  services: AlibabaPostApiV1ServicesNamespace;
}

export interface AlibabaPostApiNamespace {
  v1: AlibabaPostApiV1Namespace;
}

export interface AlibabaPostNamespace {
  compatibleMode: { v1: AlibabaPostV1Namespace };
  stream: { compatibleMode: { v1: AlibabaPostStreamV1Namespace } };
  api: AlibabaPostApiNamespace;
}

export interface AlibabaGetV1Namespace {
  models: (signal?: AbortSignal) => Promise<AlibabaModelListResponse>;
}

export interface AlibabaGetApiV1Namespace {
  tasks: (
    taskId: string,
    signal?: AbortSignal
  ) => Promise<AlibabaTaskStatusResponse>;
}

export interface AlibabaGetApiNamespace {
  v1: AlibabaGetApiV1Namespace;
}

export interface AlibabaGetNamespace {
  compatibleMode: { v1: AlibabaGetV1Namespace };
  api: AlibabaGetApiNamespace;
}

export interface AlibabaProvider {
  post: AlibabaPostNamespace;
  get: AlibabaGetNamespace;
}
