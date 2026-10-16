import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

// This endpoint downloads `audio_url` server-side and refuses a data URL
// (422 file_download_error, "Failed to download the file"), so the source is
// fal-hosted. It is tests/fixtures/music-sample.wav — 12.0 s, 16 kHz mono,
// the only owned clip inside the 10-second minimum — uploaded once to fal
// storage before recording (byte-identical, sha256 87ec7df4…).
const SOURCE_AUDIO_URL =
  "https://v3b.fal.media/files/b/0aae934a/lt6LMO4KefWquL27tCWTH_pixverse-vibemv-source.wav";

describe("fal PixVerse VibeMV music video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/pixverse-music-video-vibemv");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("turns our music fixture into a music video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // No prompt field: the owned audio above is the whole input.
    const result = await provider.run.pixverse.musicVideo.vibemv({
      audio_url: SOURCE_AUDIO_URL,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
