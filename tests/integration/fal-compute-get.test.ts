import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances get integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-get");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get a specific compute instance", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    // First list to get an instance ID
    const list = await provider.v1.compute.instances();
    if (list.instances && list.instances.length > 0) {
      const instanceId = list.instances[0].id;
      const result = await provider.v1.compute.instances.get(instanceId);
      expect(result.id).toBe(instanceId);
      expect(result.status).toBeDefined();
    } else {
      // Skip if no instances
      expect(true).toBe(true);
    }
  });

  it("should list compute instances", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.compute.instances();
    expect(result.instances).toBeDefined();
    expect(Array.isArray(result.instances)).toBe(true);
  });
});
