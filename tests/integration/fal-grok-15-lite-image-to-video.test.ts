import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal Grok 1.5 Lite image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/grok-15-lite-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a short video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result =
      await provider.run.xai.grokImagineVideo.v1p5.lite.imageToVideo({
        prompt: "Gentle natural motion in the scene. Static camera.",
        duration: 1,
        resolution: "480p",
        image_url:
          "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
      });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
