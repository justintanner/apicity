import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

const fixtureDataUrl = (fileName: string, contentType: string) => {
  const fixturePath = path.resolve(
    import.meta.dirname,
    "..",
    "fixtures",
    fileName
  );
  return `data:${contentType};base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
};

describe("fal bytedance seedance2p5 us reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/bytedance-seedance2p5-us-reference-to-video"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short 480p video from image and video references", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const imageDataUrl = fixtureDataUrl("cat1.jpg", "image/jpeg");
    const videoDataUrl = fixtureDataUrl("seedance-ref.mp4", "video/mp4");

    const result = await provider.run.bytedance.seedance2p5.us.referenceToVideo(
      {
        prompt:
          "@Image1 follows the gentle head movement from @Video1, cinematic close-up.",
        image_urls: [imageDataUrl],
        video_urls: [videoDataUrl],
        resolution: "480p",
        duration: "4",
        aspect_ratio: "1:1",
        generate_audio: false,
      }
    );

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
