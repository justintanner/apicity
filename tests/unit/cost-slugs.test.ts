import { describe, it, expect } from "vitest";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { PRICING } from "../../packages/provider/cost/src/pricing/index";

describe("MODEL_SLUGS", () => {
  it("has all expected providers", () => {
    expect(Object.keys(MODEL_SLUGS)).toEqual(
      expect.arrayContaining([
        "kie",
        "kimicoding",
        "anthropic",
        "openai",
        "xai",
        "alibaba",
        "fireworks",
        "elevenlabs",
        "fal",
      ])
    );
  });

  it("has fal models keyed by endpoint id", () => {
    expect(MODEL_SLUGS.fal).toMatchObject({
      "fal-ai/flux/dev": "fluxd",
      "fal-ai/flux/schnell": "fluxs",
      "fal-ai/qwen-image": "qwenimg",
      "fal-ai/nano-banana": "nb",
      "fal-ai/nano-banana-2": "nb2",
      "fal-ai/nano-banana-pro": "nbp",
      "fal-ai/bytedance/seedream/v5/lite/text-to-image": "sd5",
    });
  });

  it("shares slugs with kie for models both providers resell", () => {
    expect(MODEL_SLUGS.fal["fal-ai/nano-banana"]).toBe(
      MODEL_SLUGS.kie["nano-banana"]
    );
    expect(
      MODEL_SLUGS.fal["fal-ai/bytedance/seedream/v5/lite/text-to-image"]
    ).toBe(MODEL_SLUGS.kie["seedream/5-lite-text-to-image"]);
    expect(MODEL_SLUGS.fal["fal-ai/bytedance/seedream/v5/lite/edit"]).toBe(
      MODEL_SLUGS.kie["seedream/5-lite-image-to-image"]
    );
    expect(MODEL_SLUGS.fal["xai/grok-imagine-image"]).toBe(
      MODEL_SLUGS.kie["grok-imagine/text-to-image"]
    );
    expect(MODEL_SLUGS.fal["xai/grok-imagine-image/edit"]).toBe(
      MODEL_SLUGS.kie["grok-imagine/image-to-image"]
    );
    expect(MODEL_SLUGS.fal["fal-ai/wan/v2.7/text-to-image"]).toBe(
      MODEL_SLUGS.kie["wan/2-7-image"]
    );
    expect(MODEL_SLUGS.fal["fal-ai/wan/v2.7/pro/text-to-image"]).toBe(
      MODEL_SLUGS.kie["wan/2-7-image-pro"]
    );
  });

  it("registers a slug for every fal pricing entry", () => {
    expect(Object.keys(MODEL_SLUGS.fal).sort()).toEqual(
      Object.keys(PRICING.fal).sort()
    );
  });

  it("has kie models", () => {
    expect(MODEL_SLUGS.kie).toMatchObject({
      "bytedance/seedance-2": "sd2",
      "bytedance/seedance-2-fast": "sd2f",
      "bytedance/seedance-2-mini": "sd2m",
      "kling-3.0/video": "kling3",
      "kling-3.0/video/std": "kling3s",
      "kling-3.0/video/pro": "kling3p",
      "kling-3.0/motion-control": "kling3mc",
      "kling/v3-turbo-image-to-video": "kling3t",
      "kling/v3-turbo-text-to-video": "kling3t",
      "wan/2-7-text-to-video": "wan2p7",
      "grok-imagine/text-to-video": "grok",
      "happyhorse/text-to-video": "hh",
      "happyhorse-1-1/text-to-video": "hh1p1",
      "minimax-h3/text-to-video": "mmh3",
      "minimax-h3/image-to-video": "mmh3",
      "minimax-h3/reference-to-video": "mmh3",
      "omnihuman-1-5": "oh1p5",
      "volcengine/video-to-video-lip-sync": "vlipsync",
      veo3: "veo3",
      veo3_fast: "veo3f",
      "nano-banana": "nb",
      "nano-banana-2": "nb2",
      "nano-banana-pro": "nbp",
      "suno/generate": "suno",
    });
  });

  it("has openai models", () => {
    expect(MODEL_SLUGS.openai).toMatchObject({
      "gpt-5": "gpt5",
      "gpt-5-mini": "gpt5m",
      "gpt-5-nano": "gpt5n",
      "gpt-4.1": "gpt4p1",
      "gpt-4o": "gpt4o",
      "gpt-4o-mini": "gpt4om",
      o3: "o3",
      "o4-mini": "o4m",
    });
  });

  it("has anthropic models", () => {
    expect(MODEL_SLUGS.anthropic).toMatchObject({
      "claude-opus-4": "opus4",
      "claude-sonnet-4": "sonnet4",
      "claude-haiku-3-5": "haiku3p5",
    });
  });

  it("has xai models", () => {
    expect(MODEL_SLUGS.xai).toMatchObject({
      "grok-build-0.1": "grokbuild01",
      "grok-code-fast-1": "grokbuild01",
      "grok-3": "grok3",
      "grok-4": "grok4",
      "grok-4-fast": "grok4f",
    });
  });

  it("has alibaba models", () => {
    expect(MODEL_SLUGS.alibaba).toMatchObject({
      "qwen3.5-0.8b": "qwen3p5",
      "qwen3.6-plus": "qwen3p6",
      "qwen-image-2.0": "qwen2",
      "wan2.7-image": "wan2p7",
      "wan2.7-image-pro": "wan2p7p",
      "wan2.7-i2v": "wan2p7",
      "wan2.7-videoedit": "wan2p7",
    });
  });

  it("has fireworks models", () => {
    expect(MODEL_SLUGS.fireworks).toMatchObject({
      "deepseek-v3": "ds3",
      "deepseek-v4-pro": "ds4p",
      "glm-5": "glm5",
      "kimi-k2.6": "kimi2p6",
    });
  });

  it("has elevenlabs models", () => {
    expect(MODEL_SLUGS.elevenlabs).toMatchObject({
      eleven_flash_v2_5: "elf2p5",
      eleven_turbo_v2_5: "elt2p5",
      eleven_multilingual_v2: "elml2",
      eleven_multilingual_v3: "elml3",
    });
  });

  it("has kimicoding models", () => {
    expect(MODEL_SLUGS.kimicoding).toMatchObject({
      "kimi-k2": "kimi2",
      "kimi-k2.5": "kimi2p5",
      "kimi-k2.6": "kimi2p6",
    });
  });
});

