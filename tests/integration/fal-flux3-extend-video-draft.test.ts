import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 extend-video draft", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux3-extend-video-draft");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("generates a five-second silent draft", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.blackforestlabs.flux3.extendVideo.draft({
      prompt: "Continue the shot as the cat blinks slowly and tilts its head.",
      video_url:
        "https://v3b.fal.media/files/b/0ab06600/PQFal3vxkzt3U9AMmn63P_output.mp4",
      duration: 5,
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    if (result.draft_cache) {
      expect(result.draft_cache.url).toMatch(/^https?:\/\//);
    }
  }, 900000);
});
