import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.1 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-1-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits the example clip at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p1.edit({
      prompt: "Make this video anime. Keep everything else the same.",
      video_url:
        "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
      resolution: "360p",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
