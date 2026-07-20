export type CostSource = "tokens-heuristic+table" | "per-unit-table" | "free";

export type CostUnit =
  | "tokens"
  | "characters"
  | "seconds"
  | "images"
  | "songs"
  | "generations"
  | "megapixels";

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
//
// `endpoint` is an optional discriminator for per-unit providers whose
// pricing is keyed by endpoint rather than by `payload.model` (e.g. Suno,
// where the model field is the audio model version V3_5/.../V5_5 but
// pricing varies per endpoint). When set, it takes precedence over
// payload.model in the pricing lookup. Ignored for token-billed providers.
//
// For `fal` it is optional in the type but required in practice: fal payloads
// carry no model field at all, so the endpoint id ("fal-ai/nano-banana") is the
// only pricing key. Omitting it is not a compile error — it resolves to a zero
// estimate carrying the warning "fal: endpoint or payload.model is required".
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
        | "elevenlabs"
        | "fal"
        | "googleflow";
      payload: Record<string, unknown>;
      endpoint?: string;
    }
  | { provider: "free-media-upload" };

export interface CostProvider {
  estimate: (req: EstimateRequest) => CostEstimate;
}
