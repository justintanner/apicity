import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kling O3 Pro video-to-video edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3-pro-video-to-video-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits an exact three-second cat video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Derived from cat1.jpg's ac-cg2abc animation (PR539):
    // https://v3b.fal.media/files/b/0ab06dbc/fT3G7l-zDiWpDHmJHxu7N_output.mp4
    // ffmpeg: -vf scale=720:960,fps=24 -t 3 -an -c:v libx264
    // -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart
    // ffprobe: 720x960, 72 frames at24fps, exactly3s, no audio.
    const result = await provider.run.klingVideo.o3.pro.videoToVideo.edit({
      video_url: `data:video/mp4;base64,${readFileSync(new URL("../fixtures/cat1-kling-o3-3s.mp4", import.meta.url)).toString("base64")}`,
      prompt: "Add a blue bow tie to the cat in @Video1.",
      keep_audio: false,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
