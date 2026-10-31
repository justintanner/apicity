import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Happy Horse text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/alibaba-happy-horse-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("renders the shortest 720p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.alibaba.happyHorse.textToVideo({
      prompt: "A red panda waves once, then holds still.",
      resolution: "720p",
      duration: 3,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
  }, 900000);
});
