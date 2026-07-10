export { createCost } from "./cost";
export { computeEstimate } from "./compute";
export {
  COST_TIERS,
  CHEAP_MAX_USD,
  EXPENSIVE_MAX_USD,
  classifyCostUsd,
  classifyEstimate,
  isCostPolicyKnown,
} from "./cost-tier";
export type { CostTier, TierEstimate } from "./cost-tier";
export {
  ENDPOINT_COST_POLICIES,
  GATED_COST_TIERS,
  classifyEndpoint,
  resolveEndpointCostPolicy,
  isEndpointExplicitlyClassified,
  shouldRunEndpointByDefault,
} from "./endpoint-cost-policy";
export type {
  EndpointCostTier,
  EndpointCostPolicy,
  EndpointCostPolicyMatch,
} from "./endpoint-cost-policy";
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
  PAID_ENDPOINTS,
  lookupPaidEndpoint,
  isPaidEndpoint,
} from "./paid-endpoints";
export type {
  PaidEndpointKey,
  PaidEndpointInfo,
  PaidEndpointEntry,
} from "./paid-endpoints";

export {
  PayGateError,
  dispatchWithPaidGate,
  mintOtp,
  createReplayStore,
  canonicalizeJson,
  canonicalHash,
  parseOtp,
  parseTtl,
  verifyOtp,
} from "./paygate";
export type {
  PayGateApproval,
  PayGateConfig,
  ReplayStore,
  OtpCall,
  PayGateOtpPayload,
  VerifyFailureCode,
  VerifyOtpInput,
  VerifyResult,
} from "./paygate";

export { withPaidGate } from "./with-paid-gate";
export type { WithPaidGateOptions } from "./with-paid-gate";
