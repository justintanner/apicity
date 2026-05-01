import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { cost, PRICING_AS_OF } from "@apicity/cost";

describe("cost.estimate — pure-math providers (no network)", () => {
  it("free → $0", async () => {
    const c = cost({});
    const r = await c.estimate({ provider: "free" });
    expect(r.usd).toBe(0);
    expect(r.source).toBe("free");
    expect(r.warnings).toEqual([]);
    expect(r.rateAsOf).toBe(PRICING_AS_OF);
  });

  it("elevenlabs flash v2.5 → 1000 chars × $0.00006", async () => {
    const c = cost({});
    const r = await c.estimate({
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

  it("kie veo3_fast → 8 seconds × $0.10", async () => {
    const c = cost({});
    const r = await c.estimate({
      provider: "kie",
      payload: { model: "veo3_fast", prompt: "a sunset", duration: 8 },
    });
    expect(r.usd).toBeCloseTo(0.8, 6);
    expect(r.source).toBe("per-unit-table");
    expect(r.breakdown.unit).toBe("seconds");
    expect(r.breakdown.units).toBe(8);
  });

  it("kie seedance-2 i2v 720p resolves to seedance-2-720p-i2v rate", async () => {
    const c = cost({});
    const r = await c.estimate({
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

  it("kie seedance-2 t2v (no first_frame) resolves to seedance-2-720p-t2v rate", async () => {
    const c = cost({});
    const r = await c.estimate({
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

  it("kie kling-3.0/video coerces '5s' duration string", async () => {
    const c = cost({});
    const r = await c.estimate({
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

  it("kie unknown model → warning + $0", async () => {
    const c = cost({});
    const r = await c.estimate({
      provider: "kie",
      payload: { model: "totally-fake-model", duration: 4 },
    });
    expect(r.usd).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/totally-fake-model/);
  });

  it("kie video model with no duration → warning", async () => {
    const c = cost({});
    const r = await c.estimate({
      provider: "kie",
      payload: { model: "veo3_fast" },
    });
    expect(r.usd).toBe(0);
    expect(r.warnings[0]).toMatch(/duration/);
  });

  it("fireworks heuristic → chars/4 × deepseek-v3 rate", async () => {
    const c = cost({});
    const text = "x".repeat(400);
    const r = await c.estimate({
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

  it("alibaba heuristic — unknown model emits warning, usd=0", async () => {
    const c = cost({});
    const r = await c.estimate({
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

  it("openai heuristic mode skips network, uses chars/4", async () => {
    const c = cost({ openai: { apiKey: "sk-test" } });
    const text = "y".repeat(800);
    const r = await c.estimate({
      provider: "openai",
      payload: {
        model: "gpt-5",
        messages: [{ role: "user", content: text }],
        max_completion_tokens: 1000,
      },
      useHeuristic: true,
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBe(200);
    const expected = (200 * 1.25 + 1000 * 10) / 1_000_000;
    expect(r.usd).toBeCloseTo(expected, 9);
  });

  it("anthropic heuristic mode → chars/4 × claude-haiku-4-5 rate", async () => {
    const c = cost({ anthropic: { apiKey: "sk-ant-test" } });
    const r = await c.estimate({
      provider: "anthropic",
      payload: {
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: "x".repeat(400) }],
        max_tokens: 200,
      },
      useHeuristic: true,
    });
    expect(r.source).toBe("tokens-heuristic+table");
    expect(r.breakdown.inputTokens).toBe(100);
    const expected = (100 * 1 + 200 * 5) / 1_000_000;
    expect(r.usd).toBeCloseTo(expected, 9);
  });

  it("anthropic heuristic includes system prompt in token count", async () => {
    const c = cost({ anthropic: { apiKey: "sk-ant-test" } });
    const r = await c.estimate({
      provider: "anthropic",
      payload: {
        model: "claude-haiku-4-5",
        system: "y".repeat(200),
        messages: [{ role: "user", content: "x".repeat(200) }],
        max_tokens: 100,
      },
      useHeuristic: true,
    });
    // 200 system + 1 join newline + 200 user = 401 chars → ceil(401/4) = 101
    expect(r.breakdown.inputTokens).toBe(101);
  });

  it("kimicoding routes to heuristic-only (upstream count-tokens not available)", async () => {
    const c = cost({ kimicoding: { apiKey: "sk-test" } });
    const r = await c.estimate({
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

  it("missing max_tokens emits warning", async () => {
    const c = cost({});
    const r = await c.estimate({
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

describe("cost.estimate — upstream token APIs (replay)", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("openai gpt-5 → input_tokens × $1.25 + max_tokens × $10", async () => {
    ctx = setupPolly("cost/usd-openai-gpt-5");
    const c = cost({
      openai: { apiKey: process.env.OPENAI_API_KEY ?? "sk-test" },
    });
    const r = await c.estimate({
      provider: "openai",
      payload: {
        model: "gpt-5",
        input: "Estimate the cost of this short prompt.",
        max_tokens: 200,
      },
    });
    expect(r.source).toBe("tokens-api+table");
    expect(r.breakdown.inputTokens).toBeGreaterThan(0);
    expect(r.breakdown.inputUsdPerMillion).toBe(1.25);
    expect(r.breakdown.outputUsdPerMillion).toBe(10);
    expect(r.usd).toBeGreaterThan(0);
  });

  // Anthropic upstream-tokens path is supported by the dispatcher but not
  // exercised here — the 1Password ANTHROPIC_API_KEY in this vault returns
  // 401, so we cannot record a clean fixture. Heuristic path is covered above.

  it("xai grok-4-fast → tokenize-text upstream → bundled rate", async () => {
    ctx = setupPolly("cost/usd-xai-grok-4-fast");
    const c = cost({
      xai: { apiKey: process.env.XAI_API_KEY ?? "xai-test" },
    });
    const r = await c.estimate({
      provider: "xai",
      payload: {
        model: "grok-4-fast",
        text: "What does this cost?",
        max_tokens: 100,
      },
    });
    expect(r.source).toBe("tokens-api+table");
    expect(r.breakdown.inputTokens).toBeGreaterThan(0);
    expect(r.breakdown.inputUsdPerMillion).toBe(0.2);
    expect(r.breakdown.outputUsdPerMillion).toBe(0.5);
  });
});

describe("cost.estimate — fal upstream-usd (replay)", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("fal returns upstream USD verbatim, source='upstream-usd'", async () => {
    ctx = setupPolly("cost/usd-fal-flux-dev");
    const c = cost({
      fal: { apiKey: process.env.FAL_API_KEY ?? "fal-test-key" },
    });
    const r = await c.estimate({
      provider: "fal",
      endpoint_id: "fal-ai/flux/dev",
      payload: { unit_quantity: 100 },
    });
    expect(r.source).toBe("upstream-usd");
    expect(r.usd).toBeGreaterThanOrEqual(0);
    expect(r.rateAsOf).toBeNull();
  });
});
