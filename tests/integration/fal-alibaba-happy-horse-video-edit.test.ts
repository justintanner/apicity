import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HappyHorse video edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/alibaba-happy-horse-video-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("recolors the three-second cat clip at 720p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The cat1-derived 3 s clip (720x960, 24 fps, no audio) at 720p, the
    // cheaper tier, keeping the source audio track.
    const result = await provider.run.alibaba.happyHorse.videoEdit({
      video_url: `data:video/mp4;base64,${readFileSync(new URL("../fixtures/cat1-kling-o3-3s.mp4", import.meta.url)).toString("base64")}`,
      prompt: "Make the cat's fur bright orange.",
      resolution: "720p",
      audio_setting: "origin",
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
  }, 900000);
});
