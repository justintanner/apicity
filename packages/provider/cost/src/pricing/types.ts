// Shared shapes for the per-provider pricing tables under pricing/.
//
// Each provider file exports a Record<modelId, ModelPricing>. The barrel
// (pricing/index.ts) wires those into a typed `PRICING` constant. Model ids
// are upstream identifiers verbatim (e.g. "bytedance/seedance-2-fast"), and
// per-unit rate keys mirror upstream payload values verbatim — no internal
// translation layer between what the caller sends and what selects a rate.

export type CostUnit =
  | "tokens"
  | "characters"
  | "seconds"
  | "images"
  | "songs"
  | "generations";

export interface RateSource {
  url: string;
  // ISO date the rate was last refreshed. Falls back to PRICING_AS_OF when
  // omitted, so a provider-specific refresh can stamp its own date without
  // bumping the global default.
  asOf?: string;
}

// Token-billed providers: openai, anthropic, xai, kimicoding, fireworks,
// alibaba. Token counts come from outside (upstream tokenizer or chars/4
// heuristic) — selectors and units derivation aren't needed.
export interface TokenPricing {
  kind: "tokens";
  rate: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite5m?: number;
  };
  source: RateSource;
}

// Per-unit providers: kie, elevenlabs.
//
// `select` is an ordered list of named pickers that read the upstream payload
// and return string values. The variant key is the values joined by "|",
// dropping any undefined entry. `rates` maps that key to per-unit USD.
//
// A flat-rate model has `select: []` and `rates: { "": <perUnit> }`.
export interface PerUnitPricing {
  kind: "perUnit";
  unit: CostUnit;
  units: (payload: Record<string, unknown>) => number | undefined;
  select: ReadonlyArray<{
    name: string;
    pick: (payload: Record<string, unknown>) => string | undefined;
  }>;
  rates: Record<string, number>;
  source: RateSource;
}

export type ModelPricing = TokenPricing | PerUnitPricing;
