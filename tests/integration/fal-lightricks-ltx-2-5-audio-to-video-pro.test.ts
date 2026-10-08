import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Lightricks LTX-2.5 audio-to-video pro", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/lightricks-ltx-2-5-audio-to-video-pro");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates the example image to a short speech clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.lightricks.ltx2p5.audioToVideo.pro({
      audio_url:
        "https://v3b.fal.media/files/b/0aad2527/MgFeC76hf4IYXYdYTcAbM_gemini_tts_output.wav",
      image_url:
        "https://v3b.fal.media/files/b/0a90dfd2/G1zBOgd-17yqZ-2S5TN4j_M3nzt3Sp.png",
      prompt: "A woman whispering to the microphone",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
