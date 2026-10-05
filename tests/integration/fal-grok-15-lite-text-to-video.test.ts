import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal Grok 1.5 Lite text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/grok-15-lite-text-to-video");
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
      await provider.run.xai.grokImagineVideo.v1p5.lite.textToVideo({
        prompt:
          "A red panda waves gently at the camera in a sunlit forest. Static camera.",
        duration: 1,
        resolution: "480p",
        aspect_ratio: "16:9",
      });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
