// Fal provider options
export interface FalOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

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
  readonly requestId?: string;
  readonly docsUrl?: string;

  constructor(
    message: string,
    status: number,
    type: FalErrorType,
    requestId?: string,
    docsUrl?: string
  ) {
    super(message);
    this.name = "FalError";
    this.status = status;
    this.type = type;
    this.requestId = requestId;
    this.docsUrl = docsUrl;
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
  boundToTimeframe?: boolean;
}

// ==================== Models ====================

// Model search parameters
export interface FalModelSearchParams extends FalPaginatedParams {
  endpointId?: string | string[];
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
  displayName: string;
  category: string;
  description: string;
  status: "active" | "deprecated";
  tags: string[];
  updatedAt: string;
  isFavorited: boolean | null;
  thumbnailUrl: string;
  thumbnailAnimatedUrl?: string;
  modelUrl: string;
  githubUrl?: string;
  licenseType?: "commercial" | "research" | "private";
  date: string;
  group?: FalModelGroup;
  highlighted: boolean;
  kind?: "inference" | "training";
  trainingEndpointIds?: string[];
  inferenceEndpointIds?: string[];
  streamUrl?: string;
  durationEstimate?: number;
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
  endpointId: string;
  metadata?: FalModelMetadata;
  openapi?: FalOpenApiSpec | FalOpenApiError;
}

// Model search response
export interface FalModelSearchResponse {
  models: FalModel[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ==================== Pricing ====================

// Pricing parameters
export interface FalPricingParams {
  endpointId: string | string[];
}

// Price information for a model
export interface FalPrice {
  endpointId: string;
  unitPrice: number;
  unit: string;
  currency: string;
}

// Pricing response
export interface FalPricingResponse {
  prices: FalPrice[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ==================== Cost Estimation ====================

// Historical API price estimate request
export interface FalHistoricalApiPriceEstimate {
  estimateType: "historical_api_price";
  endpoints: Record<string, { callQuantity: number }>;
}

// Unit price estimate request
export interface FalUnitPriceEstimate {
  estimateType: "unit_price";
  endpoints: Record<string, { unitQuantity: number }>;
}

// Estimate request (discriminated union)
export type FalEstimateRequest =
  | FalHistoricalApiPriceEstimate
  | FalUnitPriceEstimate;

// Estimate response
export interface FalEstimateResponse {
  estimateType: "historical_api_price" | "unit_price";
  totalCost: number;
  currency: string;
}

// ==================== Usage ====================

// Usage parameters
export interface FalUsageParams extends FalPaginatedParams, FalTimeRangeParams {
  endpointId?: string | string[];
  expand?: string[];
}

// Usage record
export interface FalUsageRecord {
  endpointId: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  cost: number;
  currency: string;
  authMethod?: string;
}

// Usage time bucket
export interface FalUsageBucket {
  bucket: string;
  results: FalUsageRecord[];
}

// Usage response
export interface FalUsageResponse {
  nextCursor: string | null;
  hasMore: boolean;
  timeSeries?: FalUsageBucket[];
  summary?: FalUsageRecord[];
}

// ==================== Analytics ====================

// Analytics parameters
export interface FalAnalyticsParams
  extends FalPaginatedParams, FalTimeRangeParams {
  endpointId: string | string[];
  expand?: string[];
}

// Analytics record
export interface FalAnalyticsRecord {
  endpointId: string;
  requestCount?: number;
  successCount?: number;
  userErrorCount?: number;
  errorCount?: number;
  p50Duration?: number;
  p75Duration?: number;
  p90Duration?: number;
  p50PrepareDuration?: number;
  p75PrepareDuration?: number;
  p90PrepareDuration?: number;
}

// Analytics time bucket
export interface FalAnalyticsBucket {
  bucket: string;
  results: FalAnalyticsRecord[];
}

// Analytics response
export interface FalAnalyticsResponse {
  nextCursor: string | null;
  hasMore: boolean;
  timeSeries?: FalAnalyticsBucket[];
  summary?: FalAnalyticsRecord[];
}

// ==================== Requests ====================

// Requests parameters
export interface FalRequestsParams extends FalPaginatedParams {
  endpointId: string;
  start?: string;
  end?: string;
  status?: "success" | "error" | "user_error";
  requestId?: string;
  expand?: string[];
  sortBy?: "ended_at" | "duration";
}

// Request item
export interface FalRequestItem {
  requestId: string;
  endpointId: string;
  startedAt: string;
  sentAt: string;
  endedAt?: string;
  statusCode?: number;
  duration?: number;
  jsonInput?: unknown;
  jsonOutput?: unknown;
}

// Requests response
export interface FalRequestsResponse {
  nextCursor: string | null;
  hasMore: boolean;
  items: FalRequestItem[];
}

// ==================== Delete Payloads ====================

// Delete payloads parameters
export interface FalDeletePayloadsParams {
  requestId: string;
  idempotencyKey?: string;
}

// CDN delete result
export interface FalCdnDeleteResult {
  link: string;
  exception: string | null;
}

// Delete payloads response
export interface FalDeletePayloadsResponse {
  cdnDeleteResults: FalCdnDeleteResult[];
}

// ==================== Provider ====================

// Namespace types
interface FalModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
  estimate(
    req: FalEstimateRequest,
    signal?: AbortSignal
  ): Promise<FalEstimateResponse>;
}

interface FalModelsRequestsNamespace {
  byEndpoint(
    params: FalRequestsParams,
    signal?: AbortSignal
  ): Promise<FalRequestsResponse>;
  payloads(
    params: FalDeletePayloadsParams,
    signal?: AbortSignal
  ): Promise<FalDeletePayloadsResponse>;
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

interface FalV1Namespace {
  models: FalModelsNamespace;
}

// Provider interface
export interface FalProvider {
  v1: FalV1Namespace;
}