describe("modelSlug", () => {
  it("returns correct slug for openai gpt-5", () => {
    expect(modelSlug("openai", "gpt-5")).toBe("gpt5");
  });

  it("returns correct slug for anthropic claude-opus-4", () => {
    expect(modelSlug("anthropic", "claude-opus-4")).toBe("opus4");
  });

  it("returns correct slug for xai grok-4", () => {
    expect(modelSlug("xai", "grok-4")).toBe("grok4");
  });

  it("returns shared slug for xai grok build aliases", () => {
    expect(modelSlug("xai", "grok-build-0.1")).toBe("grokbuild01");
    expect(modelSlug("xai", "grok-code-fast-1")).toBe("grokbuild01");
  });

  it("returns correct slug for kie veo3", () => {
    expect(modelSlug("kie", "veo3")).toBe("veo3");
  });

  it("returns correct slug for kie veo3_fast", () => {
    expect(modelSlug("kie", "veo3_fast")).toBe("veo3f");
  });

  it("returns shared slug for kie Kling 3.0 Turbo variants", () => {
    expect(modelSlug("kie", "kling/v3-turbo-image-to-video")).toBe("kling3t");
    expect(modelSlug("kie", "kling/v3-turbo-text-to-video")).toBe("kling3t");
  });

  it("resolves kie lip-sync models without throwing", () => {
    expect(() => modelSlug("kie", "omnihuman-1-5")).not.toThrow();
    expect(modelSlug("kie", "omnihuman-1-5")).toBe("oh1p5");
    expect(modelSlug("kie", "volcengine/video-to-video-lip-sync")).toBe(
      "vlipsync"
    );
  });

  it("returns correct slug for alibaba qwen3.6-plus", () => {
    expect(modelSlug("alibaba", "qwen3.6-plus")).toBe("qwen3p6");
  });

  it("shares Wan 2.7 image slugs across Alibaba and KIE", () => {
    expect(modelSlug("alibaba", "wan2.7-image")).toBe(
      modelSlug("kie", "wan/2-7-image")
    );
    expect(modelSlug("alibaba", "wan2.7-image-pro")).toBe(
      modelSlug("kie", "wan/2-7-image-pro")
    );
  });

  it("returns distinct slugs for xai grok imagine media models", () => {
    expect(modelSlug("xai", "grok-imagine-video")).toBe("grokimgv");
    expect(modelSlug("xai", "grok-imagine-video-1.5")).toBe("grokimgv1p5");
    // The preview id is the same model variant, so it shares the slug.
    expect(modelSlug("xai", "grok-imagine-video-1.5-preview")).toBe(
      "grokimgv1p5"
    );
    expect(modelSlug("xai", "grok-imagine-image")).toBe("grokimgi");
    expect(modelSlug("xai", "grok-imagine-image-quality")).toBe("grokimgiq");
  });

  it("returns correct slug for fireworks deepseek-v3", () => {
    expect(modelSlug("fireworks", "deepseek-v3")).toBe("ds3");
  });

  it("returns correct slug for elevenlabs eleven_flash_v2_5", () => {
    expect(modelSlug("elevenlabs", "eleven_flash_v2_5")).toBe("elf2p5");
  });

  it("returns correct slug for kimicoding kimi-k2.6", () => {
    expect(modelSlug("kimicoding", "kimi-k2.6")).toBe("kimi2p6");
  });

  it("throws for unknown provider", () => {
    expect(() =>
      // @ts-expect-error — testing invalid input
      modelSlug("unknown-provider", "some-model")
    ).toThrow();
  });

  it("throws for unknown model within valid provider", () => {
    expect(() =>
      // @ts-expect-error — testing invalid input
      modelSlug("openai", "nonexistent-model")
    ).toThrow(/No slug registered/);
  });

  it("throws message includes provider and model", () => {
    expect(() =>
      // @ts-expect-error — testing invalid input
      modelSlug("openai", "fake-model")
    ).toThrow(
      "No slug registered for openai/fake-model — add it to packages/provider/cost/src/slugs.ts"
    );
  });
});

