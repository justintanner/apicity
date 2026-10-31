import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Happy Horse image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/alibaba-happy-horse-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates cat1.jpg for the shortest 720p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.alibaba.happyHorse.imageToVideo({
      image_url: `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      prompt: "The cat slowly blinks.",
      resolution: "720p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
  }, 900000);
});
