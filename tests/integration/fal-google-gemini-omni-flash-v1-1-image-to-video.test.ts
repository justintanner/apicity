import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.1 image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-1-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates the first frame for the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p1.imageToVideo({
      prompt: "The dog turns its head and wags its tail in warm sunlight.",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/dog.png",
      resolution: "360p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
