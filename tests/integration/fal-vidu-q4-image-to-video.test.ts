import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Vidu Q4 image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/vidu-q4-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates cat1.jpg for three seconds at 540p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Reuse the owned fixture and prompt from kie-vidu-q4-image-to-video.
    const result = await provider.run.vidu.q4.imageToVideo({
      image_url: `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      prompt:
        "The white cat looks toward the camera, blinks slowly, and gently tilts its head.",
      duration: 3,
      resolution: "540p",
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
    if (result.cover_image != null) {
      expect(result.cover_image.url).toMatch(/^https:\/\//);
    }
  }, 900000);
});
