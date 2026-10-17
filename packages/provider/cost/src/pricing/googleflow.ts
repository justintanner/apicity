import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asString } from "./helpers";

// Google Flow (via the useapi.net proxy) does not bill in USD. It bills in
// Google Flow credits drawn from the Google AI subscription attached to the
// account, so a USD estimate is credits x the plan's credit value.
//
// Credit costs per generation come from the upstream endpoint docs:
//   Veo 3.1 Lite                 non-Ultra 10 / Ultra 5
//   Veo 3.1 Lite Lower Priority  0 (Google AI Ultra $199 only)
//   Veo 3.1 Fast                 non-Ultra 20 / Ultra 10
//   Veo 3.1 Quality              100 (flat; 8s max)
//   Omni 1.1 Flash, 720p         4s 7 / 6s 10 / 8s 12 / 10s 15
//   Omni 1.1 Flash, 360p         4s 4 / 6s 5 / 8s 6 / 10s 7
//   Omni 1.1 Flash + V2V         720p 20 / 360p 10
// The Omni figures are from the 2026-10-17 re-read of the endpoint page and
// the overview's per-plan table, which lists the same Omni credits on every
// plan. They replaced the 2026-07-20 figures (4s 15 / 6s 20 / 8s 25 / 10s 30,
// V2V 40), which upstream had cut by about half.
//
// Image generation draws no credits on any plan. The Google Flow overview
// lists Nano Banana Pro, Nano Banana 2.1 and Nano Banana 2 Lite as
// "included" on Flow Pro and Flow Ultra, and image generation works even on
// a free account (read 2026-10-17):
//   nano-banana-2-lite (default), nano-banana-2 (Nano Banana 2.1),
//   nano-banana-pro, and the deprecated aliases nano-banana
//   (-> nano-banana-2) and imagen-4 (-> nano-banana-2-lite)    0
//
// Two Google AI plan tiers set the credit -> USD value:
//   pro    Google AI Pro,        $19.99/mo  for  1,000 credits => $0.02  / credit
//   ultra  Google AI Ultra $199, $199.99/mo for 25,000 credits => $0.008 / credit
// The overview also lists Plus ($7.99/mo, 200 credits, ~$0.04 / credit) and
// Ultra $99 ($99.99/mo, 10,000 credits, ~$0.01 / credit); neither is modelled.
// The credit *costs* also differ by tier, but only where upstream documents a
// halved Ultra cost: Veo Lite 10 -> 5 and Veo Fast 20 -> 10. Veo Quality (100)
// and every omni-flash cost carry no documented Ultra halving, so for those
// only the credit *value* changes. veo-3.1-lite-low-priority is an Ultra-only,
// zero-credit generation ($0 on both tiers), and the image models are
// zero-credit on both tiers too: the models where Ultra is not strictly below
// Pro.
//
// | Model                       | Pro credits x $0.02 | Ultra credits x $0.008 | Pro USD | Ultra USD |
// | --------------------------- | ------------------- | ---------------------- | ------- | --------- |
// | veo-3.1-quality             | 100                 | 100                    | $2.00   | $0.80     |
// | veo-3.1-fast                | 20                  | 10 (halved)            | $0.40   | $0.08     |
// | veo-3.1-lite                | 10                  | 5 (halved)             | $0.20   | $0.04     |
// | veo-3.1-lite-low-priority   | 0                   | 0 (Ultra-only, free)   | $0.00   | $0.00     |
// | omni-flash 720p 4/6/8/10s   | 7/10/12/15          | 7/10/12/15             | ...     | x $0.008  |
// | omni-flash 360p 4/6/8/10s   | 4/5/6/7             | 4/5/6/7                | ...     | x $0.008  |
// | omni-flash V2V 720p / 360p  | 20 / 10             | 20 / 10                | ...     | x $0.008  |
// | each image model, /image    | 0 (included)        | 0 (included)           | $0.00   | $0.00     |
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

// The omni-flash credits were re-priced from a later read of the same page,
// so they carry that read's stamp; the Veo entries keep the 2026-07-20 one.
const omniFlashSource = {
  url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos",
  asOf: "2026-10-17",
};

