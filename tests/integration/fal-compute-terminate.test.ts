import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances terminate integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-terminate");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should terminate a compute instance", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.delete.v1.compute.instances.terminate({
      id: process.env.FAL_INSTANCE_ID ?? "test-instance-id",
    });

    expect(result).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.delete.v1.compute.instances.terminate.validatePayload({
        id: "test-instance-id",
      });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.delete.v1.compute.instances.terminate.validatePayload({});

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("id is required");
  });
});
