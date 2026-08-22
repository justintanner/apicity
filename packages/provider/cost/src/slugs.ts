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
    "bytedance/seedance-2-5": "sd2p5",
    "bytedance/seedance-2-mini": "sd2m",

    // Video — Kling 3.0 (mode-tiered: synthetic suffixed keys)
    "kling-3.0/video": "kling3",
    "kling-3.0/video/std": "kling3s",
    "kling-3.0/video/pro": "kling3p",
    "kling-3.0/motion-control": "kling3mc",
    "kling/v3-turbo-image-to-video": "kling3t",
    "kling/v3-turbo-text-to-video": "kling3t",

    // Video — Kling O3 / Kling 3.0 Omni. Text and image input share one rate
    // shape; reference input and transformation have distinct ladders.
    "kling-3.0-omni/text-to-video": "klingo3",
    "kling-3.0-omni/image-to-video": "klingo3",
    "kling-3.0-omni/reference-to-video": "klingo3r",
    "kling-3.0-omni/transformation": "klingo3x",

    // Video — Wan 2.2 (A14B Turbo trio + the Animate pair). All five share the
    // family slug: there is no separately-priced non-turbo wan 2.2 generation
    // surface for a tier letter to distinguish, and the animate ops differ by
    // modality only, which the slug convention treats as metadata.
    "wan/2-2-a14b-text-to-video-turbo": "wan2p2",
    "wan/2-2-a14b-image-to-video-turbo": "wan2p2",
    "wan/2-2-a14b-speech-to-video-turbo": "wan2p2",
    "wan/2-2-animate-move": "wan2p2",
    "wan/2-2-animate-replace": "wan2p2",

    // Video — Wan 2.5
    "wan/2-5-text-to-video": "wan2p5",
    "wan/2-5-image-to-video": "wan2p5",

    // Video — Wan 2.6 standard trio. The two wan/2-6-flash-* ids get no slug:
    // kie publishes no flash rate, so they carry no PRICING.kie entry either
    // and stay unpriced (mayor ruling R2, 2026-08-07).
    "wan/2-6-text-to-video": "wan2p6",
    "wan/2-6-image-to-video": "wan2p6",
    "wan/2-6-video-to-video": "wan2p6",

    // Video — Wan 2.7
    "wan/2-7-text-to-video": "wan2p7",
    "wan/2-7-image-to-video": "wan2p7",
    "wan/2-7-r2v": "wan2p7",
    "wan/2-7-videoedit": "wan2p7",

    // Video — Grok Imagine
    "grok-imagine/text-to-video": "grok",
    "grok-imagine/image-to-video": "grok",
    "grok-imagine-video-1-5-preview": "grok",
    "grok-imagine/extend": "grok",
    "grok-imagine/upscale": "grok",

    // Video — HappyHorse
    "happyhorse/text-to-video": "hh",
    "happyhorse/image-to-video": "hh",
    "happyhorse/reference-to-video": "hh",
    "happyhorse/video-edit": "hh",
    "happyhorse-1-1/text-to-video": "hh1p1",
    "happyhorse-1-1/image-to-video": "hh1p1",
    "happyhorse-1-1/reference-to-video": "hh1p1",

    // Video — MiniMax H3 (Hailuo 03)
    "minimax-h3/text-to-video": "mmh3",
    "minimax-h3/image-to-video": "mmh3",
    "minimax-h3/reference-to-video": "mmh3",

    // Video — Hailuo 02 / 2.3 (MiniMax). Standard and Pro are separate price
    // ladders, so the tier letter trails the family slug (s / p); t2v and i2v
    // are modalities of one tier and share its slug. "2.3" follows the
    // dots→`p` rule: 2p3.
    "hailuo/02-text-to-video-standard": "hailuo02s",
    "hailuo/02-image-to-video-standard": "hailuo02s",
    "hailuo/02-text-to-video-pro": "hailuo02p",
    "hailuo/02-image-to-video-pro": "hailuo02p",
    "hailuo/2-3-image-to-video-standard": "hailuo2p3s",
    "hailuo/2-3-image-to-video-pro": "hailuo2p3p",

    // Video — Kling 2.6 / 2.5 turbo / 2.1 (each generation is its own price
    // ladder, so its own slug; t2v and i2v are modalities and share one)
    "kling-2.6/text-to-video": "kling2p6",
    "kling-2.6/image-to-video": "kling2p6",
    "kling-2.6/motion-control": "kling2p6mc",
    "kling/v2-5-turbo-text-to-video-pro": "kling2p5t",
    "kling/v2-5-turbo-image-to-video-pro": "kling2p5t",
    "kling/v2-1-standard": "kling2p1s",
    "kling/v2-1-pro": "kling2p1p",
    "kling/v2-1-master-text-to-video": "kling2p1m",
    "kling/v2-1-master-image-to-video": "kling2p1m",

    // Video — Bytedance Seedance 1.5
    "bytedance/seedance-1.5-pro": "sd1p5p",

    // The registered `bytedance/v1-lite-{text,image}-to-video`,
    // `bytedance/v1-pro-{text,image}-to-video`, and
    // `bytedance/v1-pro-fast-image-to-video` ids intentionally have no slug or
    // pricing key. The 2026-08-22 catalog and their docs.kie.ai/market pages
    // publish no rate, so they fail safe instead of inheriting another tier.

    // Video — Topaz
    "topaz/video-upscale": "topazvid",

    // Video — lip sync / avatar
    "omnihuman-1-5": "oh1p5",
    // `omnihuman-1-5/human-identification` and
    // `omnihuman-1-5/subject-detection` intentionally have no slug or pricing
    // key. On 2026-08-22 the catalog priced only lip sync and their docs pages
    // published neither a rate nor an explicit free designation, so both fail
    // safe instead of borrowing the lip-sync price.
    "volcengine/video-to-video-lip-sync": "vlipsync",
    "kling/ai-avatar-standard": "klingavs",
    "kling/ai-avatar-pro": "klingavp",
    "infinitalk/from-audio": "infinitalk",

    // Video — Veo (the aux endpoint keys share the family slug: extend and
    // the resolution upgrades are ops on the same model, not price tiers)
    veo3: "veo3",
    veo3_fast: "veo3f",
    veo3_lite: "veo3l",
    "veo/extend": "veo3",
    "veo/get-1080p-video": "veo3",
    "veo/get-4k-video": "veo3",

    // Video — Runway
    "runway/generate": "runway",
    "runway/extend": "runway",
    "aleph/generate": "aleph",

    // Video — Gemini Omni
    "gemini-omni-video": "geminiomni",

    // Video — PixVerse V6. Operations are modality metadata and share one
    // family slug; transition has no evidenced rate and therefore no slug.
    "pixverse-v6/text-to-video": "pixv6",
    "pixverse-v6/image-to-video": "pixv6",
    "pixverse-v6/extend": "pixv6",
    "pixverse-v6/reference-to-video": "pixv6",

    // Image — Grok Imagine
    "grok-imagine/text-to-image": "grok",
    "grok-imagine/image-to-image": "grok",
    "grok-imagine-image-2-0/text-to-image": "grok",
    "grok-imagine-image-2-0/segment-map": "grok",
    "grok-imagine-image-2-0/image-edit": "grok",

    // Image — Nano Banana
    "nano-banana": "nb",
    "nano-banana-2": "nb2",
    "nano-banana-pro": "nbp",

    // Image — GPT Image 2
    "gpt-image-2-text-to-image": "gi2",
    "gpt-image-2-image-to-image": "gi2",

    // Image — Wan 2.7
    "wan/2-7-image": "wan2p7",
    "wan/2-7-image-pro": "wan2p7p",

    // Image — Qwen 2
    "qwen2/text-to-image": "qwen2",
    "qwen2/image-edit": "qwen2",

    // Image — Qwen 3 (modality shares the family slug; Pro is a price tier)
    "qwen3/text-to-image": "qwen3",
    "qwen3/image-to-image": "qwen3",
    "qwen3/pro-text-to-image": "qwen3p",
    "qwen3/pro-image-to-image": "qwen3p",

    // Image — Seedream 5 lite / 5 pro / 4.5
    "seedream/5-lite-text-to-image": "sd5",
    "seedream/5-lite-image-to-image": "sd5",
    "seedream/5-pro-text-to-image": "sd5p",
    "seedream/5-pro-image-to-image": "sd5p",
    "seedream/5-pro-layer-decomposition": "sd5p",
    "seedream/4.5-text-to-image": "sd4p5",
    "seedream/4.5-edit": "sd4p5",

    // Registered `bytedance/seedream`, `bytedance/seedream-v4-edit`, and
    // `bytedance/seedream-v4-text-to-image` intentionally have no slug or
    // pricing key: the 2026-08-22 KIE catalog and their
    // docs.kie.ai/market/bytedance operation pages publish no rate. They fail
    // safe into the prohibitive tier instead of borrowing this separately
    // priced 4.5 family's rate.

    // Image — Nano Banana 2 Lite + the namespaced google/* Nano Banana ids
    // (same model as the bare "nano-banana" key, so the same family slug)
    "nano-banana-2-lite": "nb2l",
    "google/nano-banana": "nb",
    "google/nano-banana-edit": "nb",

    // Image — GPT Image 1.5 (matches fal's slug for the same model)
    "gpt-image/1.5-text-to-image": "gi1p5",
    "gpt-image/1.5-image-to-image": "gi1p5",

    // Image — Imagen 4
    "google/imagen4": "imagen4",
    "google/imagen4-fast": "imagen4f",
    "google/imagen4-ultra": "imagen4u",

    // Image — Z-Image
    "z-image": "zimg",

    // Image — Flux 2 (flex and pro are price tiers, so distinct slugs)
    "flux-2/flex-text-to-image": "flux2f",
    "flux-2/flex-image-to-image": "flux2f",
    "flux-2/pro-text-to-image": "flux2p",
    "flux-2/pro-image-to-image": "flux2p",

    // Image — Ideogram (V3 and Character are separate rate ladders; the
    // edit/remix variants are modalities of each, so they share its slug)
    "ideogram/v3-text-to-image": "ideo3",
    "ideogram/v3-edit": "ideo3",
    "ideogram/v3-remix": "ideo3",
    "ideogram/character": "ideochar",
    "ideogram/character-edit": "ideochar",
    "ideogram/character-remix": "ideochar",

    // Image — Recraft utilities
    "recraft/crisp-upscale": "recraftcu",
    "recraft/remove-background": "recraftrb",

    // Image — Topaz
    "topaz/image-upscale": "topazimg",

    // Image — Qwen Image (matches fal's "qwenimg" for the same model; the
    // edit variant shares it per the modality rule, as it does on fal)
    "qwen/text-to-image": "qwenimg",
    "qwen/image-to-image": "qwenimg",
    "qwen/image-edit": "qwenimg",

    // Image — GPT-4o Image
    "gpt4o-image/generate": "gi4o",

    // Image — Flux Kontext
    "flux-kontext-pro": "fluxkp",
    "flux-kontext-max": "fluxkm",

    // Image — Sora watermark removal
    "sora-watermark-remover": "soraw",

    // Audio — ElevenLabs TTS resold by kie. Same underlying models as the
    // elevenlabs provider's own entries, so the same slugs (the cross-provider
    // rule that already ties kie's qwen/* to fal's).
    "elevenlabs/text-to-speech-multilingual-v2": "elml2",
    "elevenlabs/text-to-speech-turbo-2-5": "elt2p5",
    "elevenlabs/text-to-dialogue-v3": "eldlg3",

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
    "suno/mashup-generate": "suno",
    "suno/replace-music-section-generate": "suno",
    "suno/sounds-generate": "suno",
    "suno/add-instrumental-generate": "suno",
    "suno/add-vocals-generate": "suno",
    "suno/timestamped-lyrics": "suno",
    "suno/cover-generate": "suno",
    "suno/persona-generate": "suno",
    "suno/midi-generate": "suno",
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
    "grok-build-0.1": "grokbuild01",
    "grok-code-fast-1": "grokbuild01",
    "grok-code-fast": "grokbuild01",
    "grok-code-fast-1-0825": "grokbuild01",
    "grok-3": "grok3",
    "grok-4": "grok4",
    "grok-4-fast": "grok4f",
    "grok-4-1-fast": "grok4p1f",
    "grok-4.6": "grok4p6",
    // Grok Imagine media models. Same underlying models kie resells as
    // "grok-imagine/*" — slugs intentionally match kie's "grok" family.
    "grok-imagine-video": "grokimgv",
    "grok-imagine-video-1.5": "grokimgv1p5",
    "grok-imagine-video-1.5-preview": "grokimgv1p5",
    "grok-imagine-image": "grokimgi",
    "grok-imagine-image-quality": "grokimgiq",
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
    "wan2.7-image": "wan2p7",
    "wan2.7-image-pro": "wan2p7p",
    // Video gen via alibaba's direct API. Same underlying models as kie's
    // wan/2-7-* video entries — slugs intentionally match.
    "wan2.7-i2v": "wan2p7",
    "wan2.7-videoedit": "wan2p7",
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

  // Keys are fal endpoint ids, matching PRICING.fal. Nano Banana,
  // Seedream 5, Seedance 2, Wan 2.7, Kling v3, and Grok Imagine are the
  // same underlying models kie also resells, so their slugs intentionally
  // match kie's.
  fal: {
    "fal-ai/flux/dev": "fluxd",
    "fal-ai/flux/schnell": "fluxs",
    "fal-ai/qwen-image": "qwenimg",
    "fal-ai/qwen-image-edit": "qwenimg",
    "fal-ai/nano-banana": "nb",
    "fal-ai/nano-banana/edit": "nb",
    "fal-ai/nano-banana-2": "nb2",
    "fal-ai/nano-banana-2/edit": "nb2",
    "fal-ai/nano-banana-pro": "nbp",
    "fal-ai/nano-banana-pro/edit": "nbp",
    "fal-ai/bytedance/seedream/v5/lite/text-to-image": "sd5",
    "fal-ai/bytedance/seedream/v5/lite/edit": "sd5",
    "fal-ai/wan/v2.7/text-to-image": "wan2p7",
    "fal-ai/wan/v2.7/edit": "wan2p7",
    "fal-ai/wan/v2.7/pro/text-to-image": "wan2p7p",
    "fal-ai/wan/v2.7/pro/edit": "wan2p7p",
    "xai/grok-imagine-image": "grok",
    "xai/grok-imagine-image/edit": "grok",
    "fal-ai/hunyuan-image/v3/instruct/edit": "hunyuan3",
    "fal-ai/gpt-image-1.5": "gi1p5",
    "fal-ai/gpt-image-1.5/edit": "gi1p5",

    // Video — FLUX 3
    "blackforestlabs/flux-3/extend-video": "flux3",
    "blackforestlabs/flux-3/first-last-frame-to-video": "flux3",
    "blackforestlabs/flux-3/image-to-video": "flux3",
    "blackforestlabs/flux-3/keyframes-to-video": "flux3",
    "blackforestlabs/flux-3/text-to-video": "flux3",

    // Video — Seedance 2.0
    "bytedance/seedance-2.0/text-to-video": "sd2",
    "bytedance/seedance-2.0/image-to-video": "sd2",
    "bytedance/seedance-2.0/reference-to-video": "sd2",
    "bytedance/seedance-2.0/fast/text-to-video": "sd2f",
    "bytedance/seedance-2.0/fast/image-to-video": "sd2f",
    "bytedance/seedance-2.0/fast/reference-to-video": "sd2f",

    // Video — Wan 2.7
    "fal-ai/wan/v2.7/text-to-video": "wan2p7",
    "fal-ai/wan/v2.7/image-to-video": "wan2p7",
    "fal-ai/wan/v2.7/reference-to-video": "wan2p7",
    "fal-ai/wan/v2.7/edit-video": "wan2p7",

    // Video — Kling v3 / o3 4K (kie has no o3 counterpart, so the o3
    // family gets its own slug in the kling3 family)
    "fal-ai/kling-video/v3/pro/text-to-video": "kling3p",
    "fal-ai/kling-video/v3/pro/image-to-video": "kling3p",
    "fal-ai/kling-video/v3/standard/text-to-video": "kling3s",
    "fal-ai/kling-video/v3/standard/image-to-video": "kling3s",
    "fal-ai/kling-video/o3/4k/text-to-video": "klingo3",
    "fal-ai/kling-video/o3/4k/image-to-video": "klingo3",
    "fal-ai/kling-video/o3/4k/reference-to-video": "klingo3",

    // Video — Veo 3.1
    "fal-ai/veo3.1": "veo3p1",
    "fal-ai/veo3.1/image-to-video": "veo3p1",

    // Video — Sora 2
    "fal-ai/sora-2/text-to-video": "sora2",
    "fal-ai/sora-2/image-to-video": "sora2",

    // Video — Grok Imagine
    "xai/grok-imagine-video/image-to-video": "grok",
    "xai/grok-imagine-video/reference-to-video": "grok",
    "xai/grok-imagine-video/extend-video": "grok",
  },

  googleflow: {
    "veo-3.1-quality": "veo3p1q",
    "veo-3.1-fast": "veo3p1f",
    "veo-3.1-lite": "veo3p1l",
    "veo-3.1-lite-low-priority": "veo3p1llp",
    // Same underlying model as kie's "gemini-omni-video" — slug intentionally
    // matches, as with alibaba's qwen/wan image entries.
    "omni-flash": "geminiomni",
  },
} as const;

