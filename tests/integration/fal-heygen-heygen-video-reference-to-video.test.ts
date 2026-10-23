import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createFal,
  type FalHeygenHeygenVideoReferenceToVideoRequest,
} from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal HeyGen Video reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/heygen-heygen-video-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates our cat fixture as a reference in a five-second 480p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat1.jpg")
    );
    const input = {
      prompt: "The cat from the reference image waves once, then holds still.",
      reference_image_urls: [
        `data:image/jpeg;base64,${image.toString("base64")}`,
      ],
      duration: 5,
      resolution: "480p",
      prompt_enhancement: "disabled",
    } satisfies FalHeygenHeygenVideoReferenceToVideoRequest;
    expect(
      provider.run.heygen.heygenVideo.referenceToVideo.schema.safeParse(input)
        .success
    ).toBe(true);
    const result =
      await provider.run.heygen.heygenVideo.referenceToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
