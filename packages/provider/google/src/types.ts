import type { z } from "zod";
import type {
  GoogleCountTokensRequest,
  GoogleGenerateContentRequest,
  GoogleRetrieveUserQuotaRequest,
  GoogleRetrieveUserQuotaSummaryRequest,
} from "./zod";

export type {
  GoogleOptions,
  GoogleRetrieveUserQuotaRequest,
  GoogleRetrieveUserQuotaSummaryRequest,
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
  GoogleGenerateContentRequestInput,
  GoogleGenerateContentParsedRequest,
  GoogleCountTokensRequest,
  GoogleCountTokensRequestInput,
  GoogleCountTokensParsedRequest,
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

// ---------- Antigravity / Cloud Code usage (rate-limit utilization) ----------

// A single quota bucket. `remainingFraction` is the share of the window's
// budget still available (0–1); the usage percentage is
// `(1 - remainingFraction) * 100`. Buckets are scoped per model and per
// rolling window — the window length is read off `resetTime` (e.g. a ~5h
// horizon for the session window vs ~1w for the weekly window) and/or
// `tokenType` (REQUESTS for request-count limits, WTUS for token limits).
export interface GoogleQuotaBucket {
  tokenType?: string;
  modelId?: string;
  remainingFraction?: number;
  resetTime?: string;
  [key: string]: unknown;
}

// Response of POST /v1internal:retrieveUserQuota. Each bucket's
// `(1 - remainingFraction) * 100` is the usage percentage the Antigravity
// usage UI renders for that model/window.
export interface GoogleRetrieveUserQuotaResponse {
  buckets?: GoogleQuotaBucket[];
  [key: string]: unknown;
}

// A grouped Antigravity subscription quota bucket. `window` names the quota
// window when returned (for example weekly or five-hour); `remainingFraction`
// is the share still available (0-1).
export interface GoogleQuotaSummaryBucket {
  window?: string;
  remainingFraction?: number;
  resetTime?: string;
  [key: string]: unknown;
}

export interface GoogleQuotaGroup {
  label?: string;
  models?: string[];
  buckets?: GoogleQuotaSummaryBucket[];
  [key: string]: unknown;
}

// Response of POST /v1internal:retrieveUserQuotaSummary. Successful response
// field names are based on the Antigravity quota panel and remain permissive
// until an entitled-token fixture is captured.
export interface GoogleRetrieveUserQuotaSummaryResponse {
  groups?: GoogleQuotaGroup[];
  [key: string]: unknown;
}

export interface GoogleRetrieveUserQuotaMethod {
  (
    req?: GoogleRetrieveUserQuotaRequest,
    signal?: AbortSignal
  ): Promise<GoogleRetrieveUserQuotaResponse>;
  schema: z.ZodType<GoogleRetrieveUserQuotaRequest>;
}

export interface GoogleRetrieveUserQuotaSummaryMethod {
  (
    req?: GoogleRetrieveUserQuotaSummaryRequest,
    signal?: AbortSignal
  ): Promise<GoogleRetrieveUserQuotaSummaryResponse>;
  schema: z.ZodType<GoogleRetrieveUserQuotaSummaryRequest>;
}

export interface GoogleV1InternalNamespace {
  retrieveUserQuota: GoogleRetrieveUserQuotaMethod;
  retrieveUserQuotaSummary: GoogleRetrieveUserQuotaSummaryMethod;
}

export interface GoogleProvider {
  v1: GooglePostV1Namespace;
  v1internal: GoogleV1InternalNamespace;
  post: GooglePostNamespace;
}
