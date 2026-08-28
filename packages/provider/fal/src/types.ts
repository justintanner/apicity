export interface ApicitySchemaIssue {
  path: readonly PropertyKey[];
  message: string;
  code?: string;
}

export interface ApicitySchemaError {
  issues: readonly ApicitySchemaIssue[];
}

export type ApicitySafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApicitySchemaError };

export interface ApicitySchema<T = unknown> {
  parse(data: unknown): T;
  safeParse(data: unknown): ApicitySafeParseResult<T>;
  description?: string;
}

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  FalOptions,
  FalEstimateRequest,
  FalEstimateRequestInput,
  FalEstimateParsedRequest,
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
  FalSeedance2p5TextToVideoParams,
  FalSeedance2p5ImageToVideoParams,
  FalSeedance2p5ReferenceToVideoParams,
  FalLtx2p5ImageToVideoProParams,
  FalLtx2p5ImageToVideoFastParams,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProEditParams,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2EditParams,
  FalNanoBanana2LiteTextToImageParams,
  FalNanoBanana2LiteEditParams,
  FalVirtualTryOnParams,
  FalTopazUpscaleImagePrecisionParams,
  FalTopazUpscaleVideoPrecisionParams,
  FalMeshyV7ImageTo3dParams,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteTextToImageParams,
  FalSeedreamV5ProLayerizeParams,
  FalMinimaxH3TextToVideoParams,
  FalMinimaxH3ImageToVideoParams,
  FalSeedSpeechTtsV2Params,
  FalMinimaxMusic3Params,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalAlibabaQwenImage3TextToImageParams,
  FalAlibabaQwenImage3EditParams,
  FalWan3p0TextToVideoParams,
  FalWan3p0ImageToVideoParams,
  FalWan3p0ReferenceToVideoParams,
  FalWanV2p7TextToImageParams,
  FalWanV2p7EditParams,
  FalWanV2p7TextToVideoParams,
  FalWanV2p7ImageToVideoParams,
  FalWanV2p7ReferenceToVideoParams,
  FalWanV2p7EditVideoParams,
  FalFlux3TextToVideoParams,
  FalFlux3ImageToVideoParams,
  FalFlux3FirstLastFrameToVideoParams,
  FalFlux3KeyframesToVideoParams,
  FalFlux3ExtendVideoParams,
  FalFluxVideoUpscaleParams,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageV2p0TextToImageParams,
  FalXaiGrokImagineImageV2p0EditParams,
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
  FalKlingVideoO3p4kImageToVideoParams,
  FalKlingVideoO3p4kReferenceToVideoParams,
  FalKlingVideoO3p4kTextToVideoParams,
  FalSora2TextToVideoParams,
  FalSora2ImageToVideoParams,
  FalHunyuanImageV3InstructEditParams,
  FalSeedance2p0ImageToVideoRequest,
  FalSeedance2p0ImageToVideoRequestInput,
  FalSeedance2p0ImageToVideoParsedRequest,
  FalSeedance2p0TextToVideoRequest,
  FalSeedance2p0TextToVideoRequestInput,
  FalSeedance2p0TextToVideoParsedRequest,
  FalSeedance2p0FastImageToVideoRequest,
  FalSeedance2p0FastImageToVideoRequestInput,
  FalSeedance2p0FastImageToVideoParsedRequest,
  FalSeedance2p0FastTextToVideoRequest,
  FalSeedance2p0FastTextToVideoRequestInput,
  FalSeedance2p0FastTextToVideoParsedRequest,
  FalSeedance2p0ReferenceToVideoRequest,
  FalSeedance2p0ReferenceToVideoRequestInput,
  FalSeedance2p0ReferenceToVideoParsedRequest,
  FalSeedance2p0FastReferenceToVideoRequest,
  FalSeedance2p0FastReferenceToVideoRequestInput,
  FalSeedance2p0FastReferenceToVideoParsedRequest,
  FalSeedance2p5TextToVideoRequest,
  FalSeedance2p5TextToVideoRequestInput,
  FalSeedance2p5TextToVideoParsedRequest,
  FalSeedance2p5ImageToVideoRequest,
  FalSeedance2p5ImageToVideoRequestInput,
  FalSeedance2p5ImageToVideoParsedRequest,
  FalSeedance2p5ReferenceToVideoRequest,
  FalSeedance2p5ReferenceToVideoRequestInput,
  FalSeedance2p5ReferenceToVideoParsedRequest,
  FalLtx2p5ImageToVideoProRequest,
  FalLtx2p5ImageToVideoProRequestInput,
  FalLtx2p5ImageToVideoProParsedRequest,
  FalLtx2p5ImageToVideoFastRequest,
  FalLtx2p5ImageToVideoFastRequestInput,
  FalLtx2p5ImageToVideoFastParsedRequest,
  FalNanoBananaProEditRequest,
  FalNanoBananaProEditRequestInput,
  FalNanoBananaProEditParsedRequest,
  FalNanoBananaProTextToImageRequest,
  FalNanoBananaProTextToImageRequestInput,
  FalNanoBananaProTextToImageParsedRequest,
  FalNanoBananaTextToImageRequest,
  FalNanoBananaTextToImageRequestInput,
  FalNanoBananaTextToImageParsedRequest,
  FalNanoBananaEditRequest,
  FalNanoBananaEditRequestInput,
  FalNanoBananaEditParsedRequest,
  FalNanoBanana2TextToImageRequest,
  FalNanoBanana2TextToImageRequestInput,
  FalNanoBanana2TextToImageParsedRequest,
  FalNanoBanana2EditRequest,
  FalNanoBanana2EditRequestInput,
  FalNanoBanana2EditParsedRequest,
  FalNanoBanana2LiteTextToImageRequest,
  FalNanoBanana2LiteTextToImageRequestInput,
  FalNanoBanana2LiteTextToImageParsedRequest,
  FalNanoBanana2LiteEditRequest,
  FalNanoBanana2LiteEditRequestInput,
  FalNanoBanana2LiteEditParsedRequest,
  FalVirtualTryOnRequest,
  FalVirtualTryOnRequestInput,
  FalVirtualTryOnParsedRequest,
  FalTopazUpscaleImagePrecisionRequest,
  FalTopazUpscaleImagePrecisionRequestInput,
  FalTopazUpscaleImagePrecisionParsedRequest,
  FalTopazUpscaleVideoPrecisionRequest,
  FalTopazUpscaleVideoPrecisionRequestInput,
  FalTopazUpscaleVideoPrecisionParsedRequest,
  FalMeshyV7ImageTo3dRequest,
  FalMeshyV7ImageTo3dRequestInput,
  FalMeshyV7ImageTo3dParsedRequest,
  FalSeedreamV5LiteEditRequest,
  FalSeedreamV5LiteEditRequestInput,
  FalSeedreamV5LiteEditParsedRequest,
  FalSeedreamV5LiteTextToImageRequest,
  FalSeedreamV5LiteTextToImageRequestInput,
  FalSeedreamV5LiteTextToImageParsedRequest,
  FalSeedreamV5ProLayerizeRequest,
  FalSeedreamV5ProLayerizeRequestInput,
  FalSeedreamV5ProLayerizeParsedRequest,
  FalMinimaxH3TextToVideoRequest,
  FalMinimaxH3TextToVideoRequestInput,
  FalMinimaxH3TextToVideoParsedRequest,
  FalMinimaxH3ImageToVideoRequest,
  FalMinimaxH3ImageToVideoRequestInput,
  FalMinimaxH3ImageToVideoParsedRequest,
  FalSeedSpeechTtsV2Request,
  FalSeedSpeechTtsV2RequestInput,
  FalSeedSpeechTtsV2ParsedRequest,
  FalMinimaxMusic3Request,
  FalMinimaxMusic3RequestInput,
  FalMinimaxMusic3ParsedRequest,
  FalElevenlabsSpeechToTextScribeV2Request,
  FalElevenlabsSpeechToTextScribeV2RequestInput,
  FalElevenlabsSpeechToTextScribeV2ParsedRequest,
  FalAlibabaQwenImage3TextToImageRequest,
  FalAlibabaQwenImage3TextToImageRequestInput,
  FalAlibabaQwenImage3TextToImageParsedRequest,
  FalAlibabaQwenImage3EditRequest,
  FalAlibabaQwenImage3EditRequestInput,
  FalAlibabaQwenImage3EditParsedRequest,
  FalWan3p0TextToVideoRequest,
  FalWan3p0TextToVideoRequestInput,
  FalWan3p0TextToVideoParsedRequest,
  FalWan3p0ImageToVideoRequest,
  FalWan3p0ImageToVideoRequestInput,
  FalWan3p0ImageToVideoParsedRequest,
  FalWan3p0ReferenceToVideoRequest,
  FalWan3p0ReferenceToVideoRequestInput,
  FalWan3p0ReferenceToVideoParsedRequest,
  FalWanV2p7TextToImageRequest,
  FalWanV2p7TextToImageRequestInput,
  FalWanV2p7TextToImageParsedRequest,
  FalWanV2p7EditRequest,
  FalWanV2p7EditRequestInput,
  FalWanV2p7EditParsedRequest,
  FalWanV2p7TextToVideoRequest,
  FalWanV2p7TextToVideoRequestInput,
  FalWanV2p7TextToVideoParsedRequest,
  FalWanV2p7ImageToVideoRequest,
  FalWanV2p7ImageToVideoRequestInput,
  FalWanV2p7ImageToVideoParsedRequest,
  FalWanV2p7ReferenceToVideoRequest,
  FalWanV2p7ReferenceToVideoRequestInput,
  FalWanV2p7ReferenceToVideoParsedRequest,
  FalWanV2p7EditVideoRequest,
  FalWanV2p7EditVideoRequestInput,
  FalWanV2p7EditVideoParsedRequest,
  FalFlux3TextToVideoRequest,
  FalFlux3TextToVideoRequestInput,
  FalFlux3TextToVideoParsedRequest,
  FalFlux3ImageToVideoRequest,
  FalFlux3ImageToVideoRequestInput,
  FalFlux3ImageToVideoParsedRequest,
  FalFlux3FirstLastFrameToVideoRequest,
  FalFlux3FirstLastFrameToVideoRequestInput,
  FalFlux3FirstLastFrameToVideoParsedRequest,
  FalFlux3KeyframesToVideoRequest,
  FalFlux3KeyframesToVideoRequestInput,
  FalFlux3KeyframesToVideoParsedRequest,
  FalFlux3ExtendVideoRequest,
  FalFlux3ExtendVideoRequestInput,
  FalFlux3ExtendVideoParsedRequest,
  FalFluxVideoUpscaleRequest,
  FalFluxVideoUpscaleRequestInput,
  FalFluxVideoUpscaleParsedRequest,
  FalXaiGrokImagineImageEditRequest,
  FalXaiGrokImagineImageEditRequestInput,
  FalXaiGrokImagineImageEditParsedRequest,
  FalSora2TextToVideoRequest,
  FalSora2TextToVideoRequestInput,
  FalSora2TextToVideoParsedRequest,
  FalSora2ImageToVideoRequest,
  FalSora2ImageToVideoRequestInput,
  FalSora2ImageToVideoParsedRequest,
  FalHunyuanImageV3InstructEditRequest,
  FalHunyuanImageV3InstructEditRequestInput,
  FalHunyuanImageV3InstructEditParsedRequest,
  FalKlingVideoV3ProImageToVideoRequest,
  FalKlingVideoV3ProImageToVideoRequestInput,
  FalKlingVideoV3ProImageToVideoParsedRequest,
  FalKlingVideoV3ProTextToVideoRequest,
  FalKlingVideoV3ProTextToVideoRequestInput,
  FalKlingVideoV3ProTextToVideoParsedRequest,
  FalKlingVideoV3StandardImageToVideoRequest,
  FalKlingVideoV3StandardImageToVideoRequestInput,
  FalKlingVideoV3StandardImageToVideoParsedRequest,
  FalKlingVideoV3StandardTextToVideoRequest,
  FalKlingVideoV3StandardTextToVideoRequestInput,
  FalKlingVideoV3StandardTextToVideoParsedRequest,
  FalKlingVideoO3p4kImageToVideoRequest,
  FalKlingVideoO3p4kImageToVideoRequestInput,
  FalKlingVideoO3p4kImageToVideoParsedRequest,
  FalKlingVideoO3p4kReferenceToVideoRequest,
  FalKlingVideoO3p4kReferenceToVideoRequestInput,
  FalKlingVideoO3p4kReferenceToVideoParsedRequest,
  FalKlingVideoO3p4kTextToVideoRequest,
  FalKlingVideoO3p4kTextToVideoRequestInput,
  FalKlingVideoO3p4kTextToVideoParsedRequest,
  FalVeo3p1TextToVideoRequest,
  FalVeo3p1TextToVideoRequestInput,
  FalVeo3p1TextToVideoParsedRequest,
  FalVeo3p1ImageToVideoRequest,
  FalVeo3p1ImageToVideoRequestInput,
  FalVeo3p1ImageToVideoParsedRequest,
  FalXaiGrokImagineVideoImageToVideoRequest,
  FalXaiGrokImagineVideoImageToVideoRequestInput,
  FalXaiGrokImagineVideoImageToVideoParsedRequest,
  FalXaiGrokImagineVideoReferenceToVideoRequest,
  FalXaiGrokImagineVideoReferenceToVideoRequestInput,
  FalXaiGrokImagineVideoReferenceToVideoParsedRequest,
  FalXaiGrokImagineVideoExtendVideoRequest,
  FalXaiGrokImagineVideoExtendVideoRequestInput,
  FalXaiGrokImagineVideoExtendVideoParsedRequest,
  FalXaiGrokImagineVideoEditVideoRequest,
  FalXaiGrokImagineVideoEditVideoRequestInput,
  FalXaiGrokImagineVideoEditVideoParsedRequest,
  FalXaiGrokImagineImageRequest,
  FalXaiGrokImagineImageRequestInput,
  FalXaiGrokImagineImageParsedRequest,
  FalXaiGrokImagineImageV2p0TextToImageRequest,
  FalXaiGrokImagineImageV2p0TextToImageRequestInput,
  FalXaiGrokImagineImageV2p0TextToImageParsedRequest,
  FalXaiGrokImagineImageV2p0EditRequest,
  FalXaiGrokImagineImageV2p0EditRequestInput,
  FalXaiGrokImagineImageV2p0EditParsedRequest,
  FalQwenImageEditRequest,
  FalQwenImageEditRequestInput,
  FalQwenImageEditParsedRequest,
  FalGptImage1p5EditRequest,
  FalGptImage1p5EditRequestInput,
  FalGptImage1p5EditParsedRequest,
  FalGptImage1p5Request,
  FalGptImage1p5RequestInput,
  FalGptImage1p5ParsedRequest,
  FalQwenImageRequest,
  FalQwenImageRequestInput,
  FalQwenImageParsedRequest,
  FalEndpointId,
  FalEndpointInputMap,
  FalQueueSubmitRequest,
} from "./zod";

