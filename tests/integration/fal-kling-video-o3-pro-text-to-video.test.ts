import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kling O3 Pro text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/kling-video-o3-pro-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates three seconds without audio", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.klingVideo.o3.pro.textToVideo({
      prompt: "A cat blinks, static camera.",
      duration: "3",
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
