import type { ModelPricing } from "./types";
import { asNumber, asString, hintSeconds } from "./helpers";

const source = {
  url: "https://developers.openai.com/api/docs/pricing",
  asOf: "2026-11-04",
};

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

// Duration-billed audio has no request-body length; never infer it from bytes.
function perAudioMinute(perMinute: number): ModelPricing {
  return {
    kind: "perUnit",
    unit: "seconds",
    units: (_p, hints) => hintSeconds(hints),
    select: [],
    rates: { "": perMinute / 60 },
    source,
  };
}
function perCharacter(perMillion: number): ModelPricing {
  return {
    kind: "perUnit",
    unit: "characters",
    units: (p) => (typeof p.input === "string" ? p.input.length : undefined),
    select: [],
    rates: { "": perMillion / 1_000_000 },
    source,
  };
}

export const openai: Record<string, ModelPricing> = {
  // Standard tier only, read 2026-11-04. Batch, Flex, Fast/Priority and
  // Ultrafast are not bundled and fail closed. Cache writes use the 30m
  // retention rate; 12h writes must not be billed at that rate.
  "gpt-6-astra": {
    kind: "tokens",
    rate: { input: 10.0, output: 50.0, cacheRead: 1.0, cacheWrite: 12.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 20.0, output: 75.0, cacheRead: 2.0, cacheWrite: 25.0 },
    },
  },
  "gpt-6.1-sol": {
    kind: "tokens",
    rate: { input: 2.0, output: 10.0, cacheRead: 0.1, cacheWrite: 2.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 4.0, output: 15.0, cacheRead: 0.2, cacheWrite: 5.0 },
    },
  },
  "gpt-6.1-terra": {
    kind: "tokens",
    rate: { input: 1.0, output: 5.0, cacheRead: 0.05, cacheWrite: 1.25 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 2.0, output: 7.5, cacheRead: 0.1, cacheWrite: 2.5 },
    },
  },
  "gpt-6-luna": {
    kind: "tokens",
    rate: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 0.2, output: 0.75, cacheRead: 0.02, cacheWrite: 0.25 },
    },
  },
  "gpt-6-sol": {
    kind: "tokens",
    rate: { input: 2.0, output: 10.0, cacheRead: 0.2, cacheWrite: 2.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 4.0, output: 15.0, cacheRead: 0.4, cacheWrite: 5.0 },
    },
  },
  // Promotional through at least 2026-11-21.
  "gpt-5.6-sol": {
    kind: "tokens",
    rate: { input: 4.0, output: 20.0, cacheRead: 0.4, cacheWrite: 5.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 8.0, output: 30.0, cacheRead: 0.8, cacheWrite: 10.0 },
    },
  },
  "gpt-5.6-terra": {
    kind: "tokens",
    rate: { input: 2.0, output: 12.0, cacheRead: 0.2, cacheWrite: 2.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 4.0, output: 18.0, cacheRead: 0.4, cacheWrite: 5.0 },
    },
  },
  "gpt-5.6-luna": {
    kind: "tokens",
    rate: { input: 0.2, output: 1.2, cacheRead: 0.02, cacheWrite: 0.25 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 0.4, output: 1.8, cacheRead: 0.04, cacheWrite: 0.5 },
    },
  },
  "gpt-5.5": {
    kind: "tokens",
    rate: { input: 5.0, output: 30.0, cacheRead: 0.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 10.0, output: 45.0, cacheRead: 1.0 },
    },
  },
  "gpt-5.5-pro": {
    kind: "tokens",
    rate: { input: 30.0, output: 180.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 60.0, output: 270.0 },
    },
  },
  "gpt-5.4": {
    kind: "tokens",
    rate: { input: 2.5, output: 15.0, cacheRead: 0.25 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 5.0, output: 22.5, cacheRead: 0.5 },
    },
  },
  "gpt-5.4-pro": {
    kind: "tokens",
    rate: { input: 30.0, output: 180.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 60.0, output: 270.0 },
    },
  },
  "gpt-5.4-mini": {
    kind: "tokens",
    rate: { input: 0.75, output: 4.5, cacheRead: 0.075 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5.4-nano": {
    kind: "tokens",
    rate: { input: 0.2, output: 1.25, cacheRead: 0.02 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5.2": {
    kind: "tokens",
    rate: { input: 1.75, output: 14.0, cacheRead: 0.175 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5.2-pro": {
    kind: "tokens",
    rate: { input: 21.0, output: 168.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5.1": {
    kind: "tokens",
    rate: { input: 1.25, output: 10.0, cacheRead: 0.125 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5": {
    kind: "tokens",
    rate: { input: 1.25, output: 10.0, cacheRead: 0.125 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5-mini": {
    kind: "tokens",
    rate: { input: 0.25, output: 2.0, cacheRead: 0.025 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5-nano": {
    kind: "tokens",
    rate: { input: 0.05, output: 0.4, cacheRead: 0.005 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5-pro": {
    kind: "tokens",
    rate: { input: 15.0, output: 120.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-4.1": {
    kind: "tokens",
    rate: { input: 2.0, output: 8.0, cacheRead: 0.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-4.1-mini": {
    kind: "tokens",
    rate: { input: 0.4, output: 1.6, cacheRead: 0.1 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-4o": {
    kind: "tokens",
    rate: { input: 2.5, output: 10.0, cacheRead: 1.25 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-4o-mini": {
    kind: "tokens",
    rate: { input: 0.15, output: 0.6, cacheRead: 0.075 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "o3-pro": {
    kind: "tokens",
    rate: { input: 20.0, output: 80.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  o3: {
    kind: "tokens",
    rate: { input: 2.0, output: 8.0, cacheRead: 0.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "chat-latest": {
    kind: "tokens",
    rate: { input: 5, output: 30, cacheRead: 0.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5.3-codex": {
    kind: "tokens",
    rate: { input: 1.75, output: 14, cacheRead: 0.175 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-5-search-api": {
    kind: "tokens",
    rate: { input: 1.25, output: 10, cacheRead: 0.125 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "text-embedding-3-small": {
    kind: "tokens",
    rate: { input: 0.02, output: 0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "text-embedding-3-large": {
    kind: "tokens",
    rate: { input: 0.13, output: 0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "text-embedding-ada-002": {
    kind: "tokens",
    rate: { input: 0.1, output: 0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "omni-moderation-latest": {
    kind: "tokens",
    rate: { input: 0, output: 0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  // Limited access; availability is not implied by this price.
  "gpt-5.6-cyber": {
    kind: "tokens",
    rate: { input: 12.5, output: 75.0, cacheRead: 1.25, cacheWrite: 15.625 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  // Limited access; availability is not implied by this price.
  "gpt-5.5-cyber": {
    kind: "tokens",
    rate: { input: 12.5, output: 75.0, cacheRead: 1.25 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  // Limited access; availability is not implied by this price.
  "gpt-6-rosalind": {
    kind: "tokens",
    rate: { input: 15.0, output: 75.0, cacheRead: 1.5, cacheWrite: 18.75 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
    longContext: {
      aboveInputTokens: 272000,
      rate: { input: 30.0, output: 112.5, cacheRead: 3.0, cacheWrite: 37.5 },
    },
  },
  // Limited access; availability is not implied by this price.
  "gpt-rosalind-research": {
    kind: "tokens",
    rate: { input: 5.0, output: 25.0, cacheRead: 0.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  // Limited access; availability is not implied by this price.
  "gpt-rosalind-discovery": {
    kind: "tokens",
    rate: { input: 5.0, output: 25.0, cacheRead: 0.5 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  // Limited access; availability is not implied by this price.
  // Promotional through at least 2026-12-31.
  "gpt-6-astra-law": {
    kind: "tokens",
    rate: { input: 10.0, output: 50.0, cacheRead: 1.0 },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-realtime-2.1": {
    kind: "tokens",
    rate: { input: 4, output: 24, cacheRead: 0.4 },
    modalityRates: {
      audio: { input: 32, output: 64, cacheRead: 0.4 },
      image: { input: 5, cacheRead: 0.5 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-realtime-2.1-mini": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.4, cacheRead: 0.06 },
    modalityRates: {
      audio: { input: 10, output: 20, cacheRead: 0.3 },
      image: { input: 0.8, cacheRead: 0.08 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-realtime-2": {
    kind: "tokens",
    rate: { input: 4, output: 24, cacheRead: 0.4 },
    modalityRates: {
      audio: { input: 32, output: 64, cacheRead: 0.4 },
      image: { input: 5, cacheRead: 0.5 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-realtime-1.5": {
    kind: "tokens",
    rate: { input: 4, output: 16, cacheRead: 0.4 },
    modalityRates: {
      audio: { input: 32, output: 64, cacheRead: 0.4 },
      image: { input: 5, cacheRead: 0.5 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-realtime-mini": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.4, cacheRead: 0.06 },
    modalityRates: {
      audio: { input: 10, output: 20, cacheRead: 0.3 },
      image: { input: 0.8, cacheRead: 0.08 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-realtime": {
    kind: "tokens",
    rate: { input: 4, output: 16, cacheRead: 0.4 },
    modalityRates: {
      audio: { input: 32, output: 64, cacheRead: 0.4 },
      image: { input: 5, cacheRead: 0.5 },
    },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-audio-1.5": {
    kind: "tokens",
    rate: { input: 2.5, output: 10 },
    modalityRates: { audio: { input: 32, output: 64 } },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-audio-mini": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.4 },
    modalityRates: { audio: { input: 10, output: 20 } },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-audio": {
    kind: "tokens",
    rate: { input: 2.5, output: 10 },
    modalityRates: { audio: { input: 32, output: 64 } },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-4o-mini-tts": {
    kind: "tokens",
    rate: { input: 0.6, output: 0 },
    modalityRates: { audio: { input: 0, output: 12 } },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "gpt-image-1-mini": {
    kind: "tokens",
    rate: { input: 2, output: 0, cacheRead: 0.2 },
    modalityRates: { image: { input: 2.5, output: 8, cacheRead: 0.25 } },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  "chatgpt-image-latest": {
    kind: "tokens",
    rate: { input: 5, output: 10, cacheRead: 1.25 },
    modalityRates: { image: { input: 8, output: 32, cacheRead: 2 } },
    source: {
      url: "https://developers.openai.com/api/docs/pricing",
      asOf: "2026-11-04",
    },
  },
  // Retained legacy keys: not listed on the current pricing page.
  "gpt-4.1-nano": {
    kind: "tokens",
    rate: { input: 0.1, output: 0.4 },
    source: { url: source.url, asOf: "2026-10-19" },
  },
  "o4-mini": {
    kind: "tokens",
    rate: { input: 1.1, output: 4.4 },
    source: { url: source.url, asOf: "2026-10-19" },
  },
  "gpt-realtime-translate": perAudioMinute(0.034),
  "gpt-live-transcribe": perAudioMinute(0.017),
  "gpt-realtime-whisper": perAudioMinute(0.017),
  "gpt-transcribe": perAudioMinute(0.0045),
  "gpt-4o-transcribe": perAudioMinute(0.006),
  "gpt-4o-mini-transcribe": perAudioMinute(0.003),
  "gpt-4o-transcribe-diarize": perAudioMinute(0.006),
  "whisper-1": perAudioMinute(0.006),
  "gpt-live-1": perAudioMinute(0.05),
  "tts-1": perCharacter(15),
  "tts-1-hd": perCharacter(30),

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
