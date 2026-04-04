import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances get integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-instances-get");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get compute instance details", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.v1.compute.instances.get({
      id: process.env.FAL_INSTANCE_ID ?? "test-instance-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.instance_type).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it("should get compute instance details using get namespace", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.get.v1.compute.instances.get({
      id: process.env.FAL_INSTANCE_ID ?? "test-instance-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBeDefined();
  });
});
