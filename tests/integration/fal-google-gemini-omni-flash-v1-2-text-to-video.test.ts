import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.2 text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-2-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.geminiOmniFlash.v1p2.textToVideo({
      prompt: "A red panda waves once, then holds still.",
      duration: 3,
      resolution: "360p",
      aspect_ratio: "16:9",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
