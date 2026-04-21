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
  FalSeedance2p0FastImageToVideoParams,
  FalSeedance2p0FastTextToVideoParams,
  FalSeedance2p0ReferenceToVideoParams,
  FalSeedance2p0FastReferenceToVideoParams,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProEditParams,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2EditParams,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteTextToImageParams,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalWanV2p7TextToImageParams,
  FalWanV2p7EditParams,
  FalWanV2p7TextToVideoParams,
  FalWanV2p7ImageToVideoParams,
  FalWanV2p7ReferenceToVideoParams,
  FalWanV2p7EditVideoParams,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageEditParams,
  FalQwenImageParams,
  FalQwenImageEditParams,
  FalGptImage1p5Params,
  FalGptImage1p5EditParams,
  FalNanoBananaTextToImageParams,
  FalNanoBananaEditParams,
  FalXaiGrokImagineVideoImageToVideoParams,
  FalXaiGrokImagineVideoReferenceToVideoParams,
  FalXaiGrokImagineVideoExtendVideoParams,
  FalXaiGrokImagineVideoEditVideoParams,
  FalVeo3p1TextToVideoParams,
  FalVeo3p1ImageToVideoParams,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalKlingVideoV3ProImageToVideoParams,
  FalKlingVideoV3ProTextToVideoParams,
  FalKlingVideoV3StandardImageToVideoParams,
  FalKlingVideoV3StandardTextToVideoParams,
  FalSora2TextToVideoParams,
  FalSora2ImageToVideoParams,
  FalHunyuanImageV3InstructEditParams,
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
  FalSeedance2p0FastImageToVideoParams,
  FalSeedance2p0FastTextToVideoParams,
  FalSeedance2p0ReferenceToVideoParams,
  FalSeedance2p0FastReferenceToVideoParams,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProEditParams,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2EditParams,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteTextToImageParams,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalWanV2p7TextToImageParams,
  FalWanV2p7EditParams,
  FalWanV2p7TextToVideoParams,
  FalWanV2p7ImageToVideoParams,
  FalWanV2p7ReferenceToVideoParams,
  FalWanV2p7EditVideoParams,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageEditParams,
  FalQwenImageParams,
  FalQwenImageEditParams,
  FalGptImage1p5Params,
  FalGptImage1p5EditParams,
  FalNanoBananaTextToImageParams,
  FalNanoBananaEditParams,
  FalXaiGrokImagineVideoImageToVideoParams,
  FalXaiGrokImagineVideoReferenceToVideoParams,
  FalXaiGrokImagineVideoExtendVideoParams,
  FalXaiGrokImagineVideoEditVideoParams,
  FalVeo3p1TextToVideoParams,
  FalVeo3p1ImageToVideoParams,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalKlingVideoV3ProImageToVideoParams,
  FalKlingVideoV3ProTextToVideoParams,
  FalKlingVideoV3StandardImageToVideoParams,
  FalKlingVideoV3StandardTextToVideoParams,
  FalSora2TextToVideoParams,
  FalSora2ImageToVideoParams,
  FalHunyuanImageV3InstructEditParams,
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

