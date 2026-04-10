import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal models pricing integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get model pricing", async () => {
    ctx = setupPolly("fal/models-pricing");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.ai.v1.models.pricing({
      endpoint_id: "fal-ai/flux/dev",
    });
    expect(result.prices).toBeDefined();
    expect(Array.isArray(result.prices)).toBe(true);
    expect(result.prices.length).toBeGreaterThan(0);
  });

  it("should estimate pricing for a request", async () => {
    ctx = setupPolly("fal/models-pricing-estimate");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.ai.v1.models.pricing.estimate({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });
    expect(result.total_cost).toBeDefined();
    expect(result.currency).toBeDefined();
  });
});