export type SlugProviderId = keyof typeof MODEL_SLUGS;

export type SlugModelId<P extends SlugProviderId> =
  keyof (typeof MODEL_SLUGS)[P];

// Returns the compact slug for a given provider+model. Throws if unknown
// — slugs are a write-time concern (asset naming, telemetry) where
// silently falling back to a string would produce drift.
export function modelSlug<P extends SlugProviderId>(
  provider: P,
  model: SlugModelId<P>
): string {
  const slug = (MODEL_SLUGS[provider] as Record<string, string>)[
    model as string
  ];
  if (!slug) {
    throw new Error(
      `No slug registered for ${String(provider)}/${String(model)} — add it to packages/provider/cost/src/slugs.ts`
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
    "bytedance/seedance-2-5": "Seedance 2.5",
    "bytedance/seedance-2-mini": "Seedance 2 Mini",

    "kling-3.0/video": "Kling 3.0",
    "kling-3.0/video/std": "Kling 3.0",
    "kling-3.0/video/pro": "Kling 3.0 Pro",
    "kling-3.0/motion-control": "Kling 3.0 Motion",
    "kling/v3-turbo-image-to-video": "Kling 3.0 Turbo",
    "kling/v3-turbo-text-to-video": "Kling 3.0 Turbo",
    "kling-3.0-omni/text-to-video": "Kling 3.0 Omni Text-to-Video",
    "kling-3.0-omni/image-to-video": "Kling 3.0 Omni Image-to-Video",
    "kling-3.0-omni/reference-to-video": "Kling 3.0 Omni Reference-to-Video",
    "kling-3.0-omni/transformation": "Kling 3.0 Omni Transformation",

    "wan/2-2-a14b-text-to-video-turbo": "Wan 2.2",
    "wan/2-2-a14b-image-to-video-turbo": "Wan 2.2",
    "wan/2-2-a14b-speech-to-video-turbo": "Wan 2.2",
    "wan/2-2-animate-move": "Wan 2.2 Animate",
    "wan/2-2-animate-replace": "Wan 2.2 Animate",

    "wan/2-5-text-to-video": "Wan 2.5",
    "wan/2-5-image-to-video": "Wan 2.5",

    "wan/2-6-text-to-video": "Wan 2.6",
    "wan/2-6-image-to-video": "Wan 2.6",
    "wan/2-6-video-to-video": "Wan 2.6",

    "wan/2-7-text-to-video": "Wan 2.7",
    "wan/2-7-image-to-video": "Wan 2.7",
    "wan/2-7-r2v": "Wan 2.7",
    "wan/2-7-videoedit": "Wan 2.7 Edit",

    "grok-imagine/text-to-video": "Grok Imagine",
    "grok-imagine/image-to-video": "Grok Imagine",
    "grok-imagine-video-1-5-preview": "Grok Imagine",
    "grok-imagine/extend": "Grok Extend",
    "grok-imagine/upscale": "Grok Upscale",

    "happyhorse/text-to-video": "HappyHorse",
    "happyhorse/image-to-video": "HappyHorse",
    "happyhorse/reference-to-video": "HappyHorse",
    "happyhorse/video-edit": "HappyHorse Edit",
    "happyhorse-1-1/text-to-video": "HappyHorse 1.1",
    "happyhorse-1-1/image-to-video": "HappyHorse 1.1",
    "happyhorse-1-1/reference-to-video": "HappyHorse 1.1",

    "minimax-h3/text-to-video": "MiniMax H3",
    "minimax-h3/image-to-video": "MiniMax H3",
    "minimax-h3/reference-to-video": "MiniMax H3",

    "hailuo/02-text-to-video-standard": "Hailuo 02",
    "hailuo/02-image-to-video-standard": "Hailuo 02",
    "hailuo/02-text-to-video-pro": "Hailuo 02 Pro",
    "hailuo/02-image-to-video-pro": "Hailuo 02 Pro",
    "hailuo/2-3-image-to-video-standard": "Hailuo 2.3",
    "hailuo/2-3-image-to-video-pro": "Hailuo 2.3 Pro",

    "kling-2.6/text-to-video": "Kling 2.6",
    "kling-2.6/image-to-video": "Kling 2.6",
    "kling-2.6/motion-control": "Kling 2.6 Motion",
    "kling/v2-5-turbo-text-to-video-pro": "Kling 2.5 Turbo Pro",
    "kling/v2-5-turbo-image-to-video-pro": "Kling 2.5 Turbo Pro",
    "kling/v2-1-standard": "Kling 2.1",
    "kling/v2-1-pro": "Kling 2.1 Pro",
    "kling/v2-1-master-text-to-video": "Kling 2.1 Master",
    "kling/v2-1-master-image-to-video": "Kling 2.1 Master",

    "bytedance/seedance-1.5-pro": "Seedance 1.5 Pro",

    "topaz/video-upscale": "Topaz Video Upscale",

    "omnihuman-1-5": "OmniHuman 1.5",
    "volcengine/video-to-video-lip-sync": "Volcengine Lip Sync",
    "kling/ai-avatar-standard": "Kling AI Avatar",
    "kling/ai-avatar-pro": "Kling AI Avatar Pro",
    "infinitalk/from-audio": "InfiniTalk",

    veo3: "Veo 3",
    veo3_fast: "Veo 3 Fast",
    veo3_lite: "Veo 3 Lite",
    "veo/extend": "Veo 3 Extend",
    "veo/get-1080p-video": "Veo 3 1080p Upgrade",
    "veo/get-4k-video": "Veo 3 4K Upgrade",

    "runway/generate": "Runway",
    "runway/extend": "Runway Extend",
    "aleph/generate": "Runway Aleph",

    "gemini-omni-video": "Gemini Omni",

    "pixverse-v6/text-to-video": "PixVerse V6",
    "pixverse-v6/image-to-video": "PixVerse V6",
    "pixverse-v6/extend": "PixVerse V6 Extend",
    "pixverse-v6/reference-to-video": "PixVerse V6 Reference",

    "grok-imagine/text-to-image": "Grok Imagine",
    "grok-imagine/image-to-image": "Grok Imagine",
    "grok-imagine-image-2-0/text-to-image": "Grok Imagine Image 2.0",
    "grok-imagine-image-2-0/segment-map": "Grok Imagine Image 2.0 Segment Map",
    "grok-imagine-image-2-0/image-edit": "Grok Imagine Image 2.0 Edit",

    "nano-banana": "Nano Banana",
    "nano-banana-2": "Nano Banana 2",
    "nano-banana-pro": "Nano Banana Pro",

    "gpt-image-2-text-to-image": "GPT Image 2.0",
    "gpt-image-2-image-to-image": "GPT Image 2.0 Edit",

    "wan/2-7-image": "Wan 2.7",
    "wan/2-7-image-pro": "Wan 2.7 Pro",

    "qwen2/text-to-image": "Qwen 2 Image",
    "qwen2/image-edit": "Qwen 2 Edit",
    "qwen3/text-to-image": "Qwen 3 Image",
    "qwen3/image-to-image": "Qwen 3 Image Edit",
    "qwen3/pro-text-to-image": "Qwen 3 Image Pro",
    "qwen3/pro-image-to-image": "Qwen 3 Image Pro Edit",

    "seedream/5-lite-text-to-image": "Seedream 5",
    "seedream/5-lite-image-to-image": "Seedream 5 Edit",
    "seedream/5-pro-text-to-image": "Seedream 5 Pro",
    "seedream/5-pro-image-to-image": "Seedream 5 Pro Edit",
    "seedream/5-pro-layer-decomposition": "Seedream 5 Pro Layer Decomposition",
    "seedream/4.5-text-to-image": "Seedream 4.5",
    "seedream/4.5-edit": "Seedream 4.5 Edit",

    "nano-banana-2-lite": "Nano Banana 2 Lite",
    "google/nano-banana": "Nano Banana",
    "google/nano-banana-edit": "Nano Banana Edit",

    "gpt-image/1.5-text-to-image": "GPT Image 1.5",
    "gpt-image/1.5-image-to-image": "GPT Image 1.5 Edit",

    "google/imagen4": "Imagen 4",
    "google/imagen4-fast": "Imagen 4 Fast",
    "google/imagen4-ultra": "Imagen 4 Ultra",

    "z-image": "Z-Image",

    "flux-2/flex-text-to-image": "Flux 2 Flex",
    "flux-2/flex-image-to-image": "Flux 2 Flex Edit",
    "flux-2/pro-text-to-image": "Flux 2 Pro",
    "flux-2/pro-image-to-image": "Flux 2 Pro Edit",

    "ideogram/v3-text-to-image": "Ideogram V3",
    "ideogram/v3-edit": "Ideogram V3 Edit",
    "ideogram/v3-remix": "Ideogram V3 Remix",
    "ideogram/character": "Ideogram Character",
    "ideogram/character-edit": "Ideogram Character Edit",
    "ideogram/character-remix": "Ideogram Character Remix",

    "recraft/crisp-upscale": "Recraft Crisp Upscale",
    "recraft/remove-background": "Recraft Remove Background",

    "topaz/image-upscale": "Topaz Image Upscale",

    "qwen/text-to-image": "Qwen Image",
    "qwen/image-to-image": "Qwen Image",
    "qwen/image-edit": "Qwen Image Edit",

    "gpt4o-image/generate": "GPT-4o Image",

    "flux-kontext-pro": "Flux Kontext Pro",
    "flux-kontext-max": "Flux Kontext Max",

    "sora-watermark-remover": "Sora Watermark Remover",

    "elevenlabs/text-to-speech-multilingual-v2": "Eleven Multilingual 2",
    "elevenlabs/text-to-speech-turbo-2-5": "Eleven Turbo 2.5",
    "elevenlabs/text-to-dialogue-v3": "Eleven Dialogue 3",

    "suno/generate": "Suno",
    "suno/extend": "Suno Extend",
    "suno/upload-cover": "Suno Cover",
    "suno/upload-extend": "Suno Extend",
    "suno/wav-generate": "Suno WAV",
    "suno/mp4-generate": "Suno MP4",
    "suno/lyrics": "Suno Lyrics",
    "suno/style-generate": "Suno Style",
    "suno/vocal-removal-generate": "Suno Vocal Removal",
    "suno/mashup-generate": "Suno Mashup",
    "suno/replace-music-section-generate": "Suno Replace Section",
    "suno/sounds-generate": "Suno Sounds",
    "suno/add-instrumental-generate": "Suno Add Instrumental",
    "suno/add-vocals-generate": "Suno Add Vocals",
    "suno/timestamped-lyrics": "Suno Timestamped Lyrics",
    "suno/cover-generate": "Suno Cover Image",
    "suno/persona-generate": "Suno Persona",
    "suno/midi-generate": "Suno MIDI",
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
    "grok-build-0.1": "Grok Build 0.1",
    "grok-code-fast-1": "Grok Build 0.1",
    "grok-code-fast": "Grok Build 0.1",
    "grok-code-fast-1-0825": "Grok Build 0.1",
    "grok-3": "Grok 3",
    "grok-4": "Grok 4",
    "grok-4-fast": "Grok 4 Fast",
    "grok-4-1-fast": "Grok 4.1 Fast",
    "grok-4.6": "Grok 4.6",
    "grok-imagine-video": "Grok Imagine Video",
    "grok-imagine-video-1.5": "Grok Imagine Video 1.5",
    "grok-imagine-video-1.5-preview": "Grok Imagine Video 1.5",
    "grok-imagine-image": "Grok Imagine Image",
    "grok-imagine-image-quality": "Grok Imagine Image Quality",
  },

  alibaba: {
    "qwen3.5-0.8b": "Qwen 3.5",
    "qwen3.6-plus": "Qwen 3.6 Plus",
    "qwen-image-2.0": "Qwen Image 2.0",
    "qwen-image-2.0-pro": "Qwen Image 2.0 Pro",
    "qwen-image-edit": "Qwen Image Edit",
    "qwen-image-edit-plus": "Qwen Image Edit Plus",
    "qwen-image-edit-max": "Qwen Image Edit Max",
    "wan2.7-image": "Wan 2.7 Image",
    "wan2.7-image-pro": "Wan 2.7 Image Pro",
    "wan2.7-i2v": "Wan 2.7",
    "wan2.7-videoedit": "Wan 2.7 Edit",
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

  fal: {
    "fal-ai/flux/dev": "FLUX.1 Dev",
    "fal-ai/flux/schnell": "FLUX.1 Schnell",
    "fal-ai/qwen-image": "Qwen Image",
    "fal-ai/qwen-image-edit": "Qwen Image Edit",
    "fal-ai/nano-banana": "Nano Banana",
    "fal-ai/nano-banana/edit": "Nano Banana Edit",
    "fal-ai/nano-banana-2": "Nano Banana 2",
    "fal-ai/nano-banana-2/edit": "Nano Banana 2 Edit",
    "fal-ai/nano-banana-pro": "Nano Banana Pro",
    "fal-ai/nano-banana-pro/edit": "Nano Banana Pro Edit",
    "fal-ai/bytedance/seedream/v5/lite/text-to-image": "Seedream 5",
    "fal-ai/bytedance/seedream/v5/lite/edit": "Seedream 5 Edit",
    "fal-ai/wan/v2.7/text-to-image": "Wan 2.7",
    "fal-ai/wan/v2.7/edit": "Wan 2.7 Edit",
    "fal-ai/wan/v2.7/pro/text-to-image": "Wan 2.7 Pro",
    "fal-ai/wan/v2.7/pro/edit": "Wan 2.7 Pro Edit",
    "xai/grok-imagine-image": "Grok Imagine",
    "xai/grok-imagine-image/edit": "Grok Imagine Edit",
    "fal-ai/hunyuan-image/v3/instruct/edit": "Hunyuan Image 3 Edit",
    "fal-ai/gpt-image-1.5": "GPT Image 1.5",
    "fal-ai/gpt-image-1.5/edit": "GPT Image 1.5 Edit",

    "blackforestlabs/flux-3/extend-video": "FLUX 3",
    "blackforestlabs/flux-3/first-last-frame-to-video": "FLUX 3",
    "blackforestlabs/flux-3/image-to-video": "FLUX 3",
    "blackforestlabs/flux-3/keyframes-to-video": "FLUX 3",
    "blackforestlabs/flux-3/text-to-video": "FLUX 3",

    "bytedance/seedance-2.0/text-to-video": "Seedance 2",
    "bytedance/seedance-2.0/image-to-video": "Seedance 2",
    "bytedance/seedance-2.0/reference-to-video": "Seedance 2",
    "bytedance/seedance-2.0/fast/text-to-video": "Seedance 2 Fast",
    "bytedance/seedance-2.0/fast/image-to-video": "Seedance 2 Fast",
    "bytedance/seedance-2.0/fast/reference-to-video": "Seedance 2 Fast",

    "fal-ai/wan/v2.7/text-to-video": "Wan 2.7",
    "fal-ai/wan/v2.7/image-to-video": "Wan 2.7",
    "fal-ai/wan/v2.7/reference-to-video": "Wan 2.7",
    "fal-ai/wan/v2.7/edit-video": "Wan 2.7 Edit",

    "fal-ai/kling-video/v3/pro/text-to-video": "Kling v3 Pro",
    "fal-ai/kling-video/v3/pro/image-to-video": "Kling v3 Pro",
    "fal-ai/kling-video/v3/standard/text-to-video": "Kling v3 Standard",
    "fal-ai/kling-video/v3/standard/image-to-video": "Kling v3 Standard",
    "fal-ai/kling-video/o3/4k/text-to-video": "Kling o3 4K",
    "fal-ai/kling-video/o3/4k/image-to-video": "Kling o3 4K",
    "fal-ai/kling-video/o3/4k/reference-to-video": "Kling o3 4K",

    "fal-ai/veo3.1": "Veo 3.1",
    "fal-ai/veo3.1/image-to-video": "Veo 3.1",

    "fal-ai/sora-2/text-to-video": "Sora 2",
    "fal-ai/sora-2/image-to-video": "Sora 2",

    "xai/grok-imagine-video/image-to-video": "Grok Imagine",
    "xai/grok-imagine-video/reference-to-video": "Grok Imagine",
    "xai/grok-imagine-video/extend-video": "Grok Extend",
  },

  googleflow: {
    "veo-3.1-quality": "Veo 3.1 Quality",
    "veo-3.1-fast": "Veo 3.1 Fast",
    "veo-3.1-lite": "Veo 3.1 Lite",
    "veo-3.1-lite-low-priority": "Veo 3.1 Lite Low Priority",
    "omni-flash": "Gemini Omni Flash",
  },
} as const;

export function modelDisplay<P extends SlugProviderId>(
  provider: P,
  model: SlugModelId<P>
): string {
  const display = (MODEL_DISPLAY[provider] as Record<string, string>)[
    model as string
  ];
  if (!display) {
    throw new Error(
      `No display name registered for ${String(provider)}/${String(model)} — add it to packages/provider/cost/src/slugs.ts`
    );
  }
  return display;
}
