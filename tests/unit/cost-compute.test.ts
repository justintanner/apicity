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
