import { describe, it, expect } from "vitest";
import {
  asString,
  asNumber,
  asObject,
  coerceSeconds,
} from "../../packages/provider/cost/src/pricing/helpers";
import {
  PRICING,
  PRICING_AS_OF,
} from "../../packages/provider/cost/src/pricing/index";
import { MODEL_SLUGS } from "../../packages/provider/cost/src/slugs";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

describe("pricing helpers", () => {
  describe("asString", () => {
    it("returns the string when input is a string", () => {
      expect(asString("hello")).toBe("hello");
      expect(asString("")).toBe("");
    });

    it("returns undefined for non-string values", () => {
      expect(asString(42)).toBeUndefined();
      expect(asString(null)).toBeUndefined();
      expect(asString(undefined)).toBeUndefined();
      expect(asString({})).toBeUndefined();
      expect(asString([])).toBeUndefined();
      expect(asString(true)).toBeUndefined();
    });
  });

  describe("asNumber", () => {
    it("returns the number when input is a finite number", () => {
      expect(asNumber(42)).toBe(42);
      expect(asNumber(0)).toBe(0);
      expect(asNumber(3.14)).toBe(3.14);
      expect(asNumber(-1)).toBe(-1);
    });

    it("returns undefined for non-number values", () => {
      expect(asNumber("42")).toBeUndefined();
      expect(asNumber(null)).toBeUndefined();
      expect(asNumber(undefined)).toBeUndefined();
      expect(asNumber({})).toBeUndefined();
      expect(asNumber([])).toBeUndefined();
    });

    it("returns undefined for non-finite numbers", () => {
      expect(asNumber(Infinity)).toBeUndefined();
      expect(asNumber(-Infinity)).toBeUndefined();
      expect(asNumber(NaN)).toBeUndefined();
    });
  });

  describe("asObject", () => {
    it("returns the object when input is a plain object", () => {
      const obj = { a: 1 };
      expect(asObject(obj)).toBe(obj);
      expect(asObject({})).toEqual({});
    });

    it("returns undefined for non-object values", () => {
      expect(asObject("hello")).toBeUndefined();
      expect(asObject(42)).toBeUndefined();
      expect(asObject(null)).toBeUndefined();
      expect(asObject(undefined)).toBeUndefined();
      expect(asObject([])).toBeUndefined();
    });

    it("returns undefined for arrays", () => {
      expect(asObject([1, 2, 3])).toBeUndefined();
    });
  });

  describe("coerceSeconds", () => {
    it("returns number input directly", () => {
      expect(coerceSeconds(5)).toBe(5);
      expect(coerceSeconds(10)).toBe(10);
      expect(coerceSeconds(0)).toBe(0);
      expect(coerceSeconds(3.5)).toBe(3.5);
    });

    it("parses '5s' style strings", () => {
      expect(coerceSeconds("5s")).toBe(5);
      expect(coerceSeconds("10s")).toBe(10);
      expect(coerceSeconds("120s")).toBe(120);
    });

    it("parses bare digit strings", () => {
      expect(coerceSeconds("6")).toBe(6);
      expect(coerceSeconds("30")).toBe(30);
    });

    it("parses decimal strings", () => {
      expect(coerceSeconds("5.5")).toBe(5.5);
      expect(coerceSeconds("5.5s")).toBe(5.5);
    });

    it("returns undefined for non-numeric strings", () => {
      expect(coerceSeconds("hello")).toBeUndefined();
      expect(coerceSeconds("")).toBeUndefined();
      expect(coerceSeconds("s5")).toBeUndefined();
    });

    it("returns undefined for non-finite values", () => {
      expect(coerceSeconds(Infinity)).toBeUndefined();
      expect(coerceSeconds(NaN)).toBeUndefined();
      expect(coerceSeconds(null)).toBeUndefined();
      expect(coerceSeconds(undefined)).toBeUndefined();
    });
  });
});

