import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.1 text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-1-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the prompt's video for the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p1.textToVideo({
      prompt:
        "A cinematic wide shot of a lighthouse on a rocky cliff at dusk, waves crashing below, the beam sweeping across the dark sea.",
      resolution: "360p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
