// Compact, stable per-model slugs for use as filename / asset-id prefixes.
//
// Convention: lowercase, alphanumeric only (no spaces, hyphens, or dots).
// Dots in version numbers become the letter "p" — e.g. "Kimi 2.5" → "kimi2p5",
// "Wan 2.7" → "wan2p7". Tier letters trail the version: pro → "p",
// fast → "f", std → "s". Slugs identify the *model variant* (different
// price / quality tier = different slug), but NOT the I/O modality
// (T2V/I2V/R2V/edit/extend share one slug — the op is metadata).
//
// Keys mirror PRICING wherever possible. The exception is kie's
// "kling-3.0/video", which has a single pricing entry with mode-tiered
// rates; we expose two synthetic slug keys ("kling-3.0/video/std",
// "kling-3.0/video/pro") so consumers get the right slug per tier.

export const MODEL_SLUGS = {
  kie: {
    // Video — Bytedance Seedance
    "bytedance/seedance-2": "sd2",
    "bytedance/seedance-2-fast": "sd2f",

    // Video — Kling 3.0 (mode-tiered: synthetic suffixed keys)
    "kling-3.0/video": "kling3",
    "kling-3.0/video/std": "kling3s",
    "kling-3.0/video/pro": "kling3p",
    "kling-3.0/motion-control": "kling3mc",

    // Video — Wan 2.7
    "wan/2-7-text-to-video": "wan2p7",
    "wan/2-7-image-to-video": "wan2p7",
    "wan/2-7-r2v": "wan2p7",
    "wan/2-7-videoedit": "wan2p7",

    // Video — Grok Imagine
    "grok-imagine/text-to-video": "grok",
    "grok-imagine/image-to-video": "grok",
    "grok-imagine/extend": "grok",
    "grok-imagine/upscale": "grok",

    // Video — HappyHorse
    "happyhorse/text-to-video": "hh",
    "happyhorse/image-to-video": "hh",
    "happyhorse/reference-to-video": "hh",
    "happyhorse/video-edit": "hh",

    // Video — Veo
    veo3: "veo3",
    veo3_fast: "veo3f",

    // Image — Grok Imagine
    "grok-imagine/text-to-image": "grok",
    "grok-imagine/image-to-image": "grok",

    // Image — Nano Banana
    "nano-banana": "nb",
    "nano-banana-2": "nb2",
    "nano-banana-pro": "nbp",

    // Image — GPT Image 2
    "gpt-image-2-text-to-image": "gpti2",
    "gpt-image-2-image-to-image": "gpti2",

    // Image — Wan 2.7
    "wan/2-7-image": "wan2p7",
    "wan/2-7-image-pro": "wan2p7p",

    // Image — Qwen 2
    "qwen2/text-to-image": "qwen2",
    "qwen2/image-edit": "qwen2",

    // Image — Seedream 5 lite
    "seedream/5-lite-text-to-image": "sd5",
    "seedream/5-lite-image-to-image": "sd5",

    // Image — Sora watermark removal
    "sora-watermark-remover": "soraw",

    // Audio — Suno
    "suno/generate": "suno",
    "suno/extend": "suno",
    "suno/upload-cover": "suno",
    "suno/upload-extend": "suno",
    "suno/wav-generate": "suno",
    "suno/mp4-generate": "suno",
    "suno/lyrics": "suno",
    "suno/style-generate": "suno",
    "suno/vocal-removal-generate": "suno",
  },

  kimicoding: {
    "kimi-k2": "kimi2",
    "kimi-k2.5": "kimi2p5",
    "kimi-k2.6": "kimi2p6",
  },

  anthropic: {
    "claude-opus-4": "opus4",
    "claude-opus-4-1": "opus4p1",
    "claude-opus-4-5": "opus4p5",
    "claude-opus-4-6": "opus4p6",
    "claude-opus-4-7": "opus4p7",
    "claude-sonnet-4": "sonnet4",
    "claude-sonnet-4-5": "sonnet4p5",
    "claude-sonnet-4-6": "sonnet4p6",
    "claude-haiku-3-5": "haiku3p5",
    "claude-haiku-4-5": "haiku4p5",
  },

  openai: {
    "gpt-5": "gpt5",
    "gpt-5-mini": "gpt5m",
    "gpt-5-nano": "gpt5n",
    "gpt-4.1": "gpt4p1",
    "gpt-4.1-mini": "gpt4p1m",
    "gpt-4.1-nano": "gpt4p1n",
    "gpt-4o": "gpt4o",
    "gpt-4o-mini": "gpt4om",
    o3: "o3",
    "o4-mini": "o4m",
    "text-embedding-3-small": "emb3s",
    "text-embedding-3-large": "emb3l",
  },

  xai: {
    "grok-3": "grok3",
    "grok-4": "grok4",
    "grok-4-fast": "grok4f",
    "grok-4-1-fast": "grok4p1f",
  },

  alibaba: {
    "qwen3.5-0.8b": "qwen3p5",
    "qwen3.6-plus": "qwen3p6",
    // Image gen via alibaba's direct API (Qwen Image, Wan 2.7 Image).
    // Same underlying models as kie's qwen2/* and wan/2-7-image* —
    // slugs intentionally match.
    "qwen-image-2.0": "qwen2",
    "qwen-image-2.0-pro": "qwen2p",
    "qwen-image-edit": "qwen2e",
    "qwen-image-edit-plus": "qwen2e",
    "qwen-image-edit-max": "qwen2e",
    "wan2.7-image-pro": "wan2p7p",
  },

  fireworks: {
    "deepseek-v3": "ds3",
    "deepseek-v4-pro": "ds4p",
    "glm-5": "glm5",
    "glm-5.1": "glm5p1",
    "kimi-k2.6": "kimi2p6",
    "qwen3-vl-30b": "qwen3vl",
  },

  elevenlabs: {
    eleven_flash_v2_5: "elf2p5",
    eleven_turbo_v2_5: "elt2p5",
    eleven_multilingual_v2: "elml2",
    eleven_multilingual_v3: "elml3",
  },
} as const;

