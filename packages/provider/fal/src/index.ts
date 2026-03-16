// Export main provider function
export { fal } from "./fal";

// Export error class
export { FalError } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";
export type { RetryOptions, FallbackOptions } from "./middleware";

// Export all types
export type {
  FalOptions,
  FalErrorType,
  FalPaginatedParams,
  FalTimeRangeParams,
  FalModelSearchParams,
  FalModelGroup,
  FalModelMetadata,
  FalOpenApiSpec,
  FalOpenApiError,
  FalModel,
  FalModelSearchResponse,
  FalPricingParams,
  FalPrice,
  FalPricingResponse,
  FalHistoricalApiPriceEstimate,
  FalUnitPriceEstimate,
  FalEstimateRequest,
  FalEstimateResponse,
  FalUsageParams,
  FalUsageRecord,
  FalUsageBucket,
  FalUsageResponse,
  FalAnalyticsParams,
  FalAnalyticsRecord,
  FalAnalyticsBucket,
  FalAnalyticsResponse,
  FalRequestsParams,
  FalRequestItem,
  FalRequestsResponse,
  FalDeletePayloadsParams,
  FalCdnDeleteResult,
  FalDeletePayloadsResponse,
  FalProvider,
} from "./types";
