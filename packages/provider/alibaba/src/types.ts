import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request and response types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  // Options
  AlibabaOptions,
  // Chat request
  AlibabaTextPart,
  AlibabaImageUrlPart,
  AlibabaContentPart,
  AlibabaMessage,
  AlibabaFunctionDefinition,
  AlibabaTool,
  AlibabaToolCallFunction,
  AlibabaToolCall,
  AlibabaStreamOptions,
  AlibabaResponseFormat,
  AlibabaChatRequest,
  // Video request
  AlibabaVideoMediaType,
  AlibabaVideoMedia,
  AlibabaVideoSynthesisInput,
  AlibabaVideoSynthesisParameters,
  AlibabaVideoSynthesisRequest,
  // Image-gen request
  AlibabaImageTextContent,
  AlibabaImageImageContent,
  AlibabaImageContent,
  AlibabaImageGenerationMessage,
  AlibabaImageGenerationInput,
  AlibabaColorPaletteItem,
  AlibabaImageGenerationParameters,
  AlibabaImageGenerationRequest,
  // Multimodal request
  AlibabaMultimodalGenerationMessage,
  AlibabaMultimodalGenerationInput,
  AlibabaMultimodalGenerationParameters,
  AlibabaMultimodalGenerationRequest,
  // Response unions
  AlibabaRole,
  AlibabaFinishReason,
  AlibabaTaskStatus,
  // Chat response
  AlibabaChatResponseMessage,
  AlibabaChatChoice,
  AlibabaUsage,
  AlibabaChatResponse,
  AlibabaChatStreamDelta,
  AlibabaChatStreamChoice,
  AlibabaChatStreamChunk,
  // Models
  AlibabaModel,
  AlibabaModelListResponse,
  // Image-gen response
  AlibabaImageGenerationContent,
  AlibabaImageGenerationResultMessage,
  AlibabaImageGenerationChoice,
  AlibabaImageGenerationSubmitOutput,
  AlibabaImageGenerationSubmitResponse,
  // Multimodal response
  AlibabaMultimodalGenerationImagePart,
  AlibabaMultimodalGenerationResultMessage,
  AlibabaMultimodalGenerationChoice,
  AlibabaMultimodalGenerationOutput,
  AlibabaMultimodalGenerationUsage,
  AlibabaMultimodalGenerationResponse,
  // Video task response
  AlibabaVideoSynthesisSubmitOutput,
  AlibabaVideoSynthesisSubmitResponse,
  AlibabaTaskOutput,
  AlibabaTaskUsage,
  AlibabaTaskStatusResponse,
  // Upload policy response
  AlibabaUploadPolicyData,
  AlibabaUploadPolicyResponse,
} from "./zod";

// ---------------------------------------------------------------------------
// Non-schema types (request-style helpers that have no payload to validate)
// ---------------------------------------------------------------------------

export interface AlibabaUploadPolicyParams {
  action: "getPolicy";
  model: string;
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
  AlibabaChatResponse,
  AlibabaChatStreamChunk,
  AlibabaVideoSynthesisRequest,
  AlibabaVideoSynthesisSubmitResponse,
  AlibabaImageGenerationRequest,
  AlibabaImageGenerationSubmitResponse,
  AlibabaMultimodalGenerationRequest,
  AlibabaMultimodalGenerationResponse,
  AlibabaModelListResponse,
  AlibabaTaskStatusResponse,
  AlibabaUploadPolicyResponse,
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

export interface AlibabaMultimodalGenerationMethod {
  (
    req: AlibabaMultimodalGenerationRequest,
    signal?: AbortSignal
  ): Promise<AlibabaMultimodalGenerationResponse>;
  schema: z.ZodType<AlibabaMultimodalGenerationRequest>;
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

export interface AlibabaPostApiV1MultimodalGenerationNamespace {
  generation: AlibabaMultimodalGenerationMethod;
}

export interface AlibabaPostApiV1AigcNamespace {
  videoGeneration: AlibabaPostApiV1VideoGenerationNamespace;
  imageGeneration: AlibabaPostApiV1ImageGenerationNamespace;
  multimodalGeneration: AlibabaPostApiV1MultimodalGenerationNamespace;
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
  uploads: (
    params: AlibabaUploadPolicyParams,
    signal?: AbortSignal
  ) => Promise<AlibabaUploadPolicyResponse>;
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
