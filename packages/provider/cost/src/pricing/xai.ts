import type { CostHints } from "../types";
import type { ModelPricing } from "./types";
import { asNumber, asString, coerceSeconds, hintSeconds } from "./helpers";

const source = { url: "https://docs.x.ai" };
const grokBuild01Source = {
  url: "https://docs.x.ai/developers/models/grok-build-0.1",
  asOf: "2026-06-07",
};

const grokBuild01: ModelPricing = {
  kind: "tokens",
  rate: { input: 1, output: 2, cacheRead: 0.2 },
  source: grokBuild01Source,
};

// Media rates come from the Imagine Pricing table on
// docs.x.ai/developers/pricing (docs.x.ai/developers/models repeats it), which
// publishes video as USD/sec and images as USD/image. In-repo tests cannot
// verify these against upstream — refresh them from the same page and bump
// `asOf` when they change. The rest come from xAI bills: every Imagine
// response carries usage.cost_in_usd_ticks (1 USD = 1e10 ticks), and
// tests/integration/xai-imagine-billing.test.ts pins its recorded bills to
// these estimates.
const mediaSource = {
  url: "https://docs.x.ai/developers/pricing",
  asOf: "2026-10-31",
};

// Video generation bills per second of output. `duration` is a real top-level
// wire field on the generation/extension payloads, so it wins; v1/videos/edits
// has no duration in its schema (the edit inherits the source video's length),
// so callers must declare that length as costHints.durationSeconds — the same
// cost-only channel kie's veo3 entry uses.
const videoSeconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => coerceSeconds(p.duration) ?? hintSeconds(hints);

// The per-second rate also depends on the output resolution: the page's
// single figure is the 480p rate, and a recorded 1 s grok-imagine-video-1.5
// clip at 720p billed 0.14 against its 0.08. A generation renders at
// `resolution`, 480p when omitted. A request with a source video (an edit or
// extension) keeps that video's resolution, at most 720p, which the payload
// does not carry. Where no rate is known for the served resolution, the
// estimate keeps the 480p rate and warns that it is a floor. 1080p is not
// priced, so it fails closed.
const videoResolution = (p: Record<string, unknown>): string | undefined =>
  p.resolution === undefined ? "480p" : asString(p.resolution);

const keepsSourceResolution = (p: Record<string, unknown>): boolean =>
  p.video !== undefined || p.video_file_id !== undefined;

const perSecondVideo = (
  model: string,
  rates: { "480p": number; "720p"?: number }
): ModelPricing => {
  const unknown720p = (p: Record<string, unknown>): boolean =>
    rates["720p"] === undefined && videoResolution(p) === "720p";
  return {
    kind: "perUnit",
    unit: "seconds",
    units: videoSeconds,
    select: [
      {
        name: "resolution",
        pick: (p) =>
          keepsSourceResolution(p) || unknown720p(p)
            ? "480p"
            : videoResolution(p),
        required: true,
      },
    ],
    rates,
    // Without units the estimate fails, and evaluatePerUnit would report
    // these warnings in place of its costHints.durationSeconds advice.
    warn: (p, hints) => {
      if (videoSeconds(p, hints) === undefined) return [];
      const floor = `bills above the published 480p rate of ${rates["480p"]} USD/s, so this estimate is a floor`;
      if (keepsSourceResolution(p))
        return [
          `xai '${model}': the output keeps the source video's resolution, and a source above 480p ${floor}`,
        ];
      if (unknown720p(p))
        return [`xai '${model}': no 720p rate is known, and 720p ${floor}`];
      return [];
    },
    source: mediaSource,
  };
};

// Image generation bills per generated image. `n` is the batch size on both
// v1/images/generations and v1/images/edits, and defaults to 1.
const imageCount = (p: Record<string, unknown>): number => asNumber(p.n) ?? 1;

// An edit also bills each input image, once per request: the recorded edits
// show n, quality, output resolution and input size leave that charge
// unchanged. The provider sends image_file_id and image_file_ids as file
// references in `image` and `images`, so they count alike. As on the wire,
// `image` wins over `image_file_id` and `images` over `image_file_ids`.
const inputImageCharge =
  (perImage: number) =>
  (p: Record<string, unknown>): number | undefined => {
    const single =
      p.image !== undefined || p.image_file_id !== undefined ? 1 : 0;
    const list = p.images ?? p.image_file_ids;
    if (list === undefined) return single * perImage;
    return Array.isArray(list) ? (single + list.length) * perImage : undefined;
  };

