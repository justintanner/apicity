import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.1 reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-1-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates one reference image for the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p1.referenceToVideo({
      prompt:
        "The family in <IMAGE_REF_0> waves from the lawn in front of the white farmhouse, camera holding still.",
      image_urls: [
        "https://v3b.fal.media/files/b/0aa7d0a6/Zxzqx2mbFF7Ey3YVnD-g4_084_monochrome_expressionism.jpg",
      ],
      resolution: "360p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