describe("MODEL_DISPLAY", () => {
  it("mirrors MODEL_SLUGS provider keys", () => {
    expect(Object.keys(MODEL_DISPLAY)).toEqual(Object.keys(MODEL_SLUGS));
  });

  it("has openai display names", () => {
    expect(MODEL_DISPLAY.openai).toMatchObject({
      "gpt-5": "GPT-5",
      "gpt-5-mini": "GPT-5 Mini",
      "gpt-5-nano": "GPT-5 Nano",
      "gpt-4.1": "GPT-4.1",
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini",
      o3: "o3",
      "o4-mini": "o4 Mini",
    });
  });

  it("has kie display names", () => {
    expect(MODEL_DISPLAY.kie).toMatchObject({
      "bytedance/seedance-2": "Seedance 2",
      "bytedance/seedance-2-mini": "Seedance 2 Mini",
      "kling-3.0/video": "Kling 3.0",
      "kling-3.0/video/pro": "Kling 3.0 Pro",
      "kling/v3-turbo-image-to-video": "Kling 3.0 Turbo",
      "kling/v3-turbo-text-to-video": "Kling 3.0 Turbo",
      "happyhorse-1-1/text-to-video": "HappyHorse 1.1",
      "minimax-h3/text-to-video": "MiniMax H3",
      "minimax-h3/image-to-video": "MiniMax H3",
      "minimax-h3/reference-to-video": "MiniMax H3",
      "omnihuman-1-5": "OmniHuman 1.5",
      "volcengine/video-to-video-lip-sync": "Volcengine Lip Sync",
      veo3: "Veo 3",
      veo3_fast: "Veo 3 Fast",
      "suno/generate": "Suno",
    });
  });

  it("has anthropic display names", () => {
    expect(MODEL_DISPLAY.anthropic).toMatchObject({
      "claude-opus-4": "Claude Opus 4",
      "claude-sonnet-4": "Claude Sonnet 4",
      "claude-haiku-3-5": "Claude Haiku 3.5",
    });
  });

  it("has xai display names", () => {
    expect(MODEL_DISPLAY.xai).toMatchObject({
      "grok-build-0.1": "Grok Build 0.1",
      "grok-code-fast-1": "Grok Build 0.1",
      "grok-3": "Grok 3",
      "grok-4": "Grok 4",
      "grok-4-fast": "Grok 4 Fast",
    });
  });

  it("has elevenlabs display names", () => {
    expect(MODEL_DISPLAY.elevenlabs).toMatchObject({
      eleven_flash_v2_5: "Eleven Flash 2.5",
      eleven_turbo_v2_5: "Eleven Turbo 2.5",
      eleven_multilingual_v2: "Eleven Multilingual 2",
    });
  });

  it("has fal display names", () => {
    expect(MODEL_DISPLAY.fal).toMatchObject({
      "fal-ai/flux/dev": "FLUX.1 Dev",
      "fal-ai/nano-banana": "Nano Banana",
      "fal-ai/nano-banana/edit": "Nano Banana Edit",
      "fal-ai/nano-banana-pro": "Nano Banana Pro",
      "fal-ai/bytedance/seedream/v5/lite/text-to-image": "Seedream 5",
    });
  });

  it("every model in SLUGS has a matching display entry", () => {
    for (const [provider, models] of Object.entries(MODEL_SLUGS)) {
      for (const model of Object.keys(models)) {
        expect(
          (MODEL_DISPLAY as Record<string, Record<string, string>>)[provider]?.[
            model
          ]
        ).toBeDefined();
      }
    }
  });
});

