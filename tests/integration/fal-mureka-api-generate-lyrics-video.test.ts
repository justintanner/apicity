import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Mureka lyrics video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/mureka-api-generate-lyrics-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a lyrics video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Fresh owned vocal song with timed lyrics; generated once under ac-d5kmgo.
    const result = await provider.run.mureka.api.generate.lyricsVideo({
      song_id: "166608639098881",
    });
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