// The image rates' provenance: the overview's pricing table, which is where
// the "included" entries are published, read when the image entries landed.
const imageSource = {
  url: "https://useapi.net/docs/api-google-flow-v1",
  asOf: "2026-10-17",
};

// `count` is the number of video variations to generate (1-4, default 1);
// each variation is a separate generation and draws its own credits.
const generations = (p: Record<string, unknown>): number =>
  asNumber(p.count) ?? 1;

// `count` is the number of image variations to generate (1-4); POST /images
// defaults it to 4, unlike POST /videos.
const images = (p: Record<string, unknown>): number => asNumber(p.count) ?? 4;

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

// Per-image rate on the same plan tiers as video: `pro` / `ultra` are the
// per-tier credit costs of one image. Every Flow image model is included in
// every plan, so both are an explicit 0, a real $0 estimate rather than a
// missing rate.
const flatImage = ({
  pro,
  ultra,
}: {
  pro: number;
  ultra: number;
}): PerUnitPricing => ({
  kind: "perUnit",
  unit: "images",
  units: images,
  select: [{ name: "plan", pick: planPick }],
  rates: { pro: proUsd(pro), ultra: ultraUsd(ultra) },
  warn: planWarn,
  source: imageSource,
});

// Omni Flash is the only duration-tiered model, and a video-to-video request
// (referenceVideo_1 set) overrides the duration tier with a flat edit price.
// One selector emits the whole variant key so the two axes stay in one place.
const omniFlashVariant = (p: Record<string, unknown>): string =>
  asString(p.referenceVideo_1)
    ? "reference-video"
    : `duration-${asNumber(p.duration) ?? 8}`;

// `resolution` is omni-flash only: 720p (the default) or 360p, which roughly
// halves the credits. 720p stays out of the variant key, so the default keys
// read as they always have. Any other value lands on a key with no rate and
// the estimate fails closed, as upstream rejects the request.
const omniFlashResolution = (
  p: Record<string, unknown>
): string | undefined => {
  const resolution = asString(p.resolution);
  return resolution === "720p" ? undefined : resolution;
};

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
    // Selector order is [variant, resolution, plan], so the variant key is
    // e.g. "duration-8|pro" at 720p or "reference-video|360p|ultra".
    select: [
      { name: "variant", pick: omniFlashVariant },
      { name: "resolution", pick: omniFlashResolution },
      { name: "plan", pick: planPick },
    ],
    rates: {
      // 720p, the default
      "duration-4|pro": proUsd(7),
      "duration-4|ultra": ultraUsd(7),
      "duration-6|pro": proUsd(10),
      "duration-6|ultra": ultraUsd(10),
      "duration-8|pro": proUsd(12),
      "duration-8|ultra": ultraUsd(12),
      "duration-10|pro": proUsd(15),
      "duration-10|ultra": ultraUsd(15),
      "reference-video|pro": proUsd(20),
      "reference-video|ultra": ultraUsd(20),
      // 360p
      "duration-4|360p|pro": proUsd(4),
      "duration-4|360p|ultra": ultraUsd(4),
      "duration-6|360p|pro": proUsd(5),
      "duration-6|360p|ultra": ultraUsd(5),
      "duration-8|360p|pro": proUsd(6),
      "duration-8|360p|ultra": ultraUsd(6),
      "duration-10|360p|pro": proUsd(7),
      "duration-10|360p|ultra": ultraUsd(7),
      "reference-video|360p|pro": proUsd(10),
      "reference-video|360p|ultra": ultraUsd(10),
    },
    warn: planWarn,
    source: omniFlashSource,
  },

  // POST /images models: included in every plan, so zero credits per image
  // on both tiers.
  "nano-banana-2-lite": flatImage({ pro: 0, ultra: 0 }),
  "nano-banana-2": flatImage({ pro: 0, ultra: 0 }),
  "nano-banana-pro": flatImage({ pro: 0, ultra: 0 }),
  // Deprecated aliases upstream still accepts: nano-banana runs
  // nano-banana-2, and imagen-4 runs nano-banana-2-lite (Google removed Imagen
  // from Flow in July 2026).
  "nano-banana": flatImage({ pro: 0, ultra: 0 }),
  "imagen-4": flatImage({ pro: 0, ultra: 0 }),
};
