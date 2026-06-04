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
  PAID_ENDPOINTS,
  lookupPaidEndpoint,
  isPaidEndpoint,
  SpendBoundError,
} from "./paid-endpoints";
export type {
  PaidEndpointKey,
  PaidEndpointInfo,
  PaidEndpointEntry,
} from "./paid-endpoints";

export {
  PayGateError,
  dispatchWithPaidGate,
  defaultPayGateIo,
  canonicalizeJson,
  canonicalHash,
  parseOtp,
  verifyOtp,
  verifyOtpSignature,
  isJtiConsumed,
  consumeJti,
  loadPublicKey,
} from "./paygate";
export type {
  PayGateApproval,
  PayGateIo,
  PayGateOtpPayload,
  VerifyFailureCode,
  VerifyOtpInput,
  VerifyResult,
} from "./paygate";

export { withPaidGate } from "./with-paid-gate";
export type { WithPaidGateOptions } from "./with-paid-gate";
