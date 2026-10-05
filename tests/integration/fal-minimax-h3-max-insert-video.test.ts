import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Minimax H3 Max Insert Video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-insert-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.insertVideo({
      video_url:
        "https://v3b.fal.media/files/b/0aac0919/5NYtHn5-5dxFlbH_U9oQW_video.mp4",
      prompt: "A red panda waves once, then holds still.",
      duration: 5,
      resume_time: 2.125,
      resolution: "480p",
      start_time: 1.625,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
    expect(result.width).not.toBeUndefined();
    expect(result.height).not.toBeUndefined();
    expect(result.frame_count).not.toBeUndefined();
    expect(result.duration).not.toBeUndefined();
    expect(result.start_time).not.toBeUndefined();
    expect(result.resume_time).not.toBeUndefined();
    expect(result.injected_duration).not.toBeUndefined();
    expect(result.source).not.toBeUndefined();
    expect(result.timings).not.toBeUndefined();
  }, 900000);
});