// Video file output — fal video models include media metadata alongside FalFile
export interface FalVideoFile extends FalFile {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  num_frames?: number;
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

export interface FalSeedance2p0FastImageToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0FastTextToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0ReferenceToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0FastReferenceToVideoResponse {
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

// Qwen Image (text-to-image and edit)
export type FalQwenImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | { width: number; height: number };

export type FalQwenImageOutputFormat = "jpeg" | "png";

export type FalQwenImageAcceleration = "none" | "regular" | "high";

export interface FalQwenImageResponse {
  images: FalFile[];
  timings: Record<string, unknown>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export interface FalQwenImageEditResponse {
  images: FalFile[];
  timings: Record<string, unknown>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

// GPT Image 1.5 (text-to-image and edit)
export type FalGptImage1p5ImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export type FalGptImage1p5EditImageSize =
  | "auto"
  | "1024x1024"
  | "1536x1024"
  | "1024x1536";

export type FalGptImage1p5Background = "auto" | "transparent" | "opaque";

export type FalGptImage1p5Quality = "low" | "medium" | "high";

export type FalGptImage1p5OutputFormat = "jpeg" | "png" | "webp";

export type FalGptImage1p5InputFidelity = "low" | "high";

export interface FalGptImage1p5Response {
  images: FalFile[];
}

export interface FalGptImage1p5EditResponse {
  images: FalFile[];
}

// Nano Banana (original variant, text-to-image and edit)
export type FalNanoBananaAspectRatio =
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

export type FalNanoBananaEditAspectRatio = "auto" | FalNanoBananaAspectRatio;

export type FalNanoBananaOutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBananaSafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export interface FalNanoBananaTextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBananaEditResponse {
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

// Hunyuan Image v3 Instruct Edit
export type FalHunyuanImageV3ImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | "auto"
  | { width: number; height: number };

export interface FalHunyuanImageV3InstructEditResponse {
  images: FalFile[];
  seed: number;
}

export interface FalWanV2p7TextToVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

export interface FalWanV2p7ImageToVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

export interface FalWanV2p7ReferenceToVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

export interface FalWanV2p7EditVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
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

// xAI Grok Imagine Video (image-to-video)
export type FalXaiGrokImagineVideoAspectRatio =
  | "auto"
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16";

export type FalXaiGrokImagineVideoResolution = "480p" | "720p";

export type FalXaiGrokImagineVideoReferenceAspectRatio =
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16";

export interface FalXaiGrokImagineVideoImageToVideoResponse {
  video: FalFile;
}

export interface FalXaiGrokImagineVideoReferenceToVideoResponse {
  video: FalFile;
}

export interface FalXaiGrokImagineVideoExtendVideoResponse {
  video: FalFile;
}

export type FalXaiGrokImagineVideoEditResolution = "auto" | "480p" | "720p";

export interface FalXaiGrokImagineVideoEditVideoResponse {
  video: FalFile;
}

// Google Veo 3.1 (text-to-video and image-to-video)
export type FalVeo3p1AspectRatio = "16:9" | "9:16";

export type FalVeo3p1ImageToVideoAspectRatio = "auto" | FalVeo3p1AspectRatio;

export type FalVeo3p1Duration = "4s" | "6s" | "8s";

export type FalVeo3p1Resolution = "720p" | "1080p" | "4k";

export type FalVeo3p1SafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export interface FalVeo3p1TextToVideoResponse {
  video: FalFile;
}

export interface FalVeo3p1ImageToVideoResponse {
  video: FalFile;
}

// Kling Video v3 Pro (image-to-video)
export interface FalKlingV3MultiPromptElement {
  prompt: string;
  duration?: string;
}

export interface FalKlingV3ComboElementInput {
  frontal_image_url?: string;
  reference_image_urls?: string[];
  video_url?: string;
  voice_id?: string;
}

export interface FalKlingVideoV3ProImageToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoV3ProTextToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoV3StandardImageToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoV3StandardTextToVideoResponse {
  video: FalFile;
}

// OpenAI Sora 2 (text-to-video and image-to-video)
export type FalSora2Model =
  | "sora-2"
  | "sora-2-2025-12-08"
  | "sora-2-2025-10-06";

export type FalSora2AspectRatio = "9:16" | "16:9";

export type FalSora2ImageToVideoAspectRatio = "auto" | FalSora2AspectRatio;

export type FalSora2Resolution = "720p";

export type FalSora2ImageToVideoResolution = "auto" | "720p";

export type FalSora2Duration = 4 | 8 | 12 | 16 | 20;

export interface FalSora2TextToVideoResponse {
  video: FalFile;
  video_id: string;
  thumbnail: FalFile | null;
  spritesheet: FalFile | null;
}

export interface FalSora2ImageToVideoResponse {
  video: FalFile;
  video_id: string;
  thumbnail: FalFile | null;
  spritesheet: FalFile | null;
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

type FalSeedance2p0FastImageToVideoFn = ((
  params: FalSeedance2p0FastImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastImageToVideoResponse>) & {
  schema: z.ZodType<FalSeedance2p0FastImageToVideoParams>;
};

type FalSeedance2p0FastTextToVideoFn = ((
  params: FalSeedance2p0FastTextToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastTextToVideoResponse>) & {
  schema: z.ZodType<FalSeedance2p0FastTextToVideoParams>;
};

type FalSeedance2p0ReferenceToVideoFn = ((
  params: FalSeedance2p0ReferenceToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ReferenceToVideoResponse>) & {
  schema: z.ZodType<FalSeedance2p0ReferenceToVideoParams>;
};

type FalSeedance2p0FastReferenceToVideoFn = ((
  params: FalSeedance2p0FastReferenceToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastReferenceToVideoResponse>) & {
  schema: z.ZodType<FalSeedance2p0FastReferenceToVideoParams>;
};

export interface FalRunBytedanceSeedance2p0FastNamespace {
  imageToVideo: FalSeedance2p0FastImageToVideoFn;
  textToVideo: FalSeedance2p0FastTextToVideoFn;
  referenceToVideo: FalSeedance2p0FastReferenceToVideoFn;
}

export interface FalRunBytedanceSeedance2p0Namespace {
  imageToVideo: FalSeedance2p0ImageToVideoFn;
  textToVideo: FalSeedance2p0TextToVideoFn;
  referenceToVideo: FalSeedance2p0ReferenceToVideoFn;
  fast: FalRunBytedanceSeedance2p0FastNamespace;
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

type FalWanV2p7TextToVideoFn = ((
  params: FalWanV2p7TextToVideoParams,
  signal?: AbortSignal
) => Promise<FalWanV2p7TextToVideoResponse>) & {
  schema: z.ZodType<FalWanV2p7TextToVideoParams>;
};

type FalWanV2p7ImageToVideoFn = ((
  params: FalWanV2p7ImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalWanV2p7ImageToVideoResponse>) & {
  schema: z.ZodType<FalWanV2p7ImageToVideoParams>;
};

type FalWanV2p7ReferenceToVideoFn = ((
  params: FalWanV2p7ReferenceToVideoParams,
  signal?: AbortSignal
) => Promise<FalWanV2p7ReferenceToVideoResponse>) & {
  schema: z.ZodType<FalWanV2p7ReferenceToVideoParams>;
};

type FalWanV2p7EditVideoFn = ((
  params: FalWanV2p7EditVideoParams,
  signal?: AbortSignal
) => Promise<FalWanV2p7EditVideoResponse>) & {
  schema: z.ZodType<FalWanV2p7EditVideoParams>;
};

export interface FalRunWanV2p7ProNamespace {
  textToImage: FalWanV2p7TextToImageFn;
  edit: FalWanV2p7EditFn;
}

export interface FalRunWanV2p7Namespace {
  textToImage: FalWanV2p7TextToImageFn;
  edit: FalWanV2p7EditFn;
  textToVideo: FalWanV2p7TextToVideoFn;
  imageToVideo: FalWanV2p7ImageToVideoFn;
  referenceToVideo: FalWanV2p7ReferenceToVideoFn;
  editVideo: FalWanV2p7EditVideoFn;
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

type FalXaiGrokImagineVideoImageToVideoFn = ((
  params: FalXaiGrokImagineVideoImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoImageToVideoResponse>) & {
  schema: z.ZodType<FalXaiGrokImagineVideoImageToVideoParams>;
};

type FalXaiGrokImagineVideoReferenceToVideoFn = ((
  params: FalXaiGrokImagineVideoReferenceToVideoParams,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoReferenceToVideoResponse>) & {
  schema: z.ZodType<FalXaiGrokImagineVideoReferenceToVideoParams>;
};

type FalXaiGrokImagineVideoExtendVideoFn = ((
  params: FalXaiGrokImagineVideoExtendVideoParams,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoExtendVideoResponse>) & {
  schema: z.ZodType<FalXaiGrokImagineVideoExtendVideoParams>;
};

type FalXaiGrokImagineVideoEditVideoFn = ((
  params: FalXaiGrokImagineVideoEditVideoParams,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoEditVideoResponse>) & {
  schema: z.ZodType<FalXaiGrokImagineVideoEditVideoParams>;
};

export interface FalRunXaiGrokImagineVideoNamespace {
  imageToVideo: FalXaiGrokImagineVideoImageToVideoFn;
  referenceToVideo: FalXaiGrokImagineVideoReferenceToVideoFn;
  extendVideo: FalXaiGrokImagineVideoExtendVideoFn;
  editVideo: FalXaiGrokImagineVideoEditVideoFn;
}

export interface FalRunXaiNamespace {
  grokImagineImage: FalXaiGrokImagineImageFn;
  grokImagineVideo: FalRunXaiGrokImagineVideoNamespace;
}

type FalQwenImageEditFn = ((
  params: FalQwenImageEditParams,
  signal?: AbortSignal
) => Promise<FalQwenImageEditResponse>) & {
  schema: z.ZodType<FalQwenImageEditParams>;
};

type FalQwenImageFn = ((
  params: FalQwenImageParams,
  signal?: AbortSignal
) => Promise<FalQwenImageResponse>) & {
  schema: z.ZodType<FalQwenImageParams>;
  edit: FalQwenImageEditFn;
};

type FalGptImage1p5EditFn = ((
  params: FalGptImage1p5EditParams,
  signal?: AbortSignal
) => Promise<FalGptImage1p5EditResponse>) & {
  schema: z.ZodType<FalGptImage1p5EditParams>;
};

type FalGptImage1p5Fn = ((
  params: FalGptImage1p5Params,
  signal?: AbortSignal
) => Promise<FalGptImage1p5Response>) & {
  schema: z.ZodType<FalGptImage1p5Params>;
  edit: FalGptImage1p5EditFn;
};

type FalNanoBananaTextToImageFn = ((
  params: FalNanoBananaTextToImageParams,
  signal?: AbortSignal
) => Promise<FalNanoBananaTextToImageResponse>) & {
  schema: z.ZodType<FalNanoBananaTextToImageParams>;
};

type FalNanoBananaEditFn = ((
  params: FalNanoBananaEditParams,
  signal?: AbortSignal
) => Promise<FalNanoBananaEditResponse>) & {
  schema: z.ZodType<FalNanoBananaEditParams>;
};

export interface FalRunNanoBananaNamespace {
  textToImage: FalNanoBananaTextToImageFn;
  edit: FalNanoBananaEditFn;
}

type FalVeo3p1TextToVideoFn = ((
  params: FalVeo3p1TextToVideoParams,
  signal?: AbortSignal
) => Promise<FalVeo3p1TextToVideoResponse>) & {
  schema: z.ZodType<FalVeo3p1TextToVideoParams>;
};

type FalVeo3p1ImageToVideoFn = ((
  params: FalVeo3p1ImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalVeo3p1ImageToVideoResponse>) & {
  schema: z.ZodType<FalVeo3p1ImageToVideoParams>;
};

export interface FalRunVeo3p1Namespace {
  textToVideo: FalVeo3p1TextToVideoFn;
  imageToVideo: FalVeo3p1ImageToVideoFn;
}

type FalKlingVideoV3ProImageToVideoFn = ((
  params: FalKlingVideoV3ProImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3ProImageToVideoResponse>) & {
  schema: z.ZodType<FalKlingVideoV3ProImageToVideoParams>;
};

type FalKlingVideoV3ProTextToVideoFn = ((
  params: FalKlingVideoV3ProTextToVideoParams,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3ProTextToVideoResponse>) & {
  schema: z.ZodType<FalKlingVideoV3ProTextToVideoParams>;
};

type FalKlingVideoV3StandardImageToVideoFn = ((
  params: FalKlingVideoV3StandardImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3StandardImageToVideoResponse>) & {
  schema: z.ZodType<FalKlingVideoV3StandardImageToVideoParams>;
};

type FalKlingVideoV3StandardTextToVideoFn = ((
  params: FalKlingVideoV3StandardTextToVideoParams,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3StandardTextToVideoResponse>) & {
  schema: z.ZodType<FalKlingVideoV3StandardTextToVideoParams>;
};

export interface FalRunKlingVideoV3ProNamespace {
  imageToVideo: FalKlingVideoV3ProImageToVideoFn;
  textToVideo: FalKlingVideoV3ProTextToVideoFn;
}

export interface FalRunKlingVideoV3StandardNamespace {
  imageToVideo: FalKlingVideoV3StandardImageToVideoFn;
  textToVideo: FalKlingVideoV3StandardTextToVideoFn;
}

export interface FalRunKlingVideoV3Namespace {
  pro: FalRunKlingVideoV3ProNamespace;
  standard: FalRunKlingVideoV3StandardNamespace;
}

export interface FalRunKlingVideoNamespace {
  v3: FalRunKlingVideoV3Namespace;
}

type FalSora2TextToVideoFn = ((
  params: FalSora2TextToVideoParams,
  signal?: AbortSignal
) => Promise<FalSora2TextToVideoResponse>) & {
  schema: z.ZodType<FalSora2TextToVideoParams>;
};

type FalSora2ImageToVideoFn = ((
  params: FalSora2ImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalSora2ImageToVideoResponse>) & {
  schema: z.ZodType<FalSora2ImageToVideoParams>;
};

export interface FalRunSora2Namespace {
  textToVideo: FalSora2TextToVideoFn;
  imageToVideo: FalSora2ImageToVideoFn;
}

type FalHunyuanImageV3InstructEditFn = ((
  params: FalHunyuanImageV3InstructEditParams,
  signal?: AbortSignal
) => Promise<FalHunyuanImageV3InstructEditResponse>) & {
  schema: z.ZodType<FalHunyuanImageV3InstructEditParams>;
};

export interface FalRunHunyuanV3Namespace {
  instructEdit: FalHunyuanImageV3InstructEditFn;
}

export interface FalRunHunyuanNamespace {
  v3: FalRunHunyuanV3Namespace;
}

export interface FalRunNamespace {
  bytedance: FalRunBytedanceNamespace;
  hunyuan: FalRunHunyuanNamespace;
  klingVideo: FalRunKlingVideoNamespace;
  nanoBanana: FalRunNanoBananaNamespace;
  nanoBananaPro: FalRunNanoBananaProNamespace;
  nanoBanana2: FalRunNanoBanana2Namespace;
  qwenImage: FalQwenImageFn;
  gptImage1p5: FalGptImage1p5Fn;
  sora2: FalRunSora2Namespace;
  veo3p1: FalRunVeo3p1Namespace;
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

// Storage upload (CDN)

export interface FalStorageLifecycle {
  expiration_duration_seconds: number;
  allow_io_storage?: boolean;
}

export interface FalStorageUploadInitiateResponse {
  file_url: string;
  upload_url: string;
}

export interface FalStorageUploadPartResponse {
  partNumber: number;
  etag: string;
}

type FalStorageUploadInitiateFn = ((
  params: FalStorageUploadInitiateParams,
  signal?: AbortSignal
) => Promise<FalStorageUploadInitiateResponse>) & {
  schema: z.ZodType<FalStorageUploadInitiateParams>;
};

type FalStorageUploadInitiateMultipartFn = ((
  params: FalStorageUploadInitiateMultipartParams,
  signal?: AbortSignal
) => Promise<FalStorageUploadInitiateResponse>) & {
  schema: z.ZodType<FalStorageUploadInitiateMultipartParams>;
};

type FalStorageUploadCompleteMultipartFn = ((
  params: FalStorageUploadCompleteMultipartParams,
  signal?: AbortSignal
) => Promise<Response>) & {
  schema: z.ZodType<FalStorageUploadCompleteMultipartParams>;
};

export interface FalStorageUploadNamespace {
  initiate: FalStorageUploadInitiateFn;
  initiateMultipart: FalStorageUploadInitiateMultipartFn;
  completeMultipart: FalStorageUploadCompleteMultipartFn;
}

export interface FalStorageNamespace {
  upload: FalStorageUploadNamespace;
}

// Provider interface
export interface FalProvider {
  v1: FalV1Namespace;
  run: FalRunNamespace;
  storage: FalStorageNamespace;
  get: FalGetNamespace;
  post: FalPostNamespace;
  delete: FalDeleteNamespace;
}
