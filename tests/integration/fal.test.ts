import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should search models", async () => {
    ctx = setupPolly("fal/models-search");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models({ limit: 5 });
    expect(result.models).toBeDefined();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models[0].endpoint_id).toBeTruthy();
  });

  it("should search models by query", async () => {
    ctx = setupPolly("fal/models-search-query");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models({ q: "flux", limit: 3 });
    expect(result.models).toBeDefined();
    expect(result.models.length).toBeGreaterThan(0);
  });

  it("should get pricing for an endpoint", async () => {
    ctx = setupPolly("fal/pricing");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.pricing({
      endpoint_id: "fal-ai/flux/dev",
    });
    expect(result.prices).toBeDefined();
    expect(Array.isArray(result.prices)).toBe(true);
    expect(result.prices.length).toBeGreaterThan(0);
    expect(result.prices[0].currency).toBeTruthy();
  });

  it("should estimate cost with unit price", async () => {
    ctx = setupPolly("fal/estimate-cost");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.pricing.estimate({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });
    expect(result.total_cost).toBeDefined();
    expect(typeof result.total_cost).toBe("number");
    expect(result.currency).toBeTruthy();
  });

  it("should get usage for an endpoint", async () => {
    ctx = setupPolly("fal/usage");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.usage({
      endpoint_id: "fal-ai/flux/dev",
      limit: 5,
    });
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
  });

  it("should get analytics for an endpoint", async () => {
    ctx = setupPolly("fal/analytics");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.analytics({
      endpoint_id: "fal-ai/flux/dev",
    });
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
  });

  it("should get requests for an endpoint", async () => {
    ctx = setupPolly("fal/requests");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.requests["by-endpoint"]({
      endpoint_id: "fal-ai/flux/dev",
      limit: 5,
    });
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });
});
