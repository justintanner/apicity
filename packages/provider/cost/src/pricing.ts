// Bundled pricing rates. Source-of-truth file.
//
// Each row is researched directly from the upstream pricing page on the date
// shown in PRICING_AS_OF. To refresh: re-fetch the same six pages, update
// numbers, bump PRICING_AS_OF.
//
// Sources (refreshed 2026-04-30):
//   openai      → openai.com/api/pricing
//   anthropic   → platform.claude.com/docs/en/about-claude/pricing
//   xai         → docs.x.ai (per-model pages)
//   kimicoding  → platform.moonshot.ai
//   fireworks   → fireworks.ai/pricing
//   alibaba     → alibabacloud.com/help/en/model-studio/model-pricing (intl)
//   elevenlabs  → elevenlabs.io/pricing/api
//   kie         → kie.ai/market

export const PRICING_AS_OF = "2026-04-30";

export interface TokenRate {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite5m?: number;
}

export interface PerUnitRate {
  unit: "characters" | "seconds" | "images" | "songs";
  perUnit: number;
}

export type TokenProviderId =
  | "openai"
  | "anthropic"
  | "xai"
  | "kimicoding"
  | "fireworks"
  | "alibaba";

export type PerUnitProviderId = "elevenlabs" | "kie";

export const TOKEN_RATES: Record<TokenProviderId, Record<string, TokenRate>> = {
  openai: {
    "gpt-5": { input: 1.25, output: 10 },
    "gpt-5-mini": { input: 0.25, output: 2 },
    "gpt-5-nano": { input: 0.05, output: 0.4 },
    "gpt-4.1": { input: 2, output: 8 },
    "gpt-4.1-mini": { input: 0.4, output: 1.6 },
    "gpt-4.1-nano": { input: 0.1, output: 0.4 },
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    o3: { input: 2, output: 8 },
    "o4-mini": { input: 1.1, output: 4.4 },
    "text-embedding-3-small": { input: 0.02, output: 0 },
    "text-embedding-3-large": { input: 0.13, output: 0 },
  },
  anthropic: {
    "claude-opus-4-7": {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
    },
    "claude-opus-4-6": {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
    },
    "claude-opus-4-5": {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
    },
    "claude-opus-4-1": {
      input: 15,
      output: 75,
      cacheRead: 1.5,
      cacheWrite5m: 18.75,
    },
    "claude-opus-4": {
      input: 15,
      output: 75,
      cacheRead: 1.5,
      cacheWrite5m: 18.75,
    },
    "claude-sonnet-4-6": {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite5m: 3.75,
    },
    "claude-sonnet-4-5": {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite5m: 3.75,
    },
    "claude-sonnet-4": {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite5m: 3.75,
    },
    "claude-haiku-4-5": {
      input: 1,
      output: 5,
      cacheRead: 0.1,
      cacheWrite5m: 1.25,
    },
    "claude-haiku-3-5": {
      input: 0.8,
      output: 4,
      cacheRead: 0.08,
      cacheWrite5m: 1,
    },
  },
  xai: {
    "grok-4": { input: 3, output: 15 },
    "grok-3": { input: 3, output: 15 },
    "grok-4-fast": { input: 0.2, output: 0.5 },
    "grok-4-1-fast": { input: 0.2, output: 0.5 },
  },
  kimicoding: {
    "kimi-k2.6": { input: 0.95, output: 4, cacheRead: 0.16 },
    "kimi-k2.5": { input: 0.6, output: 2.5 },
    "kimi-k2": { input: 0.55, output: 2.2 },
  },
  fireworks: {
    "deepseek-v4-pro": { input: 1.74, output: 3.48 },
    "deepseek-v3": { input: 0.56, output: 1.68 },
    "glm-5": { input: 1, output: 3.2 },
    "glm-5.1": { input: 1.4, output: 4.4 },
    "kimi-k2.6": { input: 0.95, output: 4 },
    "qwen3-vl-30b": { input: 0.15, output: 0.6 },
  },
  alibaba: {
    "qwen3.6-plus": { input: 0.325, output: 1.95 },
    "qwen3.5-0.8b": { input: 0.01, output: 0.04 },
  },
};

