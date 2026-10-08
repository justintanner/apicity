import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal xAI Grok Imagine Video 1.5 text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/xai-grok-imagine-video-v1-5-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a one-second clip at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.xai.grokImagineVideo.v1p5.textToVideo({
      prompt:
        "Anime schoolgirl bursting out of house door, cherry blossoms blowing, morning light, speed lines indicating rush, chibi-ready expressions, classic shojo aesthetic, vibrant colors",
      duration: 1,
      resolution: "480p",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
