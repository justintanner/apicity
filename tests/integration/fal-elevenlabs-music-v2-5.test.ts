import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal ElevenLabs Music v2.5", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/elevenlabs-music-v2-5");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.elevenlabs.music.v2p5({
      prompt:
        "Mysterious original soundtrack, themes of jungle, rainforest, nature, woodwinds, busy rhythmic tribal percussion.",
      music_length_ms: 3000,
    });
    expect(result.audio.url).toMatch(/^https?:\/\//);
  }, 900000);
});
