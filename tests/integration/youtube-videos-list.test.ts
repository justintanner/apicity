import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createYouTube } from "@apicity/youtube";

describe("youtube videos.list", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list a video by id", async () => {
    ctx = setupPolly("youtube/videos-list");
    const provider = createYouTube({
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN ?? "test-token",
    });

    const result = await provider.videos.list({
      part: "snippet",
      id: "dQw4w9WgXcQ",
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].id).toBe("dQw4w9WgXcQ");
    expect(result.items[0].snippet?.title).toBeTruthy();
  });
});
