import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalHeygenHeygenVideoTextToVideoRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Video text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-heygen-video-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("renders the house prompt as a five-second 480p clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt: "A red panda waves once, then holds still.",
      duration: 5,
      resolution: "480p",
      prompt_enhancement: "disabled",
    } satisfies FalHeygenHeygenVideoTextToVideoRequest;
    expect(
      provider.run.heygen.heygenVideo.textToVideo.schema.safeParse(input)
        .success
    ).toBe(true);
    const result = await provider.run.heygen.heygenVideo.textToVideo(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
