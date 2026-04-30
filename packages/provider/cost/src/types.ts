import type {
  AnthropicCountTokensRequest,
  AnthropicCountTokensResponse,
} from "@apicity/anthropic";
import type {
  FalEstimateRequest,
  FalEstimateResponse,
  FalPricingParams,
  FalPricingResponse,
} from "@apicity/fal";
import type {
  CountTokensRequest as KimiCountTokensRequest,
  CountTokensResponse as KimiCountTokensResponse,
} from "@apicity/kimicoding";
import type {
  OpenAiResponseInputTokensRequest,
  OpenAiResponseInputTokensResponse,
} from "@apicity/openai";
import type {
  XaiTokenizeTextRequest,
  XaiTokenizeTextResponse,
} from "@apicity/xai";

export interface ProviderClientOptions {
  apiKey: string;
  baseURL?: string;
}

export interface CostOptions {
  openai?: ProviderClientOptions;
  anthropic?: ProviderClientOptions;
  xai?: ProviderClientOptions;
  kimicoding?: ProviderClientOptions;
  fal?: ProviderClientOptions;
}

export interface OpenAiCostNamespace {
  estimate: (
    req: OpenAiResponseInputTokensRequest,
    signal?: AbortSignal
  ) => Promise<OpenAiResponseInputTokensResponse>;
}

export interface AnthropicCostNamespace {
  estimate: (
    req: AnthropicCountTokensRequest,
    signal?: AbortSignal
  ) => Promise<AnthropicCountTokensResponse>;
}

export interface XaiCostNamespace {
  estimate: (
    req: XaiTokenizeTextRequest,
    signal?: AbortSignal
  ) => Promise<XaiTokenizeTextResponse>;
}

export interface KimicodingCostNamespace {
  estimate: (
    req: KimiCountTokensRequest,
    signal?: AbortSignal
  ) => Promise<KimiCountTokensResponse>;
}

export interface FalCostNamespace {
  estimate: (
    req: FalEstimateRequest,
    signal?: AbortSignal
  ) => Promise<FalEstimateResponse>;
  pricing: (
    req: FalPricingParams,
    signal?: AbortSignal
  ) => Promise<FalPricingResponse>;
}

// ---------------------------------------------------------------------------
// Iteration 2 — unified usd() entry
// ---------------------------------------------------------------------------

export type CostSource =
  | "upstream-usd"
  | "tokens-api+table"
  | "tokens-heuristic+table"
  | "per-unit-table"
  | "free";

export type CostUnit = "tokens" | "characters" | "seconds" | "images" | "songs";

export interface CostBreakdown {
  inputTokens?: number;
  outputTokens?: number;
  units?: number;
  unit?: CostUnit;
  inputUsdPerMillion?: number;
  outputUsdPerMillion?: number;
  perUnitUsd?: number;
}

export interface CostEstimate {
  usd: number;
  currency: "USD";
  source: CostSource;
  breakdown: CostBreakdown;
  rateAsOf: string | null;
  warnings: string[];
}

export interface UsdTokenRequest {
  provider: "openai" | "anthropic" | "xai";
  model: string;
  text: string;
  maxOutputTokens?: number;
  useHeuristic?: boolean;
  signal?: AbortSignal;
}

export interface UsdHeuristicRequest {
  provider: "fireworks" | "alibaba" | "kimicoding";
  model: string;
  text: string;
  maxOutputTokens?: number;
}

export interface UsdFalRequest {
  provider: "fal";
  endpoint_id: string;
  payload: Record<string, unknown>;
  estimate_type?: "historical_api_price" | "unit_price";
  signal?: AbortSignal;
}

export interface UsdElevenLabsRequest {
  provider: "elevenlabs";
  model: string;
  characters: number;
}

export interface UsdKieRequest {
  provider: "kie";
  model: string;
  seconds?: number;
  images?: number;
  songs?: number;
}

export interface UsdFreeRequest {
  provider: "free";
}

export type UsdRequest =
  | UsdTokenRequest
  | UsdHeuristicRequest
  | UsdFalRequest
  | UsdElevenLabsRequest
  | UsdKieRequest
  | UsdFreeRequest;

export interface CostProvider {
  openai?: OpenAiCostNamespace;
  anthropic?: AnthropicCostNamespace;
  xai?: XaiCostNamespace;
  kimicoding?: KimicodingCostNamespace;
  fal?: FalCostNamespace;
  usd: (req: UsdRequest) => Promise<CostEstimate>;
}

export type {
  AnthropicCountTokensRequest,
  AnthropicCountTokensResponse,
  FalEstimateRequest,
  FalEstimateResponse,
  FalPricingParams,
  FalPricingResponse,
  KimiCountTokensRequest,
  KimiCountTokensResponse,
  OpenAiResponseInputTokensRequest,
  OpenAiResponseInputTokensResponse,
  XaiTokenizeTextRequest,
  XaiTokenizeTextResponse,
};
