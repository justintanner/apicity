import type { ModelPricing } from "./types";
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
// Plan basis: Google AI Pro, $19.99/mo for 1,000 Flow credits, so a credit is
// worth ~$0.02. We deliberately price on the *non-Ultra* credit costs at the
// *Pro* credit value because the plan tier is not present in the request
// payload and there is nothing to select on — over-estimating is the safe
// direction for a pay-gate. An Ultra 20x account ($200/mo for 25,000 credits,
// $0.008/credit) at the halved Ultra credit costs pays ~5x less than these
// rates; see the Remaining Risks note in the WI-13 summary.
const CREDIT_USD = 0.02;

const usd = (credits: number): number => credits * CREDIT_USD;

const source = {
  url: "https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos",
  // First googleflow rates land after the global PRICING_AS_OF of 2026-04-30,
  // so they carry their own stamp (OQ-7: per-entry `source.asOf` is the
  // existing mechanism for this; PRICING_AS_OF stays global).
  asOf: "2026-07-20",
};

// `count` is the number of video variations to generate (1-4, default 1);
// each variation is a separate generation and draws its own credits.
const generations = (p: Record<string, unknown>): number =>
  asNumber(p.count) ?? 1;

// Flat per-generation rate — the Veo tiers charge the same credits regardless
// of duration.
const flatVideo = (credits: number): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: generations,
  select: [],
  rates: { "": usd(credits) },
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
  "veo-3.1-quality": flatVideo(100),
  "veo-3.1-fast": flatVideo(20),
  "veo-3.1-lite": flatVideo(10),
  // Ultra 20x only, and free of credits there — a real $0 estimate, not a
  // missing rate.
  "veo-3.1-lite-low-priority": flatVideo(0),

  "omni-flash": {
    kind: "perUnit",
    unit: "generations",
    units: generations,
    select: [{ name: "variant", pick: omniFlashVariant }],
    rates: {
      "duration-4": usd(15),
      "duration-6": usd(20),
      "duration-8": usd(25),
      "duration-10": usd(30),
      "reference-video": usd(40),
    },
    source,
  },
};
