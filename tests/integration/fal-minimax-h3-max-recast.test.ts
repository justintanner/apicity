import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal MiniMax H3 Max Recast", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-recast");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("recasts the official sample video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.recast({
      video_url:
        "https://v3b.fal.media/files/b/0aac0919/5NYtHn5-5dxFlbH_U9oQW_video.mp4",
      reference_image_urls: [
        "https://v3b.fal.media/files/b/0aac0904/DYyrpDKza8aflsP6mMm0i_76qcS0F8.png",
      ],
      resolution: "768P",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
