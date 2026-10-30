import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kling O3 Pro reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3-pro-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates cat1.jpg for three seconds", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // One reference image, shortest duration, and audio off.
    const result = await provider.run.klingVideo.o3.pro.referenceToVideo({
      image_urls: [
        `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      ],
      prompt: "The cat in @Image1 blinks, static camera.",
      duration: "3",
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
