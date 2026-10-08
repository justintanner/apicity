import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Muse Image text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/meta-muse-image-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.meta.museImage.textToImage({
      prompt:
        "A cinematic editorial portrait in soft window light with crisp typography",
    });
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
