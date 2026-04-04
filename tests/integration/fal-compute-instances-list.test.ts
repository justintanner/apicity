import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances list integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-instances-list");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list compute instances", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.v1.compute.instances();

    expect(result).toBeDefined();
    expect(result.instances).toBeDefined();
    expect(Array.isArray(result.instances)).toBe(true);
  });

  it("should list compute instances with pagination", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.v1.compute.instances({ limit: 5 });

    expect(result).toBeDefined();
    expect(result.instances).toBeDefined();
    expect(result.has_more).toBeDefined();
  });

  it("should list compute instances using get namespace", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.get.v1.compute.instances();

    expect(result).toBeDefined();
    expect(result.instances).toBeDefined();
    expect(Array.isArray(result.instances)).toBe(true);
  });
});
