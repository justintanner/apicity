import { describe, expect, it, vi } from "vitest";
import {
  createFalEstimateCache,
  falEstimateCacheKey,
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
      { hints: { durationSeconds: 4 } }
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

  describe("caching", () => {
    it("collapses a repeat lookup to one request", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const estimate = estimator({ total_cost: 0.02, currency: "USD" }, calls);
      const payload = { prompt: "a red panda", duration: 5 };

      const first = await resolveFalDynamicEstimate(
        DYNAMIC,
        payload,
        estimate,
        {
          cache,
        }
      );
      const second = await resolveFalDynamicEstimate(
        DYNAMIC,
        payload,
        estimate,
        { cache }
      );

      expect(first.usd).toBeCloseTo(0.02, 12);
      expect(second.usd).toBeCloseTo(0.02, 12);
      expect(calls).toHaveLength(1);
    });

    it("misses when any payload field differs", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const estimate = estimator({ total_cost: 0.02, currency: "USD" }, calls);
      await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "a", duration: 5 },
        estimate,
        { cache }
      );
      await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "a", duration: 6 },
        estimate,
        { cache }
      );
      // Conservative by design: an extra request is cheaper than a wrong price.
      expect(calls).toHaveLength(2);
    });

    it("is insensitive to payload key order", () => {
      expect(falEstimateCacheKey(DYNAMIC, { a: 1, b: 2 })).toBe(
        falEstimateCacheKey(DYNAMIC, { b: 2, a: 1 })
      );
      expect(falEstimateCacheKey(DYNAMIC, { a: { x: 1, y: 2 } })).toBe(
        falEstimateCacheKey(DYNAMIC, { a: { y: 2, x: 1 } })
      );
      expect(falEstimateCacheKey(DYNAMIC, { a: 1 })).not.toBe(
        falEstimateCacheKey(DYNAMIC, { a: 2 })
      );
    });

    it("never caches a degraded answer", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const payload = { prompt: "a red panda" };

      const failed = await resolveFalDynamicEstimate(
        DYNAMIC,
        payload,
        estimator(new Error("ECONNRESET"), calls),
        { cache }
      );
      expect(failed.usd).toBe(0);

      // A blip must not pin usd 0 for the whole TTL.
      const recovered = await resolveFalDynamicEstimate(
        DYNAMIC,
        payload,
        estimator({ total_cost: 0.03, currency: "USD" }, calls),
        { cache }
      );
      expect(recovered.usd).toBeCloseTo(0.03, 12);
      expect(recovered.warnings).toEqual([]);
    });

    it("expires an entry once its TTL passes", async () => {
      // Fake timers rather than a real sleep: the cache reads Date.now(), so
      // moving the clock is exact and keeps the suite off real timers.
      vi.useFakeTimers();
      try {
        const calls: unknown[] = [];
        const cache = createFalEstimateCache({ ttlMs: 60_000 });
        const estimate = estimator(
          { total_cost: 0.02, currency: "USD" },
          calls
        );
        const payload = { prompt: "a" };
        await resolveFalDynamicEstimate(DYNAMIC, payload, estimate, { cache });
        vi.advanceTimersByTime(59_000);
        await resolveFalDynamicEstimate(DYNAMIC, payload, estimate, { cache });
        expect(calls, "still fresh").toHaveLength(1);
        vi.advanceTimersByTime(2_000);
        await resolveFalDynamicEstimate(DYNAMIC, payload, estimate, { cache });
        expect(calls, "expired").toHaveLength(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it("bounds retained entries", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000, maxEntries: 2 });
      const estimate = estimator({ total_cost: 0.02, currency: "USD" }, calls);
      for (const n of [1, 2, 3]) {
        await resolveFalDynamicEstimate(
          DYNAMIC,
          { prompt: String(n) },
          estimate,
          { cache }
        );
      }
      // Re-requesting the oldest must miss: it was evicted at the cap.
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "1" }, estimate, {
        cache,
      });
      expect(calls).toHaveLength(4);
    });

    it("rejects a nonsensical cache policy", () => {
      expect(() => createFalEstimateCache({ ttlMs: 0 })).toThrow(/ttlMs/);
      expect(() => createFalEstimateCache({ ttlMs: -1 })).toThrow(/ttlMs/);
      expect(() =>
        createFalEstimateCache({ ttlMs: 1000, maxEntries: 0 })
      ).toThrow(/maxEntries/);
    });

    it("honours a caller-supplied key function", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const estimate = estimator({ total_cost: 0.02, currency: "USD" }, calls);
      // A caller that knows `seed` cannot move its price narrows the key.
      const keyFor = (endpoint: string, payload: Record<string, unknown>) => {
        const rest = { ...payload };
        delete rest.seed;
        return falEstimateCacheKey(endpoint, rest);
      };
      await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "a", seed: 1 },
        estimate,
        { cache, keyFor }
      );
      await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "a", seed: 2 },
        estimate,
        { cache, keyFor }
      );
      expect(calls).toHaveLength(1);
    });

    it("never consults the cache for a statically-priced endpoint", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const result = await resolveFalDynamicEstimate(
        STATIC,
        { prompt: "x", duration: 2 },
        estimator({ total_cost: 999, currency: "USD" }, calls),
        { cache }
      );
      expect(calls).toEqual([]);
      expect(result.usd).toBeCloseTo(0.1, 12);
    });
  });
});
