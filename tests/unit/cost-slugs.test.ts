import { describe, it, expect } from "vitest";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";

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
      ])
    );
  });

  it("has kie models", () => {
    expect(MODEL_SLUGS.kie).toMatchObject({
      "bytedance/seedance-2": "sd2",
      "bytedance/seedance-2-fast": "sd2f",
      "kling-3.0/video": "kling3",
      "kling-3.0/video/std": "kling3s",
      "kling-3.0/video/pro": "kling3p",
      "kling-3.0/motion-control": "kling3mc",
      "wan/2-7-text-to-video": "wan2p7",
      "grok-imagine/text-to-video": "grok",
      "happyhorse/text-to-video": "hh",
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
      "wan2.7-image-pro": "wan2p7p",
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

  it("returns correct slug for alibaba qwen3.6-plus", () => {
    expect(modelSlug("alibaba", "qwen3.6-plus")).toBe("qwen3p6");
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
      "kling-3.0/video": "Kling 3.0",
      "kling-3.0/video/pro": "Kling 3.0 Pro",
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
