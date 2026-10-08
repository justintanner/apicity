import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal xAI Grok Imagine Video 1.5 image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/xai-grok-imagine-video-v1-5-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates the example image for one second at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.xai.grokImagineVideo.v1p5.imageToVideo({
      prompt:
        "Medieval knight in ornate armor walking through a mystical forest, bioluminescent plants pulsing with light, ancient stone ruins overgrown with glowing vines, over-the-shoulder camera, dark fantasy aesthetic, volumetric fog and Lumen lighting",
      duration: 1,
      resolution: "480p",
      image_url:
        "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
