import { describe, it, expect } from "vitest";
import {
  COST_TIERS,
  CHEAP_MAX_USD,
  EXPENSIVE_MAX_USD,
  classifyCostUsd,
  classifyEstimate,
  isCostPolicyKnown,
  computeEstimate,
  type CostEstimate,
  type CostTier,
} from "@apicity/cost";

/**
 * Canonical cost-tier policy.
 *
 * Locks down the single classification for the whole monorepo:
 *   • cheap       — estimated cost <= USD 0.01 (includes $0 free endpoints)
 *   • expensive   — USD 0.01 < cost <= USD 1.00
 *   • prohibitive — cost > USD 1.00, OR unknown/underivable cost policy
 */
describe("cost-tier — canonical boundary constants", () => {
  it("exposes the inclusive boundary constants", () => {
    expect(CHEAP_MAX_USD).toBe(0.01);
    expect(EXPENSIVE_MAX_USD).toBe(1.0);
  });

  it("lists tiers cheapest to most costly", () => {
    expect(COST_TIERS).toEqual(["cheap", "expensive", "prohibitive"]);
  });
});

describe("classifyCostUsd — inclusive boundaries", () => {
  it("$0 (free) → cheap", () => {
    expect(classifyCostUsd(0)).toBe<CostTier>("cheap");
  });

  it("just under the cheap boundary → cheap", () => {
    expect(classifyCostUsd(0.009)).toBe("cheap");
  });

  it("exactly 0.01 → cheap (inclusive top of cheap)", () => {
    expect(classifyCostUsd(0.01)).toBe("cheap");
  });

  it("just over 0.01 → expensive", () => {
    expect(classifyCostUsd(0.010001)).toBe("expensive");
    expect(classifyCostUsd(0.5)).toBe("expensive");
  });

  it("exactly 1.00 → expensive (inclusive top of expensive)", () => {
    expect(classifyCostUsd(1.0)).toBe("expensive");
  });

  it("just over 1.00 → prohibitive", () => {
    expect(classifyCostUsd(1.000001)).toBe("prohibitive");
    expect(classifyCostUsd(1.01)).toBe("prohibitive");
    expect(classifyCostUsd(1000)).toBe("prohibitive");
  });
});

describe("classifyCostUsd — fail-safe on unknown/invalid cost", () => {
  it("null / undefined → prohibitive", () => {
    expect(classifyCostUsd(null)).toBe("prohibitive");
    expect(classifyCostUsd(undefined)).toBe("prohibitive");
  });

  it("NaN / ±Infinity → prohibitive", () => {
    expect(classifyCostUsd(Number.NaN)).toBe("prohibitive");
    expect(classifyCostUsd(Number.POSITIVE_INFINITY)).toBe("prohibitive");
    expect(classifyCostUsd(Number.NEGATIVE_INFINITY)).toBe("prohibitive");
  });

  it("negative cost → prohibitive", () => {
    expect(classifyCostUsd(-0.001)).toBe("prohibitive");
  });
});

describe("isCostPolicyKnown", () => {
  const withBreakdown = (partial: Partial<CostEstimate>): CostEstimate => ({
    usd: 0,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {},
    rateAsOf: null,
    warnings: [],
    ...partial,
  });

  it("null / undefined → unknown", () => {
    expect(isCostPolicyKnown(null)).toBe(false);
    expect(isCostPolicyKnown(undefined)).toBe(false);
  });

  it("free source → known", () => {
    expect(isCostPolicyKnown(withBreakdown({ source: "free" }))).toBe(true);
  });

  it("applied token rate → known", () => {
    expect(
      isCostPolicyKnown(
        withBreakdown({
          source: "tokens-heuristic+table",
          breakdown: { inputUsdPerMillion: 5, outputUsdPerMillion: 15 },
        })
      )
    ).toBe(true);
  });

  it("applied per-unit rate → known", () => {
    expect(
      isCostPolicyKnown(withBreakdown({ breakdown: { perUnitUsd: 0.1 } }))
    ).toBe(true);
  });

  it("pricing-table miss (usd:0, no rate fields) → unknown", () => {
    expect(
      isCostPolicyKnown(
        withBreakdown({
          source: "tokens-heuristic+table",
          breakdown: { inputTokens: 100, outputTokens: 0, unit: "tokens" },
          warnings: ["model 'mystery' not found in pricing table"],
        })
      )
    ).toBe(false);
  });
});

describe("classifyEstimate", () => {
  it("no estimate (paid endpoint, no estimate) → prohibitive", () => {
    expect(classifyEstimate(null)).toBe("prohibitive");
    expect(classifyEstimate(undefined)).toBe("prohibitive");
  });

  it("unknown/underivable policy → prohibitive (fail-safe)", () => {
    // A table miss returns usd:0 but does not resolve a rate; it must NOT be
    // mistaken for a genuinely free/cheap endpoint.
    const tableMiss = computeEstimate({
      provider: "openai",
      payload: { model: "no-such-model", messages: [{ content: "hi" }] },
    });
    expect(tableMiss.usd).toBe(0);
    expect(classifyEstimate(tableMiss)).toBe("prohibitive");
  });

  it("genuinely free endpoint → cheap", () => {
    const free = computeEstimate({ provider: "free-media-upload" });
    expect(free.source).toBe("free");
    expect(classifyEstimate(free)).toBe("cheap");
  });

  it("classifies a real per-unit estimate by its derived usd", () => {
    // kie veo3_fast: $0.30 per video at the default 720p → expensive.
    const est = computeEstimate({
      provider: "kie",
      payload: { model: "veo3_fast", prompt: "a sunset", duration: 8 },
    });
    expect(est.usd).toBeCloseTo(0.3, 6);
    expect(classifyEstimate(est)).toBe("expensive");
  });

  it("classifies a cheap real estimate as cheap", () => {
    // elevenlabs flash v2.5: 100 chars × $0.00006 = $0.006 → cheap.
    const est = computeEstimate({
      provider: "elevenlabs",
      payload: { model_id: "eleven_flash_v2_5", text: "x".repeat(100) },
    });
    expect(est.usd).toBeCloseTo(0.006, 6);
    expect(classifyEstimate(est)).toBe("cheap");
  });
});
