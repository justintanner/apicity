import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Seedance 2.0 Mini text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance-2-0-mini-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest priced call: 480p, 4 seconds, square, with no audio.
  it("generates the shortest priced clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.bytedance.seedance2p0.mini.textToVideo({
      prompt: "A red panda waves once, then holds still.",
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
