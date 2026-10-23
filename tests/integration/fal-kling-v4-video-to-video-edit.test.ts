import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalKlingV4VideoToVideoEditRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// The source is our own kling/v4/text-to-video recording (the house prompt,
// 3 s at 720p), within this endpoint's 3-30 s and 700 px minimums.
const KLING_V4_VIDEO_URL =
  "https://v3b.fal.media/files/b/0aaf8d10/7yl5MsJnBrE_BfOVG-ntX_output.mp4";

describe("fal Kling 4 video edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/kling-v4-video-to-video-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits our Kling 4 clip at 720p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt: "Make it snow in @Video1.",
      video_url: KLING_V4_VIDEO_URL,
      resolution: "720p",
    } satisfies FalKlingV4VideoToVideoEditRequest;
    expect(
      provider.run.kling.v4.videoToVideo.edit.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.kling.v4.videoToVideo.edit(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
