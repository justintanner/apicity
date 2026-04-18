import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  FalOptions,
  FalEstimateRequest,
  FalQueueSubmitParams,
  FalLogsStreamParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalDeletePayloadsParams,
  FalSeedance2p0ImageToVideoParams,
  FalSeedance2p0TextToVideoParams,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProEditParams,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2EditParams,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteTextToImageParams,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalWanV2p7TextToImageParams,
  FalWanV2p7EditParams,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageEditParams,
} from "./zod";

// Re-import for use in this file's interface definitions
import type {
  FalEstimateRequest,
  FalQueueSubmitParams,
  FalLogsStreamParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalDeletePayloadsParams,
  FalSeedance2p0ImageToVideoParams,
  FalSeedance2p0TextToVideoParams,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProEditParams,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2EditParams,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteTextToImageParams,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalWanV2p7TextToImageParams,
  FalWanV2p7EditParams,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageEditParams,
} from "./zod";

// Error types returned by fal API
export type FalErrorType =
  | "authorization_error"
  | "validation_error"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "not_implemented";

// Error class
export class FalError extends Error {
  readonly status: number;
  readonly type: FalErrorType;
  readonly request_id?: string;
  readonly docs_url?: string;
  readonly body: unknown;

  constructor(
    message: string,
    status: number,
    type: FalErrorType,
    request_id?: string,
    docs_url?: string,
    body?: unknown
  ) {
    super(message);
    this.name = "FalError";
    this.status = status;
    this.type = type;
    this.request_id = request_id;
    this.docs_url = docs_url;
    this.body = body ?? null;
  }
}

// Pagination parameters
export interface FalPaginatedParams {
  limit?: number;
  cursor?: string;
}

// Time range parameters
export interface FalTimeRangeParams {
  start?: string;
  end?: string;
  timezone?: string;
  timeframe?: "minute" | "hour" | "day" | "week" | "month";
  bound_to_timeframe?: boolean;
}

// ==================== Models ====================

// Model search parameters
export interface FalModelSearchParams extends FalPaginatedParams {
  endpoint_id?: string | string[];
  q?: string;
  category?: string;
  status?: "active" | "deprecated";
  expand?: string[];
}

// Model group information
export interface FalModelGroup {
  key: string;
  label: string;
}

// Model metadata
export interface FalModelMetadata {
  display_name: string;
  category: string;
  description: string;
  status: "active" | "deprecated";
  tags: string[];
  updated_at: string;
  is_favorited: boolean | null;
  thumbnail_url: string;
  thumbnail_animated_url?: string;
  model_url: string;
  github_url?: string;
  license_type?: "commercial" | "research" | "private";
  date: string;
  group?: FalModelGroup;
  highlighted: boolean;
  kind?: "inference" | "training";
  training_endpoint_ids?: string[];
  inference_endpoint_ids?: string[];
  stream_url?: string;
  duration_estimate?: number;
  pinned: boolean;
}

// OpenAPI specification or error
export interface FalOpenApiSpec {
  openapi: string;
  [key: string]: unknown;
}

export interface FalOpenApiError {
  error: {
    code: string;
    message: string;
  };
}

// Model information
export interface FalModel {
  endpoint_id: string;
  metadata?: FalModelMetadata;
  openapi?: FalOpenApiSpec | FalOpenApiError;
}

// Model search response
export interface FalModelSearchResponse {
  models: FalModel[];
  next_cursor: string | null;
  has_more: boolean;
}

// ==================== Pricing ====================

// Pricing parameters
export interface FalPricingParams {
  endpoint_id: string | string[];
}

// Price information for a model
export interface FalPrice {
  endpoint_id: string;
  unit_price: number;
  unit: string;
  currency: string;
}

// Pricing response
export interface FalPricingResponse {
  prices: FalPrice[];
  next_cursor: string | null;
  has_more: boolean;
}