describe("modelDisplay", () => {
  it("returns correct display for openai gpt-5", () => {
    expect(modelDisplay("openai", "gpt-5")).toBe("GPT-5");
  });

  it("returns correct display for anthropic claude-opus-4", () => {
    expect(modelDisplay("anthropic", "claude-opus-4")).toBe("Claude Opus 4");
  });

  it("returns correct display for xai grok-4-fast", () => {
    expect(modelDisplay("xai", "grok-4-fast")).toBe("Grok 4 Fast");
  });

  it("returns correct display for xai grok imagine media models", () => {
    expect(modelDisplay("xai", "grok-imagine-video")).toBe(
      "Grok Imagine Video"
    );
    expect(modelDisplay("xai", "grok-imagine-image")).toBe(
      "Grok Imagine Image"
    );
  });

  it("returns correct display for kie veo3", () => {
    expect(modelDisplay("kie", "veo3")).toBe("Veo 3");
  });

  it("returns correct display for alibaba qwen3.6-plus", () => {
    expect(modelDisplay("alibaba", "qwen3.6-plus")).toBe("Qwen 3.6 Plus");
  });

  it("returns correct display for fireworks deepseek-v4-pro", () => {
    expect(modelDisplay("fireworks", "deepseek-v4-pro")).toBe(
      "DeepSeek V4 Pro"
    );
  });

  it("returns correct display for elevenlabs eleven_multilingual_v3", () => {
    expect(modelDisplay("elevenlabs", "eleven_multilingual_v3")).toBe(
      "Eleven Multilingual 3"
    );
  });

  it("throws for unknown provider", () => {
    expect(() =>
      // @ts-expect-error — testing invalid input
      modelDisplay("unknown-provider", "some-model")
    ).toThrow();
  });

  it("throws for unknown model within valid provider", () => {
    expect(() =>
      // @ts-expect-error — testing invalid input
      modelDisplay("openai", "nonexistent-model")
    ).toThrow(/No display name registered/);
  });

  it("throws message includes provider and model", () => {
    expect(() =>
      // @ts-expect-error — testing invalid input
      modelDisplay("openai", "fake-model")
    ).toThrow(
      "No display name registered for openai/fake-model — add it to packages/provider/cost/src/slugs.ts"
    );
  });
});

