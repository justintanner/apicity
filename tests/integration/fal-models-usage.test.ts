import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal models usage integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get model usage stats", async () => {
    ctx = setupPolly("fal/models-usage-stats");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.ai.v1.models.usage({
      endpoint_id: "fal-ai/flux/dev",
      limit: 5,
    });
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
  });

  it("should get model analytics", async () => {
    ctx = setupPolly("fal/models-usage-analytics");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.ai.v1.models.analytics({
      endpoint_id: "fal-ai/flux/dev",
    });
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
  });
});
