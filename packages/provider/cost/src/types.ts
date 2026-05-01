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

interface TextEstimateRequestBase {
  payload: Record<string, unknown>;
  useHeuristic?: boolean;
  signal?: AbortSignal;
}

interface HeuristicEstimateRequestBase {
  payload: Record<string, unknown>;
}

export type EstimateRequest =
  | ({ provider: "openai" } & TextEstimateRequestBase)
  | ({ provider: "anthropic" } & TextEstimateRequestBase)
  | ({ provider: "xai" } & TextEstimateRequestBase)
  | ({ provider: "kimicoding" } & HeuristicEstimateRequestBase)
  | ({ provider: "fireworks" } & HeuristicEstimateRequestBase)
  | ({ provider: "alibaba" } & HeuristicEstimateRequestBase)
  | {
      provider: "fal";
      endpoint_id: string;
      payload: Record<string, unknown>;
      estimateType?: "historical_api_price" | "unit_price";
      signal?: AbortSignal;
    }
  | { provider: "kie"; payload: Record<string, unknown> }
  | { provider: "elevenlabs"; payload: Record<string, unknown> }
  | { provider: "free" };

export interface CostProvider {
  estimate: (req: EstimateRequest) => Promise<CostEstimate>;
}
