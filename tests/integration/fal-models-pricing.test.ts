import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { resolveFalDynamicEstimate } from "@apicity/cost";

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

  // resolveFalDynamicEstimate sends fal's documented oneOf body, one quantity
  // per endpoint, never the request payload (ac-ytg1l1).
  it("should price billed units for a dynamic endpoint with unitQuantity", async () => {
    ctx = setupPolly("fal/models-pricing-estimate-unit-quantity");
    const provider = createFal({
      apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",
    });
    const result = await resolveFalDynamicEstimate(
      "alibaba/wan-3.0/text-to-video",
      { prompt: "a red panda", duration: 5 },
      provider.v1.models.pricing.estimate,
      { unitQuantity: 5 }
    );
    // The recorded answer: 5 units at fal's unit price, total_cost 0.25.
    expect(result.warnings).toEqual([]);
    expect(result.usd).toBe(0.25);
    expect(result.rateAsOf).toBeNull();
  });

  it("should ask for the historical average per call with callQuantity", async () => {
    ctx = setupPolly("fal/models-pricing-estimate-call-quantity");
    const provider = createFal({
      apiKey: process.env.FAL_ADMIN_API_KEY ?? "fal-admin-test-key",
    });
    const result = await resolveFalDynamicEstimate(
      "alibaba/wan-3.0/text-to-video",
      { prompt: "a red panda", duration: 5 },
      provider.v1.models.pricing.estimate,
      { callQuantity: 1 }
    );
    // The recorded answer: fal's historical average per call, total_cost 1.2.
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("historical average");
    expect(result.usd).toBe(1.2);
  });
});
