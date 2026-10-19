import type { ModelPricing } from "./types";

const source = { url: "https://openai.com/api/pricing" };

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
};