describe("PRICING data", () => {
  it("has PRICING_AS_OF as a valid date string", () => {
    expect(PRICING_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(
      new Date(PRICING_AS_OF).toISOString().startsWith(PRICING_AS_OF)
    ).toBe(true);
  });

  it("has all expected providers", () => {
    expect(Object.keys(PRICING)).toEqual(
      expect.arrayContaining([
        "alibaba",
        "anthropic",
        "elevenlabs",
        "fireworks",
        "kimicoding",
        "kie",
        "openai",
        "xai",
      ])
    );
  });

  it("alibaba has token-priced models", () => {
    expect(PRICING.alibaba["qwen3.6-plus"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.325, output: 1.95 },
    });
    expect(PRICING.alibaba["qwen3.5-0.8b"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.01, output: 0.04 },
    });
  });

  it("alibaba prices every registered image model per image", () => {
    const perImage: Record<string, number> = {
      "qwen-image-2.0": 0.035,
      "qwen-image-2.0-pro": 0.075,
      "qwen-image-edit": 0.045,
      "qwen-image-edit-plus": 0.03,
      "qwen-image-edit-max": 0.075,
      "wan2.7-image-pro": 0.075,
    };
    for (const [model, rate] of Object.entries(perImage)) {
      expect(PRICING.alibaba[model]).toMatchObject({
        kind: "perUnit",
        unit: "images",
        rates: { "": rate },
      });
    }
  });

  it("alibaba prices wan2.7 video at a flat per-second rate", () => {
    for (const model of ["wan2.7-i2v", "wan2.7-videoedit"]) {
      expect(PRICING.alibaba[model]).toMatchObject({
        kind: "perUnit",
        unit: "seconds",
        select: [],
        rates: { "": 0.1 },
      });
    }
  });

  it("stamps the new alibaba media rates with their own asOf", () => {
    const entry = PRICING.alibaba["wan2.7-i2v"];
    expect(entry.source.asOf).toBe("2026-07-20");
    expect(entry.source.asOf).not.toBe(PRICING_AS_OF);
  });

  // AC-017: the slug registry and the pricing table are two halves of one
  // fact. Registering a slug without a rate produced the split this item
  // fixes, so walk the registry rather than pinning today's model list.
  it("has a PRICING entry for every registered alibaba slug", () => {
    const unpriced = Object.keys(MODEL_SLUGS.alibaba).filter(
      (model) => PRICING.alibaba[model] === undefined
    );
    expect(unpriced).toEqual([]);
  });

  it("openai has token-priced models", () => {
    expect(PRICING.openai["gpt-5"]).toMatchObject({
      kind: "tokens",
      rate: { input: 1.25, output: 10 },
    });
    expect(PRICING.openai["gpt-4o-mini"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.15, output: 0.6 },
    });
  });

  it("anthropic has token-priced models with cache rates", () => {
    expect(PRICING.anthropic["claude-opus-4-7"]).toMatchObject({
      kind: "tokens",
      rate: { input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25 },
    });
  });

  it("xai has token-priced models", () => {
    expect(PRICING.xai["grok-4"]).toMatchObject({
      kind: "tokens",
      rate: { input: 3, output: 15 },
    });
    expect(PRICING.xai["grok-build-0.1"]).toMatchObject({
      kind: "tokens",
      rate: { input: 1, output: 2, cacheRead: 0.2 },
    });
    expect(PRICING.xai["grok-code-fast-1"]).toBe(PRICING.xai["grok-build-0.1"]);
    expect(PRICING.xai["grok-code-fast"]).toBe(PRICING.xai["grok-build-0.1"]);
    expect(PRICING.xai["grok-code-fast-1-0825"]).toBe(
      PRICING.xai["grok-build-0.1"]
    );
  });

  it("xai has per-second video rates", () => {
    expect(PRICING.xai["grok-imagine-video"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.05 },
    });
    expect(PRICING.xai["grok-imagine-video-1.5"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.08 },
    });
    // The provider exports the preview id; it prices at the released rate.
    expect(PRICING.xai["grok-imagine-video-1.5-preview"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.08 },
    });
  });

  it("xai has per-generation image rates", () => {
    expect(PRICING.xai["grok-imagine-image"]).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "": 0.02 },
    });
    expect(PRICING.xai["grok-imagine-image-quality"]).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "": 0.05 },
    });
  });

  it("every xai media rate carries a source url and asOf stamp", () => {
    for (const [model, entry] of Object.entries(PRICING.xai)) {
      if (entry.kind !== "perUnit") continue;
      expect(entry.source.url, model).toMatch(/^https:\/\/docs\.x\.ai\//);
      expect(entry.source.asOf, model).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // Review finding R-3: the per-unit route is derived from the table's own
  // `kind`, so the set of per-unit xai models is pinned here rather than in a
  // hand-maintained endpoint allowlist that could drift from it.
  it("marks exactly the Grok Imagine media models as per-unit", () => {
    const perUnit = Object.entries(PRICING.xai)
      .filter(([, entry]) => entry.kind === "perUnit")
      .map(([model]) => model)
      .sort();
    expect(perUnit).toEqual([
      "grok-imagine-image",
      "grok-imagine-image-quality",
      "grok-imagine-video",
      "grok-imagine-video-1.5",
      "grok-imagine-video-1.5-preview",
    ]);
  });

  it("kimicoding has token-priced models", () => {
    expect(PRICING.kimicoding["kimi-k2.6"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.95, output: 4, cacheRead: 0.16 },
    });
  });

  it("fireworks has token-priced models", () => {
    expect(PRICING.fireworks["deepseek-v3"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.56, output: 1.68 },
    });
  });

  it("elevenlabs has per-unit (character) pricing", () => {
    expect(PRICING.elevenlabs.eleven_flash_v2_5).toMatchObject({
      kind: "perUnit",
      unit: "characters",
      rates: { "": 0.00006 },
    });
  });

  it("kie has per-unit pricing for video", () => {
    expect(PRICING.kie.veo3).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.3 },
    });
  });

  it("kie has tiered per-unit pricing for kling", () => {
    expect(PRICING.kie["kling-3.0/video"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: {
        std: 0.07,
        "std|sound": 0.1,
        pro: 0.09,
        "pro|sound": 0.135,
        "4K": 0.335,
        "4K|sound": 0.335,
      },
    });
  });

  it("fal has flat per-image pricing", () => {
    expect(PRICING.fal["fal-ai/nano-banana"]).toMatchObject({
      kind: "perUnit",
      unit: "images",
      rates: { "": 0.039 },
    });
  });

  it("fal has resolution-tiered per-image pricing", () => {
    expect(PRICING.fal["fal-ai/nano-banana-pro"]).toMatchObject({
      kind: "perUnit",
      unit: "images",
      rates: { "1K": 0.15, "2K": 0.15, "4K": 0.3 },
    });
  });

  it("fal has per-megapixel pricing for area-billed models", () => {
    expect(PRICING.fal["fal-ai/flux/dev"]).toMatchObject({
      kind: "perUnit",
      unit: "megapixels",
      rates: { "": 0.025 },
    });
  });

  it("every fal rate carries a source url and an asOf stamp", () => {
    for (const [model, entry] of Object.entries(PRICING.fal)) {
      expect(entry.source.url, `fal/${model} url`).toMatch(
        /^https:\/\/fal\.ai\/models\//
      );
      expect(entry.source.asOf, `fal/${model} asOf`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    }
  });

  it("kie has flat per-second pricing for the lip-sync models", () => {
    expect(PRICING.kie["omnihuman-1-5"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.135 },
    });
    expect(PRICING.kie["volcengine/video-to-video-lip-sync"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.04 },
    });
  });

  it("kie lip-sync entries carry a source url and asOf stamp", () => {
    for (const model of [
      "omnihuman-1-5",
      "volcengine/video-to-video-lip-sync",
    ]) {
      const entry = PRICING.kie[model];
      expect(entry.source.url, model).toMatch(/^https:\/\/kie\.ai\//);
      expect(entry.source.asOf, model).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("kie lip-sync requests return estimates", () => {
    const omni = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "omnihuman-1-5",
        duration: 8,
        input: { image_url: "https://example.com/a.png" },
      },
    });
    expect(omni.usd).toBeCloseTo(1.08, 10); // 8 * 0.135
    expect(omni.source).toBe("per-unit-table");
    expect(omni.breakdown).toMatchObject({
      units: 8,
      unit: "seconds",
      perUnitUsd: 0.135,
    });
    expect(omni.warnings).toEqual([]);

    const lipSync = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { duration: 12, mode: "basic" },
      },
    });
    expect(lipSync.usd).toBeCloseTo(0.48, 10); // 12 * 0.04
    expect(lipSync.source).toBe("per-unit-table");
    expect(lipSync.warnings).toEqual([]);
  });

  it("kie lip-sync rate is flat across mode and resolution", () => {
    const lite = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { duration: 10, mode: "lite" },
      },
    });
    const basic = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { duration: 10, mode: "basic" },
      },
    });
    expect(lite.usd).toBe(basic.usd);

    const at720 = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "omnihuman-1-5",
        duration: 5,
        input: { output_resolution: "720" },
      },
    });
    const at1080 = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "omnihuman-1-5",
        duration: 5,
        input: { output_resolution: "1080" },
      },
    });
    expect(at720.usd).toBe(at1080.usd);
  });

  it("every pricing entry has a source", () => {
    for (const [provider, models] of Object.entries(PRICING)) {
      for (const [model, entry] of Object.entries(models)) {
        expect(entry.source, `${provider}/${model}`).toBeDefined();
        expect(entry.source.url, `${provider}/${model}`).toBeTruthy();
      }
    }
  });

  it("token entries have input and output rates", () => {
    for (const [provider, models] of Object.entries(PRICING)) {
      for (const [model, entry] of Object.entries(models)) {
        if (entry.kind === "tokens") {
          expect(entry.rate.input, `${provider}/${model} input`).toBeDefined();
          expect(
            entry.rate.output,
            `${provider}/${model} output`
          ).toBeDefined();
          expect(
            entry.rate.input,
            `${provider}/${model} input`
          ).toBeGreaterThanOrEqual(0);
          expect(
            entry.rate.output,
            `${provider}/${model} output`
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("has a googleflow rate for every registered googleflow slug", () => {
    for (const model of Object.keys(MODEL_SLUGS.googleflow)) {
      expect(PRICING.googleflow[model], model).toBeDefined();
    }
  });

  it("stamps googleflow rates with their own asOf, ahead of the global", () => {
    for (const [model, entry] of Object.entries(PRICING.googleflow)) {
      expect(entry.source.asOf, model).toBe("2026-07-20");
      expect(Date.parse(entry.source.asOf as string), model).toBeGreaterThan(
        Date.parse(PRICING_AS_OF)
      );
    }
  });

  it("per-unit entries have at least one rate", () => {
    for (const [provider, models] of Object.entries(PRICING)) {
      for (const [model, entry] of Object.entries(models)) {
        if (entry.kind === "perUnit") {
          expect(
            Object.keys(entry.rates).length,
            `${provider}/${model} rates`
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});
