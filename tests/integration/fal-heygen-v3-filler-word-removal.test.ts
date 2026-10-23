import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalHeygenV3FillerWordRemovalRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// The source video is our own fal-ai/heygen/avatar4/image-to-video recording
// (tests/fixtures/cat1.jpg speaking the house prompt).
const AVATAR4_VIDEO_URL =
  "https://v3b.fal.media/files/b/0aaf8622/62FTWTu-9SFpD5P1Vh3Bm_0IjiKdRc.mp4";

describe("fal HeyGen Filler Word Removal", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-v3-filler-word-removal");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("cleans our avatar video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      video_url: AVATAR4_VIDEO_URL,
    } satisfies FalHeygenV3FillerWordRemovalRequest;
    expect(
      provider.run.heygen.v3.fillerWordRemoval.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.v3.fillerWordRemoval(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