// ==================== Cost Estimation ====================

// Estimate response
export interface FalEstimateResponse {
  estimate_type: "historical_api_price" | "unit_price";
  total_cost: number;
  currency: string;
}

// ==================== Usage ====================

// Usage parameters
export interface FalUsageParams extends FalPaginatedParams, FalTimeRangeParams {
  endpoint_id?: string | string[];
  expand?: string[];
}

// Usage record
export interface FalUsageRecord {
  endpoint_id: string;
  unit: string;
  quantity: number;
  unit_price: number;
  cost: number;
  currency: string;
  auth_method?: string;
}

// Usage time bucket
export interface FalUsageBucket {
  bucket: string;
  results: FalUsageRecord[];
}

// Usage response
export interface FalUsageResponse {
  next_cursor: string | null;
  has_more: boolean;
  time_series?: FalUsageBucket[];
  summary?: FalUsageRecord[];
}

// ==================== Analytics ====================

// Analytics parameters
export interface FalAnalyticsParams
  extends FalPaginatedParams, FalTimeRangeParams {
  endpoint_id: string | string[];
  expand?: string[];
}

// Analytics record
export interface FalAnalyticsRecord {
  endpoint_id: string;
  request_count?: number;
  success_count?: number;
  user_error_count?: number;
  error_count?: number;
  p50_duration?: number;
  p75_duration?: number;
  p90_duration?: number;
  p50_prepare_duration?: number;
  p75_prepare_duration?: number;
  p90_prepare_duration?: number;
}

// Analytics time bucket
export interface FalAnalyticsBucket {
  bucket: string;
  results: FalAnalyticsRecord[];
}

// Analytics response
export interface FalAnalyticsResponse {
  next_cursor: string | null;
  has_more: boolean;
  time_series?: FalAnalyticsBucket[];
  summary?: FalAnalyticsRecord[];
}

// ==================== Requests ====================

// Requests parameters
export interface FalRequestsParams extends FalPaginatedParams {
  endpoint_id: string;
  start?: string;
  end?: string;
  status?: "success" | "error" | "user_error";
  request_id?: string;
  expand?: string[];
  sort_by?: "ended_at" | "duration";
}

// Request item
export interface FalRequestItem {
  request_id: string;
  endpoint_id: string;
  started_at: string;
  sent_at: string;
  ended_at?: string;
  status_code?: number;
  duration?: number;
  json_input?: unknown;
  json_output?: unknown;
}

// Requests response
export interface FalRequestsResponse {
  next_cursor: string | null;
  has_more: boolean;
  items: FalRequestItem[];
}

// ==================== Delete Payloads ====================

// CDN delete result
export interface FalCdnDeleteResult {
  link: string;
  exception: string | null;
}

// Delete payloads response
export interface FalDeletePayloadsResponse {
  cdn_delete_results: FalCdnDeleteResult[];
}

// ==================== Workflows ====================

// Workflow list parameters
export interface FalWorkflowListParams extends FalPaginatedParams {
  search?: string;
  used_endpoint_ids?: string | string[];
}

// Workflow list item
export interface FalWorkflowListItem {
  name: string;
  title: string;
  user_nickname: string;
  created_at: string;
  thumbnail_url?: string;
  description?: string;
  tags: string[];
  endpoint_ids: string[];
}

