import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { youtube } from "@apicity/youtube";

describe("youtube videoMetadata", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return metadata for a public video by id (no credentials)", async () => {
    ctx = setupPolly("youtube/video-metadata-id");
    const provider = youtube();

    const result = await provider.videoMetadata({
      videoId: "dQw4w9WgXcQ",
    });

    expect(result.title).toBeTruthy();
    expect(result.authorName).toBeTruthy();
    expect(result.authorUrl).toBeTruthy();
    expect(result.type).toBe("video");
    expect(result.html).toContain("iframe");
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.thumbnailUrl).toContain("http");
    expect(result.providerName).toBe("YouTube");
  });

  it("should accept a full URL", async () => {
    ctx = setupPolly("youtube/video-metadata-url");
    const provider = youtube();

    const result = await provider.videoMetadata({
      videoId: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    expect(result.title).toBeTruthy();
    expect(result.authorName).toBeTruthy();
  });

  it("should throw a typed error for an invalid video id", async () => {
    ctx = setupPolly("youtube/video-metadata-invalid");
    const provider = youtube();

    await expect(
      provider.videoMetadata({
        videoId: "notavalidid",
      })
    ).rejects.toMatchObject({
      name: "YouTubeError",
      status: 400,
    });
  });
});
