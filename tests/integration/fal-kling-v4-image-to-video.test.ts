import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal, type FalKlingV4ImageToVideoRequest } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kling 4 image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-v4-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates our cat fixture as a three-second 720p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat1.jpg")
    );
    const input = {
      prompt: "The cat waves once, then holds still.",
      start_image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      duration: 3,
      resolution: "720p",
    } satisfies FalKlingV4ImageToVideoRequest;
    expect(
      provider.run.kling.v4.imageToVideo.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.kling.v4.imageToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
