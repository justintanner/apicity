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

// Media rates come from the model table on docs.x.ai/docs/models, which
// publishes video as USD/sec and images as USD/image. In-repo tests cannot
// verify these against upstream — refresh them from the same page and bump
// `asOf` when they change.
const mediaSource = {
  url: "https://docs.x.ai/docs/models",
  asOf: "2026-07-20",
};

// Video generation bills per second of output. `duration` is a top-level
// field on the generation/extension payloads; edits inherit the source
// video's length, so callers must pass a top-level `duration` hint (the same
// convention kie's veo3 entry uses).
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

  // Grok Imagine video — USD per second of output.
  "grok-imagine-video": perSecondVideo(0.05),
  "grok-imagine-video-1.5": perSecondVideo(0.08),
  // The provider exports the preview id (XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW in
  // packages/provider/xai/src/zod.ts); docs list only the released "1.5" id.
  // Same rate, registered so preview payloads price instead of missing.
  "grok-imagine-video-1.5-preview": perSecondVideo(0.08),

  // Grok Imagine image — USD per generated image. `units` follows `n`, so a
  // batch request scales linearly.
  "grok-imagine-image": perGenerationImage(0.02),
  "grok-imagine-image-quality": perGenerationImage(0.05),
};
