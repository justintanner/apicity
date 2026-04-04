import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances terminate integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-instances-terminate");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should terminate a compute instance", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.v1.compute.instances.terminate({
      id: process.env.FAL_INSTANCE_ID ?? "test-instance-id",
    });

    expect(result).toBeUndefined();
  });

  it("should terminate a compute instance using delete namespace", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.delete.v1.compute.instances.terminate({
      id: process.env.FAL_INSTANCE_ID ?? "test-instance-id",
    });

    expect(result).toBeUndefined();
  });
});
