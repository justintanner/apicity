import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Google Gemini Omni Flash 1.2 reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-omni-flash-v1-2-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest call: the owned cat photo as the one reference image, for the
  // minimum duration at the cheapest resolution.
  it("animates the owned cat photo for the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result = await provider.run.geminiOmniFlash.v1p2.referenceToVideo({
      prompt: "The cat in <IMAGE_REF_0> stretches, then sits still.",
      image_urls: [`data:image/jpeg;base64,${cat.toString("base64")}`],
      duration: 3,
      resolution: "360p",
      aspect_ratio: "16:9",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
