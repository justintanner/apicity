import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal Ideogram 4.5 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/ideogram45-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits an image", async () => {
    const p = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await p.run.ideogram.v4p5.edit({
      prompt:
        "Render this scene as a watercolor painting while preserving its composition.",
      image_url:
        "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
      quality: "very_low",
      num_images: 1,
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
