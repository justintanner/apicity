import { describe, it, expect } from "vitest";
import { cost, PRICING_AS_OF } from "@apicity/cost";

describe("cost.estimate — pure-table (no network)", () => {
  it("free → $0", () => {
    const c = cost();
    const r = c.estimate({ provider: "free" });
    expect(r.usd).toBe(0);
    expect(r.source).toBe("free");
    expect(r.warnings).toEqual([]);
    expect(r.rateAsOf).toBe(PRICING_AS_OF);
  });

  it("elevenlabs flash v2.5 → 1000 chars × $0.00006", () => {
    const c = cost();
    const r = c.estimate({
      provider: "elevenlabs",
      payload: {
        model_id: "eleven_flash_v2_5",
        text: "x".repeat(1000),
        voice_settings: { stability: 0.5 },
      },
    });
    expect(r.usd).toBeCloseTo(0.06, 6);
    expect(r.source).toBe("per-unit-table");
    expect(r.breakdown.unit).toBe("characters");
    expect(r.breakdown.units).toBe(1000);
    expect(r.warnings).toEqual([]);
  });

  it("kie veo3_fast → 8 seconds × $0.10", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: { model: "veo3_fast", prompt: "a sunset", duration: 8 },
    });
    expect(r.usd).toBeCloseTo(0.8, 6);
    expect(r.source).toBe("per-unit-table");
    expect(r.breakdown.unit).toBe("seconds");
    expect(r.breakdown.units).toBe(8);
  });

  it("kie seedance-2 i2v 720p resolves to seedance-2-720p-i2v rate", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "bytedance/seedance-2",
        input: {
          prompt: "x",
          first_frame_url: "https://example.com/img.jpg",
          resolution: "720p",
          duration: 8,
          web_search: false,
        },
      },
    });
    expect(r.source).toBe("per-unit-table");
    expect(r.breakdown.units).toBe(8);
    expect(r.breakdown.perUnitUsd).toBe(0.125);
    expect(r.usd).toBeCloseTo(0.125 * 8, 6);
  });

  it("kie seedance-2 t2v (no first_frame) resolves to seedance-2-720p-t2v rate", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "bytedance/seedance-2",
        input: {
          prompt: "x",
          resolution: "720p",
          duration: 8,
          web_search: false,
        },
      },
    });
    expect(r.breakdown.perUnitUsd).toBe(0.205);
    expect(r.usd).toBeCloseTo(0.205 * 8, 6);
  });

  it("kie kling-3.0/video coerces '5s' duration string", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "kling-3.0/video",
        input: {
          prompt: "x",
          sound: false,
          duration: "5s",
          mode: "std",
          multi_shots: false,
        },
      },
    });
    expect(r.breakdown.units).toBe(5);
    expect(r.usd).toBeCloseTo(0.07 * 5, 6);
  });

  it("kie unknown model → warning + $0", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: { model: "totally-fake-model", duration: 4 },
    });
    expect(r.usd).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/totally-fake-model/);
  });

  it("kie video model with no duration → warning", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: { model: "veo3_fast" },
    });
    expect(r.usd).toBe(0);
    expect(r.warnings[0]).toMatch(/duration/);
  });

  it("fireworks heuristic → chars/4 × deepseek-v3 rate", () => {
    const c = cost();
    const text = "x".repeat(400);
    const r = c.estimate({
      provider: "fireworks",
      payload: {
        model: "deepseek-v3",
        messages: [{ role: "user", content: text }],
        max_tokens: 100,
      },
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBe(100);
    expect(r.breakdown.outputTokens).toBe(100);
    const expected = (100 * 0.56 + 100 * 1.68) / 1_000_000;
    expect(r.usd).toBeCloseTo(expected, 9);
  });

  it("alibaba heuristic — unknown model emits warning, usd=0", () => {
    const c = cost();
    const r = c.estimate({
      provider: "alibaba",
      payload: {
        model: "qwen-not-priced-yet",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 50,
      },
    });
    expect(r.usd).toBe(0);
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.warnings.some((w) => w.includes("qwen-not-priced-yet"))).toBe(
      true
    );
  });

  it("openai heuristic → chars/4 × gpt-5 rate", () => {
    const c = cost();
    const text = "y".repeat(800);
    const r = c.estimate({
      provider: "openai",
      payload: {
        model: "gpt-5",
        messages: [{ role: "user", content: text }],
        max_completion_tokens: 1000,
      },
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBe(200);
    const expected = (200 * 1.25 + 1000 * 10) / 1_000_000;
    expect(r.usd).toBeCloseTo(expected, 9);
  });

  it("anthropic heuristic → chars/4 × claude-haiku-4-5 rate", () => {
    const c = cost();
    const r = c.estimate({
      provider: "anthropic",
      payload: {
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "x".repeat(400) }],
        max_tokens: 200,
      },
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBe(100);
    const expected = (100 * 1 + 200 * 5) / 1_000_000;
    expect(r.usd).toBeCloseTo(expected, 9);
  });

  it("anthropic heuristic includes system prompt in token count", () => {
    const c = cost();
    const r = c.estimate({
      provider: "anthropic",
      payload: {
        model: "claude-haiku-4-5",
        system: "y".repeat(200),
        messages: [{ role: "user", content: "x".repeat(200) }],
        max_tokens: 100,
      },
    });
    // 200 system + 1 join newline + 200 user = 401 chars → ceil(401/4) = 101
    expect(r.breakdown.inputTokens).toBe(101);
  });

  it("xai grok-4-fast → chars/4 heuristic × bundled rate", () => {
    const c = cost();
    const r = c.estimate({
      provider: "xai",
      payload: {
        model: "grok-4-fast",
        text: "What does this cost?",
        max_tokens: 100,
      },
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBeGreaterThan(0);
    expect(r.breakdown.inputUsdPerMillion).toBe(0.2);
    expect(r.breakdown.outputUsdPerMillion).toBe(0.5);
  });

  it("kimicoding routes to heuristic-only", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kimicoding",
      payload: {
        model: "kimi-k2.6",
        messages: [{ role: "user", content: "x".repeat(80) }],
        max_tokens: 100,
      },
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBe(20);
    const expected = (20 * 0.95 + 100 * 4) / 1_000_000;
    expect(r.usd).toBeCloseTo(expected, 9);
  });

  it("kie grok-imagine/text-to-image (default) → flat $0.02/generation", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "grok-imagine/text-to-image",
        input: { prompt: "a sunset" },
      },
    });
    expect(r.source).toBe("per-unit-table");
    expect(r.breakdown.unit).toBe("generations");
    expect(r.breakdown.units).toBe(1);
    expect(r.breakdown.perUnitUsd).toBe(0.02);
    expect(r.usd).toBeCloseTo(0.02, 6);
  });

  it("kie grok-imagine/text-to-image (enable_pro) → flat $0.025/generation", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "grok-imagine/text-to-image",
        input: { prompt: "a sunset", enable_pro: true },
      },
    });
    expect(r.breakdown.perUnitUsd).toBe(0.025);
    expect(r.usd).toBeCloseTo(0.025, 6);
  });

  it("kie grok-imagine/image-to-image → flat $0.02/generation", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "grok-imagine/image-to-image",
        input: {
          prompt: "make it red",
          image_urls: ["https://example.com/in.jpg"],
        },
      },
    });
    expect(r.breakdown.unit).toBe("generations");
    expect(r.usd).toBeCloseTo(0.02, 6);
  });

  it("kie grok-imagine/extend resolves (extend_times, resolution) variant", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "grok-imagine/extend",
        input: {
          task_id: "abc",
          prompt: "more",
          extend_at: "5",
          extend_times: "10",
        },
        resolution: "720p",
      },
    });
    expect(r.breakdown.unit).toBe("generations");
    expect(r.breakdown.perUnitUsd).toBe(0.15);
    expect(r.usd).toBeCloseTo(0.15, 6);
  });

  it("kie grok-imagine/extend without resolution hint warns", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "grok-imagine/extend",
        input: {
          task_id: "abc",
          prompt: "more",
          extend_at: "5",
          extend_times: "6",
        },
      },
    });
    expect(r.usd).toBe(0);
    expect(r.warnings.some((w) => w.includes("variant '6'"))).toBe(true);
  });

  it("kie happyhorse/video-edit 1080p → $0.265/s with top-level duration hint", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "happyhorse/video-edit",
        input: {
          prompt: "make it sepia",
          video_url: "https://example.com/in.mp4",
          resolution: "1080p",
        },
        duration: 8,
      },
    });
    expect(r.breakdown.unit).toBe("seconds");
    expect(r.breakdown.units).toBe(8);
    expect(r.breakdown.perUnitUsd).toBe(0.265);
    expect(r.usd).toBeCloseTo(0.265 * 8, 6);
  });

  it("kie happyhorse/video-edit 720p → $0.155/s", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "happyhorse/video-edit",
        input: {
          prompt: "make it sepia",
          video_url: "https://example.com/in.mp4",
          resolution: "720p",
        },
        duration: 5,
      },
    });
    expect(r.breakdown.perUnitUsd).toBe(0.155);
    expect(r.usd).toBeCloseTo(0.155 * 5, 6);
  });

  it("kie suno/generate via endpoint hint → $0.06/generation regardless of model version", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      endpoint: "suno/generate",
      payload: {
        model: "V5",
        prompt: "epic synthwave",
        instrumental: false,
        customMode: true,
        callBackUrl: "https://example.com/cb",
      },
    });
    expect(r.source).toBe("per-unit-table");
    expect(r.breakdown.unit).toBe("generations");
    expect(r.breakdown.perUnitUsd).toBe(0.06);
    expect(r.usd).toBeCloseTo(0.06, 6);
  });

  it("kie suno endpoint pricing is independent of model version", () => {
    const c = cost();
    const v3 = c.estimate({
      provider: "kie",
      endpoint: "suno/generate",
      payload: { model: "V3_5", prompt: "x", customMode: false },
    });
    const v55 = c.estimate({
      provider: "kie",
      endpoint: "suno/generate",
      payload: { model: "V5_5", prompt: "x", customMode: false },
    });
    expect(v3.usd).toBe(v55.usd);
  });

  it("kie suno/vocal-removal-generate separate_vocal → $0.05", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      endpoint: "suno/vocal-removal-generate",
      payload: {
        taskId: "abc",
        audioId: "xyz",
        callBackUrl: "https://example.com/cb",
        type: "separate_vocal",
      },
    });
    expect(r.breakdown.perUnitUsd).toBe(0.05);
    expect(r.usd).toBeCloseTo(0.05, 6);
  });

  it("kie suno/vocal-removal-generate split_stem → $0.25", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      endpoint: "suno/vocal-removal-generate",
      payload: {
        taskId: "abc",
        audioId: "xyz",
        callBackUrl: "https://example.com/cb",
        type: "split_stem",
      },
    });
    expect(r.breakdown.perUnitUsd).toBe(0.25);
    expect(r.usd).toBeCloseTo(0.25, 6);
  });

  it("kie suno/lyrics → $0.002/generation", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      endpoint: "suno/lyrics",
      payload: { prompt: "rain", callBackUrl: "https://example.com/cb" },
    });
    expect(r.usd).toBeCloseTo(0.002, 6);
  });

  it("kie sora-watermark-remover → $0.05/generation", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "sora-watermark-remover",
        input: { video_url: "https://example.com/in.mp4" },
      },
    });
    expect(r.breakdown.unit).toBe("generations");
    expect(r.usd).toBeCloseTo(0.05, 6);
  });

  it("kie endpoint hint takes precedence over payload.model", () => {
    const c = cost();
    // payload.model would resolve to veo3_fast ($0.10/s × 8 = $0.80),
    // but endpoint=suno/generate forces a flat $0.06 lookup.
    const r = c.estimate({
      provider: "kie",
      endpoint: "suno/generate",
      payload: { model: "veo3_fast", prompt: "...", duration: 8 },
    });
    expect(r.usd).toBeCloseTo(0.06, 6);
  });

  it("kie nano-banana-pro 2K → $0.09/image", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "nano-banana-pro",
        input: { prompt: "a cat", resolution: "2K" },
      },
    });
    expect(r.breakdown.unit).toBe("images");
    expect(r.breakdown.perUnitUsd).toBe(0.09);
    expect(r.usd).toBeCloseTo(0.09, 6);
  });

  it("kie nano-banana-pro 4K → $0.12/image", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "nano-banana-pro",
        input: { prompt: "a cat", resolution: "4K" },
      },
    });
    expect(r.breakdown.perUnitUsd).toBe(0.12);
    expect(r.usd).toBeCloseTo(0.12, 6);
  });

  it("kie grok-imagine/upscale → flat $0.05/generation", () => {
    const c = cost();
    const r = c.estimate({
      provider: "kie",
      payload: {
        model: "grok-imagine/upscale",
        input: { task_id: "abc" },
      },
    });
    expect(r.breakdown.unit).toBe("generations");
    expect(r.usd).toBeCloseTo(0.05, 6);
  });

  it("missing max_tokens emits warning", () => {
    const c = cost();
    const r = c.estimate({
      provider: "fireworks",
      payload: {
        model: "deepseek-v3",
        messages: [{ role: "user", content: "abcd" }],
      },
    });
    expect(r.warnings.some((w) => w.includes("maxOutputTokens"))).toBe(true);
    expect(r.breakdown.outputTokens).toBe(0);
  });
});
