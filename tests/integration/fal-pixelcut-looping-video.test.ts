import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Pixelcut Looping Video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/pixelcut-looping-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns a looping video from our cat fixture", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Committed owned fixture. Prompt omitted: upstream defaults to empty.
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat2.jpg")
    );
    const result = await provider.run.pixelcut.loopingVideo({
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      duration: 5,
      resolution: "480p",
    });
    expect(result.video?.url).toMatch(/^https?:\/\//);
    expect(result.video?.content_type).toBe("video/mp4");
  }, 900000);
});
