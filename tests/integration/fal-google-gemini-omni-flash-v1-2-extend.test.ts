import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.2 extend", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-2-extend");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest call: fal's 5 s example clip, extended by the minimum
  // continuation at the cheapest resolution.
  it("extends the example clip by the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p2.extend({
      prompt: "Continue the scene for a moment.",
      video_url:
        "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
      resolution: "360p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
