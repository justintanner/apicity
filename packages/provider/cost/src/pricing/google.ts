import type { ModelPricing, TokenPricing } from "./types";

const source = {
  url: "https://cloud.google.com/vertex-ai/generative-ai/pricing",
  asOf: "2026-11-04",
};
const tokens = (
  input: number,
  output: number,
  cacheRead?: number
): TokenPricing => ({
  kind: "tokens",
  rate: { input, output, ...(cacheRead === undefined ? {} : { cacheRead }) },
  source,
});
// Standard, global, text input/output. Other modalities fail closed in the route.
// Dated snapshot: Flash 3.6–3.8 introductory rates end 2026-12-31;
// Argon introductory rates end 2026-11-30. No wall-clock-dependent estimates.
export const google: Record<string, ModelPricing> = {
  "gemini-4-argon": tokens(2, 10, 0.1),
  "gemini-4-argon-cyber-permissive": tokens(4, 20, 0.2),
  "gemini-3.8-flash": tokens(0.75, 3.75, 0.075),
  "gemini-3.8-flash-cyber": tokens(1.5, 7.5, 0.15),
  "gemini-3.7-flash": tokens(0.75, 3.75, 0.075),
  "gemini-3.6-flash": tokens(0.75, 3.75, 0.075),
  "gemini-3.5-flash": tokens(1.5, 9, 0.15),
  "gemini-3.5-flash-lite": tokens(0.3, 2.5, 0.03),
  "gemini-3.1-flash-lite": tokens(0.25, 1.5, 0.025),
  "gemini-3.1-pro-preview": {
    ...tokens(2, 12, 0.2),
    longContext: {
      aboveInputTokens: 200000,
      rate: { input: 4, output: 18, cacheRead: 0.4 },
    },
  },
  "gemini-2.5-pro": {
    ...tokens(1.25, 10, 0.125),
    longContext: {
      aboveInputTokens: 200000,
      rate: { input: 2.5, output: 15, cacheRead: 0.25 },
    },
  },
  "gemini-2.5-flash": tokens(0.3, 2.5, 0.03),
  "gemini-2.5-flash-lite": tokens(0.1, 0.4, 0.01),
  "gemini-2.0-flash": tokens(0.15, 0.6),
  "gemini-2.0-flash-lite": tokens(0.075, 0.3),
  "gemini-omni-flash": tokens(1.5, 9),
  "gemini-omni-1.1-flash": tokens(1.5, 9),
  // Vertex Interactions API (global-only): $1.50/1M input (text, image, video,
  // audio), $9.00/1M text/reasoning output, and $12.00/1M (1.2) or $17.50/1M
  // (1.1 preview) video output (1,931 / 5,792 / 8,688 / 17,376 video tokens/s
  // at 360p / 720p / 1080p / 4k). Read 2026-11-22.
  "gemini-omni-1.2-flash": {
    kind: "tokens",
    rate: { input: 1.5, output: 9 },
    modalityRates: {
      image: { input: 1.5 },
      audio: { input: 1.5 },
      video: { input: 1.5, output: 12 },
    },
    source: {
      url: "https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing",
      asOf: "2026-11-22",
    },
  },
  "gemini-omni-1.1-flash-preview": {
    kind: "tokens",
    rate: { input: 1.5, output: 9 },
    modalityRates: {
      image: { input: 1.5 },
      audio: { input: 1.5 },
      video: { input: 1.5, output: 17.5 },
    },
    source: {
      url: "https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing",
      asOf: "2026-11-22",
    },
  },
  "gemini-nano-banana-2.1": {
    kind: "tokens",
    rate: { input: 1.5, output: 7.5, cacheRead: 0.15 },
    modalityRates: {
      image: { input: 1.5, cacheRead: 0.15, output: 30 },
    },
    source: {
      url: source.url,
      asOf: "2026-11-21",
    },
  },
};
