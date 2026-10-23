import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createFal,
  type FalHeygenAvatar4ImageToVideoRequest,
} from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal HeyGen Avatar 4 image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/heygen-avatar4-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("has our cat fixture speak the house prompt at 360p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat1.jpg")
    );
    const input = {
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      prompt: "A red panda waves once, then holds still.",
      voice: "Ivy",
      resolution: "360p",
    } satisfies FalHeygenAvatar4ImageToVideoRequest;
    expect(
      provider.run.heygen.avatar4.imageToVideo.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.avatar4.imageToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
