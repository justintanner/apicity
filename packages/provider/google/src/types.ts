import type { z } from "zod";
import type {
  GoogleCountTokensRequest,
  GoogleGenerateContentRequest,
} from "./zod";

export type {
  GoogleOptions,
  GoogleBlob,
  GoogleFileData,
  GoogleFunctionCall,
  GoogleFunctionResponse,
  GooglePart,
  GoogleContent,
  GoogleSafetySetting,
  GoogleGenerationConfig,
  GoogleFunctionDeclaration,
  GoogleTool,
  GoogleToolConfig,
  GoogleGenerateContentRequest,
  GoogleCountTokensRequest,
} from "./zod";

export class GoogleError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "GoogleError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

export interface GoogleCandidate {
  content?: import("./zod").GoogleContent;
  finishReason?: string;
  safetyRatings?: Array<Record<string, unknown>>;
  citationMetadata?: Record<string, unknown>;
  groundingMetadata?: Record<string, unknown>;
  avgLogprobs?: number;
  index?: number;
  logprobsResult?: Record<string, unknown>;
}

export interface GooglePromptFeedback {
  blockReason?: string;
  safetyRatings?: Array<Record<string, unknown>>;
  blockReasonMessage?: string;
}

export interface GoogleUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  cachedContentTokenCount?: number;
  thoughtsTokenCount?: number;
  [key: string]: unknown;
}

export interface GoogleGenerateContentResponse {
  candidates?: GoogleCandidate[];
  promptFeedback?: GooglePromptFeedback;
  usageMetadata?: GoogleUsageMetadata;
  modelVersion?: string;
  responseId?: string;
  [key: string]: unknown;
}

export interface GoogleModalityTokenCount {
  modality?: string;
  tokenCount?: number;
  [key: string]: unknown;
}

export interface GoogleCountTokensResponse {
  totalTokens?: number;
  totalBillableCharacters?: number;
  promptTokensDetails?: GoogleModalityTokenCount[];
  [key: string]: unknown;
}

export interface GoogleGenerateContentMethod {
  (
    model: string,
    req: GoogleGenerateContentRequest,
    signal?: AbortSignal
  ): Promise<GoogleGenerateContentResponse>;
  schema: z.ZodType<GoogleGenerateContentRequest>;
}

export interface GoogleCountTokensMethod {
  (
    model: string,
    req: GoogleCountTokensRequest,
    signal?: AbortSignal
  ): Promise<GoogleCountTokensResponse>;
  schema: z.ZodType<GoogleCountTokensRequest>;
}

export interface GooglePostV1PublishersGoogleModelsNamespace {
  countTokens: GoogleCountTokensMethod;
  generateContent: GoogleGenerateContentMethod;
}

export interface GooglePostV1PublishersGoogleNamespace {
  models: GooglePostV1PublishersGoogleModelsNamespace;
}

export interface GooglePostV1PublishersNamespace {
  google: GooglePostV1PublishersGoogleNamespace;
}

export interface GooglePostV1Namespace {
  publishers: GooglePostV1PublishersNamespace;
}

export interface GooglePostNamespace {
  v1: GooglePostV1Namespace;
}

export interface GoogleProvider {
  v1: GooglePostV1Namespace;
  post: GooglePostNamespace;
}
