// Single source of truth for bundled pricing rates. Each provider lives in
// its own file under pricing/ — adding or updating a model means editing
// exactly one file.
//
// Refresh procedure: re-fetch the upstream pricing page named in the
// affected entry's `source.url`, update the rate, set `source.asOf` if
// you want a per-entry stamp; otherwise the global PRICING_AS_OF applies.
//
// fal rates are bundled here like every other provider. @apicity/fal does
// expose upstream pricing endpoints (`fal.v1.models.pricing()` and
// `fal.v1.models.pricing.estimate()`), but computeEstimate never calls them —
// it is a dependency-free local lookup with no network access at all, so fal
// resolves against the bundled table in pricing/fal.ts keyed by endpoint id.

import { alibaba } from "./alibaba";
import { anthropic } from "./anthropic";
import { elevenlabs } from "./elevenlabs";
import { fal } from "./fal";
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
  fal,
} as const;

export type PricedProviderId = keyof typeof PRICING;

export type {
  CostUnit,
  ModelPricing,
  PerUnitPricing,
  RateSource,
  TokenPricing,
} from "./types";
