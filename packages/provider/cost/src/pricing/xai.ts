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

// An input image bills once per request: the recorded image edits show n,
// quality, output resolution and input size leave that charge unchanged. The
// provider sends the *_file_id fields as file references in `image` and in
// the list field, so they count alike. As on the wire, `image` wins over
// `image_file_id` and the list over its file-id twin.
const inputImageCount =
  (list: string, fileIdList: string) =>
  (p: Record<string, unknown>): number | undefined => {
    const single =
      p.image !== undefined || p.image_file_id !== undefined ? 1 : 0;
    const many = p[list] ?? p[fileIdList];
    if (many === undefined) return single;
    return Array.isArray(many) ? single + many.length : undefined;
  };

const inputImageCharge =
  (perImage: number, list: string, fileIdList: string) =>
  (p: Record<string, unknown>): number | undefined => {
    const count = inputImageCount(list, fileIdList)(p);
    return count === undefined ? undefined : count * perImage;
  };

// A video request also bills each frame it pins as an input image: the first
// frame (`image`), the last frame (`last_frame` or `last_frame_file_id`) and
// each keyframe, beside each reference image. Preset voices add nothing.
// The reference-image charge is measured (PR 565); xAI's cookbook bills match
// the same rate on pinned frames. A 10 s 720p grok-imagine-video-1.5 clip
// with a first frame, 2 keyframes and a last frame cost 1.44 = 10 x 0.14 +
// 4 x 0.01 (docs.x.ai/cookbook/examples/photo-to-time-lapse.md), and 10 s
// from two references and two voices cost 1.42 = 10 x 0.14 + 2 x 0.01
// (docs.x.ai/cookbook/examples/photo-to-talking-character.md).
const videoInputImageCount = (
  p: Record<string, unknown>
): number | undefined => {
  const firstFrameAndReferences = inputImageCount(
    "reference_images",
    "reference_image_file_ids"
  )(p);
  const keyframes =
    p.keyframes === undefined
      ? 0
      : Array.isArray(p.keyframes)
        ? p.keyframes.length
        : undefined;
  if (firstFrameAndReferences === undefined || keyframes === undefined)
    return undefined;
  const lastFrame =
    p.last_frame !== undefined || p.last_frame_file_id !== undefined ? 1 : 0;
  return firstFrameAndReferences + lastFrame + keyframes;
};

// The per-second rate depends on the output resolution, and the page's single
// figure is the 480p rate. Recorded 1 s clips billed 0.07 at 720p on
// grok-imagine-video, 0.14 and 0.25 at 720p and 1080p on 1.5, and 0.03 and
// 0.14 on 1.5-lite. A generation renders at `resolution`, 480p when omitted.
// A request with a source video (an edit or extension) keeps that video's
// resolution, at most 720p, which the payload does not carry, so it prices
// at 480p and warns that the estimate is a floor. A resolution the model has
// no rate for (1080p on grok-imagine-video) fails closed.
const videoResolution = (p: Record<string, unknown>): string | undefined =>
  p.resolution === undefined ? "480p" : asString(p.resolution);

const keepsSourceResolution = (p: Record<string, unknown>): boolean =>
  p.video !== undefined || p.video_file_id !== undefined;

// Each input image bills on top, once per request (see inputImageCharge and
// videoInputImageCount): 0.002 on grok-imagine-video and 0.01 on the 1.5
// models, for each pinned frame and each reference image. A 1 s clip cannot
// tell a per-request charge from a per-second one; fal's cards, which matched
// xAI on every cell checked, bill it per image.
const perSecondVideo = (
  model: string,
  rates: { "480p": number; "720p": number; "1080p"?: number },
  perInputImage: number
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: videoSeconds,
  select: [
    {
      name: "resolution",
      pick: (p) => (keepsSourceResolution(p) ? "480p" : videoResolution(p)),
      required: true,
    },
  ],
  rates,
  extra: (p) => {
    const images = videoInputImageCount(p);
    return images === undefined ? undefined : images * perInputImage;
  },
  // Without units the estimate fails, and evaluatePerUnit would report this
  // warning in place of its costHints.durationSeconds advice.
  warn: (p, hints) =>
    videoSeconds(p, hints) !== undefined && keepsSourceResolution(p)
      ? [
          `xai '${model}': the output keeps the source video's resolution, and a source above 480p bills above the published 480p rate of ${rates["480p"]} USD/s, so this estimate is a floor`,
        ]
      : [],
  source: mediaSource,
});

// Image generation bills per generated image. `n` is the batch size on both
// v1/images/generations and v1/images/edits, and defaults to 1.
const imageCount = (p: Record<string, unknown>): number => asNumber(p.n) ?? 1;

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
    : { extra: inputImageCharge(perInputImage, "images", "image_file_ids") }),
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
  extra: inputImageCharge(0.01, "images", "image_file_ids"),
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

  // Grok Imagine video — USD per second of output, by resolution, plus each
  // input image.
  "grok-imagine-video": perSecondVideo(
    "grok-imagine-video",
    { "480p": 0.05, "720p": 0.07 },
    0.002
  ),
  "grok-imagine-video-1.5": perSecondVideo(
    "grok-imagine-video-1.5",
    { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    0.01
  ),
  // The provider exports the preview id (XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW in
  // packages/provider/xai/src/zod.ts); docs list only the released "1.5" id.
  // Same rate, registered so preview payloads price instead of missing.
  "grok-imagine-video-1.5-preview": perSecondVideo(
    "grok-imagine-video-1.5-preview",
    { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    0.01
  ),
  "grok-imagine-video-1.5-lite": perSecondVideo(
    "grok-imagine-video-1.5-lite",
    { "480p": 0.02, "720p": 0.03, "1080p": 0.14 },
    0.01
  ),

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