// Re-import for use in this file's interface definitions
import type {
  FalEstimateRequest,
  FalQueueSubmitParams,
  FalQueueSubmitRequest,
  FalLogsStreamParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalDeletePayloadsParams,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalSeedreamV5LiteTextToImageParams,
  FalSeedance2p0ImageToVideoRequest,
  FalSeedance2p0TextToVideoRequest,
  FalSeedance2p0FastImageToVideoRequest,
  FalSeedance2p0FastTextToVideoRequest,
  FalSeedance2p0ReferenceToVideoRequest,
  FalSeedance2p0FastReferenceToVideoRequest,
  FalSeedance2p5TextToVideoRequest,
  FalSeedance2p5ImageToVideoRequest,
  FalSeedance2p5ReferenceToVideoRequest,
  FalLtx2p5ImageToVideoProRequest,
  FalLtx2p5ImageToVideoFastRequest,
  FalNanoBananaProEditRequest,
  FalNanoBananaProTextToImageRequest,
  FalNanoBananaTextToImageRequest,
  FalNanoBananaEditRequest,
  FalNanoBanana2TextToImageRequest,
  FalNanoBanana2EditRequest,
  FalNanoBanana2LiteTextToImageRequest,
  FalNanoBanana2LiteEditRequest,
  FalVirtualTryOnRequest,
  FalTopazUpscaleImagePrecisionRequest,
  FalTopazUpscaleVideoPrecisionRequest,
  FalMeshyV7ImageTo3dRequest,
  FalSeedreamV5LiteEditRequest,
  FalSeedreamV5LiteTextToImageRequest,
  FalSeedreamV5ProLayerizeRequest,
  FalMinimaxH3TextToVideoRequest,
  FalMinimaxH3ImageToVideoRequest,
  FalSeedSpeechTtsV2Request,
  FalMinimaxMusic3Request,
  FalElevenlabsSpeechToTextScribeV2Request,
  FalAlibabaQwenImage3TextToImageRequest,
  FalAlibabaQwenImage3EditRequest,
  FalWan3p0TextToVideoRequest,
  FalWan3p0ImageToVideoRequest,
  FalWan3p0ReferenceToVideoRequest,
  FalWanV2p7TextToImageRequest,
  FalWanV2p7EditRequest,
  FalWanV2p7TextToVideoRequest,
  FalWanV2p7ImageToVideoRequest,
  FalWanV2p7ReferenceToVideoRequest,
  FalWanV2p7EditVideoRequest,
  FalFlux3TextToVideoRequest,
  FalFlux3ImageToVideoRequest,
  FalFlux3FirstLastFrameToVideoRequest,
  FalFlux3KeyframesToVideoRequest,
  FalFlux3ExtendVideoRequest,
  FalFluxVideoUpscaleRequest,
  FalXaiGrokImagineImageEditRequest,
  FalSora2TextToVideoRequest,
  FalSora2ImageToVideoRequest,
  FalHunyuanImageV3InstructEditRequest,
  FalKlingVideoV3ProImageToVideoRequest,
  FalKlingVideoV3ProTextToVideoRequest,
  FalKlingVideoV3StandardImageToVideoRequest,
  FalKlingVideoV3StandardTextToVideoRequest,
  FalKlingVideoO3p4kImageToVideoRequest,
  FalKlingVideoO3p4kReferenceToVideoRequest,
  FalKlingVideoO3p4kTextToVideoRequest,
  FalVeo3p1TextToVideoRequest,
  FalVeo3p1ImageToVideoRequest,
  FalXaiGrokImagineVideoImageToVideoRequest,
  FalXaiGrokImagineVideoReferenceToVideoRequest,
  FalXaiGrokImagineVideoExtendVideoRequest,
  FalXaiGrokImagineVideoEditVideoRequest,
  FalXaiGrokImagineImageRequest,
  FalXaiGrokImagineImageV2p0TextToImageRequest,
  FalXaiGrokImagineImageV2p0EditRequest,
  FalQwenImageEditRequest,
  FalGptImage1p5EditRequest,
  FalGptImage1p5Request,
  FalQwenImageRequest,
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
  file_size?: number | null;
}

