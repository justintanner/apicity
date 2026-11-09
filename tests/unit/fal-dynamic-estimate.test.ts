import { describe, expect, it, vi } from "vitest";
import {
  computeEstimate,
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

const DYNAMIC = "google/gemini-omni-flash/v1.1/text-to-video";
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

  it("prices a unit quantity with fal's documented unit_price body", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      { prompt: "a red panda", duration: 5 },
      estimator({ total_cost: 0.25, currency: "USD" }, calls),
      { unitQuantity: 5 }
    );
    expect(result.usd).toBeCloseTo(0.25, 12);
    expect(result.currency).toBe("USD");
    expect(result.warnings).toEqual([]);
    // Priced as of now, not as of a table pull.
    expect(result.rateAsOf).toBeNull();
    // fal's oneOf: one quantity per endpoint, never the request payload
    // (ac-ytg1l1; the payload body was a 400).
    expect(calls).toEqual([
      {
        estimate_type: "unit_price",
        endpoints: { [DYNAMIC]: { unit_quantity: 5 } },
      },
    ]);
  });

  it("asks for fal's historical average with callQuantity, and says it ignores the payload", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      { prompt: "a red panda", duration: 5 },
      estimator(
        {
          total_cost: 1.2,
          currency: "USD",
          estimate_type: "historical_api_price",
        },
        calls
      ),
      { callQuantity: 1 }
    );
    expect(result.usd).toBeCloseTo(1.2, 12);
    expect(calls).toEqual([
      {
        estimate_type: "historical_api_price",
        endpoints: { [DYNAMIC]: { call_quantity: 1 } },
      },
    ]);
    expect(result.warnings).toEqual([
      `fal pricing estimate for '${DYNAMIC}' is fal's historical average per call x 1; it ignores this request's payload`,
    ]);
  });

  it("makes no remote call without a quantity", async () => {
    const calls: unknown[] = [];
    const payload = { prompt: "a red panda", duration: 5 };
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      payload,
      estimator({ total_cost: 999, currency: "USD" }, calls),
      {}
    );
    expect(calls).toEqual([]);
    expect(result.usd).toBe(0);
    const local = computeEstimate({
      provider: "fal",
      endpoint: DYNAMIC,
      payload,
    });
    // The local warning first, then the resolver's own, naming both options.
    expect(result.warnings.slice(0, local.warnings.length)).toEqual(
      local.warnings
    );
    const own = result.warnings[result.warnings.length - 1];
    expect(own).toContain("not requested");
    expect(own).toContain("unitQuantity");
    expect(own).toContain("x-fal-billable-units");
    expect(own).toContain("callQuantity");
  });

  it("rejects an unusable quantity without calling", async () => {
    for (const [options, needle] of [
      [{ unitQuantity: Number.NaN }, "unitQuantity NaN"],
      [{ unitQuantity: -1 }, "unitQuantity -1"],
      [{ callQuantity: 0 }, "callQuantity 0"],
      [{ callQuantity: 1.5 }, "callQuantity 1.5"],
      [{ unitQuantity: 1, callQuantity: 1 }, "not both"],
    ] as const) {
      const calls: unknown[] = [];
      const result = await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "x" },
        estimator({ total_cost: 999, currency: "USD" }, calls),
        options
      );
      expect(calls, needle).toEqual([]);
      expect(result.usd, needle).toBe(0);
      expect(
        result.warnings.some((w) => w.includes(needle)),
        needle
      ).toBe(true);
    }
  });

  it("never calls the estimator for a statically-priced endpoint", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      STATIC,
      { prompt: "a red panda", duration: 2 },
      estimator({ total_cost: 999, currency: "USD" }, calls),
      { unitQuantity: 2 }
    );
    // Wiring this in must not turn every estimate into a request.
    // Omitted resolution is 1080p at $0.28/s, so 2 seconds is $0.56.
    expect(calls).toEqual([]);
    expect(result.usd).toBeCloseTo(0.56, 12);
    expect(result.warnings).toEqual([]);
  });

  it("degrades to the local warning when the call throws", async () => {
    const result = await resolveFalDynamicEstimate(
      DYNAMIC,
      { prompt: "a red panda" },
      estimator(new Error("ECONNRESET")),
      { unitQuantity: 5 }
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
        estimator(answer),
        { unitQuantity: 5 }
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
      estimator({ total_cost: 5, currency: "EUR" }),
      { unitQuantity: 5 }
    );
    expect(result.usd).toBe(0);
    expect(result.warnings.some((w) => w.includes("EUR"))).toBe(true);
  });

  it("forwards cost hints to the local path", async () => {
    // wan/v2.7/edit-video bills $0.15/s at its default 1080p, and duration 0
    // means "match the source clip", a length only the caller knows — so the
    // hint is what makes it derivable at all. Chosen over a wan-3.0-prime
    // call because that family's `duration: null` is NOT hint-rescuable.
    const endpoint = "fal-ai/wan/v2.7/edit-video";
    const calls: unknown[] = [];
    const withHint = await resolveFalDynamicEstimate(
      endpoint,
      { prompt: "x", video_url: "https://example.com/a.mp4", duration: 0 },
      estimator({ total_cost: 1, currency: "USD" }, calls),
      { hints: { durationSeconds: 4 } }
    );
    expect(calls).toEqual([]);
    expect(withHint.usd).toBeCloseTo(0.6, 12);

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
        { cache, unitQuantity: 5 }
      );
      const second = await resolveFalDynamicEstimate(
        DYNAMIC,
        payload,
        estimate,
        { cache, unitQuantity: 5 }
      );

      expect(first.usd).toBeCloseTo(0.02, 12);
      expect(second.usd).toBeCloseTo(0.02, 12);
      expect(calls).toHaveLength(1);
    });

    it("keys on the estimate type and quantity, not the payload", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const estimate = estimator({ total_cost: 0.02, currency: "USD" }, calls);
      // fal's answer cannot depend on the payload, so a different payload
      // with the same quantity is a hit...
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "a" }, estimate, {
        cache,
        unitQuantity: 5,
      });
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "b" }, estimate, {
        cache,
        unitQuantity: 5,
      });
      expect(calls).toHaveLength(1);
      // ...while another quantity or estimate type is a miss.
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "a" }, estimate, {
        cache,
        unitQuantity: 6,
      });
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "a" }, estimate, {
        cache,
        callQuantity: 5,
      });
      expect(calls).toHaveLength(3);
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
        { cache, unitQuantity: 5 }
      );
      expect(failed.usd).toBe(0);

      // A blip must not pin usd 0 for the whole TTL.
      const recovered = await resolveFalDynamicEstimate(
        DYNAMIC,
        payload,
        estimator({ total_cost: 0.03, currency: "USD" }, calls),
        { cache, unitQuantity: 5 }
      );
      expect(recovered.usd).toBeCloseTo(0.03, 12);
      expect(recovered.warnings).toEqual([]);
    });

    it("caches a historical answer despite its warning", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const estimate = estimator({ total_cost: 1.2, currency: "USD" }, calls);
      for (let i = 0; i < 2; i++) {
        const result = await resolveFalDynamicEstimate(
          DYNAMIC,
          { prompt: "a" },
          estimate,
          { cache, callQuantity: 1 }
        );
        expect(result.usd).toBeCloseTo(1.2, 12);
        expect(result.warnings).toHaveLength(1);
      }
      expect(calls).toHaveLength(1);
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
        const options = { cache, unitQuantity: 5 };
        await resolveFalDynamicEstimate(DYNAMIC, payload, estimate, options);
        vi.advanceTimersByTime(59_000);
        await resolveFalDynamicEstimate(DYNAMIC, payload, estimate, options);
        expect(calls, "still fresh").toHaveLength(1);
        vi.advanceTimersByTime(2_000);
        await resolveFalDynamicEstimate(DYNAMIC, payload, estimate, options);
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
        await resolveFalDynamicEstimate(DYNAMIC, { prompt: "x" }, estimate, {
          cache,
          unitQuantity: n,
        });
      }
      // Re-requesting the oldest must miss: it was evicted at the cap.
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "x" }, estimate, {
        cache,
        unitQuantity: 1,
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

    it("appends the estimate type and quantity to a caller-supplied key", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const estimate = estimator({ total_cost: 0.02, currency: "USD" }, calls);
      // A caller-supplied key replaces the endpoint prefix. It can never make
      // two quantities share an answer, because the discriminator follows it.
      const keyFor = (endpoint: string) => `account-a:${endpoint}`;
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "a" }, estimate, {
        cache,
        keyFor,
        unitQuantity: 5,
      });
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "b" }, estimate, {
        cache,
        keyFor,
        unitQuantity: 5,
      });
      expect(calls).toHaveLength(1);
      await resolveFalDynamicEstimate(DYNAMIC, { prompt: "a" }, estimate, {
        cache,
        keyFor,
        unitQuantity: 7,
      });
      expect(calls).toHaveLength(2);
    });

    it("never consults the cache for a statically-priced endpoint", async () => {
      const calls: unknown[] = [];
      const cache = createFalEstimateCache({ ttlMs: 60_000 });
      const result = await resolveFalDynamicEstimate(
        STATIC,
        { prompt: "x", duration: 2 },
        estimator({ total_cost: 999, currency: "USD" }, calls),
        { cache, unitQuantity: 2 }
      );
      expect(calls).toEqual([]);
      expect(result.usd).toBeCloseTo(0.56, 12);
    });
  });
});

