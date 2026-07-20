import type { ModelPricing } from "./types";
import { asNumber, asObject, asString } from "./helpers";

// fal bills image generation per generated image, not per token. Unlike the
// other per-unit providers, the payload carries no model field — the model
// *is* the endpoint path ("fal-ai/nano-banana"), so callers must pass the
// `endpoint` discriminator on the estimate request. Keys below are those
// endpoint ids verbatim.
//
// Two billing shapes appear upstream:
//
//   - per image      — a flat (or resolution-tiered) price per output image.
//   - per megapixel  — price scales with output area, rounded up to the next
//                      whole megapixel per image.
//
// Rates were read from each model's own fal.ai page on the `asOf` date; the
// flux/dev rate additionally matches the recorded
// GET /v1/models/pricing response in tests/recordings/fal_*/pricing_*.

const asOf = "2026-07-20";

const source = (endpointId: string) => ({
  url: `https://fal.ai/models/${endpointId}`,
  asOf,
});

// fal's `image_size` is either a named preset or an explicit
// { width, height }. Presets are the documented fal defaults.
const PRESET_DIMENSIONS: Record<string, readonly [number, number]> = {
  square_hd: [1024, 1024],
  square: [512, 512],
  portrait_4_3: [768, 1024],
  portrait_16_9: [576, 1024],
  landscape_4_3: [1024, 768],
  landscape_16_9: [1024, 576],
};

function imageCount(p: Record<string, unknown>): number {
  return asNumber(p.num_images) ?? 1;
}

// Billable megapixels across the whole request. fal rounds each image up to
// the next whole megapixel before charging, so the ceil is applied per image
// and then multiplied by the image count.
//
// When `image_size` is absent the caller gets fal's model default, which is
// ~1 MP for every model priced this way — so we assume 1 MP/image rather
// than refusing to estimate. An `image_size` that is present but
// unrecognized returns undefined, which surfaces as a warning instead of a
// silently wrong number.
function megapixels(p: Record<string, unknown>): number | undefined {
  const size = p.image_size;
  if (size === undefined) return imageCount(p);

  const preset = asString(size);
  const dims = preset ? PRESET_DIMENSIONS[preset] : undefined;
  const explicit = preset ? undefined : asObject(size);
  const width = dims ? dims[0] : asNumber(explicit?.width);
  const height = dims ? dims[1] : asNumber(explicit?.height);
  if (width === undefined || height === undefined) return undefined;

  return Math.ceil((width * height) / 1_000_000) * imageCount(p);
}

// Resolution tier for models whose per-image price scales with output
// resolution. fal defaults to 1K when the field is omitted.
const resolution = {
  name: "resolution",
  pick: (p: Record<string, unknown>) => asString(p.resolution) ?? "1K",
};

const perImage = (endpointId: string, usd: number): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [],
  rates: { "": usd },
  source: source(endpointId),
});

const perImageByResolution = (
  endpointId: string,
  rates: Record<string, number>
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [resolution],
  rates,
  source: source(endpointId),
});

const perMegapixel = (endpointId: string, usd: number): ModelPricing => ({
  kind: "perUnit",
  unit: "megapixels",
  units: megapixels,
  select: [],
  rates: { "": usd },
  source: source(endpointId),
});

export const fal: Record<string, ModelPricing> = {
  // Image — Flux (area-priced)
  "fal-ai/flux/dev": perMegapixel("fal-ai/flux/dev", 0.025),
  "fal-ai/flux/schnell": perMegapixel("fal-ai/flux/schnell", 0.003),

  // Image — Qwen Image (area-priced)
  "fal-ai/qwen-image": perMegapixel("fal-ai/qwen-image", 0.02),

  // Image — Nano Banana (flat per image; edit is priced as generation)
  "fal-ai/nano-banana": perImage("fal-ai/nano-banana", 0.039),
  "fal-ai/nano-banana/edit": perImage("fal-ai/nano-banana/edit", 0.039),

  // Image — Nano Banana 2: 1K base, 0.5K ×0.75, 2K ×1.5, 4K ×2
  "fal-ai/nano-banana-2": perImageByResolution("fal-ai/nano-banana-2", {
    "0.5K": 0.06,
    "1K": 0.08,
    "2K": 0.12,
    "4K": 0.16,
  }),

  // Image — Nano Banana Pro: flat until 4K, which bills at double
  "fal-ai/nano-banana-pro": perImageByResolution("fal-ai/nano-banana-pro", {
    "1K": 0.15,
    "2K": 0.15,
    "4K": 0.3,
  }),

  // Image — Seedream 5 Lite (flat per image at any supported size)
  "fal-ai/bytedance/seedream/v5/lite/text-to-image": perImage(
    "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    0.035
  ),
};
