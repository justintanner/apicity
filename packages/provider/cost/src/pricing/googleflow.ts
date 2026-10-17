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
// Four Google AI plan tiers set the credit -> USD value. The overview's tier
// table (https://useapi.net/docs/api-google-flow-v1) and Google's own credits
// page (https://support.google.com/flow/answer/16526234), both read
// 2026-10-17, give the price and the monthly allowance:
//   plus      Google AI Plus,       $7.99/mo   for    200 credits => $0.04  / credit
//   pro       Google AI Pro,        $19.99/mo  for  1,000 credits => $0.02  / credit
//   ultra-99  Google AI Ultra $99,  $99.99/mo  for 10,000 credits => $0.01  / credit
//   ultra     Google AI Ultra $199, $199.99/mo for 25,000 credits => $0.008 / credit
// Each value is the quotient rounded up to the overview's "~cost / credit"
// figure (0.03995, 0.01999, 0.009999 and 0.0079996 exactly), so the rounding
// only ever over-estimates. Google prices Pro at $9.99/mo for the first six
// months; the list price is the basis. Google calls the two Ultra plans
// "Ultra $100" and "Ultra $200"; `ultra` keeps meaning the $199 plan, as it
// did when it was the only Ultra tier.
//
// The credit *costs* also differ by tier, but only where upstream documents a
// halved Ultra cost: Veo Lite 10 -> 5 and Veo Fast 20 -> 10, on both Ultra
// plans. Veo Quality (100) and every omni-flash cost are the same on every
// plan, so for those only the credit *value* changes.
// veo-3.1-lite-low-priority runs only on Ultra $199, for zero credits; every
// other plan is refused upstream before any credit is drawn, so it is $0 on
// every plan. The image models are zero-credit on every plan too. Those are
// the models where the four tiers are not strictly ordered
// plus > pro > ultra-99 > ultra.
//
// | Model                       | Plus x $0.04 | Pro x $0.02 | Ultra $99 x $0.01 | Ultra $199 x $0.008 |
// | --------------------------- | ------------ | ----------- | ----------------- | ------------------- |
// | veo-3.1-quality             | 100  $4.00   | 100  $2.00  | 100  $1.00        | 100  $0.80          |
// | veo-3.1-fast                | 20   $0.80   | 20   $0.40  | 10   $0.10        | 10   $0.08          |
// | veo-3.1-lite                | 10   $0.40   | 10   $0.20  | 5    $0.05        | 5    $0.04          |
// | veo-3.1-lite-low-priority   | 0    $0.00   | 0    $0.00  | 0    $0.00        | 0    $0.00          |
// | omni-flash 720p 4/6/8/10s   | 7/10/12/15 credits on every plan                                       |
// | omni-flash 360p 4/6/8/10s   | 4/5/6/7 credits on every plan                                          |
// | omni-flash V2V 720p / 360p  | 20 / 10 credits on every plan                                          |
// | each image model, /image    | 0    $0.00   | 0    $0.00  | 0    $0.00        | 0    $0.00          |
//
// The tier is a COST-ONLY selector read from costHints.googleFlowPlan; it is
// never in the request payload, never merged into it, and never signed.
// Omitted => "pro", the default since the selector was added (byte-for-byte
// the pre-selector output); a Plus account must pass "plus", since Pro
// under-estimates it by half. An unrecognized value => "plus", the highest
// credit value, so a tier the estimator cannot read is never under-charged,
// and it warns, naming the value.
const PLANS = {
  plus: { creditUsd: 0.04, ultraCredits: false },
  pro: { creditUsd: 0.02, ultraCredits: false },
  "ultra-99": { creditUsd: 0.01, ultraCredits: true },
  ultra: { creditUsd: 0.008, ultraCredits: true },
} as const;
type Plan = keyof typeof PLANS;
const PLAN_NAMES = Object.keys(PLANS) as Plan[];

const isKnownPlan = (value: unknown): value is Plan =>
  typeof value === "string" && Object.hasOwn(PLANS, value);

// Per-plan USD for one generation (or image). `nonUltra` / `ultra` are the
// credit costs upstream publishes for non-Ultra and Ultra plans; a cost that
// is the same on every plan passes the same number twice. `variant` prefixes
// each plan key ("duration-8|plus"); a flat entry has none ("plus").
const planRates = (
  { nonUltra, ultra }: { nonUltra: number; ultra: number },
  variant?: string
): Record<string, number> =>
  Object.fromEntries(
    PLAN_NAMES.map((plan) => {
      const { creditUsd, ultraCredits } = PLANS[plan];
      const credits = ultraCredits ? ultra : nonUltra;
      return [variant ? `${variant}|${plan}` : plan, credits * creditUsd];
    })
  );