// Workflow list response
export interface FalWorkflowListResponse {
  workflows: FalWorkflowListItem[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
}

// Workflow get parameters
export interface FalWorkflowGetParams {
  username: string;
  workflow_name: string;
}

// Workflow detail
export interface FalWorkflowDetail {
  name: string;
  title: string;
  user_nickname: string;
  created_at: string;
  is_public: boolean;
  contents: Record<string, unknown>;
}

// Workflow get response
export interface FalWorkflowGetResponse {
  workflow: FalWorkflowDetail;
}

// ==================== fal.run inference models ====================

// Generic file output returned by fal.run inference models
export interface FalFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

// ==================== ElevenLabs Speech to Text Scribe V2 ====================

// Transcription word details
export interface FalTranscriptionWord {
  text: string;
  start: number;
  end: number;
  speaker_id: string;
  type: "word" | "spacing" | "audio_event";
}

// ElevenLabs Scribe V2 speech-to-text response
export interface FalElevenlabsSpeechToTextScribeV2Response {
  text: string;
  language_code: string;
  language_probability: number;
  words: FalTranscriptionWord[];
}

// ByteDance Seedance 2.0 image-to-video
export type FalSeedanceResolution = "480p" | "720p";
export type FalSeedanceDuration =
  | "auto"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15";
export type FalSeedanceAspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16";

export interface FalSeedance2p0ImageToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0TextToVideoResponse {
  video: FalFile;
  seed: number;
}

// Nano Banana Pro image generation and editing (Google state-of-the-art image model)
export type FalNanoBananaProAspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16";

export type FalNanoBananaProOutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBananaProSafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export type FalNanoBananaProResolution = "1K" | "2K" | "4K";

export interface FalNanoBananaProTextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBananaProEditResponse {
  images: FalFile[];
  description: string;
}

// Nano Banana 2 image generation and editing (Google's newer state-of-the-art image model)
export type FalNanoBanana2AspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16"
  | "4:1"
  | "1:4"
  | "8:1"
  | "1:8";

export type FalNanoBanana2OutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBanana2SafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export type FalNanoBanana2Resolution = "0.5K" | "1K" | "2K" | "4K";

export type FalNanoBanana2ThinkingLevel = "minimal" | "high";

export interface FalNanoBanana2TextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBanana2EditResponse {
  images: FalFile[];
  description: string;
}

// Bytedance Seedream v5 Lite image editing
export type FalSeedreamV5LiteImageSize =
  | "auto_2K"
  | "auto_4K"
  | { width: number; height: number };

export interface FalSeedreamV5LiteEditResponse {
  images: FalFile[];
  seed: number;
}

// Bytedance Seedream v5 Lite text-to-image
export interface FalSeedreamV5LiteTextToImageResponse {
  images: FalFile[];
  seed: number;
}

// Wan v2.7 text-to-image
export type FalWanImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | { width: number; height: number };

export interface FalWanV2p7TextToImageResponse {
  images: FalFile[];
  generated_text?: string;
  seed: number;
}

export interface FalWanV2p7EditResponse {
  images: FalFile[];
  seed: number;
}

// xAI Grok Imagine Image
export type FalXaiGrokImagineImageAspectRatio =
  | "2:1"
  | "20:9"
  | "19.5:9"
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16"
  | "9:19.5"
  | "9:20"
  | "1:2";

export type FalXaiGrokImagineImageResolution = "1k" | "2k";

export type FalXaiGrokImagineImageOutputFormat = "jpeg" | "png" | "webp";

export interface FalXaiGrokImagineImageResponse {
  images: FalFile[];
  revised_prompt: string;
}

export interface FalXaiGrokImagineImageEditResponse {
  images: FalFile[];
  revised_prompt: string;
}

// ==================== Serverless Logs ====================

// Label filter for log queries
export interface FalLabelFilter {
  key: string;
  value: string | string[];
  condition_type?: "equals" | "in" | "not_equals" | "not_in";
}

// Run source for serverless logs
export type FalRunSource = "grpc-run" | "grpc-register" | "gateway" | "cron";

// Log entry returned by stream events
export interface FalLogEntry {
  timestamp: string;
  level: string;
  message: string;
  app: string;
  revision: string;
  labels?: Record<string, string>;
}

// ==================== Serverless Files ====================

// File/directory item in a listing
export interface FalFileItem {
  path: string;
  name: string;
  created_time: string;
  updated_time: string;
  is_file: boolean;
  size: number;
  checksum_sha256?: string;
  checksum_md5?: string;
}

// List files parameters
export interface FalFilesListParams {
  dir?: string;
}

// ==================== Queue ====================

// Queue submit response
export interface FalQueueSubmitResponse {
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
  queue_position: number;
}

// Queue status parameters
export interface FalQueueStatusParams {
  endpoint_id: string;
  request_id: string;
  logs?: boolean;
}

// Queue log entry
export interface FalQueueLog {
  message: string;
  level: "STDERR" | "STDOUT" | "ERROR" | "INFO" | "WARN" | "DEBUG";
  source: string;
  timestamp: string;
}

// Queue metrics
export interface FalQueueMetrics {
  inference_time: number | null;
}

// Queue status: IN_QUEUE
export interface FalQueueInQueueStatus {
  status: "IN_QUEUE";
  request_id: string;
  response_url: string;
  queue_position: number;
}

// Queue status: IN_PROGRESS
export interface FalQueueInProgressStatus {
  status: "IN_PROGRESS";
  request_id: string;
  response_url: string;
  logs?: FalQueueLog[];
}

// Queue status: COMPLETED
export interface FalQueueCompletedStatus {
  status: "COMPLETED";
  request_id: string;
  response_url: string;
  logs?: FalQueueLog[];
  metrics?: FalQueueMetrics;
  error?: string;
  error_type?: string;
}

// Queue status response (discriminated union)
export type FalQueueStatusResponse =
  | FalQueueInQueueStatus
  | FalQueueInProgressStatus
  | FalQueueCompletedStatus;

// ==================== Serverless Apps Queue ====================

// Get queue size parameters
export interface FalAppsQueueParams {
  owner: string;
  name: string;
}

// Get queue size response
export interface FalAppsQueueResponse {
  queue_size: number;
}

// ==================== Provider ====================

// Namespace types
interface FalPricingEstimateMethod {
  (req: FalEstimateRequest, signal?: AbortSignal): Promise<FalEstimateResponse>;
  schema: z.ZodType<FalEstimateRequest>;
}

interface FalModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
  estimate: FalPricingEstimateMethod;
}