describe("googleflow slugs", () => {
  const models = [
    "veo-3.1-quality",
    "veo-3.1-fast",
    "veo-3.1-lite",
    "veo-3.1-lite-low-priority",
    "omni-flash",
  ] as const;

  it("resolves a slug for every registered Google Flow model", () => {
    for (const model of models) {
      expect(modelSlug("googleflow", model), model).toBeTruthy();
    }
    expect(modelSlug("googleflow", "veo-3.1-quality")).toBe("veo3p1q");
    expect(modelSlug("googleflow", "veo-3.1-fast")).toBe("veo3p1f");
    expect(modelSlug("googleflow", "veo-3.1-lite")).toBe("veo3p1l");
    expect(modelSlug("googleflow", "veo-3.1-lite-low-priority")).toBe(
      "veo3p1llp"
    );
  });

  it("shares the gemini omni slug with kie's gemini-omni-video", () => {
    expect(modelSlug("googleflow", "omni-flash")).toBe(
      modelSlug("kie", "gemini-omni-video")
    );
  });

  it("resolves a display name for every registered Google Flow model", () => {
    for (const model of models) {
      expect(modelDisplay("googleflow", model), model).toBeTruthy();
    }
    expect(modelDisplay("googleflow", "veo-3.1-quality")).toBe(
      "Veo 3.1 Quality"
    );
    expect(modelDisplay("googleflow", "omni-flash")).toBe("Gemini Omni Flash");
  });

  it("keys MODEL_SLUGS.googleflow exactly to MODEL_DISPLAY.googleflow", () => {
    expect(Object.keys(MODEL_DISPLAY.googleflow)).toEqual(
      Object.keys(MODEL_SLUGS.googleflow)
    );
  });
});