const perGenerationImage = (
  perUnit: number,
  perInputImage?: number
): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: imageCount,
  select: [],
  rates: { "": perUnit },
  ...(perInputImage === undefined
    ? {}
    : { extra: inputImageCharge(perInputImage) }),
  source: mediaSource,
});

// grok-imagine-image-2.0 bills each image at the quality it serves and at its
// resolution. GET https://api.x.ai/v1/image-generation-models lists the grid
// as `pricing` (read 2026-10-31); the pricing page shows only low at 1k.
// `auto`, the default, serves low for a generation and medium for an edit
// (docs.x.ai/developers/model-capabilities/images/generation#quality), and
// 1k is the default resolution; the recorded bills match. The models
// reference calls medium the default, but a generation that omitted quality
// billed the low rate. "high" has no listed price, so it fails closed.
const isImageEdit = (p: Record<string, unknown>): boolean =>
  [p.image, p.images, p.image_file_id, p.image_file_ids].some(
    (source) => source !== undefined
  );

const grokImagineImage2: ModelPricing = {
  kind: "perUnit",
  unit: "generations",
  units: imageCount,
  select: [
    {
      name: "quality",
      pick: (p) =>
        p.quality === undefined || p.quality === "auto"
          ? isImageEdit(p)
            ? "medium"
            : "low"
          : asString(p.quality),
      required: true,
    },
    {
      name: "resolution",
      pick: (p) => (p.resolution === undefined ? "1k" : asString(p.resolution)),
      required: true,
    },
  ],
  rates: {
    "low|1k": 0.04,
    "low|1.5k": 0.05,
    "low|2k": 0.06,
    "medium|1k": 0.06,
    "medium|1.5k": 0.07,
    "medium|2k": 0.08,
  },
  extra: inputImageCharge(0.01),
  source: {
    url: "https://docs.x.ai/developers/rest-api-reference/inference/models",
    asOf: "2026-10-31",
  },
};

export const xai: Record<string, ModelPricing> = {
  "grok-build-0.1": grokBuild01,
  "grok-code-fast-1": grokBuild01,
  "grok-code-fast": grokBuild01,
  "grok-code-fast-1-0825": grokBuild01,
  "grok-4": { kind: "tokens", rate: { input: 3, output: 15 }, source },
  "grok-3": { kind: "tokens", rate: { input: 3, output: 15 }, source },
  "grok-4-fast": { kind: "tokens", rate: { input: 0.2, output: 0.5 }, source },
  "grok-4-1-fast": {
    kind: "tokens",
    rate: { input: 0.2, output: 0.5 },
    source,
  },
  "grok-4.6": { kind: "tokens", rate: { input: 2, output: 6 }, source },

  // Grok Imagine video — USD per second of output, by resolution.
  "grok-imagine-video": perSecondVideo("grok-imagine-video", {
    "480p": 0.05,
  }),
  "grok-imagine-video-1.5": perSecondVideo("grok-imagine-video-1.5", {
    "480p": 0.08,
    "720p": 0.14,
  }),
  // The provider exports the preview id (XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW in
  // packages/provider/xai/src/zod.ts); docs list only the released "1.5" id.
  // Same rate, registered so preview payloads price instead of missing.
  "grok-imagine-video-1.5-preview": perSecondVideo(
    "grok-imagine-video-1.5-preview",
    { "480p": 0.08, "720p": 0.14 }
  ),
  "grok-imagine-video-1.5-lite": perSecondVideo("grok-imagine-video-1.5-lite", {
    "480p": 0.02,
  }),

  // Grok Imagine image — USD per generated image. `units` follows `n`, so a
  // batch request scales linearly. A recorded edit of two inputs billed
  // 0.024: 0.02 for the image and 0.002 for each input.
  "grok-imagine-image": perGenerationImage(0.02, 0.002),
  // xAI retires this slug on 2026-11-02
  // (docs.x.ai/developers/migration/imagine-image-quality-nov-2): it keeps
  // resolving, but grok-imagine-image-2.0 at `low` serves it and bills it at
  // that rate. 0.05 holds until the switch.
  "grok-imagine-image-quality": perGenerationImage(0.05),
  "grok-imagine-image-2.0": grokImagineImage2,
};
