import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalFlux3KleinEditImageRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 Klein edit-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-klein-edit-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits the owned cat photo at the smallest size", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });
    const imageDataUrl = `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`;
    const input = {
      image_urls: [imageDataUrl],
      prompt: "Make the photo black and white.",
      enable_prompt_expansion: false,
      seed: 5555,
      num_images: 1,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    } satisfies FalFlux3KleinEditImageRequest;
    const leaf = provider.run.blackforestlabs.flux3.klein.editImage;
    expect(leaf.schema.safeParse(input).success).toBe(true);
    const result = await leaf(input);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(result.seed).toBe(5555);
  }, 300000);
});
