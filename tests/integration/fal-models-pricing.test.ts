import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";

describe("fal models pricing integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get model pricing", async () => {
    ctx = setupPolly("fal/models-pricing");
    const provider = createFal({
      apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",
    });
    const result = await provider.v1.models.pricing({
      endpoint_id: "fal-ai/flux/dev",
    });
    expect(result.prices).toBeDefined();
    expect(Array.isArray(result.prices)).toBe(true);
    expect(result.prices.length).toBeGreaterThan(0);
  });

  it("should estimate pricing for a request", async () => {
    ctx = setupPolly("fal/models-pricing-estimate");
    const provider = createFal({
      apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",
    });
    const result = await provider.v1.models.pricing.estimate({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });
    expect(result.total_cost).toBeDefined();
    expect(result.currency).toBeDefined();
  });

  // These cassettes record fal's pricing estimate for Wan 3.0. That
  // endpoint is now a static card, so resolveFalDynamicEstimate prices it
  // locally and does not send this request. Replay still checks the
  // recorded estimate call. Dynamic routing is covered with an injected
  // estimator in tests/unit/fal-dynamic-estimate.test.ts.
  it("replays the recorded Wan 3.0 unit-price estimate", async () => {
    ctx = setupPolly("fal/models-pricing-estimate-unit-quantity");
    const provider = createFal({
      apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",
    });
    const result = await provider.v1.models.pricing.estimate({
      estimate_type: "unit_price",
      endpoints: {
        "alibaba/wan-3.0/text-to-video": { unit_quantity: 5 },
      },
    });
    // 5 units at the recorded unit price.
    expect(result.total_cost).toBe(0.25);
    expect(result.currency).toBe("USD");
  });

  it("replays the recorded Wan 3.0 historical-average estimate", async () => {
    ctx = setupPolly("fal/models-pricing-estimate-call-quantity");
    const provider = createFal({
      apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",
    });
    const result = await provider.v1.models.pricing.estimate({
      estimate_type: "historical_api_price",
      endpoints: {
        "alibaba/wan-3.0/text-to-video": { call_quantity: 1 },
      },
    });
    expect(result.total_cost).toBe(1.2);
    expect(result.currency).toBe("USD");
  });
});
