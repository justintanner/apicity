export type CostSource = "tokens-heuristic+table" | "per-unit-table" | "free";

export type CostUnit =
  | "tokens"
  | "characters"
  | "seconds"
  | "images"
  | "songs"
  | "generations";

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

// All provider routes are pure-table lookups. Token-billed providers
// approximate input tokens via chars/4 (no upstream tokenizer call).
export type EstimateRequest =
  | {
      provider:
        | "openai"
        | "anthropic"
        | "xai"
        | "kimicoding"
        | "fireworks"
        | "alibaba"
        | "kie"
        | "elevenlabs";
      payload: Record<string, unknown>;
    }
  | { provider: "free" };

export interface CostProvider {
  estimate: (req: EstimateRequest) => CostEstimate;
}
