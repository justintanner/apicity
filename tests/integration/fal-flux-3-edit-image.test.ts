import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal FLUX3 image editing", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-edit-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits the documented reference image", async () => {
    const p = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const r = await p.run.blackforestlabs.flux3.editImage({
      prompt:
        "Restyle the image as a watercolor painting while preserving the composition.",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/flux2_pro_edit_input.png",
      ],
      resolution: "1k",
      aspect_ratio: "1:1",
    });
    expect(r.images.length).toBeGreaterThan(0);
    expect(r.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
