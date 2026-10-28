import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalFlux3KleinTextToImageRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 Klein text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-klein-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates an image at the smallest size", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });
    const input = {
      prompt: "A photo of a cat sitting on a windowsill in soft daylight.",
      enable_prompt_expansion: false,
      seed: 5555,
      num_images: 1,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    } satisfies FalFlux3KleinTextToImageRequest;
    const leaf = provider.run.blackforestlabs.flux3.klein.textToImage;
    expect(leaf.schema.safeParse(input).success).toBe(true);
    const result = await leaf(input);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(result.seed).toBe(5555);
  }, 300000);
});
