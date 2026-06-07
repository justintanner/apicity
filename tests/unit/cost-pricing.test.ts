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
