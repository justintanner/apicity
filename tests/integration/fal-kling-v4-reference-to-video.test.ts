import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createFal,
  type FalKlingV4ReferenceToVideoRequest,
} from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kling 4 reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-v4-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates our cat fixture as @Image1 in a three-second 720p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat1.jpg")
    );
    const input = {
      prompt: "@Image1 waves once, then holds still.",
      image_urls: [`data:image/jpeg;base64,${image.toString("base64")}`],
      duration: 3,
      resolution: "720p",
    } satisfies FalKlingV4ReferenceToVideoRequest;
    expect(
      provider.run.kling.v4.referenceToVideo.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.kling.v4.referenceToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
