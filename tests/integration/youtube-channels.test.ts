import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createYouTube } from "@apicity/youtube";

describe("youtube integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("youtube/channels-list");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list the authenticated user's channel", async () => {
    const provider = createYouTube({
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN ?? "youtube-test-token",
    });
    const result = await provider.channels.list({
      part: "snippet",
      mine: true,
    });
    expect(result.kind).toBe("youtube#channelListResponse");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].kind).toBe("youtube#channel");
    expect(result.items[0].snippet?.title).toBeTruthy();
  });
});
