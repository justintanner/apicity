import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asString } from "./helpers";

// Google Flow (via the useapi.net proxy) does not bill in USD. It bills in
// Google Flow credits drawn from the Google AI subscription attached to the
// account, so a USD estimate is credits x the plan's credit value.
//
// Credit costs per generation come from the upstream endpoint docs:
//   Veo 3.1 Lite                 non-Ultra 10 / Ultra 5
//   Veo 3.1 Lite Lower Priority  0 (Google AI Ultra 20x only)
//   Veo 3.1 Fast                 non-Ultra 20 / Ultra 10
//   Veo 3.1 Quality              100 (flat; 8s max)
//   Gemini Omni Flash            4s 15 / 6s 20 / 8s 25 / 10s 30
//   Gemini Omni Flash + V2V      40
//
// Two Google AI plan tiers set the credit -> USD value:
//   pro    Google AI Pro,       $19.99/mo for  1,000 credits => $0.02  / credit
//   ultra  Google AI Ultra 20x, $200/mo   for 25,000 credits => $0.008 / credit
// The credit *costs* also differ by tier, but only where upstream documents a
// halved Ultra cost: Veo Lite 10 -> 5 and Veo Fast 20 -> 10. Veo Quality (100),
// the omni-flash duration tiers (15/20/25/30), and the omni-flash V2V flat 40
// carry no documented Ultra halving, so for those only the credit *value*
// changes. veo-3.1-lite-low-priority is an Ultra-only, zero-credit generation
// ($0 on both tiers) — the one model where Ultra is not strictly below Pro.
//
// | Model                     | Pro credits x $0.02 | Ultra credits x $0.008 | Pro USD | Ultra USD |
// | ------------------------- | ------------------- | ---------------------- | ------- | --------- |
// | veo-3.1-quality           | 100                 | 100                    | $2.00   | $0.80     |
// | veo-3.1-fast              | 20                  | 10 (halved)            | $0.40   | $0.08     |
// | veo-3.1-lite              | 10                  | 5 (halved)             | $0.20   | $0.04     |
// | veo-3.1-lite-low-priority | 0                   | 0 (Ultra-only, free)   | $0.00   | $0.00     |
// | omni-flash dur-4/6/8/10   | 15/20/25/30         | 15/20/25/30            | ...     | x $0.008  |
// | omni-flash reference-video| 40                  | 40                     | $0.80   | $0.32     |
//
// The tier is a COST-ONLY selector read from costHints.googleFlowPlan; it is
// never in the request payload, never merged into it, and never signed. Omitted
// or unrecognized => "pro", the deliberate over-estimate (safe for a pay-gate);
// an unrecognized value additionally warns, naming the value. Consumers on an
// Ultra account pass { googleFlowPlan: "ultra" } to get their ~5x-lower basis.
const CREDIT_USD_PRO = 0.02;
const CREDIT_USD_ULTRA = 0.008;

// Known plan tiers. Anything else normalizes to "pro" (and warns) at request
// time; keeping the set named lets planPick / planWarn share one source of
// truth.
const PLANS = ["pro", "ultra"] as const;
type Plan = (typeof PLANS)[number];

const isKnownPlan = (value: string): value is Plan =>
  (PLANS as readonly string[]).includes(value);

const proUsd = (credits: number): number => credits * CREDIT_USD_PRO;
const ultraUsd = (credits: number): number => credits * CREDIT_USD_ULTRA;

const source = {
  url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos",
  // First googleflow rates land after the global PRICING_AS_OF of 2026-04-30,
  // so they carry their own stamp (OQ-7: per-entry `source.asOf` is the
  // existing mechanism for this; PRICING_AS_OF stays global). The plan tier
  // changes the credit basis, not the rate's provenance date or URL.
  asOf: "2026-07-20",
};

// `count` is the number of video variations to generate (1-4, default 1);
// each variation is a separate generation and draws its own credits.
const generations = (p: Record<string, unknown>): number =>
  asNumber(p.count) ?? 1;

// Cost-only plan-tier selector. Reads ONLY costHints.googleFlowPlan and always
// returns a known plan key, so the variant lookup never misses (and the
// estimate is never the zero-USD "no rate for variant" path). Omitted and
// unrecognized tiers both normalize to "pro", the safe over-estimate; planWarn
// names the unrecognized value separately.
const planPick = (
  _payload: Record<string, unknown>,
  hints?: CostHints
): Plan => (hints?.googleFlowPlan === "ultra" ? "ultra" : "pro");

// Warn — without changing the price — when the caller passes a tier that is
// neither known plan. planPick has already fallen back to the Pro basis; this
// only surfaces that fallback and names the bad value (REQ-005). Empty for
// pro / ultra / omitted, so default parity (REQ-001) still sees warnings: [].
const planWarn = (
  _payload: Record<string, unknown>,
  hints?: CostHints
): string[] => {
  const plan = hints?.googleFlowPlan;
  return plan !== undefined && !isKnownPlan(plan)
    ? [`googleflow: unknown plan tier '${plan}', using Pro basis`]
    : [];
};

// Flat per-generation rate — the Veo tiers charge the same credits regardless
// of duration, but both the credit *value* and (for Lite/Fast) the credit
// *cost* depend on the plan tier. `pro` / `ultra` are the per-tier credit
// costs; the `plan` selector picks between the two resolved USD rates.
const flatVideo = ({
  pro,
  ultra,
}: {
  pro: number;
  ultra: number;
}): PerUnitPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: generations,
  select: [{ name: "plan", pick: planPick }],
  rates: { pro: proUsd(pro), ultra: ultraUsd(ultra) },
  warn: planWarn,
  source,
});

// Omni Flash is the only duration-tiered model, and a video-to-video request
// (referenceVideo_1 set) overrides the duration tier with a flat 40 credits.
// One selector emits the whole variant key so the two axes stay in one place.
const omniFlashVariant = (p: Record<string, unknown>): string =>
  asString(p.referenceVideo_1)
    ? "reference-video"
    : `duration-${asNumber(p.duration) ?? 8}`;

export const googleflow: Record<string, ModelPricing> = {
  "veo-3.1-quality": flatVideo({ pro: 100, ultra: 100 }),
  "veo-3.1-fast": flatVideo({ pro: 20, ultra: 10 }),
  "veo-3.1-lite": flatVideo({ pro: 10, ultra: 5 }),
  // Ultra 20x only, and free of credits there — a real $0 estimate, not a
  // missing rate. $0 on both tiers is the one exception to "Ultra < Pro".
  "veo-3.1-lite-low-priority": flatVideo({ pro: 0, ultra: 0 }),

  "omni-flash": {
    kind: "perUnit",
    unit: "generations",
    units: generations,
    // Selector order is [variant, plan], so the variant key is e.g.
    // "duration-8|pro" or "reference-video|ultra".
    select: [
      { name: "variant", pick: omniFlashVariant },
      { name: "plan", pick: planPick },
    ],
    rates: {
      "duration-4|pro": proUsd(15),
      "duration-4|ultra": ultraUsd(15),
      "duration-6|pro": proUsd(20),
      "duration-6|ultra": ultraUsd(20),
      "duration-8|pro": proUsd(25),
      "duration-8|ultra": ultraUsd(25),
      "duration-10|pro": proUsd(30),
      "duration-10|ultra": ultraUsd(30),
      "reference-video|pro": proUsd(40),
      "reference-video|ultra": ultraUsd(40),
    },
    warn: planWarn,
    source,
  },
};
