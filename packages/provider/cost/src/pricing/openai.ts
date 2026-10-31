import type { ModelPricing } from "./types";
import { asNumber, asString } from "./helpers";

const source = { url: "https://openai.com/api/pricing" };

// GPT Image models bill image output tokens, plus text and image input tokens
// that the request does not carry, so every estimate below prices the output
// only and warns that it is a floor. `auto`, the default quality and size,
// depends on the generated image, so it fails closed. Read 2026-10-31 from the
// model pages and https://developers.openai.com/api/docs/guides/image-generation.
const gptImageFloor = (model: string): string =>
  `openai '${model}': prices the image output only; text and image input tokens bill on top, so this estimate is a floor`;

const imageCount = (p: Record<string, unknown>): number => asNumber(p.n) ?? 1;

// A "WIDTHxHEIGHT" size within the GPT Image 2 rules: both edges multiples of
// 16, the long edge at most 3840 and 3 times the short one, and 655,360 to
// 8,294,400 pixels.
function gptImageSize(
  p: Record<string, unknown>
): { width: number; height: number } | undefined {
  const match = asString(p.size)?.match(/^(\d+)x(\d+)$/);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const pixels = width * height;
  if (width % 16 !== 0 || height % 16 !== 0) return undefined;
  if (long > 3840 || long / short > 3) return undefined;
  if (pixels < 655_360 || pixels > 8_294_400) return undefined;
  return { width, height };
}

// Output tokens per image, as the image generation guide's calculator computes
// them: the long edge takes the quality's patch count, the short edge that
// count scaled by the aspect ratio and rounded half to even. The recorded
// gpt-image-2 calls at medium 1024x1024 billed exactly its 1756 tokens.
function gptImageOutputTokens(
  patches: number,
  width: number,
  height: number
): number {
  const scaled = patches / (Math.max(width, height) / Math.min(width, height));
  const floor = Math.floor(scaled);
  const shortPatches =
    scaled - floor === 0.5 ? floor + (floor % 2) : Math.round(scaled);
  return Math.ceil((patches * shortPatches * (2e6 + width * height)) / 4e6);
}

// gpt-image-2 and the 2.5 models bill 30 USD per 1M image output tokens.
const gptImageTokens = (
  model: string,
  patchesByQuality: Record<string, number>
): ModelPricing => {
  const outputTokens = (p: Record<string, unknown>): number | undefined => {
    const quality = asString(p.quality);
    const patches =
      quality !== undefined && Object.hasOwn(patchesByQuality, quality)
        ? patchesByQuality[quality]
        : undefined;
    const size = gptImageSize(p);
    if (patches === undefined || size === undefined) return undefined;
    return (
      imageCount(p) * gptImageOutputTokens(patches, size.width, size.height)
    );
  };
  const qualities = Object.keys(patchesByQuality).join(", ");
  return {
    kind: "perUnit",
    unit: "tokens",
    units: outputTokens,
    select: [],
    rates: { "": 0.00003 },
    warn: (p) =>
      outputTokens(p) === undefined
        ? [
            `openai '${model}': needs an explicit quality (${qualities}) and a WIDTHxHEIGHT size within the GPT Image size rules; auto depends on the generated image`,
          ]
        : [gptImageFloor(model)],
    source: {
      url: "https://developers.openai.com/api/docs/guides/image-generation",
      asOf: "2026-10-31",
    },
  };
};

const gptImage2p5Patches = {
  low: 16,
  medium: 24,
  high: 48,
  xhigh: 64,
  max: 96,
};

// gpt-image-1.5's model page lists a price per image for each quality and its
// three sizes.
const gptImage1p5Rates: Record<string, number> = {
  "low|1024x1024": 0.009,
  "low|1024x1536": 0.013,
  "low|1536x1024": 0.013,
  "medium|1024x1024": 0.034,
  "medium|1024x1536": 0.05,
  "medium|1536x1024": 0.05,
  "high|1024x1024": 0.133,
  "high|1024x1536": 0.2,
  "high|1536x1024": 0.2,
};

