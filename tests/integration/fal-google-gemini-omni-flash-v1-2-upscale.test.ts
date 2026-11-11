import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.2 upscale", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-2-upscale");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest call: the owned 3 s, 360p output of the recorded 1.2
  // text-to-video call, one step up to 720p.
  it("upscales an owned 360p clip one step to 720p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p2.upscale({
      video_url:
        "https://v3b.fal.media/files/b/0ab20aa6/_-uXxPeQ4CvqA-usGco3f_cccfda385c03442bb5fe74b45beb3a8d.mp4",
      resolution: "720p",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
