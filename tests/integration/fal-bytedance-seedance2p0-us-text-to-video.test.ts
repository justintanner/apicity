import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Bytedance Seedance 2.0 US text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p0-us-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the seedance cat prompt as a four-second 480p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Mirrors fal-bytedance-seedance2p0-text-to-video exactly: the same
    // prompt at 480p, four seconds (the shortest fixed duration), 1:1 and
    // audio off.
    const result = await provider.run.bytedance.seedance2p0.us.textToVideo({
      prompt:
        "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
  }, 900000);
});
