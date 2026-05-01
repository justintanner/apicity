// Single source of truth for bundled pricing rates. Each provider lives in
// its own file under pricing/ — adding or updating a model means editing
// exactly one file.
//
// Refresh procedure: re-fetch the upstream pricing page named in the
// affected entry's `source.url`, update the rate, set `source.asOf` if
// you want a per-entry stamp; otherwise the global PRICING_AS_OF applies.
//
// FAL is intentionally absent: it has no bundled rates because the
// dispatcher in compute.ts asks the upstream pricing endpoint at runtime.

import { alibaba } from "./alibaba";
import { anthropic } from "./anthropic";
import { elevenlabs } from "./elevenlabs";
import { fireworks } from "./fireworks";
import { kie } from "./kie";
import { kimicoding } from "./kimicoding";
import { openai } from "./openai";
import { xai } from "./xai";

export const PRICING_AS_OF = "2026-04-30";

export const PRICING = {
  openai,
  anthropic,
  xai,
  kimicoding,
  fireworks,
  alibaba,
  elevenlabs,
  kie,
} as const;

export type PricedProviderId = keyof typeof PRICING;

export type {
  CostUnit,
  ModelPricing,
  PerUnitPricing,
  RateSource,
  TokenPricing,
} from "./types";
