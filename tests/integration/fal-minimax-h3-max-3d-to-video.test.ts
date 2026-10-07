import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max 3D-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-3d-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("renders the example Blender previs from one reference image at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.threeDToVideo({
      video_url:
        "https://v3b.fal.media/files/b/0aaaaf78/M5dPeIbYcdI5BaIrbHuXq_blender-source.mp4",
      reference_image_urls: [
        "https://v3b.fal.media/files/b/0aaab04d/YHhN06SXKgl5ufCWnYRfy_UIb6gaXa.jpg",
      ],
      resolution: "480P",
    });
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