const gptImage1p5: ModelPricing = {
  kind: "perUnit",
  unit: "images",
  units: (p) =>
    Object.hasOwn(
      gptImage1p5Rates,
      `${asString(p.quality)}|${asString(p.size)}`
    )
      ? imageCount(p)
      : undefined,
  select: [
    { name: "quality", pick: (p) => asString(p.quality), required: true },
    { name: "size", pick: (p) => asString(p.size), required: true },
  ],
  rates: gptImage1p5Rates,
  warn: (p) =>
    Object.hasOwn(
      gptImage1p5Rates,
      `${asString(p.quality)}|${asString(p.size)}`
    )
      ? [gptImageFloor("gpt-image-1.5")]
      : [
          "openai 'gpt-image-1.5': needs an explicit quality (low, medium, high) and size (1024x1024, 1024x1536, 1536x1024); auto depends on the generated image",
        ],
  source: {
    url: "https://developers.openai.com/api/docs/models/gpt-image-1.5",
    asOf: "2026-10-31",
  },
};

export const openai: Record<string, ModelPricing> = {
  // GPT-5.6 Sol, Standard processing, verified 2026-10-19 against
  // https://developers.openai.com/api/docs/pricing and
  // https://developers.openai.com/api/docs/models/gpt-5.6-sol (ac-0y875w).
  // Input tokens are uncached, cached or cache writes (1.25x uncached, not an
  // additive fee). Prompts with more than 272K (272,000) input tokens bill
  // the whole request at the long-context rates. These are OpenAI's
  // promotional prices, "available at least through November 21, 2026".
  // Priced from declared usage only; Batch, Flex and Fast tiers and the
  // regional-processing uplift are not bundled and fail closed.
  "gpt-5.6-sol": {
    kind: "tokens",
    rate: { input: 4, output: 20, cacheRead: 0.4, cacheWrite: 5 },
    longContext: {
      aboveInputTokens: 272_000,
      rate: { input: 8, output: 30, cacheRead: 0.8, cacheWrite: 10 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-10-19",
    },
  },
  // GPT-Realtime-2.1, verified 2026-10-19 against
  // https://developers.openai.com/api/docs/pricing and
  // https://developers.openai.com/api/docs/models/gpt-realtime-2.1
  // (ac-ow167y). Realtime bills text, audio and image tokens at separate
  // rates; `rate` is the text rate. Image is an input-only modality, and no
  // cache-write charge is published. Priced only from declared modality usage
  // (a Realtime response.done `usage`).
  "gpt-realtime-2.1": {
    kind: "tokens",
    rate: { input: 4, output: 24, cacheRead: 0.4 },
    modalityRates: {
      audio: { input: 32, cacheRead: 0.4, output: 64 },
      image: { input: 5, cacheRead: 0.5 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-10-19",
    },
  },
  "gpt-5": { kind: "tokens", rate: { input: 1.25, output: 10 }, source },
  "gpt-5-mini": { kind: "tokens", rate: { input: 0.25, output: 2 }, source },
  "gpt-5-nano": { kind: "tokens", rate: { input: 0.05, output: 0.4 }, source },
  "gpt-4.1": { kind: "tokens", rate: { input: 2, output: 8 }, source },
  "gpt-4.1-mini": { kind: "tokens", rate: { input: 0.4, output: 1.6 }, source },
  "gpt-4.1-nano": { kind: "tokens", rate: { input: 0.1, output: 0.4 }, source },
  "gpt-4o": { kind: "tokens", rate: { input: 2.5, output: 10 }, source },
  "gpt-4o-mini": { kind: "tokens", rate: { input: 0.15, output: 0.6 }, source },
  o3: { kind: "tokens", rate: { input: 2, output: 8 }, source },
  "o4-mini": { kind: "tokens", rate: { input: 1.1, output: 4.4 }, source },
  "text-embedding-3-small": {
    kind: "tokens",
    rate: { input: 0.02, output: 0 },
    source,
  },
  "text-embedding-3-large": {
    kind: "tokens",
    rate: { input: 0.13, output: 0 },
    source,
  },

  // GPT Image — USD per image (1.5) or per image output token (2 and 2.5).
  "gpt-image-1.5": gptImage1p5,
  "gpt-image-2": gptImageTokens("gpt-image-2", {
    low: 16,
    medium: 48,
    high: 96,
  }),
  "gpt-image-2.5-sunburst": gptImageTokens(
    "gpt-image-2.5-sunburst",
    gptImage2p5Patches
  ),
  "gpt-image-2.5-flare": gptImageTokens(
    "gpt-image-2.5-flare",
    gptImage2p5Patches
  ),
};
