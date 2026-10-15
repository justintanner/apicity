import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kling O3 Standard image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3-standard-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates cat1.jpg for three seconds", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The prompt and the committed cat1.jpg fixture are reused together from
    // fal-wan3p0-image-to-video. Three seconds is the shortest duration.
    const result = await provider.run.klingVideo.o3.standard.imageToVideo({
      image_url: `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      prompt: "the cat blinks",
      duration: "3",
    });
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