// omni-flash credits are the same on every plan.
const everyPlan = (variant: string, credits: number): Record<string, number> =>
  planRates({ nonUltra: credits, ultra: credits }, variant);

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
// estimate is never the zero-USD "no rate for variant" path). Omitted
// normalizes to "pro", the compatible default; an unrecognized value
// normalizes to "plus", the highest credit value, and planWarn names it.
const planPick = (
  _payload: Record<string, unknown>,
  hints?: CostHints
): Plan => {
  const plan = hints?.googleFlowPlan;
  if (plan === undefined) return "pro";
  return isKnownPlan(plan) ? plan : "plus";
};

// Warn — without changing the price — when the caller passes a tier that is
// not a known plan. planPick has already fallen back to the Plus basis; this
// only surfaces that fallback and names the bad value (REQ-005). Empty for
// the four known plans and for omitted, so default parity (REQ-001) still
// sees warnings: [].
const planWarn = (
  _payload: Record<string, unknown>,
  hints?: CostHints
): string[] => {
  const plan = hints?.googleFlowPlan;
  return plan !== undefined && !isKnownPlan(plan)
    ? [`googleflow: unknown plan tier '${plan}', using Plus basis`]
    : [];
};

// Flat per-generation rate — the Veo tiers charge the same credits regardless
// of duration, but both the credit *value* and (for Lite/Fast) the credit
// *cost* depend on the plan tier. `nonUltra` / `ultra` are the credit costs;
// the `plan` selector picks among the four resolved USD rates.
const flatVideo = (credits: {
  nonUltra: number;
  ultra: number;
}): PerUnitPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: generations,
  select: [{ name: "plan", pick: planPick }],
  rates: planRates(credits),
  warn: planWarn,
  source,
});

// Per-image rate on the same plan tiers as video. Every Flow image model is
// included in every plan, so each plan's rate is an explicit 0, a real $0
// estimate rather than a missing rate.
const flatImage = (credits: {
  nonUltra: number;
  ultra: number;
}): PerUnitPricing => ({
  kind: "perUnit",
  unit: "images",
  units: images,
  select: [{ name: "plan", pick: planPick }],
  rates: planRates(credits),
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
  "veo-3.1-quality": flatVideo({ nonUltra: 100, ultra: 100 }),
  "veo-3.1-fast": flatVideo({ nonUltra: 20, ultra: 10 }),
  "veo-3.1-lite": flatVideo({ nonUltra: 10, ultra: 5 }),
  // Ultra $199 only, and free of credits there — a real $0 estimate, not a
  // missing rate. Every other plan is refused upstream before any credit is
  // drawn, so it is $0 there too: the exception to plus > pro > ultra-99 >
  // ultra.
  "veo-3.1-lite-low-priority": flatVideo({ nonUltra: 0, ultra: 0 }),

  "omni-flash": {
    kind: "perUnit",
    unit: "generations",
    units: generations,
    // Selector order is [variant, resolution, plan], so the variant key is
    // e.g. "duration-8|pro" at 720p or "reference-video|360p|ultra-99".
    select: [
      { name: "variant", pick: omniFlashVariant },
      { name: "resolution", pick: omniFlashResolution },
      { name: "plan", pick: planPick },
    ],
    rates: {
      // 720p, the default
      ...everyPlan("duration-4", 7),
      ...everyPlan("duration-6", 10),
      ...everyPlan("duration-8", 12),
      ...everyPlan("duration-10", 15),
      ...everyPlan("reference-video", 20),
      // 360p
      ...everyPlan("duration-4|360p", 4),
      ...everyPlan("duration-6|360p", 5),
      ...everyPlan("duration-8|360p", 6),
      ...everyPlan("duration-10|360p", 7),
      ...everyPlan("reference-video|360p", 10),
    },
    warn: planWarn,
    source: omniFlashSource,
  },

  // POST /images models: included in every plan, so zero credits per image
  // on every tier.
  "nano-banana-2-lite": flatImage({ nonUltra: 0, ultra: 0 }),
  "nano-banana-2": flatImage({ nonUltra: 0, ultra: 0 }),
  "nano-banana-pro": flatImage({ nonUltra: 0, ultra: 0 }),
  // Deprecated aliases upstream still accepts: nano-banana runs
  // nano-banana-2, and imagen-4 runs nano-banana-2-lite (Google removed Imagen
  // from Flow in July 2026).
  "nano-banana": flatImage({ nonUltra: 0, ultra: 0 }),
  "imagen-4": flatImage({ nonUltra: 0, ultra: 0 }),
};
