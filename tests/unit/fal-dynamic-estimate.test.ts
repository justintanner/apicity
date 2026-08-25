import { describe, expect, it } from "vitest";
import {
  isFalDynamicPricingEndpoint,
  resolveFalDynamicEstimate,
  type FalEstimateLike,
  type FalEstimator,
} from "@apicity/cost";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";

// `@apicity/cost` stays dependency-free and performs no I/O; the estimator is
// injected, so every case here is offline by construction — no Polly, no
// network, no provider import (ac-nz65nc).

const DYNAMIC = "alibaba/wan-3.0/text-to-video";
const STATIC = "alibaba/wan-3.0-prime/text-to-video";

const estimator = (
  answer: FalEstimateLike | Error,
  calls: unknown[] = []
): FalEstimator => {
  return async (request) => {
    calls.push(request);
    if (answer instanceof Error) throw answer;
    return answer;
  };
};

describe("resolveFalDynamicEstimate", () => {
  it("knows which endpoints are deliberately unpriced", () => {
    expect(isFalDynamicPricingEndpoint(DYNAMIC)).toBe(true);
    expect(isFalDynamicPricingEndpoint(STATIC)).toBe(false);
    for (const endpoint of FAL_DYNAMIC_PRICING_ENDPOINTS) {
      expect(isFalDynamicPricingEndpoint(endpoint), endpoint).toBe(true);
    }
  });

  it("returns the remote total for a dynamic endpoint", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      { prompt: "a red panda", duration: 5 },
      estimator({ total_cost: 0.0341, currency: "USD" }, calls)
    );
    expect(result.usd).toBeCloseTo(0.0341, 12);
    expect(result.currency).toBe("USD");
    expect(result.warnings).toEqual([]);
    // Priced as of now, not as of a table pull.
    expect(result.rateAsOf).toBeNull();
    expect(calls).toEqual([
      {
        estimate_type: "unit_price",
        endpoints: { [DYNAMIC]: { prompt: "a red panda", duration: 5 } },
      },
    ]);
  });

  it("never calls the estimator for a statically-priced endpoint", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      STATIC,
      { prompt: "a red panda", duration: 2 },
      estimator({ total_cost: 999, currency: "USD" }, calls)
    );
    // Wiring this in must not turn every estimate into a request.
    expect(calls).toEqual([]);
    expect(result.usd).toBeCloseTo(0.1, 12);
    expect(result.warnings).toEqual([]);
  });

  it("degrades to the local warning when the call throws", async () => {
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      { prompt: "a red panda" },
      estimator(new Error("ECONNRESET"))
    );
    expect(result.usd).toBe(0);
    // An advisory estimate must not fail a caller because a lookup timed out.
    expect(result.warnings.some((w) => w.includes("ECONNRESET"))).toBe(true);
    expect(
      result.warnings.some((w) => w.includes("models/pricing/estimate"))
    ).toBe(true);
  });

  it("degrades when the answer carries no usable total", async () => {
    for (const answer of [
      { total_cost: Number.NaN, currency: "USD" },
      { currency: "USD" } as unknown as FalEstimateLike,
    ]) {
      const result = await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "x" },
        estimator(answer)
      );
      expect(result.usd).toBe(0);
      expect(
        result.warnings.some((w) => w.includes("no usable total_cost"))
      ).toBe(true);
    }
  });

  it("refuses a non-USD quote rather than mislabelling it", async () => {
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      { prompt: "x" },
      estimator({ total_cost: 5, currency: "EUR" })
    );
    expect(result.usd).toBe(0);
    expect(result.warnings.some((w) => w.includes("EUR"))).toBe(true);
  });

  it("forwards cost hints to the local path", async () => {
    // wan/v2.7/edit-video bills $0.10/s and its duration 0 means "match the
    // source clip", a length only the caller knows — so the hint is what makes
    // it derivable at all. Chosen over a wan-3.0-prime call because that
    // family's `duration: null` is NOT hint-rescuable by design.
    const endpoint = "fal-ai/wan/v2.7/edit-video";
    const calls: unknown[] = [];
    const withHint = await resolveFalDynamicEstimate(
      endpoint,
      { prompt: "x", video_url: "https://example.com/a.mp4", duration: 0 },
      estimator({ total_cost: 1, currency: "USD" }, calls),
      { durationSeconds: 4 }
    );
    expect(calls).toEqual([]);
    expect(withHint.usd).toBeCloseTo(0.4, 12);

    const withoutHint = await resolveFalDynamicEstimate(
      endpoint,
      { prompt: "x", video_url: "https://example.com/a.mp4", duration: 0 },
      estimator({ total_cost: 1, currency: "USD" })
    );
    expect(withoutHint.usd).toBe(0);
    expect(withoutHint.warnings.length).toBeGreaterThan(0);
  });
});
