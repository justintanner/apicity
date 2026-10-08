import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Happy Horse 1.1 text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/alibaba-happy-horse-v1-1-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.alibaba.happyHorse.v1p1.textToVideo({
      prompt: "A horse walks through warm grass.",
      resolution: "720p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
