import { describe, it, expect } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { PRICING_AS_OF } from "../../packages/provider/cost/src/pricing/index";

describe("computeEstimate", () => {
  describe("token-billed providers", () => {
    it("estimates openai chat with messages", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-5",
          messages: [{ role: "user", content: "hello world" }],
          max_tokens: 100,
        },
      };
      const result = computeEstimate(req);
      expect(result.ok).toBeUndefined(); // CostEstimate has no ok field
      expect(result.usd).toBeGreaterThan(0);
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("tokens-heuristic+table");
      expect(result.breakdown.unit).toBe("tokens");
      expect(result.breakdown.inputTokens).toBeGreaterThan(0);
      expect(result.breakdown.outputTokens).toBe(100);
      expect(result.breakdown.inputUsdPerMillion).toBe(1.25);
      expect(result.breakdown.outputUsdPerMillion).toBe(10);
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe(PRICING_AS_OF);
    });

    it("estimates openai with responses payload (input string)", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-4o-mini",
          input: "Short prompt",
          max_output_tokens: 50,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.breakdown.inputTokens).toBeGreaterThan(0);
      expect(result.breakdown.outputTokens).toBe(50);
      expect(result.breakdown.inputUsdPerMillion).toBe(0.15);
      expect(result.breakdown.outputUsdPerMillion).toBe(0.6);
      expect(result.warnings).toEqual([]);
    });

    it("estimates openai with instructions field", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-5",
          instructions: "Be helpful",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 20,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    });

    it("warns when maxOutputTokens is missing for openai", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-5",
          messages: [{ role: "user", content: "hello" }],
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThanOrEqual(0);
      expect(result.warnings).toContain(
        "maxOutputTokens not provided; output cost not included in estimate"
      );
      expect(result.breakdown.outputTokens).toBe(0);
    });

    it("fails for unknown openai model", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "unknown-model",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 10,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "model 'unknown-model' not found in pricing table for provider 'openai'"
      );
    });

    it("estimates anthropic with messages and system", () => {
      const req = {
        provider: "anthropic" as const,
        payload: {
          model: "claude-opus-4-7",
          system: "You are a helpful assistant",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 200,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.source).toBe("tokens-heuristic+table");
      expect(result.breakdown.inputUsdPerMillion).toBe(5);
      expect(result.breakdown.outputUsdPerMillion).toBe(25);
      expect(result.warnings).toEqual([]);
    });

    it("estimates anthropic with system as array of blocks", () => {
      const req = {
        provider: "anthropic" as const,
        payload: {
          model: "claude-sonnet-4",
          system: [{ type: "text", text: "System prompt" }],
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 50,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    });

    it("fails for anthropic when model is missing", () => {
      const req = {
        provider: "anthropic" as const,
        payload: {
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 10,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain("anthropic: payload.model is required");
    });

    it("estimates xai with messages", () => {
      const req = {
        provider: "xai" as const,
        payload: {
          model: "grok-4",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 100,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.breakdown.inputUsdPerMillion).toBe(3);
      expect(result.breakdown.outputUsdPerMillion).toBe(15);
      expect(result.warnings).toEqual([]);
    });

    it("estimates xai with text field (tokenize-text)", () => {
      const req = {
        provider: "xai" as const,
        payload: {
          model: "grok-3",
          text: "hello world",
          max_tokens: 50,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    });

    it("estimates xai with prompt field", () => {
      const req = {
        provider: "xai" as const,
        payload: {
          model: "grok-4-fast",
          prompt: "hello world",
          max_tokens: 50,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.breakdown.inputUsdPerMillion).toBe(0.2);
      expect(result.breakdown.outputUsdPerMillion).toBe(0.5);
      expect(result.warnings).toEqual([]);
    });

    it("estimates alibaba with messages", () => {
      const req = {
        provider: "alibaba" as const,
        payload: {
          model: "qwen3.6-plus",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 100,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.source).toBe("tokens-heuristic+table");
      expect(result.breakdown.inputUsdPerMillion).toBe(0.325);
      expect(result.breakdown.outputUsdPerMillion).toBe(1.95);
      expect(result.warnings).toEqual([]);
    });

    it("estimates alibaba with prompt field", () => {
      const req = {
        provider: "alibaba" as const,
        payload: {
          model: "qwen3.5-0.8b",
          prompt: "hello world",
          max_tokens: 50,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.breakdown.inputUsdPerMillion).toBe(0.01);
      expect(result.breakdown.outputUsdPerMillion).toBe(0.04);
      expect(result.warnings).toEqual([]);
    });

    it("estimates kimicoding with messages", () => {
      const req = {
        provider: "kimicoding" as const,
        payload: {
          model: "kimi-k2.6",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 100,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.breakdown.inputUsdPerMillion).toBe(0.95);
      expect(result.breakdown.outputUsdPerMillion).toBe(4);
      expect(result.warnings).toEqual([]);
    });

    it("estimates fireworks with messages", () => {
      const req = {
        provider: "fireworks" as const,
        payload: {
          model: "deepseek-v3",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 100,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      expect(result.breakdown.inputUsdPerMillion).toBe(0.56);
      expect(result.breakdown.outputUsdPerMillion).toBe(1.68);
      expect(result.warnings).toEqual([]);
    });

    it("fails when model is missing for token provider", () => {
      const req = {
        provider: "alibaba" as const,
        payload: {
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 10,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain("alibaba: payload.model is required");
    });

    it("includes image content in token count (text only)", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-5",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "hello" },
                {
                  type: "image_url",
                  image_url: { url: "https://example.com/image.png" },
                },
              ],
            },
          ],
          max_tokens: 50,
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeGreaterThan(0);
      // Only text should be counted, image skipped
      expect(result.breakdown.inputTokens).toBe(Math.ceil("hello".length / 4));
      expect(result.warnings).toEqual([]);
    });
  });

  describe("per-unit providers", () => {
    it("estimates kie veo3 by duration", () => {
      const req = {
        provider: "kie" as const,
        payload: { model: "veo3", duration: 10 },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(3); // 10 seconds * 0.3
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 10,
        unit: "seconds",
        perUnitUsd: 0.3,
      });
      expect(result.warnings).toEqual([]);
    });

    it("estimates kie kling-3.0/video with mode selector", () => {
      const req = {
        provider: "kie" as const,
        payload: {
          model: "kling-3.0/video",
          input: { duration: 5, mode: "std" },
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeCloseTo(0.35, 10); // 5 * 0.07
      expect(result.source).toBe("per-unit-table");
      expect(result.warnings).toEqual([]);
    });

    it("estimates kie kling-3.0/video with sound variant", () => {
      const req = {
        provider: "kie" as const,
        payload: {
          model: "kling-3.0/video",
          input: { duration: 5, mode: "std", sound: true },
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0.5); // 5 * 0.1
      expect(result.warnings).toEqual([]);
    });

    it("fails kie when no rate matches variant", () => {
      const req = {
        provider: "kie" as const,
        payload: {
          model: "kling-3.0/video",
          input: { duration: 5, mode: "unknown-mode" },
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "kie 'kling-3.0/video': no rate for variant 'unknown-mode' (selectors: mode, sound)"
      );
    });

    it("estimates elevenlabs by characters", () => {
      const req = {
        provider: "elevenlabs" as const,
        payload: {
          model: "eleven_flash_v2_5",
          text: "Hello world",
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0.00066); // 11 chars * 0.00006
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 11,
        unit: "characters",
        perUnitUsd: 0.00006,
      });
      expect(result.warnings).toEqual([]);
    });

    it("fails elevenlabs when text is missing", () => {
      const req = {
        provider: "elevenlabs" as const,
        payload: {
          model: "eleven_flash_v2_5",
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "elevenlabs 'eleven_flash_v2_5': could not derive units from payload (check duration / text)"
      );
    });

    it("estimates fal nano-banana per image via the endpoint key", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/nano-banana",
        payload: { prompt: "a cat" },
      });
      expect(result.usd).toBe(0.039);
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "images",
        perUnitUsd: 0.039,
      });
      expect(result.rateAsOf).toBe("2026-07-20");
      expect(result.warnings).toEqual([]);
    });

    it("scales fal per-image cost by num_images", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/nano-banana",
        payload: { prompt: "a cat", num_images: 4 },
      });
      expect(result.usd).toBeCloseTo(0.156, 10); // 4 * 0.039
      expect(result.breakdown.units).toBe(4);
    });

    it("selects the fal nano-banana-2 rate by resolution", () => {
      const at = (resolution?: string) =>
        computeEstimate({
          provider: "fal" as const,
          endpoint: "fal-ai/nano-banana-2",
          payload: resolution ? { resolution } : {},
        }).usd;
      expect(at()).toBe(0.08); // defaults to 1K
      expect(at("0.5K")).toBe(0.06);
      expect(at("2K")).toBe(0.12);
      expect(at("4K")).toBe(0.16);
    });

    it("fails fal when no rate matches the resolution variant", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/nano-banana-2",
        payload: { resolution: "8K" },
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "fal 'fal-ai/nano-banana-2': no rate for variant '8K' (selectors: resolution)"
      );
    });

    it("estimates fal flux/dev by megapixels from an explicit image_size", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/flux/dev",
        payload: { image_size: { width: 2048, height: 2048 } },
      });
      // 2048*2048 = 4.19 MP, rounded up to 5 whole megapixels
      expect(result.usd).toBeCloseTo(0.125, 10);
      expect(result.breakdown).toEqual({
        units: 5,
        unit: "megapixels",
        perUnitUsd: 0.025,
      });
    });

    it("resolves fal image_size presets and assumes 1 MP when omitted", () => {
      const preset = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/flux/schnell",
        payload: { image_size: "landscape_16_9", num_images: 2 },
      });
      // 1024*576 = 0.59 MP → 1 MP per image, 2 images
      expect(preset.breakdown.units).toBe(2);
      expect(preset.usd).toBeCloseTo(0.006, 10);

      const omitted = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/flux/schnell",
        payload: {},
      });
      expect(omitted.breakdown.units).toBe(1);
      expect(omitted.usd).toBe(0.003);
    });

    it("fails fal when image_size is present but unrecognized", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/flux/dev",
        payload: { image_size: "ultrawide_42_9" },
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "fal 'fal-ai/flux/dev': could not derive units from payload (check duration / text)"
      );
    });

    it("fails fal for an endpoint with no bundled rate", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/not-a-real-model",
        payload: {},
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "model 'fal-ai/not-a-real-model' not found in pricing table for provider 'fal'"
      );
    });

    it("fails fal when the endpoint discriminator is missing", () => {
      const result = computeEstimate({
        provider: "fal" as const,
        payload: { prompt: "a cat" },
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "fal: endpoint or payload.model is required"
      );
    });

    it("estimates elevenlabs with model_id field", () => {
      const req = {
        provider: "elevenlabs" as const,
        payload: {
          model_id: "eleven_turbo_v2_5",
          text: "Test",
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0.00024); // 4 * 0.00006
      expect(result.warnings).toEqual([]);
    });

    it("estimates xai video by duration when the endpoint discriminator is set", () => {
      const req = {
        provider: "xai" as const,
        endpoint: "v1.videos.generations",
        payload: {
          model: "grok-imagine-video",
          prompt: "a cat on a rooftop",
          duration: 10,
          resolution: "720p",
        },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeCloseTo(0.5, 10); // 10 seconds * 0.05
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 10,
        unit: "seconds",
        perUnitUsd: 0.05,
      });
      expect(result.warnings).toEqual([]);
    });

    it("prices xai video 1.5 above the base video model", () => {
      const req = {
        provider: "xai" as const,
        endpoint: "v1.videos.generations",
        payload: { model: "grok-imagine-video-1.5", duration: 5 },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeCloseTo(0.4, 10); // 5 seconds * 0.08
      expect(result.breakdown.unit).toBe("seconds");
    });

    it("estimates xai images per generation, scaling with n", () => {
      const req = {
        provider: "xai" as const,
        endpoint: "v1.images.generations",
        payload: { model: "grok-imagine-image", prompt: "a red apple", n: 3 },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeCloseTo(0.06, 10); // 3 generations * 0.02
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 3,
        unit: "generations",
        perUnitUsd: 0.02,
      });
      expect(result.warnings).toEqual([]);
    });

    it("defaults xai image units to a single generation when n is omitted", () => {
      const req = {
        provider: "xai" as const,
        endpoint: "v1.images.edits",
        payload: { model: "grok-imagine-image-quality" },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBeCloseTo(0.05, 10); // 1 generation * 0.05
      expect(result.breakdown.units).toBe(1);
    });

    it("warns when an xai video payload carries no duration", () => {
      const req = {
        provider: "xai" as const,
        endpoint: "v1.videos.edits",
        payload: { model: "grok-imagine-video" },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "xai 'grok-imagine-video': could not derive units from payload (check duration / text)"
      );
    });

    it("keeps xai token pricing on non-media endpoints", () => {
      const req = {
        provider: "xai" as const,
        endpoint: "v1.chat.completions",
        payload: {
          model: "grok-4",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 100,
        },
      };
      const result = computeEstimate(req);
      expect(result.source).toBe("tokens-heuristic+table");
      expect(result.breakdown.inputUsdPerMillion).toBe(3);
      expect(result.breakdown.outputUsdPerMillion).toBe(15);
      expect(result.warnings).toEqual([]);
    });

    // Review finding R-3: routing is derived from the pricing entry's own
    // `kind`, so a media model prices per-unit whether or not the caller
    // supplies `endpoint`. The earlier revision gated on a hand-maintained
    // endpoint allowlist and returned 0 with a warning here.
    it("prices an xai media model without the endpoint discriminator", () => {
      const req = {
        provider: "xai" as const,
        payload: { model: "grok-imagine-video", duration: 10 },
      };
      const result = computeEstimate(req);
      expect(result.source).toBe("per-unit-table");
      expect(result.usd).toBeCloseTo(0.5);
      expect(result.warnings).toEqual([]);
    });

    it("prices an xai media model identically with and without endpoint", () => {
      const payload = { model: "grok-imagine-video", duration: 10 };
      const withEndpoint = computeEstimate({
        provider: "xai" as const,
        endpoint: "v1.videos.generations",
        payload,
      });
      const without = computeEstimate({ provider: "xai" as const, payload });
      expect(withEndpoint.usd).toBe(without.usd);
      expect(withEndpoint.source).toBe(without.source);
    });

    it("fails per-unit when model is missing", () => {
      const req = {
        provider: "kie" as const,
        payload: { duration: 10 },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "kie: endpoint or payload.model is required"
      );
    });

    it("fails per-unit when model not found in pricing table", () => {
      const req = {
        provider: "kie" as const,
        payload: { model: "nonexistent-model" },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "model 'nonexistent-model' not found in pricing table for provider 'kie'"
      );
    });
  });

  describe("googleflow", () => {
    it("estimates a Veo request as a non-zero USD amount", () => {
      const req = {
        provider: "googleflow" as const,
        payload: { model: "veo-3.1-fast", prompt: "a cat", duration: 8 },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0.4); // 20 credits * $0.02
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: 0.4,
      });
      expect(result.rateAsOf).toBe("2026-07-20");
      expect(result.warnings).toEqual([]);
    });

    it("prices each Veo tier flat, regardless of duration", () => {
      const at = (model: string, duration: number) =>
        computeEstimate({
          provider: "googleflow" as const,
          payload: { model, prompt: "a cat", duration },
        }).usd;
      expect(at("veo-3.1-quality", 8)).toBe(2);
      expect(at("veo-3.1-lite", 4)).toBe(0.2);
      expect(at("veo-3.1-lite", 8)).toBe(0.2);
      // Ultra 20x only, and free of credits there — $0 is the real rate.
      expect(at("veo-3.1-lite-low-priority", 8)).toBe(0);
    });

    it("multiplies by count, which is the number of variations", () => {
      const result = computeEstimate({
        provider: "googleflow" as const,
        payload: { model: "veo-3.1-fast", prompt: "a cat", count: 3 },
      });
      expect(result.usd).toBeCloseTo(1.2, 10); // 3 * 20 credits * $0.02
      expect(result.breakdown.units).toBe(3);
    });

    it("tiers omni-flash by duration and defaults to 8s", () => {
      const at = (payload: Record<string, unknown>) =>
        computeEstimate({
          provider: "googleflow" as const,
          payload: { model: "omni-flash", prompt: "a cat", ...payload },
        }).usd;
      expect(at({ duration: 4 })).toBe(0.3);
      expect(at({ duration: 6 })).toBe(0.4);
      expect(at({ duration: 8 })).toBe(0.5);
      expect(at({ duration: 10 })).toBe(0.6);
      expect(at({})).toBe(0.5); // upstream default duration is 8
    });

    it("prices omni-flash video-to-video flat, overriding duration", () => {
      const result = computeEstimate({
        provider: "googleflow" as const,
        payload: {
          model: "omni-flash",
          prompt: "a cat",
          duration: 4,
          referenceVideo_1: "https://example.com/in.mp4",
        },
      });
      expect(result.usd).toBe(0.8); // 40 credits * $0.02
      expect(result.warnings).toEqual([]);
    });

    it("warns for a model outside the registered set", () => {
      const result = computeEstimate({
        provider: "googleflow" as const,
        payload: { model: "veo-typo", prompt: "a cat" },
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "model 'veo-typo' not found in pricing table for provider 'googleflow'"
      );
    });
  });

  describe("free-media-upload", () => {
    it("returns zero cost for free-media-upload", () => {
      const req = {
        provider: "free-media-upload" as const,
        payload: {},
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(0);
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("free");
      expect(result.breakdown).toEqual({});
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe(PRICING_AS_OF);
    });
  });

  describe("token heuristics", () => {
    it("uses chars/4 heuristic for input tokens", () => {
      const text = "abcd".repeat(100); // 400 chars = 100 tokens
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-5",
          messages: [{ role: "user", content: text }],
          max_tokens: 10,
        },
      };
      const result = computeEstimate(req);
      expect(result.breakdown.inputTokens).toBe(100);
      expect(result.usd).toBe((100 * 1.25 + 10 * 10) / 1_000_000);
    });

    it("uses max_completion_tokens as fallback for max output", () => {
      const req = {
        provider: "openai" as const,
        payload: {
          model: "gpt-5",
          messages: [{ role: "user", content: "hi" }],
          max_completion_tokens: 75,
        },
      };
      const result = computeEstimate(req);
      expect(result.breakdown.outputTokens).toBe(75);
      expect(result.warnings).toEqual([]);
    });

    it("uses max_output_tokens as fallback for max output", () => {
      const req = {
        provider: "xai" as const,
        payload: {
          model: "grok-4",
          messages: [{ role: "user", content: "hi" }],
          max_output_tokens: 60,
        },
      };
      const result = computeEstimate(req);
      expect(result.breakdown.outputTokens).toBe(60);
      expect(result.warnings).toEqual([]);
    });
  });
});
