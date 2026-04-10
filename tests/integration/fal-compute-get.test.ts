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

  it("should handle compute permission error", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    // This API key doesn't have compute access - expect permission error
    await expect(provider.ai.v1.compute.instances()).rejects.toThrow(
      /Compute access requires additional permissions/
    );
  });

  it("should handle compute instances list permission error", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    await expect(provider.ai.v1.compute.instances()).rejects.toThrow(
      /Compute access requires additional permissions/
    );
  });
});
