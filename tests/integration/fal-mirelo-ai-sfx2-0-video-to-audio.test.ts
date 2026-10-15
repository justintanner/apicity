import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Mirelo SFX 2.0 video-to-audio", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/mirelo-ai-sfx2-0-video-to-audio");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the documented sound effect output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // tests/fixtures/seedance-ref.mp4 (4 s synthetic colour bars and tone),
    // uploaded once to fal storage: this endpoint rejects data URLs (400).
    const result = await provider.run.mireloAi.sfx2p0.videoToAudio({
      video_url:
        "https://v3b.fal.media/files/b/0aae75bd/Y4B2Ki-9zZ5gWeEpfw42T_mirelo-sfx2-source.mp4",
      duration: 1.5,
      num_samples: 1,
    });
    expect(result.model).toMatch(/^sfx-[0-9]+\.[0-9]+$/);
    expect(result.audio).toHaveLength(1);
    expect(result.audio[0].url).toMatch(/^https?:\/\//);
    expect(result.audio[0].content_type).toBe("audio/wav");
  }, 900000);
});
