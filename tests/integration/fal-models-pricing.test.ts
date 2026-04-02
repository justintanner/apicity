import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal models pricing integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/models-pricing");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get model pricing", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.pricing();
    expect(result.models).toBeDefined();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
  });

  it("should estimate pricing for a request", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.pricing.estimate({
      model: "fal-ai/flux/dev",
      input_tokens: 100,
      output_tokens: 200,
    });
    expect(result.estimated_cost).toBeDefined();
    expect(result.currency).toBeDefined();
  });
});
