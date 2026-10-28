import { afterEach, describe, expect, it } from "vitest";

import { createEndless } from "@apicity/endless";
import type { EndlessError } from "@apicity/endless";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("endless social.tiktokTrends.public integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the public TikTok trends for thailand", async () => {
    ctx = setupPolly("endless/tiktok-trends-thailand");
    const endless = createEndless();

    const result = await endless.social.tiktokTrends.public({
      region: "thailand",
    });

    expect(result.region).toBe("thailand");
    expect(result.captured_at).toEqual(expect.any(String));
    expect(result.videos.length).toBeGreaterThan(0);
    for (const video of result.videos) {
      expect(video.region).toBe("TH");
      expect(video.url).toMatch(/^https:\/\/www\.tiktok\.com\//);
    }
    const plays = result.videos.map((video) => video.play_count ?? 0);
    expect(plays).toEqual([...plays].sort((a, b) => b - a));
    expect(result.longest[0]).toMatchObject({
      video: { id: expect.any(String) },
      snapshots: expect.any(Number),
    });
    expect(result.sounds[0]).toMatchObject({
      id: expect.any(String),
      creators: expect.any(Number),
      original: expect.any(Boolean),
    });
    expect(result.hashtags[0]).toMatchObject({
      name: expect.any(String),
      creators: expect.any(Number),
    });
  });

  it("surfaces Endless's 404 for an ISO code instead of a slug", async () => {
    ctx = setupPolly("endless/tiktok-trends-invalid-region");
    const endless = createEndless();

    await expect(
      endless.social.tiktokTrends.public({ region: "TH" as never })
    ).rejects.toMatchObject({
      name: "EndlessError",
      status: 404,
      code: "invalid_path_parameter",
    } satisfies Partial<EndlessError>);
  });
});
