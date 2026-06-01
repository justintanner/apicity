export { cost } from "./cost";
export { computeEstimate } from "./compute";
export { PRICING, PRICING_AS_OF } from "./pricing/index";
export { MODEL_SLUGS, MODEL_DISPLAY, modelSlug, modelDisplay } from "./slugs";
export type { SlugProviderId, SlugModelId } from "./slugs";

export type {
  CostUnit,
  ModelPricing,
  PerUnitPricing,
  PricedProviderId,
  RateSource,
  TokenPricing,
} from "./pricing/index";

export type {
  CostBreakdown,
  CostEstimate,
  CostProvider,
  CostSource,
  EstimateRequest,
} from "./types";

export type { ExtractResult, TextExtract } from "./extract/types";

export {
  ENDPOINT_COSTS,
  getEndpointCost,
  isExpensiveOrWorse,
  isProhibitive,
  listByTier,
  listByProvider,
  countByTier,
} from "./endpoint-costs";

export type { EndpointCostInfo } from "./endpoint-costs";

// Cost tier and gate system
export {
  gateCheck,
  gateCheckBatch,
  getTier,
  TIERED_ENDPOINTS,
  lookupTier,
  providerTiers,
  DEFAULT_POLICY,
  STRICT_POLICY,
  PERMISSIVE_POLICY,
  createTokenBucket,
  GateError,
  resolveAction,
} from "./tokens";
export type {
  CostTier,
  TieredEndpoint,
  CostPolicy,
  PolicyAction,
  GateResult,
  TokenBucket,
  BatchGateRequest,
} from "./tokens";

export {
  PAID_ENDPOINTS,
  lookupPaidEndpoint,
  isPaidEndpoint,
  maxSpendPreflight,
  MaxSpendError,
  SpendBoundError,
  spendBoundCheck,
  dispatchWithPaidGuard,
} from "./paid-endpoints";
export type {
  PaidEndpointKey,
  PaidEndpointInfo,
  PaidEndpointEntry,
} from "./paid-endpoints";
