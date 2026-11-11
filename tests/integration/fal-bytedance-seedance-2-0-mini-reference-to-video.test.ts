import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Seedance 2.0 Mini reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance-2-0-mini-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest call: the owned cat photo as the only reference (images
  // alone keep the 0.007 rate), 480p, 4 seconds, square, no audio.
  it("animates from the owned cat photo as an image reference", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result =
      await provider.run.bytedance.seedance2p0.mini.referenceToVideo({
        prompt: "The cat from the reference sits on a windowsill and blinks.",
        image_urls: [`data:image/jpeg;base64,${cat.toString("base64")}`],
        resolution: "480p",
        duration: "4",
        aspect_ratio: "1:1",
        generate_audio: false,
      });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