export type SlugProviderId = keyof typeof MODEL_SLUGS;

export type SlugModelId<P extends SlugProviderId> = keyof (typeof MODEL_SLUGS)[P];

// Returns the compact slug for a given provider+model. Throws if unknown
// — slugs are a write-time concern (asset naming, telemetry) where
// silently falling back to a string would produce drift.
export function modelSlug<P extends SlugProviderId>(
  provider: P,
  model: SlugModelId<P>,
): string {
  const slug = (MODEL_SLUGS[provider] as Record<string, string>)[model as string];
  if (!slug) {
    throw new Error(
      `No slug registered for ${String(provider)}/${String(model)} — add it to packages/provider/cost/src/slugs.ts`,
    );
  }
  return slug;
}

// Human-readable display names. Parallel to MODEL_SLUGS — same provider/
// model keys. Used by UIs that surface model identity to end users
// (activity logs, model pickers, cost breakdowns). Title-case is
// intentional; consumers can lowercase if they prefer.
export const MODEL_DISPLAY = {
  kie: {
    "bytedance/seedance-2": "Seedance 2",
    "bytedance/seedance-2-fast": "Seedance 2 Fast",

    "kling-3.0/video": "Kling 3.0",
    "kling-3.0/video/std": "Kling 3.0",
    "kling-3.0/video/pro": "Kling 3.0 Pro",
    "kling-3.0/motion-control": "Kling 3.0 Motion",

    "wan/2-7-text-to-video": "Wan 2.7",
    "wan/2-7-image-to-video": "Wan 2.7",
    "wan/2-7-r2v": "Wan 2.7",
    "wan/2-7-videoedit": "Wan 2.7 Edit",

    "grok-imagine/text-to-video": "Grok Imagine",
    "grok-imagine/image-to-video": "Grok Imagine",
    "grok-imagine/extend": "Grok Extend",
    "grok-imagine/upscale": "Grok Upscale",

    "happyhorse/text-to-video": "HappyHorse",
    "happyhorse/image-to-video": "HappyHorse",
    "happyhorse/reference-to-video": "HappyHorse",
    "happyhorse/video-edit": "HappyHorse Edit",

    veo3: "Veo 3",
    veo3_fast: "Veo 3 Fast",

    "grok-imagine/text-to-image": "Grok Imagine",
    "grok-imagine/image-to-image": "Grok Imagine",

    "nano-banana": "Nano Banana",
    "nano-banana-2": "Nano Banana 2",
    "nano-banana-pro": "Nano Banana Pro",

    "gpt-image-2-text-to-image": "GPT Image 2.0",
    "gpt-image-2-image-to-image": "GPT Image 2.0 Edit",

    "wan/2-7-image": "Wan 2.7",
    "wan/2-7-image-pro": "Wan 2.7 Pro",

    "qwen2/text-to-image": "Qwen 2 Image",
    "qwen2/image-edit": "Qwen 2 Edit",

    "seedream/5-lite-text-to-image": "Seedream 5",
    "seedream/5-lite-image-to-image": "Seedream 5 Edit",

    "sora-watermark-remover": "Sora Watermark Remover",

    "suno/generate": "Suno",
    "suno/extend": "Suno Extend",
    "suno/upload-cover": "Suno Cover",
    "suno/upload-extend": "Suno Extend",
    "suno/wav-generate": "Suno WAV",
    "suno/mp4-generate": "Suno MP4",
    "suno/lyrics": "Suno Lyrics",
    "suno/style-generate": "Suno Style",
    "suno/vocal-removal-generate": "Suno Vocal Removal",
  },

  kimicoding: {
    "kimi-k2": "Kimi 2",
    "kimi-k2.5": "Kimi 2.5",
    "kimi-k2.6": "Kimi 2.6",
  },

  anthropic: {
    "claude-opus-4": "Claude Opus 4",
    "claude-opus-4-1": "Claude Opus 4.1",
    "claude-opus-4-5": "Claude Opus 4.5",
    "claude-opus-4-6": "Claude Opus 4.6",
    "claude-opus-4-7": "Claude Opus 4.7",
    "claude-sonnet-4": "Claude Sonnet 4",
    "claude-sonnet-4-5": "Claude Sonnet 4.5",
    "claude-sonnet-4-6": "Claude Sonnet 4.6",
    "claude-haiku-3-5": "Claude Haiku 3.5",
    "claude-haiku-4-5": "Claude Haiku 4.5",
  },

  openai: {
    "gpt-5": "GPT-5",
    "gpt-5-mini": "GPT-5 Mini",
    "gpt-5-nano": "GPT-5 Nano",
    "gpt-4.1": "GPT-4.1",
    "gpt-4.1-mini": "GPT-4.1 Mini",
    "gpt-4.1-nano": "GPT-4.1 Nano",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    o3: "o3",
    "o4-mini": "o4 Mini",
    "text-embedding-3-small": "Embedding 3 Small",
    "text-embedding-3-large": "Embedding 3 Large",
  },

  xai: {
    "grok-3": "Grok 3",
    "grok-4": "Grok 4",
    "grok-4-fast": "Grok 4 Fast",
    "grok-4-1-fast": "Grok 4.1 Fast",
  },

  alibaba: {
    "qwen3.5-0.8b": "Qwen 3.5",
    "qwen3.6-plus": "Qwen 3.6 Plus",
    "qwen-image-2.0": "Qwen Image 2.0",
    "qwen-image-2.0-pro": "Qwen Image 2.0 Pro",
    "qwen-image-edit": "Qwen Image Edit",
    "qwen-image-edit-plus": "Qwen Image Edit Plus",
    "qwen-image-edit-max": "Qwen Image Edit Max",
    "wan2.7-image-pro": "Wan 2.7 Image Pro",
  },

  fireworks: {
    "deepseek-v3": "DeepSeek V3",
    "deepseek-v4-pro": "DeepSeek V4 Pro",
    "glm-5": "GLM 5",
    "glm-5.1": "GLM 5.1",
    "kimi-k2.6": "Kimi 2.6",
    "qwen3-vl-30b": "Qwen 3 VL",
  },

  elevenlabs: {
    eleven_flash_v2_5: "Eleven Flash 2.5",
    eleven_turbo_v2_5: "Eleven Turbo 2.5",
    eleven_multilingual_v2: "Eleven Multilingual 2",
    eleven_multilingual_v3: "Eleven Multilingual 3",
  },
} as const;

export function modelDisplay<P extends SlugProviderId>(
  provider: P,
  model: SlugModelId<P>,
): string {
  const display = (MODEL_DISPLAY[provider] as Record<string, string>)[model as string];
  if (!display) {
    throw new Error(
      `No display name registered for ${String(provider)}/${String(model)} — add it to packages/provider/cost/src/slugs.ts`,
    );
  }
  return display;
}
