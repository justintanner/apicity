import type { CostHints } from "../types";
import type { ModelPricing } from "./types";
import { asNumber, coerceSeconds, hintSeconds } from "./helpers";

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
// `asOf` when they change.
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

// Image generation bills per generated image. `n` is the batch size on
// v1/images/generations; edits produce a single image and omit it.
const imageCount = (p: Record<string, unknown>): number => asNumber(p.n) ?? 1;

const perSecondVideo = (perUnit: number): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: videoSeconds,
  select: [],
  rates: { "": perUnit },
  source: mediaSource,
});

const perGenerationImage = (perUnit: number): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: imageCount,
  select: [],
  rates: { "": perUnit },
  source: mediaSource,
});

// grok-imagine-image-2.0 bills at the quality it serves
// (docs.x.ai/developers/model-capabilities/images/generation#quality). The
// published 0.04 USD/image is the `low` rate: the grok-imagine-image-quality
// retirement note puts 2.0 at `low` 0.01 under that model's 0.05. xAI publishes
// no `medium` rate, and `auto`, the default, serves `medium` for edits, so a
// medium-served request keeps the low rate and is warned as a floor.
const servesMediumQuality = (p: Record<string, unknown>): boolean =>
  p.quality === "medium" ||
  ((p.quality === undefined || p.quality === "auto") &&
    [p.image, p.images, p.image_file_id, p.image_file_ids].some(
      (source) => source !== undefined
    ));

const grokImagineImage2: ModelPricing = {
  kind: "perUnit",
  unit: "generations",
  units: imageCount,
  select: [],
  rates: { "": 0.04 },
  warn: (p) =>
    servesMediumQuality(p)
      ? [
          "xai 'grok-imagine-image-2.0': served at medium quality (quality \"medium\", or an edit at the default auto), which bills above the published 0.04 USD/image low rate; xAI publishes no medium rate, so this estimate is a floor",
        ]
      : [],
  source: mediaSource,
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

  // Grok Imagine video — USD per second of output.
  "grok-imagine-video": perSecondVideo(0.05),
  "grok-imagine-video-1.5": perSecondVideo(0.08),
  // The provider exports the preview id (XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW in
  // packages/provider/xai/src/zod.ts); docs list only the released "1.5" id.
  // Same rate, registered so preview payloads price instead of missing.
  "grok-imagine-video-1.5-preview": perSecondVideo(0.08),
  "grok-imagine-video-1.5-lite": perSecondVideo(0.02),

  // Grok Imagine image — USD per generated image. `units` follows `n`, so a
  // batch request scales linearly.
  "grok-imagine-image": perGenerationImage(0.02),
  // xAI retires this slug on 2026-11-02
  // (docs.x.ai/developers/migration/imagine-image-quality-nov-2): it keeps
  // resolving, but grok-imagine-image-2.0 at `low` serves it and bills it at
  // that rate. 0.05 holds until the switch.
  "grok-imagine-image-quality": perGenerationImage(0.05),
  "grok-imagine-image-2.0": grokImagineImage2,
};
