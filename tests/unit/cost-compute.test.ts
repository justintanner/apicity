import { describe, it, expect } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { canonicalHash } from "../../packages/provider/cost/src/paygate";
import {
  PRICING,
  PRICING_AS_OF,
} from "../../packages/provider/cost/src/pricing/index";

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
      // CostEstimate has no ok field
      expect((result as unknown as { ok?: unknown }).ok).toBeUndefined();
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

    it("estimates alibaba wan2.7-i2v per second of output", () => {
      const result = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "wan2.7-i2v",
          input: { media: [{ type: "first_frame", url: "https://x/a.png" }] },
          parameters: { resolution: "720P", duration: 5 },
        },
      });
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toMatchObject({
        units: 5,
        unit: "seconds",
        perUnitUsd: 0.1,
      });
      expect(result.usd).toBeCloseTo(0.5, 10);
      expect(result.rateAsOf).toBe("2026-07-20");
      expect(result.warnings).toEqual([]);
    });

    it("estimates alibaba wan2.7-videoedit at the same per-second rate", () => {
      const result = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "wan2.7-videoedit",
          input: { media: [{ type: "video", url: "https://x/a.mp4" }] },
          parameters: { duration: 10 },
        },
      });
      expect(result.usd).toBeCloseTo(1, 10);
      expect(result.breakdown.perUnitUsd).toBe(0.1);
      expect(result.warnings).toEqual([]);
    });

    // The request schema accepts 1080P but the pricing page publishes only a
    // 720P row, so the flat entry must still estimate rather than warn.
    it("estimates alibaba video at 1080P and when parameters are omitted", () => {
      const hd = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "wan2.7-i2v",
          input: { media: [{ type: "first_frame", url: "https://x/a.png" }] },
          parameters: { resolution: "1080P", duration: 4 },
        },
      });
      expect(hd.usd).toBeCloseTo(0.4, 10);
      expect(hd.warnings).toEqual([]);

      const bare = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "wan2.7-i2v",
          input: { media: [{ type: "first_frame", url: "https://x/a.png" }] },
        },
      });
      expect(bare.breakdown).toMatchObject({ units: 5, perUnitUsd: 0.1 });
      expect(bare.usd).toBeCloseTo(0.5, 10);
    });

    // duration: 0 is legal and means "match the source clip"; the length is
    // only known upstream, so the estimate falls back to the 5s default.
    it("falls back to the 5s default for alibaba duration 0", () => {
      const result = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "wan2.7-videoedit",
          input: { media: [{ type: "video", url: "https://x/a.mp4" }] },
          parameters: { duration: 0 },
        },
      });
      expect(result.breakdown.units).toBe(5);
      expect(result.usd).toBeCloseTo(0.5, 10);
    });

    it("estimates alibaba image models per image, scaling with parameters.n", () => {
      const one = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "qwen-image-2.0",
          input: { messages: [] },
        },
      });
      expect(one.breakdown).toMatchObject({
        units: 1,
        unit: "images",
        perUnitUsd: 0.035,
      });
      expect(one.usd).toBeCloseTo(0.035, 10);

      const four = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "qwen-image-2.0",
          input: { messages: [] },
          parameters: { n: 4 },
        },
      });
      expect(four.usd).toBeCloseTo(0.14, 10);

      const wan = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "wan2.7-image",
          input: { messages: [] },
          parameters: { n: 3 },
        },
      });
      expect(wan.usd).toBeCloseTo(0.09, 10);
    });

    // Regression: alibaba per-unit routing used to forward req.endpoint as the
    // pricing key, so a real dashscope endpoint path missed the model-keyed
    // PRICING.alibaba table and priced at zero with a not-found warning.
    it("prices alibaba video per-unit even when the endpoint is set", () => {
      const payload = {
        model: "wan2.7-i2v",
        input: { media: [{ type: "first_frame", url: "https://x/a.png" }] },
        parameters: { duration: 5 },
      };
      const withEndpoint = computeEstimate({
        provider: "alibaba" as const,
        endpoint: "api.v1.services.aigc.video-generation.video-synthesis",
        payload,
      });
      expect(withEndpoint.usd).toBeCloseTo(0.5, 10);
      expect(withEndpoint.source).toBe("per-unit-table");
      expect(withEndpoint.warnings).toEqual([]);

      const without = computeEstimate({
        provider: "alibaba" as const,
        payload,
      });
      expect(withEndpoint.usd).toBe(without.usd);
      expect(withEndpoint.source).toBe(without.source);
      expect(withEndpoint.breakdown).toEqual(without.breakdown);
    });

    it("ignores a nonsense endpoint for alibaba image pricing", () => {
      const result = computeEstimate({
        provider: "alibaba" as const,
        endpoint: "not.a.real.endpoint",
        payload: {
          model: "qwen-image-2.0",
          input: { messages: [] },
          parameters: { n: 2 },
        },
      });
      expect(result.usd).toBeCloseTo(0.07, 10); // 2 images * 0.035
      expect(result.source).toBe("per-unit-table");
      expect(result.warnings).toEqual([]);
    });

    it("still token-prices alibaba chat models after per-unit routing", () => {
      const result = computeEstimate({
        provider: "alibaba" as const,
        payload: {
          model: "qwen3.6-plus",
          messages: [{ role: "user", content: "hello" }],
          max_tokens: 100,
        },
      });
      expect(result.source).toBe("tokens-heuristic+table");
      expect(result.breakdown.unit).toBe("tokens");
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
    // Veo bills per video, so `duration` is inert here: the price is the
    // 720p default cell, not a multiple of 10 seconds.
    it("estimates kie veo3 per video, not by duration", () => {
      const req = {
        provider: "kie" as const,
        payload: { model: "veo3", duration: 10 },
      };
      const result = computeEstimate(req);
      expect(result.usd).toBe(1.25);
      expect(result.currency).toBe("USD");
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: 1.25,
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

    it("estimates KIE Nano Banana per image", () => {
      const result = computeEstimate({
        provider: "kie" as const,
        payload: {
          model: "nano-banana",
          input: { prompt: "a cat" },
        },
      });

      expect(result.usd).toBe(0.02);
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "images",
        perUnitUsd: 0.02,
      });
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

    it("promotes omitted Kling sound when multi_shots is true", () => {
      const estimate = (sound?: boolean) =>
        computeEstimate({
          provider: "kie" as const,
          payload: {
            model: "kling-3.0/video",
            input: {
              duration: 5,
              mode: "std",
              multi_shots: true,
              ...(sound === undefined ? {} : { sound }),
            },
          },
        });

      expect(estimate().usd).toBe(0.5);
      expect(estimate(false).usd).toBeCloseTo(0.35, 10);
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

    // gemini-omni-video's upstream schema types `duration` as a string enum
    // ("4" | "6" | "8" | "10"), so the string form is the shape real callers
    // send. Both forms must select the same rate.
    it("prices gemini-omni-video identically for string and numeric duration", () => {
      const forDuration = (duration: string | number) =>
        computeEstimate({
          provider: "kie" as const,
          payload: {
            model: "gemini-omni-video",
            input: { prompt: "a cat", duration, resolution: "720p" },
          },
        });

      const asText = forDuration("8");
      const asNum = forDuration(8);

      expect(asText.usd).toBe(0.525); // 8s @ 720p, not the 4s rate of 0.315
      expect(asText.usd).toBe(asNum.usd);
      expect(asText.breakdown).toEqual(asNum.breakdown);
      expect(asText.warnings).toEqual([]);
    });

    it.each([
      ["4", 0.315],
      ["6", 0.42],
      ["8", 0.525],
      ["10", 0.63],
    ])(
      "prices gemini-omni-video t2v at %s seconds / 720p",
      (duration, expected) => {
        const result = computeEstimate({
          provider: "kie" as const,
          payload: {
            model: "gemini-omni-video",
            input: { prompt: "a cat", duration, resolution: "720p" },
          },
        });
        expect(result.usd).toBeCloseTo(expected, 10);
        expect(result.warnings).toEqual([]);
      }
    );

    // Regression: v2v rate keys must never carry an empty segment
    // ("v2v|4|", and after the 2026-08-06 restructure "v2v||720p"), because
    // evaluatePerUnit's key join drops it — every video-to-video request then
    // missed the table and silently priced at zero.
    //
    // v2v is flat per video by resolution now: upstream ignores `duration`
    // once a clip is supplied, so every accepted duration prices the same
    // 720p-default cell.
    it.each(["4", "6", "8", "10"])(
      "prices gemini-omni-video v2v flat at every accepted duration (%s seconds)",
      (duration) => {
        const result = computeEstimate({
          provider: "kie" as const,
          payload: {
            model: "gemini-omni-video",
            input: {
              prompt: "a cat",
              duration,
              video_list: [
                { url: "https://example.com/a.mp4", start: 0, ends: 5 },
              ],
            },
          },
        });
        expect(result.usd).toBeCloseTo(0.84, 10);
        expect(result.usd).toBeGreaterThan(0);
        expect(result.warnings).toEqual([]);
      }
    );

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
      // 2048*2048 = 4,194,304 px = exactly 4 megapixels of 1024x1024 px
      expect(result.usd).toBeCloseTo(0.1, 10);
      expect(result.breakdown).toEqual({
        units: 4,
        unit: "megapixels",
        perUnitUsd: 0.025,
      });
    });

    it("resolves fal image_size presets and documented defaults", () => {
      const preset = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/flux/schnell",
        payload: { image_size: "landscape_16_9", num_images: 2 },
      });
      // 1024*576 = 0.5625 MP → 1 MP per image, 2 images
      expect(preset.breakdown.units).toBe(2);
      expect(preset.usd).toBeCloseTo(0.006, 10);

      for (const endpoint of [
        "fal-ai/flux/dev",
        "fal-ai/flux/schnell",
        "fal-ai/qwen-image",
      ]) {
        const omitted = computeEstimate({
          provider: "fal" as const,
          endpoint,
          payload: {},
        });
        const explicit = computeEstimate({
          provider: "fal" as const,
          endpoint,
          payload: { image_size: "landscape_4_3" },
        });

        expect(omitted.usd, endpoint).toBe(explicit.usd);
        expect(omitted.breakdown.units, endpoint).toBe(1);
      }
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
          resolution: "480p",
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

    // docs.x.ai publishes one figure per video model, the 480p rate. The
    // other tiers and the input-image charges are recorded 1 s bills.
    describe("xai video resolution", () => {
      it.each([
        ["grok-imagine-video-1.5", "480p", 0.08],
        ["grok-imagine-video-1.5", "720p", 0.14],
        ["grok-imagine-video-1.5", "1080p", 0.25],
        ["grok-imagine-video-1.5-preview", "720p", 0.14],
        ["grok-imagine-video-1.5-lite", "480p", 0.02],
        ["grok-imagine-video-1.5-lite", "720p", 0.03],
        ["grok-imagine-video-1.5-lite", "1080p", 0.14],
        ["grok-imagine-video", "480p", 0.05],
        ["grok-imagine-video", "720p", 0.07],
      ])("prices %s at %s by its known rate", (model, resolution, rate) => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.generations",
          payload: { model, prompt: "x", duration: 2, resolution },
        });
        expect(result.usd).toBeCloseTo(2 * rate, 10);
        expect(result.breakdown.perUnitUsd).toBe(rate);
        expect(result.warnings).toEqual([]);
      });

      it.each([
        [
          "a 1.5 image-to-video clip",
          "grok-imagine-video-1.5",
          { image: { url: "https://x/m.jpg" } },
          0.08 + 0.01,
        ],
        [
          "a 1.5 clip from two references",
          "grok-imagine-video-1.5",
          {
            reference_images: [
              { url: "https://x/m.jpg" },
              { url: "https://x/c.jpg" },
            ],
          },
          0.08 + 2 * 0.01,
        ],
        [
          "a 1.5 clip from three reference file ids",
          "grok-imagine-video-1.5",
          { reference_image_file_ids: ["f1", "f2", "f3"] },
          0.08 + 3 * 0.01,
        ],
        [
          "a grok-imagine-video image-to-video clip",
          "grok-imagine-video",
          { image_file_id: "f1" },
          0.05 + 0.002,
        ],
        [
          "a 1.5-lite image-to-video clip",
          "grok-imagine-video-1.5-lite",
          { image: "https://x/m.jpg" },
          0.02 + 0.01,
        ],
      ])("adds the input images of %s", (_label, model, body, usd) => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.generations",
          payload: { model, prompt: "x", duration: 1, ...body },
        });
        expect(result.usd).toBeCloseTo(usd, 10);
        expect(result.warnings).toEqual([]);
      });

      // A pinned frame bills as one input image (planning ac-yrfzhy D6). xAI's
      // cookbook reports 1.44 for a 10 s 720p time-lapse with a first frame,
      // 2 keyframes and a last frame, and 1.42 and 0.71 for clips from
      // references and voices.
      it.each([
        [
          "a first frame, two keyframes and a last frame",
          10,
          {
            image: { url: "https://x/first.jpg" },
            keyframes: [
              { image: { url: "https://x/k1.jpg" }, timestamp_s: 3 },
              { image: { url: "https://x/k2.jpg" }, timestamp_s: 6 },
            ],
            last_frame: { url: "https://x/last.jpg" },
          },
          1.44,
        ],
        [
          "a stored last frame",
          10,
          {
            image: { url: "https://x/first.jpg" },
            keyframes: [
              { image: { url: "https://x/k1.jpg" }, timestamp_s: 3 },
              { image: { url: "https://x/k2.jpg" }, timestamp_s: 6 },
            ],
            last_frame_file_id: "file_last",
          },
          1.44,
        ],
        [
          "two references and two voices",
          10,
          {
            reference_images: [
              { url: "https://x/a.jpg" },
              { url: "https://x/b.jpg" },
            ],
            reference_audios: [{ voice_id: "eve" }, { voice_id: "leo" }],
          },
          1.42,
        ],
        [
          "one reference and one voice",
          5,
          {
            reference_images: [{ url: "https://x/a.jpg" }],
            reference_audios: [{ voice_id: "eve" }],
          },
          0.71,
        ],
      ])("prices %s on 1.5", (_label, duration, body, usd) => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.generations",
          payload: {
            model: "grok-imagine-video-1.5",
            duration,
            resolution: "720p",
            ...body,
          },
        });
        expect(result.usd).toBeCloseTo(usd, 10);
        expect(result.warnings).toEqual([]);
      });

      it("fails closed when keyframes is not a list", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.generations",
          payload: {
            model: "grok-imagine-video-1.5",
            duration: 1,
            keyframes: { image: { url: "https://x/k.jpg" }, timestamp_s: 0.5 },
          },
        });
        expect(result.usd).toBe(0);
        expect(result.warnings).toEqual([
          "xai 'grok-imagine-video-1.5': could not derive exact additional charge from payload",
        ]);
      });

      it("fails closed when reference_images is not a list", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.generations",
          payload: {
            model: "grok-imagine-video-1.5",
            prompt: "x",
            duration: 1,
            reference_images: "https://x/m.jpg",
          },
        });
        expect(result.usd).toBe(0);
        expect(result.warnings).toEqual([
          "xai 'grok-imagine-video-1.5': could not derive exact additional charge from payload",
        ]);
      });

      it("keeps the 480p rate and warns for an edit of a source video", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.edits",
          payload: {
            model: "grok-imagine-video",
            prompt: "x",
            video: { url: "https://x/v.mp4" },
          },
          costHints: { durationSeconds: 6 },
        });
        expect(result.usd).toBeCloseTo(0.3, 10); // 6 seconds * 0.05
        expect(result.warnings).toEqual([
          "xai 'grok-imagine-video': the output keeps the source video's resolution, and a source above 480p bills above the published 480p rate of 0.05 USD/s, so this estimate is a floor",
        ]);
      });

      // The floor warning must not replace the advice to declare the
      // duration when the estimate cannot derive seconds.
      it("asks for a duration on a source-video edit without one", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.edits",
          payload: {
            model: "grok-imagine-video",
            prompt: "x",
            video: { url: "https://x/v.mp4" },
          },
        });
        expect(result.usd).toBe(0);
        expect(result.warnings).toEqual([
          "xai 'grok-imagine-video': could not derive units from payload (check duration / text); for endpoints whose schema has no duration, pass costHints.durationSeconds",
        ]);
      });

      // grok-imagine-video renders up to 720p.
      it("fails closed at 1080p on grok-imagine-video", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.videos.generations",
          payload: {
            model: "grok-imagine-video",
            prompt: "x",
            duration: 2,
            resolution: "1080p",
          },
        });
        expect(result.usd).toBe(0);
        expect(result.warnings).toEqual([
          "xai 'grok-imagine-video': no rate for variant '1080p' (selectors: resolution)",
        ]);
      });
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
      expect(result.usd).toBeCloseTo(0.04, 10); // 1 generation * 0.04 (2.0 low, 1k)
      expect(result.breakdown.units).toBe(1);
    });

    it("prices xai video 1.5 lite at its own per-second rate", () => {
      const result = computeEstimate({
        provider: "xai" as const,
        endpoint: "v1.videos.generations",
        payload: { model: "grok-imagine-video-1.5-lite", duration: 6 },
      });
      expect(result.usd).toBeCloseTo(0.12, 10); // 6 seconds * 0.02
      expect(result.breakdown).toEqual({
        units: 6,
        unit: "seconds",
        perUnitUsd: 0.02,
      });
      expect(result.warnings).toEqual([]);
    });

    // GET /v1/image-generation-models lists the quality x resolution grid;
    // `auto` serves low for a generation and medium for an edit. Edits also
    // bill each input image once per request (recorded bills, ac-k7qv4n).
    describe("xai grok-imagine-image-2.0", () => {
      it("prices a generation per image at the low rate, scaling with n", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.images.generations",
          payload: { model: "grok-imagine-image-2.0", prompt: "a cat", n: 2 },
        });
        expect(result.usd).toBeCloseTo(0.08, 10); // 2 generations * 0.04
        expect(result.source).toBe("per-unit-table");
        expect(result.breakdown).toEqual({
          units: 2,
          unit: "generations",
          perUnitUsd: 0.04,
        });
        expect(result.warnings).toEqual([]);
      });

      it.each([
        ["low", "1k", 0.04],
        ["low", "1.5k", 0.05],
        ["low", "2k", 0.06],
        ["medium", "1k", 0.06],
        ["medium", "1.5k", 0.07],
        ["medium", "2k", 0.08],
        ["auto", "2k", 0.06],
      ])(
        "prices a %s generation at %s per image",
        (quality, resolution, rate) => {
          const result = computeEstimate({
            provider: "xai" as const,
            endpoint: "v1.images.generations",
            payload: {
              model: "grok-imagine-image-2.0",
              prompt: "x",
              quality,
              resolution,
            },
          });
          expect(result.usd).toBeCloseTo(rate, 10);
          expect(result.breakdown).toEqual({
            units: 1,
            unit: "generations",
            perUnitUsd: rate,
          });
          expect(result.warnings).toEqual([]);
        }
      );

      it.each([
        [
          "an edit at the default auto",
          { image: { url: "https://x/c.jpg" } },
          0.06 + 0.01,
        ],
        [
          "an edit pinned to auto",
          { images: [{ url: "https://x/c.jpg" }], quality: "auto" },
          0.06 + 0.01,
        ],
        [
          "an edit pinned to low",
          { image: { url: "https://x/c.jpg" }, quality: "low" },
          0.04 + 0.01,
        ],
        [
          "a low edit of two inputs",
          {
            images: [{ url: "https://x/c.jpg" }, { url: "https://x/m.jpg" }],
            quality: "low",
          },
          0.04 + 2 * 0.01,
        ],
        [
          "a low edit at 2k",
          {
            image: { url: "https://x/c.jpg" },
            quality: "low",
            resolution: "2k",
          },
          0.06 + 0.01,
        ],
        [
          "a low edit with two outputs",
          { image: { url: "https://x/c.jpg" }, quality: "low", n: 2 },
          2 * 0.04 + 0.01,
        ],
        ["a file-id edit", { image_file_id: "file_1" }, 0.06 + 0.01],
        [
          "a multi-file edit",
          { image_file_ids: ["file_1", "file_2", "file_3"] },
          0.06 + 3 * 0.01,
        ],
      ])("prices %s with its input images", (_label, body, usd) => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.images.edits",
          payload: { model: "grok-imagine-image-2.0", prompt: "x", ...body },
        });
        expect(result.usd).toBeCloseTo(usd, 10);
        expect(result.warnings).toEqual([]);
      });

      // The provider sends `image` over `image_file_id` and `images` over
      // `image_file_ids`, so the dropped field bills nothing.
      it("counts the input images the provider sends", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.images.edits",
          payload: {
            model: "grok-imagine-image-2.0",
            prompt: "x",
            image: { url: "https://x/c.jpg" },
            image_file_id: "file_1",
            images: [{ url: "https://x/m.jpg" }],
            image_file_ids: ["file_2", "file_3"],
            quality: "low",
          },
        });
        expect(result.usd).toBeCloseTo(0.04 + 2 * 0.01, 10);
        expect(result.breakdown.extraUsd).toBeCloseTo(0.02, 10);
      });

      it.each([
        [
          "quality high, which has no listed price",
          { quality: "high" },
          "xai 'grok-imagine-image-2.0': no rate for variant 'high|1k' (selectors: quality, resolution)",
        ],
        [
          "a non-string resolution",
          { resolution: 2 },
          "xai 'grok-imagine-image-2.0': missing required selector(s): resolution",
        ],
        [
          "an images field that is not a list",
          { images: "c.jpg", quality: "low" },
          "xai 'grok-imagine-image-2.0': could not derive exact additional charge from payload",
        ],
      ])("fails closed for %s", (_label, body, warning) => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.images.edits",
          payload: { model: "grok-imagine-image-2.0", prompt: "x", ...body },
        });
        expect(result.usd).toBe(0);
        expect(result.warnings).toEqual([warning]);
      });
    });

    // xAI retired grok-imagine-image-quality on 2026-11-02. The slug still
    // resolves, and grok-imagine-image-2.0 serves and bills it at low, so a
    // requested quality changes nothing while the resolution and each edit
    // input bill as on 2.0.
    describe("xai grok-imagine-image-quality after its retirement", () => {
      it.each([
        ["the default 1k", {}, 0.04],
        ["1.5k", { resolution: "1.5k" }, 0.05],
        ["2k", { resolution: "2k" }, 0.06],
        ["a requested medium quality", { quality: "medium" }, 0.04],
        ["n 2", { n: 2 }, 2 * 0.04],
      ])(
        "prices a generation at %s on the 2.0 low row",
        (_label, body, usd) => {
          const result = computeEstimate({
            provider: "xai" as const,
            endpoint: "v1.images.generations",
            payload: {
              model: "grok-imagine-image-quality",
              prompt: "x",
              ...body,
            },
          });
          expect(result.usd).toBeCloseTo(usd, 10);
          expect(result.warnings).toEqual([]);
        }
      );

      // On 2.0 an edit at the default auto serves medium; the redirect
      // serves low.
      it.each([
        [
          "one input at the default auto",
          { image: { url: "https://x/c.jpg" } },
          0.04 + 0.01,
        ],
        [
          "two inputs at 2k with two outputs",
          {
            images: [{ url: "https://x/c.jpg" }, { url: "https://x/m.jpg" }],
            resolution: "2k",
            n: 2,
          },
          2 * 0.06 + 2 * 0.01,
        ],
      ])("prices an edit of %s with its input images", (_label, body, usd) => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.images.edits",
          payload: {
            model: "grok-imagine-image-quality",
            prompt: "x",
            ...body,
          },
        });
        expect(result.usd).toBeCloseTo(usd, 10);
        expect(result.warnings).toEqual([]);
      });

      it("fails closed at a resolution the 2.0 grid does not list", () => {
        const result = computeEstimate({
          provider: "xai" as const,
          endpoint: "v1.images.generations",
          payload: {
            model: "grok-imagine-image-quality",
            prompt: "x",
            resolution: "4k",
          },
        });
        expect(result.usd).toBe(0);
        expect(result.warnings).toEqual([
          "xai 'grok-imagine-image-quality': no rate for variant 'low|4k' (selectors: quality, resolution)",
        ]);
      });
    });

    // A recorded grok-imagine-image edit of two inputs billed 0.024.
    it("prices a grok-imagine-image edit with 0.002 per input image", () => {
      const result = computeEstimate({
        provider: "xai" as const,
        endpoint: "v1.images.edits",
        payload: {
          model: "grok-imagine-image",
          prompt: "x",
          images: [{ url: "https://x/c.jpg" }, { url: "https://x/m.jpg" }],
        },
      });
      expect(result.usd).toBeCloseTo(0.024, 10);
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: 0.02,
        extraUsd: 0.004,
      });
      expect(result.warnings).toEqual([]);
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
        "xai 'grok-imagine-video': could not derive units from payload (check duration / text); for endpoints whose schema has no duration, pass costHints.durationSeconds"
      );
    });

    // The channel the warning above names has to work for xai too:
    // XaiVideoEditRequestSchema declares no duration (an edit inherits the
    // source clip's length), so the hint is the only way to bound this call.
    it("bounds an xai video edit through costHints.durationSeconds", () => {
      const result = computeEstimate({
        provider: "xai" as const,
        endpoint: "v1.videos.edits",
        payload: { model: "grok-imagine-video" },
        costHints: { durationSeconds: 6 },
      });
      expect(result.usd).toBeCloseTo(0.3, 10); // 6 seconds * 0.05
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 6,
        unit: "seconds",
        perUnitUsd: 0.05,
      });
      expect(result.warnings).toEqual([]);
    });

    // xai payloads are flat, so its wire field is the top-level `duration` —
    // and it still outranks a conflicting hint, exactly as input.duration does
    // for kie.
    it("bills the xai wire duration over a conflicting hint", () => {
      const result = computeEstimate({
        provider: "xai" as const,
        endpoint: "v1.videos.edits",
        payload: { model: "grok-imagine-video", duration: 6 },
        costHints: { durationSeconds: 99 },
      });
      expect(result.usd).toBeCloseTo(0.3, 10); // 6 * 0.05, not 99 * 0.05
      expect(result.breakdown.units).toBe(6);
      expect(result.warnings).toEqual([]);
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

    // kie stays endpoint-keyed: a priced endpoint path wins over an off-table
    // payload.model.
    it("resolves kie pricing by endpoint over an off-table payload.model", () => {
      const result = computeEstimate({
        provider: "kie" as const,
        endpoint: "suno/generate",
        payload: { model: "chirp-v5-not-in-table" },
      });
      expect(result.usd).toBe(0.06);
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: 0.06,
      });
      expect(result.warnings).toEqual([]);
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

    it("fails before partial lookup when a required selector is missing", () => {
      const model = "__required-selector-test__";
      const previous = PRICING.kie[model];
      PRICING.kie[model] = {
        kind: "perUnit",
        unit: "generations",
        units: () => 1,
        select: [
          {
            name: "quality",
            required: true,
            pick: (payload) =>
              typeof payload.quality === "string" ? payload.quality : undefined,
          },
        ],
        // The empty key represents a real lower-dimensional rate. Without the
        // required-selector guard, an omitted quality would incorrectly use it.
        rates: { "": 0.1, high: 0.2 },
        source: { url: "https://example.com/required-selector-test" },
      };

      try {
        const result = computeEstimate({
          provider: "kie" as const,
          payload: { model },
        });

        expect(result.usd).toBe(0);
        expect(result.breakdown).toEqual({});
        expect(result.warnings).toEqual([
          "kie '__required-selector-test__': missing required selector(s): quality",
        ]);
      } finally {
        if (previous) {
          PRICING.kie[model] = previous;
        } else {
          delete PRICING.kie[model];
        }
      }
    });

    it("adds an optional exact extra charge to the primary unit total", () => {
      const model = "__exact-extra-charge-test__";
      const previous = PRICING.kie[model];
      PRICING.kie[model] = {
        kind: "perUnit",
        unit: "images",
        units: () => 2,
        select: [],
        rates: { "": 0.1 },
        extra: () => 0.04,
        source: { url: "https://example.com/exact-extra-charge-test" },
      };

      try {
        const result = computeEstimate({
          provider: "kie" as const,
          payload: { model },
        });

        expect(result.usd).toBeCloseTo(0.24, 10);
        expect(result.breakdown).toEqual({
          units: 2,
          unit: "images",
          perUnitUsd: 0.1,
          extraUsd: 0.04,
        });
        expect(result.warnings).toEqual([]);
      } finally {
        if (previous) {
          PRICING.kie[model] = previous;
        } else {
          delete PRICING.kie[model];
        }
      }
    });

    it("fails closed when an optional extra charge is not exact", () => {
      const model = "__undefined-extra-charge-test__";
      const previous = PRICING.kie[model];
      PRICING.kie[model] = {
        kind: "perUnit",
        unit: "images",
        units: () => 1,
        select: [],
        rates: { "": 0.1 },
        extra: () => undefined,
        source: { url: "https://example.com/undefined-extra-charge-test" },
      };

      try {
        const result = computeEstimate({
          provider: "kie" as const,
          payload: { model },
        });

        expect(result.usd).toBe(0);
        expect(result.breakdown).toEqual({});
        expect(result.warnings).toEqual([
          `kie '${model}': could not derive exact additional charge from payload`,
        ]);
      } finally {
        if (previous) {
          PRICING.kie[model] = previous;
        } else {
          delete PRICING.kie[model];
        }
      }
    });

    it("keeps omitted optional selectors working for non-Kie providers", () => {
      const fal = computeEstimate({
        provider: "fal" as const,
        endpoint: "fal-ai/nano-banana-2",
        payload: {},
      });
      expect(fal.usd).toBe(0.08);
      expect(fal.warnings).toEqual([]);

      const googleflow = computeEstimate({
        provider: "googleflow" as const,
        payload: { model: "veo-3.1-fast", prompt: "a cat" },
      });
      expect(googleflow.usd).toBe(0.4);
      expect(googleflow.warnings).toEqual([]);
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
      // Ultra $199 only, and free of credits there — $0 is the real rate.
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

    it("tiers omni-flash by duration and defaults to 8s at 720p", () => {
      const at = (payload: Record<string, unknown>) =>
        computeEstimate({
          provider: "googleflow" as const,
          payload: { model: "omni-flash", prompt: "a cat", ...payload },
        }).usd;
      // 7 / 10 / 12 / 15 credits * $0.02 (useapi.net, read 2026-10-17)
      expect(at({ duration: 4 })).toBe(0.14);
      expect(at({ duration: 6 })).toBe(0.2);
      expect(at({ duration: 8 })).toBe(0.24);
      expect(at({ duration: 10 })).toBe(0.3);
      expect(at({})).toBe(0.24); // upstream default duration is 8
      // resolution defaults to 720p, so an explicit 720p is the same price.
      expect(at({ duration: 8, resolution: "720p" })).toBe(0.24);
    });

    it("prices omni-flash at 360p for roughly half the 720p credits", () => {
      const at = (payload: Record<string, unknown>) =>
        computeEstimate({
          provider: "googleflow" as const,
          payload: {
            model: "omni-flash",
            prompt: "a cat",
            resolution: "360p",
            ...payload,
          },
        });
      // 4 / 5 / 6 / 7 credits * $0.02
      expect(at({ duration: 4 }).usd).toBe(0.08);
      expect(at({ duration: 6 }).usd).toBe(0.1);
      expect(at({ duration: 8 }).usd).toBe(0.12);
      expect(at({ duration: 10 }).usd).toBe(0.14);
      expect(at({}).usd).toBe(0.12); // upstream default duration is 8
      // A 360p video-to-video edit is a flat 10 credits.
      const edit = at({ referenceVideo_1: "https://example.com/in.mp4" });
      expect(edit.usd).toBe(0.2);
      expect(edit.warnings).toEqual([]);
      expect(edit.rateAsOf).toBe("2026-10-17");
    });

    it("fails closed on an omni-flash resolution upstream does not offer", () => {
      const result = computeEstimate({
        provider: "googleflow" as const,
        payload: {
          model: "omni-flash",
          prompt: "a cat",
          duration: 8,
          resolution: "1080p",
        },
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toContain(
        "googleflow 'omni-flash': no rate for variant 'duration-8|1080p|pro' (selectors: variant, resolution, plan)"
      );
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
      expect(result.usd).toBe(0.4); // 20 credits * $0.02 at 720p
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

    // --- plan-tier selector (costHints.googleFlowPlan) ---

    const priceGoogleflow = (
      model: string,
      extra: Record<string, unknown> = {},
      costHints?: { googleFlowPlan?: string }
    ) =>
      computeEstimate({
        provider: "googleflow" as const,
        payload: { model, prompt: "a cat", ...extra },
        ...(costHints ? { costHints } : {}),
      });

    // AC-1 / REQ-001: every priced entry, with no costHints, returns exactly
    // the pre-selector Pro-basis USD, an empty warnings list, and the same
    // rateAsOf. This is the default-parity sweep across all model entries.
    // Veo rates were priced from the 2026-07-20 read; omni-flash's from the
    // 2026-10-17 re-read (ac-yvnmf4).
    const videoRateAsOf = (model: string): string =>
      model === "omni-flash" ? "2026-10-17" : "2026-07-20";

    it("default (no costHints) prices every entry on the Pro basis", () => {
      const cases: Array<[string, Record<string, unknown>, number]> = [
        ["veo-3.1-quality", {}, 2],
        ["veo-3.1-fast", {}, 0.4],
        ["veo-3.1-lite", {}, 0.2],
        ["veo-3.1-lite-low-priority", {}, 0],
        ["omni-flash", { duration: 4 }, 0.14],
        ["omni-flash", { duration: 6 }, 0.2],
        ["omni-flash", { duration: 8 }, 0.24],
        ["omni-flash", { duration: 10 }, 0.3],
        ["omni-flash", { referenceVideo_1: "https://example.com/in.mp4" }, 0.4],
        ["omni-flash", { duration: 4, resolution: "360p" }, 0.08],
        ["omni-flash", { duration: 6, resolution: "360p" }, 0.1],
        ["omni-flash", { duration: 8, resolution: "360p" }, 0.12],
        ["omni-flash", { duration: 10, resolution: "360p" }, 0.14],
        [
          "omni-flash",
          {
            referenceVideo_1: "https://example.com/in.mp4",
            resolution: "360p",
          },
          0.2,
        ],
      ];
      for (const [model, extra, expected] of cases) {
        const result = priceGoogleflow(model, extra);
        const label = `${model} ${JSON.stringify(extra)}`;
        expect(result.usd, label).toBe(expected);
        expect(result.warnings, `${label} warnings`).toEqual([]);
        expect(result.rateAsOf, `${label} rateAsOf`).toBe(videoRateAsOf(model));
        expect(result.source, `${label} source`).toBe("per-unit-table");
      }
    });

    it("an explicit pro tier is byte-for-byte the omitted default", () => {
      const withHint = priceGoogleflow(
        "veo-3.1-fast",
        {},
        { googleFlowPlan: "pro" }
      );
      const withoutHint = priceGoogleflow("veo-3.1-fast");
      expect(withHint).toEqual(withoutHint);
      expect(withHint.usd).toBe(0.4);
      expect(withHint.warnings).toEqual([]);
    });

    // AC-3 / REQ-003: Ultra returns the documented, lower USD, keeps the same
    // source / rateAsOf, and emits no warning.
    it("ultra tier prices on the Ultra basis, strictly below Pro", () => {
      const cases: Array<[string, Record<string, unknown>, number]> = [
        ["veo-3.1-quality", {}, 0.8],
        ["veo-3.1-fast", {}, 0.08],
        ["veo-3.1-lite", {}, 0.04],
        ["omni-flash", { duration: 4 }, 0.056],
        ["omni-flash", { duration: 6 }, 0.08],
        ["omni-flash", { duration: 8 }, 0.096],
        ["omni-flash", { duration: 10 }, 0.12],
        [
          "omni-flash",
          { referenceVideo_1: "https://example.com/in.mp4" },
          0.16,
        ],
        ["omni-flash", { duration: 4, resolution: "360p" }, 0.032],
        ["omni-flash", { duration: 6, resolution: "360p" }, 0.04],
        ["omni-flash", { duration: 8, resolution: "360p" }, 0.048],
        ["omni-flash", { duration: 10, resolution: "360p" }, 0.056],
        [
          "omni-flash",
          {
            referenceVideo_1: "https://example.com/in.mp4",
            resolution: "360p",
          },
          0.08,
        ],
      ];
      for (const [model, extra, expectedUltra] of cases) {
        const ultra = priceGoogleflow(model, extra, {
          googleFlowPlan: "ultra",
        });
        const pro = priceGoogleflow(model, extra);
        const label = `${model} ${JSON.stringify(extra)}`;
        expect(ultra.usd, `${label} ultra usd`).toBe(expectedUltra);
        expect(ultra.usd, `${label} ultra < pro`).toBeLessThan(pro.usd);
        expect(ultra.breakdown.perUnitUsd, `${label} perUnitUsd`).toBe(
          expectedUltra
        );
        expect(ultra.warnings, `${label} ultra warnings`).toEqual([]);
        expect(ultra.rateAsOf, `${label} ultra rateAsOf`).toBe(
          videoRateAsOf(model)
        );
      }
    });

    // Plus and Ultra $99 (ac-1zjd41). Each case is
    // [model, extra, plus USD, ultra-99 USD]; every figure is the overview's
    // per-plan "est. $/gen" cell (useapi.net, read 2026-10-17). Plus pays the
    // non-Ultra credit costs at $0.04, Ultra $99 the halved Ultra Veo Lite /
    // Fast costs at $0.01, and both pay the same omni-flash credits as Pro.
    const plusAndUltra99: Array<
      [string, Record<string, unknown>, number, number]
    > = [
      ["veo-3.1-quality", {}, 4, 1],
      ["veo-3.1-fast", {}, 0.8, 0.1],
      ["veo-3.1-lite", {}, 0.4, 0.05],
      ["omni-flash", { duration: 4 }, 0.28, 0.07],
      ["omni-flash", { duration: 6 }, 0.4, 0.1],
      ["omni-flash", { duration: 8 }, 0.48, 0.12],
      ["omni-flash", { duration: 10 }, 0.6, 0.15],
      [
        "omni-flash",
        { referenceVideo_1: "https://example.com/in.mp4" },
        0.8,
        0.2,
      ],
      ["omni-flash", { duration: 4, resolution: "360p" }, 0.16, 0.04],
      ["omni-flash", { duration: 6, resolution: "360p" }, 0.2, 0.05],
      ["omni-flash", { duration: 8, resolution: "360p" }, 0.24, 0.06],
      ["omni-flash", { duration: 10, resolution: "360p" }, 0.28, 0.07],
      [
        "omni-flash",
        {
          referenceVideo_1: "https://example.com/in.mp4",
          resolution: "360p",
        },
        0.4,
        0.1,
      ],
    ];

    it("plus tier prices on the Plus basis, above Pro", () => {
      for (const [model, extra, expectedPlus] of plusAndUltra99) {
        const plus = priceGoogleflow(model, extra, { googleFlowPlan: "plus" });
        const pro = priceGoogleflow(model, extra);
        const label = `${model} ${JSON.stringify(extra)}`;
        expect(plus.usd, `${label} plus usd`).toBe(expectedPlus);
        expect(plus.usd, `${label} plus > pro`).toBeGreaterThan(pro.usd);
        expect(plus.breakdown.perUnitUsd, `${label} perUnitUsd`).toBe(
          expectedPlus
        );
        expect(plus.warnings, `${label} plus warnings`).toEqual([]);
        expect(plus.rateAsOf, `${label} plus rateAsOf`).toBe(
          videoRateAsOf(model)
        );
        expect(plus.source, `${label} plus source`).toBe("per-unit-table");
      }
    });

    it("ultra-99 tier prices between Pro and Ultra $199", () => {
      for (const [model, extra, , expectedUltra99] of plusAndUltra99) {
        const ultra99 = priceGoogleflow(model, extra, {
          googleFlowPlan: "ultra-99",
        });
        const pro = priceGoogleflow(model, extra);
        const ultra = priceGoogleflow(model, extra, {
          googleFlowPlan: "ultra",
        });
        const label = `${model} ${JSON.stringify(extra)}`;
        expect(ultra99.usd, `${label} ultra-99 usd`).toBe(expectedUltra99);
        expect(ultra99.usd, `${label} ultra-99 < pro`).toBeLessThan(pro.usd);
        expect(ultra99.usd, `${label} ultra-99 > ultra`).toBeGreaterThan(
          ultra.usd
        );
        expect(ultra99.breakdown.perUnitUsd, `${label} perUnitUsd`).toBe(
          expectedUltra99
        );
        expect(ultra99.warnings, `${label} ultra-99 warnings`).toEqual([]);
        expect(ultra99.rateAsOf, `${label} ultra-99 rateAsOf`).toBe(
          videoRateAsOf(model)
        );
      }
    });

    it("multiplies a plan rate by count", () => {
      const result = priceGoogleflow(
        "veo-3.1-fast",
        { count: 3 },
        { googleFlowPlan: "plus" }
      );
      expect(result.usd).toBeCloseTo(2.4, 10); // 3 * 20 credits * $0.04
      expect(result.breakdown.units).toBe(3);
    });

    it("veo-3.1-lite-low-priority is free on every plan (Ultra $199 only)", () => {
      // Ultra $199 runs it for 0 credits; every other plan is refused
      // upstream before any credit is drawn, so $0 is the real cost there too.
      for (const googleFlowPlan of [
        undefined,
        "plus",
        "pro",
        "ultra-99",
        "ultra",
      ]) {
        const result = priceGoogleflow(
          "veo-3.1-lite-low-priority",
          {},
          googleFlowPlan === undefined ? undefined : { googleFlowPlan }
        );
        expect(result.usd, String(googleFlowPlan)).toBe(0);
        expect(result.warnings, String(googleFlowPlan)).toEqual([]);
      }
    });

    // AC-4 / REQ-005: an unrecognized tier falls back to the Plus basis, the
    // highest credit value (never 0, never an under-charge), and warns, naming
    // the value (ac-1zjd41; it fell back to Pro while Plus was unmodelled).
    it("unknown plan tier falls back to Plus and warns naming the value", () => {
      for (const googleFlowPlan of ["platinum", "Pro", "ultra-199", ""]) {
        const result = priceGoogleflow("veo-3.1-fast", {}, { googleFlowPlan });
        // Plus basis: not 0, not the Pro 0.40, not the Ultra 0.08
        expect(result.usd, googleFlowPlan).toBe(0.8);
        expect(result.warnings, googleFlowPlan).toEqual([
          `googleflow: unknown plan tier '${googleFlowPlan}', using Plus basis`,
        ]);
      }
    });

    it("unknown plan tier still resolves on the omni-flash cross-product", () => {
      const result = priceGoogleflow(
        "omni-flash",
        { duration: 8 },
        { googleFlowPlan: "platinum" }
      );
      // Plus duration-8, not the zero-USD "no rate for variant" path.
      expect(result.usd).toBe(0.48);
      expect(result.warnings).toContain(
        "googleflow: unknown plan tier 'platinum', using Plus basis"
      );
    });

    // AC-2 / REQ-002: the tier is a cost-only side channel. A tier placed in
    // the payload the estimator would forward is ignored — it prices as the Pro
    // default, proving googleFlowPlan is read only from costHints.
    it("reads the tier only from costHints, never from payload", () => {
      const inPayload = computeEstimate({
        provider: "googleflow" as const,
        payload: {
          model: "veo-3.1-fast",
          prompt: "a cat",
          googleFlowPlan: "ultra",
        },
      });
      expect(inPayload.usd).toBe(0.4); // Pro default; payload field ignored
      expect(inPayload.warnings).toEqual([]);
    });

    // --- POST /images models (ac-j3d6ki.5) ---

    // Every Flow image model, the two deprecated aliases included. Flow
    // includes image generation in every plan, so each image is 0 credits on
    // every tier: a resolved $0 rate, not the "not found" miss these ids hit
    // before they were priced.
    const imageModels = [
      "nano-banana-2-lite",
      "nano-banana-2",
      "nano-banana-pro",
      "nano-banana",
      "imagen-4",
    ];

    it("prices every image model at 0 credits on the default Pro basis", () => {
      for (const model of imageModels) {
        const result = priceGoogleflow(model);
        expect(result.usd, model).toBe(0);
        expect(result.source, model).toBe("per-unit-table");
        // count defaults to 4 images on POST /images.
        expect(result.breakdown, model).toEqual({
          units: 4,
          unit: "images",
          perUnitUsd: 0,
        });
        expect(result.rateAsOf, model).toBe("2026-10-17");
        expect(result.warnings, model).toEqual([]);
      }
    });

    it("prices every image model at 0 credits on an explicit plan", () => {
      for (const model of imageModels) {
        for (const googleFlowPlan of ["plus", "ultra-99", "ultra"]) {
          const label = `${model} ${googleFlowPlan}`;
          const result = priceGoogleflow(model, {}, { googleFlowPlan });
          expect(result.usd, label).toBe(0);
          expect(result.breakdown, label).toEqual({
            units: 4,
            unit: "images",
            perUnitUsd: 0,
          });
          expect(result.warnings, label).toEqual([]);
        }

        const pro = priceGoogleflow(model, {}, { googleFlowPlan: "pro" });
        expect(pro, `${model} pro`).toEqual(priceGoogleflow(model));
      }
    });

    it("counts image variations and reads the plan the same way as video", () => {
      const one = priceGoogleflow("nano-banana-pro", { count: 1 });
      expect(one.breakdown.units).toBe(1);
      expect(one.usd).toBe(0);

      const unknownPlan = priceGoogleflow(
        "nano-banana-pro",
        {},
        { googleFlowPlan: "platinum" }
      );
      expect(unknownPlan.usd).toBe(0);
      expect(unknownPlan.breakdown.perUnitUsd).toBe(0);
      expect(unknownPlan.warnings).toEqual([
        "googleflow: unknown plan tier 'platinum', using Plus basis",
      ]);
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

  // A hint is a cost-only input: it must never reach the bytes the caller
  // POSTs upstream, and therefore never the bytes canonicalHash / mintOtp
  // sign. If estimating with a hint could change either, an OTP minted for a
  // payload before the estimate would stop verifying after it.
  describe("cost hints stay off the wire", () => {
    const buildPayload = () => ({
      model: "omnihuman-1-5",
      input: {
        image_url: "https://example.com/a.png",
        audio_url: "https://example.com/a.mp3",
      },
    });

    it("leaves canonicalHash(payload) byte-identical with and without a hint", () => {
      const payload = buildPayload();
      const before = canonicalHash(payload);

      computeEstimate({ provider: "kie" as const, payload });
      const withoutHint = canonicalHash(payload);

      const hinted = computeEstimate({
        provider: "kie" as const,
        payload,
        costHints: { durationSeconds: 8 },
      });
      const withHint = canonicalHash(payload);

      // The hint did bound the estimate — otherwise this test would pass
      // trivially on a code path that never reads costHints at all.
      expect(hinted.usd).toBeCloseTo(1.08, 10); // 8 * 0.135

      expect(before).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(withoutHint).toBe(before);
      expect(withHint).toBe(before);
    });

    it("does not mutate the caller's payload or add own keys", () => {
      const payload = buildPayload();
      const snapshot = structuredClone(payload);
      const keysBefore = Object.keys(payload);

      computeEstimate({
        provider: "kie" as const,
        payload,
        costHints: { durationSeconds: 8 },
      });

      expect(payload).toEqual(snapshot);
      expect(Object.keys(payload)).toEqual(keysBefore);
      expect("costHints" in payload).toBe(false);
      expect("durationSeconds" in payload).toBe(false);
    });
    it("keeps inputDurationSeconds off the wire for a wan 3.0 reference-video payload", () => {
      const payload = {
        model: "wan/3-0-video",
        input: {
          prompt: "x",
          resolution: "720P",
          duration: 5,
          reference_video_urls: ["https://example.com/clip.mp4"],
        },
      };
      const snapshot = structuredClone(payload);
      const before = canonicalHash(payload);

      const unhinted = computeEstimate({ provider: "kie" as const, payload });
      const hinted = computeEstimate({
        provider: "kie" as const,
        payload,
        costHints: { inputDurationSeconds: 10 },
      });
      const after = canonicalHash(payload);

      // The hint did change the figure — otherwise this test would pass on a
      // path that never reads costHints.inputDurationSeconds at all.
      expect(unhinted.usd).toBe(0);
      expect(hinted.usd).toBeCloseTo(1.2, 10); // (5 + 10) * 0.08

      expect(after).toBe(before);
      expect(payload).toEqual(snapshot);
      expect("costHints" in payload).toBe(false);
      expect("inputDurationSeconds" in payload.input).toBe(false);
    });

    // The same guarantee for each family that adopted the input-duration rule
    // after Wan 3.0 (ac-u8y5xg). Each case proves the hint changed the figure
    // first, so a path that never read costHints could not pass it.
    const expectInputHintOffTheWire = (
      payload: { model: string; input: Record<string, unknown> },
      costHints: { durationSeconds?: number; inputDurationSeconds: number },
      hintedUsd: number
    ) => {
      const snapshot = structuredClone(payload);
      const before = canonicalHash(payload);

      const unhinted = computeEstimate({ provider: "kie" as const, payload });
      const hinted = computeEstimate({
        provider: "kie" as const,
        payload,
        costHints,
      });
      const after = canonicalHash(payload);

      expect(unhinted.usd).not.toBeCloseTo(hintedUsd, 10);
      expect(hinted.usd).toBeCloseTo(hintedUsd, 10);

      expect(after).toBe(before);
      expect(payload).toEqual(snapshot);
      expect("costHints" in payload).toBe(false);
      expect("inputDurationSeconds" in payload.input).toBe(false);
      expect("durationSeconds" in payload.input).toBe(false);
    };

    it("keeps inputDurationSeconds off the wire for a seedance-2 reference-video payload", () => {
      expectInputHintOffTheWire(
        {
          model: "bytedance/seedance-2",
          input: {
            prompt: "x",
            resolution: "720p",
            duration: 5,
            reference_video_urls: ["https://example.com/clip.mp4"],
          },
        },
        { inputDurationSeconds: 10 },
        1.875 // (5 + 10) * 0.125
      );
    });

    it("keeps inputDurationSeconds off the wire for a seedance-2-5 reference-video payload", () => {
      expectInputHintOffTheWire(
        {
          model: "bytedance/seedance-2-5",
          input: {
            prompt: "x",
            resolution: "720p",
            duration: 6,
            reference_video_urls: ["https://example.com/clip.mp4"],
          },
        },
        { inputDurationSeconds: 6 },
        2.28 // (6 + 6) * 0.19
      );
    });

    it("keeps inputDurationSeconds off the wire for a minimax-h3 reference-video payload", () => {
      expectInputHintOffTheWire(
        {
          model: "minimax-h3/reference-to-video",
          input: {
            prompt: "x",
            resolution: "2K",
            duration: 6,
            reference_video_urls: ["https://example.com/clip.mp4"],
          },
        },
        { inputDurationSeconds: 4 },
        0.65 // (6 + 4) * 0.065
      );
    });

    it("keeps both hints off the wire for a happyhorse/video-edit payload", () => {
      expectInputHintOffTheWire(
        {
          model: "happyhorse/video-edit",
          input: {
            prompt: "x",
            resolution: "720p",
            video_url: "https://example.com/in.mp4",
          },
        },
        { durationSeconds: 6, inputDurationSeconds: 10 },
        2.24 // (6 + 10) * 0.14
      );
    });
  });
});
