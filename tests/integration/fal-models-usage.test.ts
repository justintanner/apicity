import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal models usage integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/models-usage");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skip("should get model usage stats", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.usage();
    expect(result.usage).toBeDefined();
    expect(Array.isArray(result.usage)).toBe(true);
  });

  it.skip("should get model analytics", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.models.analytics();
    expect(result.analytics).toBeDefined();
  });
});