// Slug + display coverage for the keys the 2026-08-06 kie pricing pull added
// (REQ-007). Variants of one product share the family slug; the op — extend,
// resolution upgrade — is metadata, per the grammar at the top of slugs.ts.
describe("kie pricing-refresh slugs (REQ-007)", () => {
  it.each([
    { model: "veo3_lite", slug: "veo3l", display: "Veo 3 Lite" },
    { model: "veo/extend", slug: "veo3", display: "Veo 3 Extend" },
    {
      model: "veo/get-1080p-video",
      slug: "veo3",
      display: "Veo 3 1080p Upgrade",
    },
    { model: "veo/get-4k-video", slug: "veo3", display: "Veo 3 4K Upgrade" },
    { model: "runway/generate", slug: "runway", display: "Runway" },
    { model: "runway/extend", slug: "runway", display: "Runway Extend" },
    { model: "aleph/generate", slug: "aleph", display: "Runway Aleph" },
    { model: "gpt4o-image/generate", slug: "gi4o", display: "GPT-4o Image" },
    {
      model: "flux-kontext-pro",
      slug: "fluxkp",
      display: "Flux Kontext Pro",
    },
    {
      model: "flux-kontext-max",
      slug: "fluxkm",
      display: "Flux Kontext Max",
    },
    {
      model: "suno/timestamped-lyrics",
      slug: "suno",
      display: "Suno Timestamped Lyrics",
    },
    {
      model: "suno/cover-generate",
      slug: "suno",
      display: "Suno Cover Image",
    },
    { model: "suno/persona-generate", slug: "suno", display: "Suno Persona" },
    { model: "suno/midi-generate", slug: "suno", display: "Suno MIDI" },
    // createTask image families (WI-4).
    {
      model: "seedream/5-pro-text-to-image",
      slug: "sd5p",
      display: "Seedream 5 Pro",
    },
    {
      model: "seedream/5-pro-image-to-image",
      slug: "sd5p",
      display: "Seedream 5 Pro Edit",
    },
    {
      model: "seedream/4.5-text-to-image",
      slug: "sd4p5",
      display: "Seedream 4.5",
    },
    { model: "seedream/4.5-edit", slug: "sd4p5", display: "Seedream 4.5 Edit" },
    {
      model: "nano-banana-2-lite",
      slug: "nb2l",
      display: "Nano Banana 2 Lite",
    },
    { model: "google/nano-banana", slug: "nb", display: "Nano Banana" },
    {
      model: "google/nano-banana-edit",
      slug: "nb",
      display: "Nano Banana Edit",
    },
    {
      model: "gpt-image/1.5-text-to-image",
      slug: "gi1p5",
      display: "GPT Image 1.5",
    },
    {
      model: "gpt-image/1.5-image-to-image",
      slug: "gi1p5",
      display: "GPT Image 1.5 Edit",
    },
    { model: "google/imagen4", slug: "imagen4", display: "Imagen 4" },
    {
      model: "google/imagen4-fast",
      slug: "imagen4f",
      display: "Imagen 4 Fast",
    },
    {
      model: "google/imagen4-ultra",
      slug: "imagen4u",
      display: "Imagen 4 Ultra",
    },
    { model: "z-image", slug: "zimg", display: "Z-Image" },
    {
      model: "flux-2/flex-text-to-image",
      slug: "flux2f",
      display: "Flux 2 Flex",
    },
    {
      model: "flux-2/flex-image-to-image",
      slug: "flux2f",
      display: "Flux 2 Flex Edit",
    },
    {
      model: "flux-2/pro-text-to-image",
      slug: "flux2p",
      display: "Flux 2 Pro",
    },
    {
      model: "flux-2/pro-image-to-image",
      slug: "flux2p",
      display: "Flux 2 Pro Edit",
    },
    {
      model: "ideogram/v3-text-to-image",
      slug: "ideo3",
      display: "Ideogram V3",
    },
    { model: "ideogram/v3-edit", slug: "ideo3", display: "Ideogram V3 Edit" },
    { model: "ideogram/v3-remix", slug: "ideo3", display: "Ideogram V3 Remix" },
    {
      model: "ideogram/character",
      slug: "ideochar",
      display: "Ideogram Character",
    },
    {
      model: "ideogram/character-edit",
      slug: "ideochar",
      display: "Ideogram Character Edit",
    },
    {
      model: "ideogram/character-remix",
      slug: "ideochar",
      display: "Ideogram Character Remix",
    },
    {
      model: "recraft/crisp-upscale",
      slug: "recraftcu",
      display: "Recraft Crisp Upscale",
    },
    {
      model: "recraft/remove-background",
      slug: "recraftrb",
      display: "Recraft Remove Background",
    },
    {
      model: "topaz/image-upscale",
      slug: "topazimg",
      display: "Topaz Image Upscale",
    },
    { model: "qwen/text-to-image", slug: "qwenimg", display: "Qwen Image" },
    { model: "qwen/image-to-image", slug: "qwenimg", display: "Qwen Image" },
    {
      model: "qwen/image-edit",
      slug: "qwenimg",
      display: "Qwen Image Edit",
    },
  ])(
    "resolves $model through modelSlug/modelDisplay",
    ({ model, slug, display }) => {
      expect(modelSlug("kie", model as never)).toBe(slug);
      expect(modelDisplay("kie", model as never)).toBe(display);
    }
  );

  // Cross-provider parity: kie and fal run the same upstream models, so the
  // same model must not get two different slugs.
  it.each([
    { kieModel: "qwen/text-to-image", falModel: "fal-ai/qwen-image" },
    { kieModel: "qwen/image-edit", falModel: "fal-ai/qwen-image-edit" },
    {
      kieModel: "gpt-image/1.5-text-to-image",
      falModel: "fal-ai/gpt-image-1.5",
    },
    { kieModel: "google/nano-banana", falModel: "fal-ai/nano-banana" },
  ])(
    "shares $kieModel's slug with fal's $falModel",
    ({ kieModel, falModel }) => {
      expect(modelSlug("kie", kieModel as never)).toBe(
        modelSlug("fal", falModel as never)
      );
    }
  );

  // Same rule against the elevenlabs provider: kie resells these two TTS
  // models, so the resold key must not mint a second slug for them.
  it.each([
    {
      kieModel: "elevenlabs/text-to-speech-multilingual-v2",
      elevenlabsModel: "eleven_multilingual_v2",
    },
    {
      kieModel: "elevenlabs/text-to-speech-turbo-2-5",
      elevenlabsModel: "eleven_turbo_v2_5",
    },
  ])(
    "shares $kieModel's slug with elevenlabs' $elevenlabsModel",
    ({ kieModel, elevenlabsModel }) => {
      expect(modelSlug("kie", kieModel as never)).toBe(
        modelSlug("elevenlabs", elevenlabsModel as never)
      );
    }
  );

  it.each([
    {
      model: "hailuo/02-text-to-video-standard",
      slug: "hailuo02s",
      display: "Hailuo 02",
    },
    {
      model: "hailuo/02-image-to-video-standard",
      slug: "hailuo02s",
      display: "Hailuo 02",
    },
    {
      model: "hailuo/02-text-to-video-pro",
      slug: "hailuo02p",
      display: "Hailuo 02 Pro",
    },
    {
      model: "hailuo/02-image-to-video-pro",
      slug: "hailuo02p",
      display: "Hailuo 02 Pro",
    },
    {
      model: "hailuo/2-3-image-to-video-standard",
      slug: "hailuo2p3s",
      display: "Hailuo 2.3",
    },
    {
      model: "hailuo/2-3-image-to-video-pro",
      slug: "hailuo2p3p",
      display: "Hailuo 2.3 Pro",
    },
  ])(
    "resolves $model through modelSlug/modelDisplay",
    ({ model, slug, display }) => {
      expect(modelSlug("kie", model as never)).toBe(slug);
      expect(modelDisplay("kie", model as never)).toBe(display);
    }
  );

  // REQ-007 repo-wide, in one walk: every priced kie model must resolve
  // through BOTH resolvers, which throw rather than fall back. This is a
  // superset relation, not equality — MODEL_SLUGS deliberately carries extra
  // keys (e.g. the "kling-3.0/video/std" variant spellings) that no pricing
  // key names.
  it("resolves every PRICING.kie key through modelSlug and modelDisplay", () => {
    const unresolved: string[] = [];
    for (const model of Object.keys(PRICING.kie)) {
      try {
        expect(modelSlug("kie", model as never)).toBeTruthy();
        expect(modelDisplay("kie", model as never)).toBeTruthy();
      } catch {
        unresolved.push(model);
      }
    }
    expect(unresolved, "kie priced-but-unslugged").toEqual([]);

    // The registries are a superset of the pricing table, never the reverse.
    for (const model of Object.keys(PRICING.kie)) {
      expect(
        (MODEL_SLUGS.kie as Record<string, string>)[model],
        `${model} slug`
      ).toBeDefined();
      expect(
        (MODEL_DISPLAY.kie as Record<string, string>)[model],
        `${model} display`
      ).toBeDefined();
    }
  });
});
