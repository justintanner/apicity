import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createFal,
  type FalHeygenHeygenVideoImageToVideoRequest,
} from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal HeyGen Video image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/heygen-heygen-video-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates our cat fixture as a five-second 480p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat1.jpg")
    );
    const input = {
      prompt: "The cat waves once, then holds still.",
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      duration: 5,
      resolution: "480p",
      prompt_enhancement: "disabled",
    } satisfies FalHeygenHeygenVideoImageToVideoRequest;
    expect(
      provider.run.heygen.heygenVideo.imageToVideo.schema.safeParse(input)
        .success
    ).toBe(true);
    const result = await provider.run.heygen.heygenVideo.imageToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
