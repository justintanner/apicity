import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Seedance 2.0 Mini image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance-2-0-mini-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest priced call: the owned cat photo at 480p, 4 seconds, square,
  // with no audio.
  it("animates the owned cat photo", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result = await provider.run.bytedance.seedance2p0.mini.imageToVideo({
      prompt: "The cat turns its head toward the camera.",
      image_url: `data:image/jpeg;base64,${cat.toString("base64")}`,
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
