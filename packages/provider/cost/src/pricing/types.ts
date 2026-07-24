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

// Per-unit providers: kie, elevenlabs, fal, googleflow.
//
// `select` is an ordered list of named pickers that read the upstream payload
// and return string values. The variant key is the values joined by "|",
// dropping any undefined entry. `rates` maps that key to per-unit USD.
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
  }>;
  rates: Record<string, number>;
  // Optional cost-only warnings derived from the payload and hints (e.g. an
  // unrecognized googleflow plan tier that fell back to the Pro basis). Omitted
  // by every entry that does not need it, so existing entries stay assignable
  // unchanged; when present, evaluatePerUnit surfaces its return as the estimate
  // `warnings`. Never affects the price, the payload, or canonicalHash/mintOtp.
  warn?: (payload: Record<string, unknown>, hints?: CostHints) => string[];
  source: RateSource;
}

export type ModelPricing = TokenPricing | PerUnitPricing;
