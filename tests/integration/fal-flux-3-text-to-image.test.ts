import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal FLUX 3 text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a square image", async () => {
    const p = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const r = await p.run.blackforestlabs.flux3.textToImage({
      prompt:
        "A red fox leaping over a stream in a pine forest, watercolor illustration.",
      resolution: "1k",
      aspect_ratio: "1:1",
    });
    expect(r.images.length).toBeGreaterThan(0);
    expect(r.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
