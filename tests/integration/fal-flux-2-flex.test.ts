import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX.2 Flex text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-2-flex");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates one image from the house prompt at the defaults", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The house prompt, reused from fal-ideogram-v4-5 and others. Every other
    // field keeps its default: landscape_4_3 (1024x768), one megapixel.
    const result = await provider.run.flux2Flex({
      prompt: "A red panda waves once, then holds still.",
    });
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
