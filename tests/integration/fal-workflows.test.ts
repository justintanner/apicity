import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal workflows integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/workflows");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list workflows", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.workflows();
    expect(result.workflows).toBeDefined();
    expect(Array.isArray(result.workflows)).toBe(true);
  });

  it("should get a specific workflow", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.workflows.get("fal-ai", "flux-dev");
    expect(result.id).toBeTruthy();
    expect(result.owner).toBe("fal-ai");
    expect(result.name).toBe("flux-dev");
  });
});
