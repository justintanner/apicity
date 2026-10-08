import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kling v3 Turbo Pro text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/kling-video-v3-turbo-pro-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.klingVideo.v3.turbo.pro.textToVideo({
      prompt: "A lioness and her cubs in warm grass, camera drifting closer.",
      duration: "3",
      aspect_ratio: "16:9",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
