// Shared shapes for the per-provider pricing tables under pricing/.
//
// Each provider file exports a Record<modelId, ModelPricing>. The barrel
// (pricing/index.ts) wires those into a typed `PRICING` constant. Model ids
// are upstream identifiers verbatim (e.g. "bytedance/seedance-2-fast"), and
// per-unit rate keys mirror upstream payload values verbatim — no internal
// translation layer between what the caller sends and what selects a rate.

import type { CostHints } from "../types";

export type CostUnit =
  | "tokens"
  | "characters"
  | "seconds"
  | "images"
  | "songs"
  | "generations"
  | "megapixels";

export interface RateSource {
  url: string;
  // ISO date the rate was last refreshed. Falls back to PRICING_AS_OF when
  // omitted, so a provider-specific refresh can stamp its own date without
  // bumping the global default.
  asOf?: string;
}

// USD per million tokens for one pricing tier of a token-billed model.
//
// `cacheRead` prices input tokens served from the provider's prompt cache.
// `cacheWrite5m` is Anthropic's five-minute cache-write rate. `cacheWrite` is
// the cache-write rate of a provider that publishes a single one with no
// retention variant (OpenAI GPT-5.6: 1.25x the uncached input rate, with a
// 30-minute cache TTL); an entry sets at most one of the two write fields.
export interface TokenRate {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite5m?: number;
  cacheWrite?: number;
}

// USD per million tokens of one non-text token modality (OpenAI Realtime
// audio and image tokens). `output` is absent for an input-only modality: an
// image is never generated, so no image-output rate exists to bundle.
export interface ModalityRate {
  input: number;
  cacheRead?: number;
  output?: number;
}

// Token-billed providers: openai, anthropic, xai, kimicoding, fireworks,
// alibaba. Token counts come from the chars/4 heuristic or, on the openai
// route, from caller-declared usage (CostHints) — selectors and units
// derivation aren't needed.
//
// `longContext` reprices the WHOLE request at `longContext.rate` when the
// declared total input tokens exceed `aboveInputTokens` (OpenAI GPT-5.6 Sol:
// "Prompts with >272K input tokens are priced at 2x input and 1.5x output
// for the full request"). An entry that sets `longContext` or
// `rate.cacheWrite` is priced only from declared usage: chars/4 cannot see
// cache writes or which side of the boundary a request falls on.
export interface TokenPricing {
  kind: "tokens";
  rate: TokenRate;
  longContext?: {
    aboveInputTokens: number;
    rate: TokenRate;
  };
  // Per-modality rates for a model that prices audio and image tokens apart
  // from text (OpenAI gpt-realtime-2.1). `rate` is then the TEXT rate. A row
  // that sets this is priced only from declared modality usage, so one flat
  // rate never prices mixed modalities, and it sets no longContext and no
  // cache-write rate.
  modalityRates?: {
    audio?: ModalityRate;
    image?: ModalityRate;
  };
  source: RateSource;
}

// Per-unit providers: kie, elevenlabs, fal, googleflow.
//
// `select` is an ordered list of named pickers that read the upstream payload
// and return string values. The variant key is the values joined by "|",
// dropping any undefined optional entry. `rates` maps that key to per-unit
// USD. A selector marked `required` fails the estimate when its picker returns
// undefined, before a partial variant key can select a different rate.
//
// A flat-rate model has `select: []` and `rates: { "": <perUnit> }`.
//
// `hints` is the caller's cost-only side channel (see CostHints), passed as a
// sibling of `payload` and never merged into it. It is optional in both the
// closure contract and at every call site, so an entry that ignores it — every
// entry today — stays assignable unchanged.
export interface PerUnitPricing {
  kind: "perUnit";
  unit: CostUnit;
  units: (
    payload: Record<string, unknown>,
    hints?: CostHints
  ) => number | undefined;
  select: ReadonlyArray<{
    name: string;
    pick: (
      payload: Record<string, unknown>,
      hints?: CostHints
    ) => string | undefined;
    // Evidence-backed billing axes without an upstream default can opt into a
    // precise missing-selector failure. Omitted means optional for backwards
    // compatibility, including selectors that intentionally disappear from a
    // variant key for one mode.
    required?: boolean;
  }>;
  rates: Record<string, number>;
  // Optional cost-only warnings derived from the payload and hints (e.g. an
  // unrecognized googleflow plan tier that fell back to the Plus basis). Omitted
  // by every entry that does not need it, so existing entries stay assignable
  // unchanged; when present, evaluatePerUnit surfaces its return as the estimate
  // `warnings`. Never affects the price, the payload, or canonicalHash/mintOtp.
  warn?: (payload: Record<string, unknown>, hints?: CostHints) => string[];
  // Optional exact additive charge for finite payload dimensions that are not
  // representable as the primary unit/rate pair. Returning undefined fails
  // the estimate closed rather than permitting a non-exact floor.
  extra?: (
    payload: Record<string, unknown>,
    hints?: CostHints
  ) => number | undefined;
  source: RateSource;
}

export type ModelPricing = TokenPricing | PerUnitPricing;
