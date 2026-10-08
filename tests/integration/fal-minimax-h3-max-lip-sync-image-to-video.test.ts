import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max lip sync image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-lip-sync-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("lip-syncs the example portrait to a 5.7 s speech sample at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.lipSync.imageToVideo({
      image_url:
        "https://v3b.fal.media/files/b/0aaad42b/j8WqFxwwop_xLekc9dsyh_6d2314abeb6b464aa14271bc70f2cc21.jpg",
      audio_url:
        "https://storage.googleapis.com/falserverless/example_inputs/elevenlabs/scribe_v2_in.mp3",
      resolution: "480P",
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
    // The audio must run at least 5 s, and the output matches its length.
    expect(result.duration).toBeGreaterThanOrEqual(5);
  }, 900000);
});
