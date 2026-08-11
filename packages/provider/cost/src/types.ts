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
  extraUsd?: number;
}

export interface CostEstimate {
  usd: number;
  currency: "USD";
  source: CostSource;
  breakdown: CostBreakdown;
  rateAsOf: string | null;
  warnings: string[];
}

// Cost-only inputs that are NOT part of the upstream request body.
//
// Some upstream endpoints bill per second while their request schema carries
// no duration at all -- the output length follows a source or driving asset
// (kie's omnihuman-1-5, volcengine/video-to-video-lip-sync, ...). The caller
// knows that length; upstream infers it. `costHints` is how the caller tells
// the estimator, without contaminating the body it POSTs or the bytes
// canonicalHash/mintOtp sign.
//
// Additive by design: new hint fields are optional, so adding one is never a
// breaking change.
export interface CostHints {
  durationSeconds?: number;
  // Google Flow plan tier that sets the googleflow credit->USD basis. Omitted
  // => "pro" (the safe over-estimate default, byte-for-byte the pre-selector
  // output); "ultra" prices on the Google AI Ultra 20x basis. The (string & {})
  // member keeps autocomplete for the two known literals while still accepting a
  // runtime-sourced value: an unrecognized tier warns and falls back to "pro"
  // rather than being a compile error. Cost-only, like the rest of CostHints:
  // never merged into payload, never canonicalHash'd, never signed. A future
  // Gemini list-rate USD source (REQ-004) would land as a second additive field
  // (e.g. googleFlowRateSource) here, non-breaking.
  googleFlowPlan?: "pro" | "ultra" | (string & {});
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
      costHints?: CostHints;
    }
  | { provider: "free-media-upload" };

export interface CostProvider {
  estimate: (req: EstimateRequest) => CostEstimate;
}