interface FalDeletePayloadsMethod {
  (
    params: FalDeletePayloadsParams,
    signal?: AbortSignal
  ): Promise<FalDeletePayloadsResponse>;
  schema: z.ZodType<FalDeletePayloadsParams>;
}

interface FalModelsRequestsNamespace {
  byEndpoint(
    params: FalRequestsParams,
    signal?: AbortSignal
  ): Promise<FalRequestsResponse>;
  payloads: FalDeletePayloadsMethod;
}

interface FalModelsNamespace {
  (
    params?: FalModelSearchParams,
    signal?: AbortSignal
  ): Promise<FalModelSearchResponse>;
  pricing: FalModelsPricingNamespace;
  usage(
    params?: FalUsageParams,
    signal?: AbortSignal
  ): Promise<FalUsageResponse>;
  analytics(
    params: FalAnalyticsParams,
    signal?: AbortSignal
  ): Promise<FalAnalyticsResponse>;
  requests: FalModelsRequestsNamespace;
}

interface FalQueueSubmitMethod {
  (
    params: FalQueueSubmitParams,
    signal?: AbortSignal
  ): Promise<FalQueueSubmitResponse>;
  schema: z.ZodType<FalQueueSubmitParams>;
}

interface FalQueueNamespace {
  submit: FalQueueSubmitMethod;
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
}

// Serverless logs namespace types
interface FalLogsStreamMethod {
  (
    params?: FalLogsStreamParams,
    body?: FalLabelFilter[],
    signal?: AbortSignal
  ): Promise<AsyncIterable<FalLogEntry>>;
  schema: z.ZodType<FalLogsStreamParams>;
}

interface FalServerlessLogsNamespace {
  stream: FalLogsStreamMethod;
}

