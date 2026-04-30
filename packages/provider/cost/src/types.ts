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

export interface CostProvider {
  openai?: OpenAiCostNamespace;
  anthropic?: AnthropicCostNamespace;
  xai?: XaiCostNamespace;
  kimicoding?: KimicodingCostNamespace;
  fal?: FalCostNamespace;
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
