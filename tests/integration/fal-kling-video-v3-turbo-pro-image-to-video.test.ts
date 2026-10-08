import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kling v3 Turbo Pro image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/kling-video-v3-turbo-pro-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.klingVideo.v3.turbo.pro.imageToVideo({
      prompt: "A lioness and her cubs in warm grass, camera drifting closer.",
      image_url:
        "https://v3b.fal.media/files/b/0a90dfd2/G1zBOgd-17yqZ-2S5TN4j_M3nzt3Sp.png",
      duration: "3",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
