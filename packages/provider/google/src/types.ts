import type { z } from "zod";
import type {
  GoogleCountTokensRequest,
  GoogleFlowAccountsCreateRequest,
  GoogleFlowAssetUploadRequest,
  GoogleFlowCaptchaProvidersRequest,
  GoogleFlowCaptchaStatsRequest,
  GoogleFlowCharactersCreateRequest,
  GoogleFlowCharactersListRequest,
  GoogleFlowEmailRequest,
  GoogleFlowImagesRequest,
  GoogleFlowImagesUpscaleRequest,
  GoogleFlowJobIdRequest,
  GoogleFlowJobsRequest,
  GoogleFlowMediaGenerationIdRequest,
  GoogleFlowNoRequest,
  GoogleFlowRefRequest,
  GoogleFlowVideosConcatenateRequest,
  GoogleFlowVideosExtendRequest,
  GoogleFlowVideosGifRequest,
  GoogleFlowVideosRequest,
  GoogleFlowVideosUpscaleRequest,
  GoogleFlowVoicesCreateRequest,
  GoogleFlowVoicesListRequest,
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
  GoogleGenerateContentRequestInput,
  GoogleGenerateContentParsedRequest,
  GoogleCountTokensRequest,
  GoogleCountTokensRequestInput,
  GoogleCountTokensParsedRequest,
  GoogleFlowNoRequest,
  GoogleFlowEmailRequest,
  GoogleFlowMediaGenerationIdRequest,
  GoogleFlowRefRequest,
  GoogleFlowJobIdRequest,
  GoogleFlowAccountsCreateRequest,
  GoogleFlowCaptchaProvidersRequest,
  GoogleFlowCaptchaStatsRequest,
  GoogleFlowAssetUploadRequest,
  GoogleFlowCharactersCreateRequest,
  GoogleFlowCharactersListRequest,
  GoogleFlowVoicesCreateRequest,
  GoogleFlowVoicesListRequest,
  GoogleFlowImagesRequest,
  GoogleFlowImagesUpscaleRequest,
  GoogleFlowVideosRequest,
  GoogleFlowVideosUpscaleRequest,
  GoogleFlowVideosGifRequest,
  GoogleFlowVideosExtendRequest,
  GoogleFlowVideosConcatenateRequest,
  GoogleFlowJobsRequest,
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

export interface GoogleFlowResponse {
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

export interface GoogleFlowMethod<TRequest extends Record<string, unknown>> {
  (req: TRequest, signal?: AbortSignal): Promise<GoogleFlowResponse>;
  schema: z.ZodType<TRequest>;
}

export interface GoogleFlowPostAccountsMethod extends GoogleFlowMethod<GoogleFlowAccountsCreateRequest> {
  captchaProviders: GoogleFlowMethod<GoogleFlowCaptchaProvidersRequest>;
}

export interface GoogleFlowPostImagesMethod extends GoogleFlowMethod<GoogleFlowImagesRequest> {
  upscale: GoogleFlowMethod<GoogleFlowImagesUpscaleRequest>;
}

export interface GoogleFlowPostVideosMethod extends GoogleFlowMethod<GoogleFlowVideosRequest> {
  upscale: GoogleFlowMethod<GoogleFlowVideosUpscaleRequest>;
  gif: GoogleFlowMethod<GoogleFlowVideosGifRequest>;
  extend: GoogleFlowMethod<GoogleFlowVideosExtendRequest>;
  concatenate: GoogleFlowMethod<GoogleFlowVideosConcatenateRequest>;
}

export interface GoogleFlowPostV1Namespace {
  accounts: GoogleFlowPostAccountsMethod;
  assets: GoogleFlowMethod<GoogleFlowAssetUploadRequest>;
  characters: GoogleFlowMethod<GoogleFlowCharactersCreateRequest>;
  voices: GoogleFlowMethod<GoogleFlowVoicesCreateRequest>;
  images: GoogleFlowPostImagesMethod;
  videos: GoogleFlowPostVideosMethod;
}

export interface GoogleFlowGetAccountsMethod extends GoogleFlowMethod<GoogleFlowNoRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowEmailRequest>;
  captchaProviders: GoogleFlowMethod<GoogleFlowNoRequest>;
  captchaStats: GoogleFlowMethod<GoogleFlowCaptchaStatsRequest>;
}

export interface GoogleFlowGetAssetsNamespace {
  retrieve: GoogleFlowMethod<GoogleFlowMediaGenerationIdRequest>;
}

export interface GoogleFlowGetCharactersMethod extends GoogleFlowMethod<GoogleFlowCharactersListRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowRefRequest>;
}

export interface GoogleFlowGetVoicesMethod extends GoogleFlowMethod<GoogleFlowVoicesListRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowRefRequest>;
}

export interface GoogleFlowGetJobsMethod extends GoogleFlowMethod<GoogleFlowJobsRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowJobIdRequest>;
}

export interface GoogleFlowGetV1Namespace {
  accounts: GoogleFlowGetAccountsMethod;
  assets: GoogleFlowGetAssetsNamespace;
  characters: GoogleFlowGetCharactersMethod;
  voices: GoogleFlowGetVoicesMethod;
  jobs: GoogleFlowGetJobsMethod;
}

export interface GoogleFlowDeleteV1Namespace {
  accounts: GoogleFlowMethod<GoogleFlowEmailRequest>;
  characters: GoogleFlowMethod<GoogleFlowRefRequest>;
  voices: GoogleFlowMethod<GoogleFlowRefRequest>;
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
  googleFlow: GoogleFlowPostV1Namespace;
}

export interface GooglePostNamespace {
  v1: GooglePostV1Namespace;
}

export interface GoogleGetV1Namespace {
  googleFlow: GoogleFlowGetV1Namespace;
}

export interface GoogleGetNamespace {
  v1: GoogleGetV1Namespace;
}

export interface GoogleDeleteV1Namespace {
  googleFlow: GoogleFlowDeleteV1Namespace;
}

export interface GoogleDeleteNamespace {
  v1: GoogleDeleteV1Namespace;
}

export interface GoogleProvider {
  v1: GooglePostV1Namespace;
  post: GooglePostNamespace;
  get: GoogleGetNamespace;
  delete: GoogleDeleteNamespace;
}