export const PER_UNIT_RATES: Record<
  PerUnitProviderId,
  Record<string, PerUnitRate>
> = {
  elevenlabs: {
    eleven_flash_v2_5: { unit: "characters", perUnit: 0.00006 },
    eleven_turbo_v2_5: { unit: "characters", perUnit: 0.00006 },
    eleven_multilingual_v2: { unit: "characters", perUnit: 0.00012 },
    eleven_multilingual_v3: { unit: "characters", perUnit: 0.00012 },
  },
  // Per-output-second video rates. Where the upstream provider publishes a
  // primary per-output-second figure (fal model pages, xAI announcement),
  // that is used verbatim. For exact per-job USD on fal-hosted models prefer
  // c.usd({ provider: "fal", endpoint_id, payload: { unit_quantity: seconds } })
  // — the kie table is a hardcoded approximation; fal returns upstream USD.
  kie: {
    veo3: { unit: "seconds", perUnit: 0.3 }, // veo3 4K rate (kie marketplace)
    veo3_fast: { unit: "seconds", perUnit: 0.1 }, // veo3 720p rate
    "kling-3.0": { unit: "seconds", perUnit: 0.14 }, // fal v3/standard (verified 2026-04-30)
    "kling-3.0-4k": { unit: "seconds", perUnit: 0.42 }, // fal o3/4k (verified 2026-04-30)
    "sora-2": { unit: "seconds", perUnit: 0.15 },
    // Seedance 2: kie publishes 6 rates (3 resolutions × i2v/t2v). Pick the
    // tier you'll actually request — there is no bare `seedance-2` alias
    // because kie does not publish a single canonical rate. Verified
    // 2026-04-30 from the kie marketplace seedance-2 page.
    "seedance-2-1080p-i2v": { unit: "seconds", perUnit: 0.31 },
    "seedance-2-1080p-t2v": { unit: "seconds", perUnit: 0.51 },
    "seedance-2-720p-i2v": { unit: "seconds", perUnit: 0.125 },
    "seedance-2-720p-t2v": { unit: "seconds", perUnit: 0.205 },
    "seedance-2-480p-i2v": { unit: "seconds", perUnit: 0.0575 },
    "seedance-2-480p-t2v": { unit: "seconds", perUnit: 0.095 },
    // Seedance 2 Fast: kie supports only 480p and 720p (no 1080p tier).
    // Verified 2026-04-30 from the kie marketplace seedance-2 page,
    // "Seedance 2 Fast" tab.
    "seedance-2-fast-720p-i2v": { unit: "seconds", perUnit: 0.1 },
    "seedance-2-fast-720p-t2v": { unit: "seconds", perUnit: 0.165 },
    "seedance-2-fast-480p-i2v": { unit: "seconds", perUnit: 0.045 },
    "seedance-2-fast-480p-t2v": { unit: "seconds", perUnit: 0.0775 },
    "wan-2.7": { unit: "seconds", perUnit: 0.1 }, // fal v2.7 (verified 2026-04-30)
    // grok-imagine: kie publishes 2 rates (480p, 720p only — no 1080p
    // tier, no i2v/t2v split). Audio is always on (no toggle in the kie
    // input schema; docs state every output includes synchronized audio).
    // Verified from the kie marketplace grok-imagine page.
    "grok-imagine-480p": { unit: "seconds", perUnit: 0.008 }, // 1.6 c/s
    "grok-imagine-720p": { unit: "seconds", perUnit: 0.015 }, // 3 c/s
    // happyhorse: kie publishes 2 rates (720p, 1080p only — no i2v/t2v
    // split). Audio always on for t2v/i2v/r2v (no toggle in those zod
    // schemas; only video-edit exposes audio_setting). Verified from the
    // kie marketplace happyhorse/image-to-video page.
    "happyhorse-720p": { unit: "seconds", perUnit: 0.155 }, // 31 c/s
    "happyhorse-1080p": { unit: "seconds", perUnit: 0.265 }, // 53 c/s
  },
};
