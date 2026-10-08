import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Bria Fibo Gen 1.5 text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bria-fibo-gen-1-5-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.bria.fiboGen1p5.textToImage({
      prompt:
        "A weathered brown leather armchair in a sunlit study, cracked grain texture, soft afternoon light raking across the surface.",
    });
    expect(result.image.url).toMatch(/^https?:\/\//);
  }, 900000);
});