// Serverless files namespace types
interface FalFilesUploadUrlMethod {
  (params: FalFilesUploadUrlParams, signal?: AbortSignal): Promise<boolean>;
  schema: z.ZodType<FalFilesUploadUrlParams>;
}

interface FalFilesUploadLocalMethod {
  (params: FalFilesUploadLocalParams, signal?: AbortSignal): Promise<boolean>;
  schema: z.ZodType<FalFilesUploadLocalParams>;
}

interface FalServerlessFilesNamespace {
  list(
    params?: FalFilesListParams,
    signal?: AbortSignal
  ): Promise<FalFileItem[]>;
  uploadUrl: FalFilesUploadUrlMethod;
  uploadLocal: FalFilesUploadLocalMethod;
}

interface FalServerlessAppsQueueNamespace {
  (
    params: FalAppsQueueParams,
    signal?: AbortSignal
  ): Promise<FalAppsQueueResponse>;
}

interface FalServerlessAppsNamespace {
  queue: FalServerlessAppsQueueNamespace;
}

interface FalServerlessNamespace {
  logs: FalServerlessLogsNamespace;
  files: FalServerlessFilesNamespace;
  apps: FalServerlessAppsNamespace;
  metrics(signal?: AbortSignal): Promise<string>;
}

interface FalWorkflowsNamespace {
  (
    params?: FalWorkflowListParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowListResponse>;
  get(
    params: FalWorkflowGetParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowGetResponse>;
}

interface FalV1Namespace {
  models: FalModelsNamespace;
  queue: FalQueueNamespace;
  serverless: FalServerlessNamespace;
  workflows: FalWorkflowsNamespace;
}

// ==================== fal.run run-namespace ====================

type FalSeedance2p0ImageToVideoFn = ((
  params: FalSeedance2p0ImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ImageToVideoResponse>) & {
  schema: z.ZodType<FalSeedance2p0ImageToVideoParams>;
};

type FalSeedance2p0TextToVideoFn = ((
  params: FalSeedance2p0TextToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0TextToVideoResponse>) & {
  schema: z.ZodType<FalSeedance2p0TextToVideoParams>;
};

export interface FalRunBytedanceSeedance2p0Namespace {
  imageToVideo: FalSeedance2p0ImageToVideoFn;
  textToVideo: FalSeedance2p0TextToVideoFn;
}

export interface FalRunBytedanceSeedreamV5LiteNamespace {
  edit: FalSeedreamV5LiteEditFn;
  textToImage: FalSeedreamV5LiteTextToImageFn;
}

export interface FalRunBytedanceSeedreamV5Namespace {
  lite: FalRunBytedanceSeedreamV5LiteNamespace;
}

export interface FalRunBytedanceSeedreamNamespace {
  v5: FalRunBytedanceSeedreamV5Namespace;
}

export interface FalRunBytedanceNamespace {
  seedance2p0: FalRunBytedanceSeedance2p0Namespace;
  seedream: FalRunBytedanceSeedreamNamespace;
}

type FalNanoBananaProEditFn = ((
  params: FalNanoBananaProEditParams,
  signal?: AbortSignal
) => Promise<FalNanoBananaProEditResponse>) & {
  schema: z.ZodType<FalNanoBananaProEditParams>;
};

type FalNanoBananaProTextToImageFn = ((
  params: FalNanoBananaProTextToImageParams,
  signal?: AbortSignal
) => Promise<FalNanoBananaProTextToImageResponse>) & {
  schema: z.ZodType<FalNanoBananaProTextToImageParams>;
};

export interface FalRunNanoBananaProNamespace {
  textToImage: FalNanoBananaProTextToImageFn;
  edit: FalNanoBananaProEditFn;
}

type FalNanoBanana2TextToImageFn = ((
  params: FalNanoBanana2TextToImageParams,
  signal?: AbortSignal
) => Promise<FalNanoBanana2TextToImageResponse>) & {
  schema: z.ZodType<FalNanoBanana2TextToImageParams>;
};

type FalNanoBanana2EditFn = ((
  params: FalNanoBanana2EditParams,
  signal?: AbortSignal
) => Promise<FalNanoBanana2EditResponse>) & {
  schema: z.ZodType<FalNanoBanana2EditParams>;
};

export interface FalRunNanoBanana2Namespace {
  textToImage: FalNanoBanana2TextToImageFn;
  edit: FalNanoBanana2EditFn;
}

type FalSeedreamV5LiteEditFn = ((
  params: FalSeedreamV5LiteEditParams,
  signal?: AbortSignal
) => Promise<FalSeedreamV5LiteEditResponse>) & {
  schema: z.ZodType<FalSeedreamV5LiteEditParams>;
};

type FalSeedreamV5LiteTextToImageFn = ((
  params: FalSeedreamV5LiteTextToImageParams,
  signal?: AbortSignal
) => Promise<FalSeedreamV5LiteTextToImageResponse>) & {
  schema: z.ZodType<FalSeedreamV5LiteTextToImageParams>;
};

type FalWanV2p7TextToImageFn = ((
  params: FalWanV2p7TextToImageParams,
  signal?: AbortSignal
) => Promise<FalWanV2p7TextToImageResponse>) & {
  schema: z.ZodType<FalWanV2p7TextToImageParams>;
};

type FalWanV2p7EditFn = ((
  params: FalWanV2p7EditParams,
  signal?: AbortSignal
) => Promise<FalWanV2p7EditResponse>) & {
  schema: z.ZodType<FalWanV2p7EditParams>;
};

export interface FalRunWanV2p7ProNamespace {
  textToImage: FalWanV2p7TextToImageFn;
  edit: FalWanV2p7EditFn;
}

export interface FalRunWanV2p7Namespace {
  textToImage: FalWanV2p7TextToImageFn;
  edit: FalWanV2p7EditFn;
  pro: FalRunWanV2p7ProNamespace;
}

export interface FalRunWanNamespace {
  v2p7: FalRunWanV2p7Namespace;
}

type FalXaiGrokImagineImageEditFn = ((
  params: FalXaiGrokImagineImageEditParams,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageEditResponse>) & {
  schema: z.ZodType<FalXaiGrokImagineImageEditParams>;
};

type FalXaiGrokImagineImageFn = ((
  params: FalXaiGrokImagineImageParams,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageResponse>) & {
  schema: z.ZodType<FalXaiGrokImagineImageParams>;
  edit: FalXaiGrokImagineImageEditFn;
};

export interface FalRunXaiNamespace {
  grokImagineImage: FalXaiGrokImagineImageFn;
}

export interface FalRunNamespace {
  bytedance: FalRunBytedanceNamespace;
  nanoBananaPro: FalRunNanoBananaProNamespace;
  nanoBanana2: FalRunNanoBanana2Namespace;
  falAi: FalRunFalAiNamespace;
  wan: FalRunWanNamespace;
  xai: FalRunXaiNamespace;
}

// ==================== fal.run fal-ai namespace ====================

type FalElevenlabsSpeechToTextScribeV2Fn = ((
  params: FalElevenlabsSpeechToTextScribeV2Params,
  signal?: AbortSignal
) => Promise<FalElevenlabsSpeechToTextScribeV2Response>) & {
  schema: z.ZodType<FalElevenlabsSpeechToTextScribeV2Params>;
};

export interface FalRunElevenlabsSpeechToTextNamespace {
  scribeV2: FalElevenlabsSpeechToTextScribeV2Fn;
}

export interface FalRunElevenlabsNamespace {
  speechToText: FalRunElevenlabsSpeechToTextNamespace;
}

export interface FalRunFalAiNamespace {
  elevenlabs: FalRunElevenlabsNamespace;
}

// ==================== Verb-Prefixed API Surface ====================

// GET v1 namespace
interface FalGetV1ModelsNamespace {
  (
    params?: FalModelSearchParams,
    signal?: AbortSignal
  ): Promise<FalModelSearchResponse>;
  pricing: FalModelsPricingNamespace;
  usage(
    params?: FalUsageParams,
    signal?: AbortSignal
  ): Promise<FalUsageResponse>;
  analytics(
    params: FalAnalyticsParams,
    signal?: AbortSignal
  ): Promise<FalAnalyticsResponse>;
  requests: FalModelsRequestsNamespace;
}

interface FalGetV1QueueNamespace {
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
}

interface FalGetV1ServerlessFilesNamespace {
  list(
    params?: FalFilesListParams,
    signal?: AbortSignal
  ): Promise<FalFileItem[]>;
}

interface FalGetV1ServerlessAppsNamespace {
  queue(
    params: FalAppsQueueParams,
    signal?: AbortSignal
  ): Promise<FalAppsQueueResponse>;
}

interface FalGetV1ServerlessNamespace {
  files: FalGetV1ServerlessFilesNamespace;
  apps: FalGetV1ServerlessAppsNamespace;
  metrics(signal?: AbortSignal): Promise<string>;
}

interface FalGetV1WorkflowsNamespace {
  (
    params?: FalWorkflowListParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowListResponse>;
  get(
    params: FalWorkflowGetParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowGetResponse>;
}

interface FalGetV1Namespace {
  models: FalGetV1ModelsNamespace;
  queue: FalGetV1QueueNamespace;
  serverless: FalGetV1ServerlessNamespace;
  workflows: FalGetV1WorkflowsNamespace;
}

// POST v1 namespace
interface FalPostV1ModelsPricingNamespace {
  estimate: FalPricingEstimateMethod;
}

interface FalPostV1ModelsNamespace {
  pricing: FalPostV1ModelsPricingNamespace;
}

interface FalPostV1QueueNamespace {
  submit: FalQueueSubmitMethod;
}

interface FalPostV1ServerlessFilesNamespace {
  uploadUrl: FalFilesUploadUrlMethod;
  uploadLocal: FalFilesUploadLocalMethod;
}

interface FalPostV1ServerlessNamespace {
  files: FalPostV1ServerlessFilesNamespace;
}

interface FalPostV1Namespace {
  models: FalPostV1ModelsNamespace;
  queue: FalPostV1QueueNamespace;
  serverless: FalPostV1ServerlessNamespace;
}

// POST stream v1 namespace
interface FalPostStreamV1ServerlessLogsNamespace {
  stream: FalLogsStreamMethod;
}

interface FalPostStreamV1ServerlessNamespace {
  logs: FalPostStreamV1ServerlessLogsNamespace;
}

interface FalPostStreamV1Namespace {
  serverless: FalPostStreamV1ServerlessNamespace;
}

interface FalPostStreamNamespace {
  v1: FalPostStreamV1Namespace;
}

// DELETE v1 namespace
interface FalDeleteV1ModelsRequestsNamespace {
  payloads: FalDeletePayloadsMethod;
}

interface FalDeleteV1ModelsNamespace {
  requests: FalDeleteV1ModelsRequestsNamespace;
}

interface FalDeleteV1Namespace {
  models: FalDeleteV1ModelsNamespace;
}

// Verb-prefixed root namespaces
interface FalGetNamespace {
  v1: FalGetV1Namespace;
}

interface FalPostNamespace {
  v1: FalPostV1Namespace;
  run: FalRunNamespace;
  stream: FalPostStreamNamespace;
}

interface FalDeleteNamespace {
  v1: FalDeleteV1Namespace;
}

// Provider interface
export interface FalProvider {
  v1: FalV1Namespace;
  run: FalRunNamespace;
  get: FalGetNamespace;
  post: FalPostNamespace;
  delete: FalDeleteNamespace;
}
