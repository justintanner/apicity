import { afterEach, describe, expect, it } from "vitest";

import { createOmkar } from "@apicity/omkar";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("omkar feed.trending integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Thailand's trending feed", async () => {
    ctx = setupPolly("omkar/feed-trending-th");
    const omkar = createOmkar({
      apiKey: process.env.OMKAR_API_KEY ?? "omkar-test-key",
    });

    const result = await omkar.feed.trending({ country: "TH" });

    expect(result.country).toBe("TH");
    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.videos.length).toBeLessThanOrEqual(30);
    expect(result.video_count).toBe(result.videos.length);
    for (const video of result.videos) {
      expect(video.id).toMatch(/^\d+$/);
      expect(video.link).toContain(video.id);
      expect(video.stats.play_count).toEqual(expect.any(Number));
      expect(video.author.username).toEqual(expect.any(String));
      // A photo post carries images instead of a video.
      if (video.video === null) expect(video.images.length).toBeGreaterThan(0);
    }
  });
});
