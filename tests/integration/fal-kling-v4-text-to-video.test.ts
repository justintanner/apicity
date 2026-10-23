import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalKlingV4TextToVideoRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kling 4 text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/kling-v4-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("renders the house prompt as a three-second 720p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt: "A red panda waves once, then holds still.",
      duration: 3,
      resolution: "720p",
    } satisfies FalKlingV4TextToVideoRequest;
    expect(
      provider.run.kling.v4.textToVideo.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.kling.v4.textToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