// Video file output — fal video models include media metadata alongside FalFile
export interface FalVideoFile extends FalFile {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  num_frames?: number;
}

// ==================== FLUX 3 (Black Forest Labs) ====================

export type FalFlux3AspectRatio =
  | "auto"
  | "21:9"
  | "2:1"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16";

export type FalFlux3Resolution = "720p" | "1080p";

export type FalFlux3Duration = "auto" | number;

export interface FalFlux3Keyframe {
  image_url: string;
  frame_index: number;
}

export interface FalFlux3VideoResponse {
  video: FalVideoFile;
  seed: number;
}

export interface FalFluxVideoUpscaleResponse {
  video: FalVideoFile;
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

export interface FalSeedance2p5TextToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p5ImageToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p5ReferenceToVideoResponse {
  video: FalFile;
  seed: number;
}

// LTX-2.5 image-to-video (Lightricks). Upstream returns the generated clip and
// nothing else — no seed, no echoed prompt — and the file carries the standard
// fal video metadata.
export interface FalLtx2p5ImageToVideoProResponse {
  video: FalVideoFile;
}
export interface FalLtx2p5ImageToVideoFastResponse {
  video: FalVideoFile;
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

// Nano Banana 2 Lite image generation and editing
export type FalNanoBanana2LiteAspectRatio = FalNanoBanana2AspectRatio;

export type FalNanoBanana2LiteOutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBanana2LiteSafetyTolerance =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6";

export type FalNanoBanana2LiteThinkingLevel = "minimal" | "high";

export interface FalNanoBanana2LiteTextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBanana2LiteEditResponse {
  images: FalFile[];
  description: string;
}

// Google Virtual Try-On image output. fal's ImageFile schema requires only
// `url` and makes every other field nullable, including the `width`/`height`
// that plain FalFile does not carry, so this models the item shape directly.
export interface FalVirtualTryOnImage {
  url: string;
  content_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface FalVirtualTryOnResponse {
  images: FalVirtualTryOnImage[];
}

// Topaz Precision Image Upscale (Gigapixel). Upstream returns a single File
// whose only required member is `url`, which is exactly FalFile's shape.
export interface FalTopazUpscaleImagePrecisionResponse {
  image: FalFile;
}
// Topaz Precision Video Upscale. Upstream returns a single File whose only
// required member is `url`, which is exactly FalFile's shape.
export interface FalTopazUpscaleVideoPrecisionResponse {
  video: FalFile;
}
// Meshy-7 image-to-3D. Every asset upstream returns is fal's standard File
// object, so these reuse FalFile and only describe how the assets are grouped.
export interface FalMeshyV7ModelUrls {
  glb?: FalFile | null;
  fbx?: FalFile | null;
  obj?: FalFile | null;
  usdz?: FalFile | null;
  blend?: FalFile | null;
  stl?: FalFile | null;
}

// One texture set per material. Only `base_color` is always present; the PBR
// maps arrive only when enable_pbr is true.
export interface FalMeshyV7TextureFiles {
  base_color: FalFile;
  metallic?: FalFile | null;
  normal?: FalFile | null;
  roughness?: FalFile | null;
}

// Bundled with the rigging result, so present only when enable_rigging is true.
export interface FalMeshyV7BasicAnimations {
  walking_glb?: FalFile | null;
  walking_fbx?: FalFile | null;
  walking_armature_glb?: FalFile | null;
  running_glb?: FalFile | null;
  running_fbx?: FalFile | null;
  running_armature_glb?: FalFile | null;
}

// Upstream requires only `model_glb` and `model_urls`. The rigging and
// animation assets appear only when the matching request flag is set, and
// `texture_urls` is empty when should_texture is false.
export interface FalMeshyV7ImageTo3dResponse {
  model_glb: FalFile;
  model_urls: FalMeshyV7ModelUrls;
  thumbnail?: FalFile | null;
  texture_urls?: FalMeshyV7TextureFiles[];
  seed?: number | null;
  animation_glb?: FalFile | null;
  animation_fbx?: FalFile | null;
  rigged_character_glb?: FalFile | null;
  rigged_character_fbx?: FalFile | null;
  basic_animations?: FalMeshyV7BasicAnimations | null;
  rig_task_id?: string | null;
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
export type FalSeedreamV5LiteImageSize = NonNullable<
  FalSeedreamV5LiteTextToImageParams["image_size"]
>;

export interface FalSeedreamV5LiteEditResponse {
  images: FalFile[];
  seed: number;
}

// Bytedance Seedream v5 Lite text-to-image
export interface FalSeedreamV5LiteTextToImageResponse {
  images: FalFile[];
  seed: number;
}

// Bytedance Seedream v5 Pro layerize. fal's `Image` schema requires only
// `url` and makes every other field nullable, including the `width`/`height`
// that plain FalFile does not carry, so the item shape is modelled directly.
export interface FalSeedreamV5ProLayerizeImage {
  url: string;
  content_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
}

// Layer bounds in the output base image's coordinate system. `normalized`
// uses the integer range [0, 1000]; `absolute` uses pixels.
export interface FalSeedreamV5ProLayerBoundingBox {
  absolute: number[];
  normalized: number[];
}

// The base image (z_index 0) carries no name, description or bounding box;
// every separated layer does.
export interface FalSeedreamV5ProLayer {
  image: FalSeedreamV5ProLayerizeImage;
  z_index: number;
  bounding_box?: FalSeedreamV5ProLayerBoundingBox | null;
  name?: string | null;
  description?: string | null;
}

export interface FalSeedreamV5ProLayerizeResponse {
  images: FalSeedreamV5ProLayerizeImage[];
  layers: FalSeedreamV5ProLayer[];
}

// Bytedance Seed Speech TTS v2
export type FalSeedSpeechTtsV2Voice =
  | "vivi_mixed_en_zh_ja_es_id"
  | "mindy_en_es_id_pt_zh"
  | "stokie_en"
  | "dacey_en"
  | "tim_en"
  | "kian_en_zh"
  | "cedric_en_zh"
  | "sophie_en_zh"
  | "jean_en_zh"
  | "magnus_en_zh"
  | "mabel_en_zh"
  | "nadia_en_zh"
  | "opal_en_zh"
  | "pearl_en_zh"
  | "quentin_en_zh"
  | "vienna_mixed_en_zh"
  | "alina_mixed_en_zh"
  | "corinne_mixed_en_zh"
  | "esther_mixed_en_zh"
  | "freya_mixed_en_zh"
  | "gigi_mixed_en_zh"
  | "holly_mixed_en_zh"
  | "lyla_mixed_en_zh"
  | "daisy_mixed_en_zh"
  | "tracy_es_zh"
  | "jess_ja_es_id_pt_en_zh"
  | "pinky_es_ko_mixed_en_zh"
  | "sweety_ja_es"
  | "sandy_es_mixed_en_zh"
  | "sven_de"
  | "minimi_ja"
  | "usseau_fr"
  | "felipe_es"
  | "han_id"
  | "martins_pt"
  | "enzo_it"
  | "shane_ko"
  | "bonnie_zh"
  | "felix_zh"
  | "celeste_zh"
  | "monkey_king_zh";

export type FalSeedSpeechTtsV2OutputFormat = "mp3" | "opus";

export type FalSeedSpeechTtsV2SampleRate =
  | 8000
  | 16000
  | 22050
  | 24000
  | 32000
  | 44100
  | 48000;

export type FalSeedSpeechTtsV2Language =
  | "zh"
  | "en"
  | "ja"
  | "es-mx"
  | "id"
  | "pt-br"
  | "ko"
  | "it"
  | "de"
  | "fr";

export interface FalSeedSpeechTtsV2Response {
  audio: FalFile;
}

// MiniMax Music 3 — one generated song. `duration` is the length the model
// actually produced, which upstream documents as possibly shorter than the
// requested upper bound, and `seed` echoes the seed used.
export interface FalMinimaxMusic3Response {
  audio: FalFile;
  seed: number;
  duration: number;
}

// Alibaba Qwen Image 3 text-to-image
export interface FalAlibabaQwenImage3TextToImageResponse {
  images: FalFile[];
  seed: number;
}

// Alibaba Qwen Image 3 edit
export interface FalAlibabaQwenImage3EditResponse {
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

// Alibaba Wan 3.0 video generation. Unlike Wan 2.7, the response always
// reports `duration` — the realized output length in seconds, which the
// smart-duration mode (`duration: null`) lets the model choose.
export interface FalWan3p0TextToVideoResponse {
  video: FalVideoFile;
  seed: number;
  duration: number;
  actual_prompt?: string | null;
}

export interface FalWan3p0ImageToVideoResponse {
  video: FalVideoFile;
  seed: number;
  duration: number;
  actual_prompt?: string | null;
}

export interface FalWan3p0ReferenceToVideoResponse {
  video: FalVideoFile;
  seed: number;
  duration: number;
  actual_prompt?: string | null;
}

// MiniMax Hailuo 03 (H3) text-to-video. Upstream returns the shared fal `File`
// schema with no media metadata beyond it, so the plain FalFile shape applies.
// `expanded_prompt` is null whenever expansion was disabled, left the prompt
// unchanged, or happened inside MiniMax's own hosted API.
export interface FalMinimaxH3TextToVideoResponse {
  video: FalFile;
  expanded_prompt?: string | null;
}
// MiniMax Hailuo 03 (H3) image-to-video. Upstream returns the shared fal
// `File` schema with no media metadata beyond it, so the plain FalFile shape
// applies. `expanded_prompt` is null whenever expansion was disabled, left the
// prompt unchanged, or happened inside MiniMax's own hosted API.
export interface FalMinimaxH3ImageToVideoResponse {
  video: FalFile;
  expanded_prompt?: string | null;
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

export interface FalXaiGrokImagineImageV2p0TextToImageResponse {
  images: FalFile[];
  revised_prompt?: string | null;
}

export interface FalXaiGrokImagineImageV2p0EditResponse {
  images: FalFile[];
  revised_prompt?: string | null;
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

export interface FalKlingVideoO3p4kImageToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoO3p4kReferenceToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoO3p4kTextToVideoResponse {
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

// Queue result parameters (fetches the completed response body)
export interface FalQueueResultParams {
  endpoint_id: string;
  request_id: string;
}

// Queue result response — endpoint-specific, so untyped
export type FalQueueResultResponse = Record<string, unknown>;

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
  schema: ApicitySchema<FalEstimateRequest>;
}

interface FalModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
  estimate: FalPricingEstimateMethod;
}

interface FalGetV1ModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
}

interface FalDeletePayloadsMethod {
  (
    params: FalDeletePayloadsParams,
    signal?: AbortSignal
  ): Promise<FalDeletePayloadsResponse>;
  schema: ApicitySchema<FalDeletePayloadsParams>;
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
  <Id extends string>(
    params: FalQueueSubmitRequest<Id>,
    signal?: AbortSignal
  ): Promise<FalQueueSubmitResponse>;
  schema: ApicitySchema<FalQueueSubmitParams>;
}

interface FalQueueNamespace {
  submit: FalQueueSubmitMethod;
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
  result(
    params: FalQueueResultParams,
    signal?: AbortSignal
  ): Promise<FalQueueResultResponse>;
}

// Serverless logs namespace types
interface FalLogsStreamMethod {
  (
    params?: FalLogsStreamParams,
    body?: FalLabelFilter[],
    signal?: AbortSignal
  ): Promise<AsyncIterable<FalLogEntry>>;
  schema: ApicitySchema<FalLogsStreamParams>;
}

interface FalServerlessLogsNamespace {
  stream: FalLogsStreamMethod;
}

// Serverless files namespace types
interface FalFilesUploadUrlMethod {
  (params: FalFilesUploadUrlParams, signal?: AbortSignal): Promise<boolean>;
  schema: ApicitySchema<FalFilesUploadUrlParams>;
}

interface FalFilesUploadLocalMethod {
  (params: FalFilesUploadLocalParams, signal?: AbortSignal): Promise<boolean>;
  schema: ApicitySchema<FalFilesUploadLocalParams>;
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
  params: FalSeedance2p0ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ImageToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0ImageToVideoRequest>;
};

type FalSeedance2p0TextToVideoFn = ((
  params: FalSeedance2p0TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0TextToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0TextToVideoRequest>;
};

type FalSeedance2p0FastImageToVideoFn = ((
  params: FalSeedance2p0FastImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastImageToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0FastImageToVideoRequest>;
};

type FalSeedance2p0FastTextToVideoFn = ((
  params: FalSeedance2p0FastTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastTextToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0FastTextToVideoRequest>;
};

type FalSeedance2p0ReferenceToVideoFn = ((
  params: FalSeedance2p0ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0ReferenceToVideoRequest>;
};

type FalSeedance2p0FastReferenceToVideoFn = ((
  params: FalSeedance2p0FastReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0FastReferenceToVideoRequest>;
};

type FalSeedance2p5TextToVideoFn = ((
  params: FalSeedance2p5TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p5TextToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p5TextToVideoRequest>;
};

type FalSeedance2p5ImageToVideoFn = ((
  params: FalSeedance2p5ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p5ImageToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p5ImageToVideoRequest>;
};

type FalSeedance2p5ReferenceToVideoFn = ((
  params: FalSeedance2p5ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p5ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p5ReferenceToVideoRequest>;
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

export interface FalRunBytedanceSeedance2p5Namespace {
  imageToVideo: FalSeedance2p5ImageToVideoFn;
  referenceToVideo: FalSeedance2p5ReferenceToVideoFn;
  textToVideo: FalSeedance2p5TextToVideoFn;
}

export interface FalRunBytedanceSeedreamV5LiteNamespace {
  edit: FalSeedreamV5LiteEditFn;
  textToImage: FalSeedreamV5LiteTextToImageFn;
}

export interface FalRunBytedanceSeedreamV5ProNamespace {
  layerize: FalSeedreamV5ProLayerizeFn;
}

export interface FalRunBytedanceSeedreamV5Namespace {
  lite: FalRunBytedanceSeedreamV5LiteNamespace;
  pro: FalRunBytedanceSeedreamV5ProNamespace;
}

export interface FalRunBytedanceSeedreamNamespace {
  v5: FalRunBytedanceSeedreamV5Namespace;
}

type FalSeedSpeechTtsV2Fn = ((
  params: FalSeedSpeechTtsV2Request,
  signal?: AbortSignal
) => Promise<FalSeedSpeechTtsV2Response>) & {
  schema: ApicitySchema<FalSeedSpeechTtsV2Request>;
};

export interface FalRunBytedanceSeedSpeechTtsNamespace {
  v2: FalSeedSpeechTtsV2Fn;
}

type FalMinimaxMusic3Fn = ((
  params: FalMinimaxMusic3Request,
  signal?: AbortSignal
) => Promise<FalMinimaxMusic3Response>) & {
  schema: ApicitySchema<FalMinimaxMusic3Request>;
};

export interface FalRunMinimaxNamespace {
  music3: FalMinimaxMusic3Fn;
  h3: FalRunMinimaxH3Namespace;
}

export interface FalRunBytedanceSeedSpeechNamespace {
  tts: FalRunBytedanceSeedSpeechTtsNamespace;
}

export interface FalRunBytedanceNamespace {
  seedance2p0: FalRunBytedanceSeedance2p0Namespace;
  seedance2p5: FalRunBytedanceSeedance2p5Namespace;
  seedSpeech: FalRunBytedanceSeedSpeechNamespace;
  seedream: FalRunBytedanceSeedreamNamespace;
}

type FalMinimaxH3TextToVideoFn = ((
  params: FalMinimaxH3TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalMinimaxH3TextToVideoResponse>) & {
  schema: ApicitySchema<FalMinimaxH3TextToVideoRequest>;
};

export interface FalRunMinimaxH3Namespace {
  textToVideo: FalMinimaxH3TextToVideoFn;
}
type FalMinimaxH3ImageToVideoFn = ((
  params: FalMinimaxH3ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalMinimaxH3ImageToVideoResponse>) & {
  schema: ApicitySchema<FalMinimaxH3ImageToVideoRequest>;
};

export interface FalRunMinimaxH3Namespace {
  imageToVideo: FalMinimaxH3ImageToVideoFn;
}

export interface FalRunMinimaxNamespace {
  h3: FalRunMinimaxH3Namespace;
}

type FalNanoBananaProEditFn = ((
  params: FalNanoBananaProEditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaProEditResponse>) & {
  schema: ApicitySchema<FalNanoBananaProEditRequest>;
};

type FalNanoBananaProTextToImageFn = ((
  params: FalNanoBananaProTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaProTextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBananaProTextToImageRequest>;
};

export interface FalRunNanoBananaProNamespace {
  textToImage: FalNanoBananaProTextToImageFn;
  edit: FalNanoBananaProEditFn;
}

type FalNanoBanana2TextToImageFn = ((
  params: FalNanoBanana2TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2TextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBanana2TextToImageRequest>;
};

type FalNanoBanana2EditFn = ((
  params: FalNanoBanana2EditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2EditResponse>) & {
  schema: ApicitySchema<FalNanoBanana2EditRequest>;
};

export interface FalRunNanoBanana2Namespace {
  textToImage: FalNanoBanana2TextToImageFn;
  edit: FalNanoBanana2EditFn;
}

type FalNanoBanana2LiteTextToImageFn = ((
  params: FalNanoBanana2LiteTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2LiteTextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBanana2LiteTextToImageRequest>;
};

type FalNanoBanana2LiteEditFn = ((
  params: FalNanoBanana2LiteEditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2LiteEditResponse>) & {
  schema: ApicitySchema<FalNanoBanana2LiteEditRequest>;
};

export interface FalRunNanoBanana2LiteNamespace {
  textToImage: FalNanoBanana2LiteTextToImageFn;
  edit: FalNanoBanana2LiteEditFn;
}

type FalVirtualTryOnFn = ((
  params: FalVirtualTryOnRequest,
  signal?: AbortSignal
) => Promise<FalVirtualTryOnResponse>) & {
  schema: ApicitySchema<FalVirtualTryOnRequest>;
};

type FalTopazUpscaleImagePrecisionFn = ((
  params: FalTopazUpscaleImagePrecisionRequest,
  signal?: AbortSignal
) => Promise<FalTopazUpscaleImagePrecisionResponse>) & {
  schema: ApicitySchema<FalTopazUpscaleImagePrecisionRequest>;
};

export interface FalRunTopazUpscaleImageNamespace {
  precision: FalTopazUpscaleImagePrecisionFn;
}

type FalTopazUpscaleVideoPrecisionFn = ((
  params: FalTopazUpscaleVideoPrecisionRequest,
  signal?: AbortSignal
) => Promise<FalTopazUpscaleVideoPrecisionResponse>) & {
  schema: ApicitySchema<FalTopazUpscaleVideoPrecisionRequest>;
};

export interface FalRunTopazUpscaleVideoNamespace {
  precision: FalTopazUpscaleVideoPrecisionFn;
}

export interface FalRunTopazUpscaleNamespace {
  image: FalRunTopazUpscaleImageNamespace;
  video: FalRunTopazUpscaleVideoNamespace;
}

export interface FalRunTopazNamespace {
  upscale: FalRunTopazUpscaleNamespace;
}
type FalMeshyV7ImageTo3dFn = ((
  params: FalMeshyV7ImageTo3dRequest,
  signal?: AbortSignal
) => Promise<FalMeshyV7ImageTo3dResponse>) & {
  schema: ApicitySchema<FalMeshyV7ImageTo3dRequest>;
};

export interface FalRunMeshyV7Namespace {
  imageTo3d: FalMeshyV7ImageTo3dFn;
}

export interface FalRunMeshyNamespace {
  v7: FalRunMeshyV7Namespace;
}

type FalSeedreamV5LiteEditFn = ((
  params: FalSeedreamV5LiteEditRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5LiteEditResponse>) & {
  schema: ApicitySchema<FalSeedreamV5LiteEditRequest>;
};

type FalSeedreamV5LiteTextToImageFn = ((
  params: FalSeedreamV5LiteTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5LiteTextToImageResponse>) & {
  schema: ApicitySchema<FalSeedreamV5LiteTextToImageRequest>;
};

type FalSeedreamV5ProLayerizeFn = ((
  params: FalSeedreamV5ProLayerizeRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5ProLayerizeResponse>) & {
  schema: ApicitySchema<FalSeedreamV5ProLayerizeRequest>;
};

type FalAlibabaQwenImage3TextToImageFn = ((
  params: FalAlibabaQwenImage3TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaQwenImage3TextToImageResponse>) & {
  schema: ApicitySchema<FalAlibabaQwenImage3TextToImageRequest>;
};

type FalAlibabaQwenImage3EditFn = ((
  params: FalAlibabaQwenImage3EditRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaQwenImage3EditResponse>) & {
  schema: ApicitySchema<FalAlibabaQwenImage3EditRequest>;
};

export interface FalRunAlibabaQwenImage3Namespace {
  textToImage: FalAlibabaQwenImage3TextToImageFn;
  edit: FalAlibabaQwenImage3EditFn;
}

type FalWan3p0TextToVideoFn = ((
  params: FalWan3p0TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWan3p0TextToVideoResponse>) & {
  schema: ApicitySchema<FalWan3p0TextToVideoRequest>;
};

type FalWan3p0ImageToVideoFn = ((
  params: FalWan3p0ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWan3p0ImageToVideoResponse>) & {
  schema: ApicitySchema<FalWan3p0ImageToVideoRequest>;
};

type FalWan3p0ReferenceToVideoFn = ((
  params: FalWan3p0ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWan3p0ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalWan3p0ReferenceToVideoRequest>;
};

// The base and prime Wan 3.0 families expose the same three operations with
// the same request and response shapes; only their upstream billing differs.
export interface FalRunAlibabaWan3p0Namespace {
  textToVideo: FalWan3p0TextToVideoFn;
  imageToVideo: FalWan3p0ImageToVideoFn;
  referenceToVideo: FalWan3p0ReferenceToVideoFn;
}

export interface FalRunAlibabaNamespace {
  qwenImage3: FalRunAlibabaQwenImage3Namespace;
  wan3p0: FalRunAlibabaWan3p0Namespace;
  wan3p0Prime: FalRunAlibabaWan3p0Namespace;
}

type FalWanV2p7TextToImageFn = ((
  params: FalWanV2p7TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7TextToImageResponse>) & {
  schema: ApicitySchema<FalWanV2p7TextToImageRequest>;
};

type FalWanV2p7EditFn = ((
  params: FalWanV2p7EditRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7EditResponse>) & {
  schema: ApicitySchema<FalWanV2p7EditRequest>;
};

type FalWanV2p7TextToVideoFn = ((
  params: FalWanV2p7TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7TextToVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7TextToVideoRequest>;
};

type FalWanV2p7ImageToVideoFn = ((
  params: FalWanV2p7ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7ImageToVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7ImageToVideoRequest>;
};

type FalWanV2p7ReferenceToVideoFn = ((
  params: FalWanV2p7ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7ReferenceToVideoRequest>;
};

type FalWanV2p7EditVideoFn = ((
  params: FalWanV2p7EditVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7EditVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7EditVideoRequest>;
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
  params: FalXaiGrokImagineImageEditRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageEditResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageEditRequest>;
};

type FalXaiGrokImagineImageV2p0TextToImageFn = ((
  params: FalXaiGrokImagineImageV2p0TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageV2p0TextToImageResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageV2p0TextToImageRequest>;
};

type FalXaiGrokImagineImageV2p0EditFn = ((
  params: FalXaiGrokImagineImageV2p0EditRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageV2p0EditResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageV2p0EditRequest>;
};

export interface FalRunXaiGrokImagineImageV2p0Namespace {
  textToImage: FalXaiGrokImagineImageV2p0TextToImageFn;
  edit: FalXaiGrokImagineImageV2p0EditFn;
}

type FalXaiGrokImagineImageFn = ((
  params: FalXaiGrokImagineImageRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageRequest>;
  edit: FalXaiGrokImagineImageEditFn;
  v2p0: FalRunXaiGrokImagineImageV2p0Namespace;
};

type FalXaiGrokImagineVideoImageToVideoFn = ((
  params: FalXaiGrokImagineVideoImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoImageToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoImageToVideoRequest>;
};

type FalXaiGrokImagineVideoReferenceToVideoFn = ((
  params: FalXaiGrokImagineVideoReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoReferenceToVideoRequest>;
};

type FalXaiGrokImagineVideoExtendVideoFn = ((
  params: FalXaiGrokImagineVideoExtendVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoExtendVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoExtendVideoRequest>;
};

type FalXaiGrokImagineVideoEditVideoFn = ((
  params: FalXaiGrokImagineVideoEditVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoEditVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoEditVideoRequest>;
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
  params: FalQwenImageEditRequest,
  signal?: AbortSignal
) => Promise<FalQwenImageEditResponse>) & {
  schema: ApicitySchema<FalQwenImageEditRequest>;
};

type FalQwenImageFn = ((
  params: FalQwenImageRequest,
  signal?: AbortSignal
) => Promise<FalQwenImageResponse>) & {
  schema: ApicitySchema<FalQwenImageRequest>;
  edit: FalQwenImageEditFn;
};

type FalGptImage1p5EditFn = ((
  params: FalGptImage1p5EditRequest,
  signal?: AbortSignal
) => Promise<FalGptImage1p5EditResponse>) & {
  schema: ApicitySchema<FalGptImage1p5EditRequest>;
};

type FalGptImage1p5Fn = ((
  params: FalGptImage1p5Request,
  signal?: AbortSignal
) => Promise<FalGptImage1p5Response>) & {
  schema: ApicitySchema<FalGptImage1p5Request>;
  edit: FalGptImage1p5EditFn;
};

type FalNanoBananaTextToImageFn = ((
  params: FalNanoBananaTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaTextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBananaTextToImageRequest>;
};

type FalNanoBananaEditFn = ((
  params: FalNanoBananaEditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaEditResponse>) & {
  schema: ApicitySchema<FalNanoBananaEditRequest>;
};

export interface FalRunNanoBananaNamespace {
  textToImage: FalNanoBananaTextToImageFn;
  edit: FalNanoBananaEditFn;
}

type FalVeo3p1TextToVideoFn = ((
  params: FalVeo3p1TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalVeo3p1TextToVideoResponse>) & {
  schema: ApicitySchema<FalVeo3p1TextToVideoRequest>;
};

type FalVeo3p1ImageToVideoFn = ((
  params: FalVeo3p1ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalVeo3p1ImageToVideoResponse>) & {
  schema: ApicitySchema<FalVeo3p1ImageToVideoRequest>;
};

export interface FalRunVeo3p1Namespace {
  textToVideo: FalVeo3p1TextToVideoFn;
  imageToVideo: FalVeo3p1ImageToVideoFn;
}

type FalKlingVideoV3ProImageToVideoFn = ((
  params: FalKlingVideoV3ProImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3ProImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3ProImageToVideoRequest>;
};

type FalKlingVideoV3ProTextToVideoFn = ((
  params: FalKlingVideoV3ProTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3ProTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3ProTextToVideoRequest>;
};

type FalKlingVideoV3StandardImageToVideoFn = ((
  params: FalKlingVideoV3StandardImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3StandardImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3StandardImageToVideoRequest>;
};

type FalKlingVideoV3StandardTextToVideoFn = ((
  params: FalKlingVideoV3StandardTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3StandardTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3StandardTextToVideoRequest>;
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

type FalKlingVideoO3p4kImageToVideoFn = ((
  params: FalKlingVideoO3p4kImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoO3p4kImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoO3p4kImageToVideoRequest>;
};

type FalKlingVideoO3p4kReferenceToVideoFn = ((
  params: FalKlingVideoO3p4kReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoO3p4kReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoO3p4kReferenceToVideoRequest>;
};

type FalKlingVideoO3p4kTextToVideoFn = ((
  params: FalKlingVideoO3p4kTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoO3p4kTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoO3p4kTextToVideoRequest>;
};

export interface FalRunKlingVideoO3p4kNamespace {
  imageToVideo: FalKlingVideoO3p4kImageToVideoFn;
  referenceToVideo: FalKlingVideoO3p4kReferenceToVideoFn;
  textToVideo: FalKlingVideoO3p4kTextToVideoFn;
}

export interface FalRunKlingVideoNamespace {
  v3: FalRunKlingVideoV3Namespace;
  o3p4k: FalRunKlingVideoO3p4kNamespace;
}

type FalSora2TextToVideoFn = ((
  params: FalSora2TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSora2TextToVideoResponse>) & {
  schema: ApicitySchema<FalSora2TextToVideoRequest>;
};

type FalSora2ImageToVideoFn = ((
  params: FalSora2ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSora2ImageToVideoResponse>) & {
  schema: ApicitySchema<FalSora2ImageToVideoRequest>;
};

export interface FalRunSora2Namespace {
  textToVideo: FalSora2TextToVideoFn;
  imageToVideo: FalSora2ImageToVideoFn;
}

type FalHunyuanImageV3InstructEditFn = ((
  params: FalHunyuanImageV3InstructEditRequest,
  signal?: AbortSignal
) => Promise<FalHunyuanImageV3InstructEditResponse>) & {
  schema: ApicitySchema<FalHunyuanImageV3InstructEditRequest>;
};

export interface FalRunHunyuanV3Namespace {
  instructEdit: FalHunyuanImageV3InstructEditFn;
}

export interface FalRunHunyuanNamespace {
  v3: FalRunHunyuanV3Namespace;
}

type FalFlux3TextToVideoFn = ((
  params: FalFlux3TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3TextToVideoRequest>;
};

type FalFlux3ImageToVideoFn = ((
  params: FalFlux3ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3ImageToVideoRequest>;
};

type FalFlux3FirstLastFrameToVideoFn = ((
  params: FalFlux3FirstLastFrameToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3FirstLastFrameToVideoRequest>;
};

type FalFlux3KeyframesToVideoFn = ((
  params: FalFlux3KeyframesToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3KeyframesToVideoRequest>;
};

type FalFlux3ExtendVideoFn = ((
  params: FalFlux3ExtendVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3ExtendVideoRequest>;
};

type FalFluxVideoUpscaleFn = ((
  params: FalFluxVideoUpscaleRequest,
  signal?: AbortSignal
) => Promise<FalFluxVideoUpscaleResponse>) & {
  schema: ApicitySchema<FalFluxVideoUpscaleRequest>;
};

export interface FalRunFlux3Namespace {
  extendVideo: FalFlux3ExtendVideoFn;
  firstLastFrameToVideo: FalFlux3FirstLastFrameToVideoFn;
  imageToVideo: FalFlux3ImageToVideoFn;
  keyframesToVideo: FalFlux3KeyframesToVideoFn;
  textToVideo: FalFlux3TextToVideoFn;
}

export interface FalRunBlackforestlabsNamespace {
  flux3: FalRunFlux3Namespace;
  fluxVideoUpscale: FalFluxVideoUpscaleFn;
}

type FalLtx2p5ImageToVideoProFn = ((
  params: FalLtx2p5ImageToVideoProRequest,
  signal?: AbortSignal
) => Promise<FalLtx2p5ImageToVideoProResponse>) & {
  schema: ApicitySchema<FalLtx2p5ImageToVideoProRequest>;
};

// `pro` is a URL segment, not a variant flag: upstream splits the LTX-2.5
// image-to-video model into `/pro` and `/fast` endpoints.
type FalLtx2p5ImageToVideoFastFn = ((
  params: FalLtx2p5ImageToVideoFastRequest,
  signal?: AbortSignal
) => Promise<FalLtx2p5ImageToVideoFastResponse>) & {
  schema: ApicitySchema<FalLtx2p5ImageToVideoFastRequest>;
};

// `fast` is a URL segment, not a variant flag: upstream splits the LTX-2.5
// image-to-video model into `/pro` and `/fast` endpoints, and the two do not
// share a request contract — the fast tier reaches 20s, 48 fps and 2160p.
export interface FalRunLightricksLtx2p5ImageToVideoNamespace {
  pro: FalLtx2p5ImageToVideoProFn;
  fast: FalLtx2p5ImageToVideoFastFn;
}

export interface FalRunLightricksLtx2p5Namespace {
  imageToVideo: FalRunLightricksLtx2p5ImageToVideoNamespace;
}

export interface FalRunLightricksNamespace {
  ltx2p5: FalRunLightricksLtx2p5Namespace;
}

export interface FalRunNamespace {
  alibaba: FalRunAlibabaNamespace;
  blackforestlabs: FalRunBlackforestlabsNamespace;
  bytedance: FalRunBytedanceNamespace;
  hunyuan: FalRunHunyuanNamespace;
  klingVideo: FalRunKlingVideoNamespace;
  minimax: FalRunMinimaxNamespace;
  meshy: FalRunMeshyNamespace;
  lightricks: FalRunLightricksNamespace;
  nanoBanana: FalRunNanoBananaNamespace;
  nanoBananaPro: FalRunNanoBananaProNamespace;
  nanoBanana2: FalRunNanoBanana2Namespace;
  nanoBanana2Lite: FalRunNanoBanana2LiteNamespace;
  virtualTryOn: FalVirtualTryOnFn;
  topaz: FalRunTopazNamespace;
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
  params: FalElevenlabsSpeechToTextScribeV2Request,
  signal?: AbortSignal
) => Promise<FalElevenlabsSpeechToTextScribeV2Response>) & {
  schema: ApicitySchema<FalElevenlabsSpeechToTextScribeV2Request>;
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
  pricing: FalGetV1ModelsPricingNamespace;
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
  result(
    params: FalQueueResultParams,
    signal?: AbortSignal
  ): Promise<FalQueueResultResponse>;
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
  schema: ApicitySchema<FalStorageUploadInitiateParams>;
};

type FalStorageUploadInitiateMultipartFn = ((
  params: FalStorageUploadInitiateMultipartParams,
  signal?: AbortSignal
) => Promise<FalStorageUploadInitiateResponse>) & {
  schema: ApicitySchema<FalStorageUploadInitiateMultipartParams>;
};

type FalStorageUploadCompleteMultipartFn = ((
  params: FalStorageUploadCompleteMultipartParams,
  signal?: AbortSignal
) => Promise<Response>) & {
  schema: ApicitySchema<FalStorageUploadCompleteMultipartParams>;
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