const EXTEND = "minimax/h3-max/extend-video";
const extendWarning =
  "fal 'minimax/h3-max/extend-video': prices the requested seconds only; reference tokens beyond the included 4,096 ($0.02 per 1,000) are not counted, so this estimate is a lower bound";

describe("H3 Max per-second floor", () => {
  it.each([
    [5, 1.6],
    [15, 4.8],
  ])(
    "quotes extend-video duration %s at 2K as %s USD without an estimator",
    (duration, usd) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint: EXTEND,
        payload: {
          video_url: "https://example.com/video.mp4",
          prompt: "continue",
          duration,
          resolution: "2K",
        },
      });
      expect(estimate.usd).toBeCloseTo(usd, 12);
      expect(estimate.usd).toBe(
        (estimate.breakdown.units ?? 0) * (estimate.breakdown.perUnitUsd ?? 0)
      );
      expect(estimate.warnings).toEqual([extendWarning]);
      expect(estimate.warnings[0]).toContain("lower bound");
    }
  );

  it("returns the floor instead of fal's historical average", async () => {
    for (const [duration, usd] of [
      [5, 1.6],
      [15, 4.8],
    ] as const) {
      const calls: unknown[] = [];
      const result = await resolveFalDynamicEstimate(
        EXTEND,
        {
          video_url: "https://example.com/video.mp4",
          prompt: "continue",
          duration,
          resolution: "2K",
        },
        estimator({ total_cost: 0.32, currency: "USD" }, calls),
        { callQuantity: 1 }
      );
      expect(calls, String(duration)).toEqual([]);
      expect(result.usd, String(duration)).toBeCloseTo(usd, 12);
      expect(result.warnings).toEqual([extendWarning]);
    }
  });

  it("returns the floor when no quantity is passed", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      EXTEND,
      {
        video_url: "https://example.com/video.mp4",
        duration: 5,
        resolution: "2K",
      },
      estimator({ total_cost: 0.32, currency: "USD" }, calls)
    );
    expect(calls).toEqual([]);
    expect(result.usd).toBeCloseTo(1.6, 12);
    expect(result.warnings).toEqual([extendWarning]);
    expect(result.warnings.join(" ")).not.toContain("not requested");
  });

  it("still calls for a positive unitQuantity", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      EXTEND,
      {
        video_url: "https://example.com/video.mp4",
        duration: 5,
        resolution: "2K",
      },
      estimator({ total_cost: 9.99, currency: "USD" }, calls),
      { unitQuantity: 32 }
    );
    expect(calls).toEqual([
      {
        estimate_type: "unit_price",
        endpoints: { [EXTEND]: { unit_quantity: 32 } },
      },
    ]);
    expect(result.usd).toBeCloseTo(9.99, 12);
    expect(result.warnings).toEqual([]);
  });

  it.each([0, -0])(
    "treats unitQuantity %s as 0 USD and does not call",
    async (unitQuantity) => {
      const calls: unknown[] = [];
      const onFloor = await resolveFalDynamicEstimate(
        EXTEND,
        {
          video_url: "https://example.com/video.mp4",
          duration: 5,
          resolution: "2K",
        },
        estimator({ total_cost: 1.6, currency: "USD" }, calls),
        { unitQuantity }
      );
      expect(calls).toEqual([]);
      expect(onFloor.usd).toBe(0);
      expect(onFloor.source).toBe("free");
      expect(onFloor.warnings).toEqual([]);
      expect(onFloor.breakdown).toEqual({});
      expect(onFloor.rateAsOf).toBeNull();
      expect(onFloor.zeroReason).toBe(
        `unitQuantity is 0: x-fal-billable-units for '${EXTEND}' reported no billed units, so the call is 0 USD`
      );

      const plain = await resolveFalDynamicEstimate(
        DYNAMIC,
        { prompt: "x" },
        estimator({ total_cost: 999, currency: "USD" }, calls),
        { unitQuantity }
      );
      expect(calls).toEqual([]);
      expect(plain.usd).toBe(0);
      expect(plain.zeroReason).toContain("x-fal-billable-units");
      expect(plain.warnings).toEqual([]);
    }
  );

  it("does not return the floor for an unusable quantity", async () => {
    for (const [options, needle] of [
      [{ unitQuantity: 0.0000001 }, "1e-7"],
      [{ callQuantity: 0 }, "callQuantity 0"],
      [{ callQuantity: 1.5 }, "callQuantity 1.5"],
      [{ unitQuantity: 0, callQuantity: 1 }, "not both"],
      [{ unitQuantity: Number.NaN }, "unitQuantity NaN"],
    ] as const) {
      const calls: unknown[] = [];
      const result = await resolveFalDynamicEstimate(
        EXTEND,
        {
          video_url: "https://example.com/video.mp4",
          duration: 15,
          resolution: "2K",
        },
        estimator({ total_cost: 4.8, currency: "USD" }, calls),
        options
      );
      expect(calls, needle).toEqual([]);
      expect(result.usd, needle).toBe(0);
      expect(result.breakdown, needle).toEqual({});
      expect(
        result.warnings.some((warning) => warning.includes(needle)),
        needle
      ).toBe(true);
      expect(result.warnings.join(" "), needle).not.toContain("lower bound");
    }
  });

  it("degrades a failed unit-price call to the floor", async () => {
    const result = await resolveFalDynamicEstimate(
      EXTEND,
      {
        video_url: "https://example.com/video.mp4",
        duration: 5,
        resolution: "2K",
      },
      estimator(new Error("ECONNRESET")),
      { unitQuantity: 32 }
    );
    expect(result.usd).toBeCloseTo(1.6, 12);
    expect(
      result.warnings.some((warning) => warning.includes("ECONNRESET"))
    ).toBe(true);
    expect(
      result.warnings.some((warning) => warning.includes("lower bound"))
    ).toBe(true);
  });

  it("does not apply a schema default or fold resolution case", () => {
    for (const payload of [
      { duration: 5 },
      { resolution: "2K" },
      { duration: 5, resolution: "2k" },
      { duration: "5", resolution: "2K" },
      { duration: 0, resolution: "2K" },
      { duration: -1, resolution: "2K" },
    ]) {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint: EXTEND,
        payload,
      });
      expect(estimate.usd, JSON.stringify(payload)).toBe(0);
      expect(estimate.warnings[0], JSON.stringify(payload)).toContain(
        "models/pricing/estimate"
      );
    }
  });

  it("ignores unitQuantity 0 on a statically priced endpoint", async () => {
    const calls: unknown[] = [];
    const result = await resolveFalDynamicEstimate(
      STATIC,
      { prompt: "a red panda", duration: 2 },
      estimator({ total_cost: 0, currency: "USD" }, calls),
      { unitQuantity: 0 }
    );
    expect(calls).toEqual([]);
    expect(result.usd).toBeCloseTo(0.56, 12);
    expect(result.zeroReason).toBeUndefined();
  });
});
