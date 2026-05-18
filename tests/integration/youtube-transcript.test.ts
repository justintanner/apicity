import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { youtube } from "@apicity/youtube";

describe("youtube transcripts.get", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return transcript for a public video by id (no credentials)", async () => {
    ctx = setupPolly("youtube/transcript-id");
    const provider = youtube();

    const result = await provider.transcripts.get({
      videoId: "dQw4w9WgXcQ",
    });

    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.plainText.length).toBeGreaterThan(0);
    expect(result.segments[0].text).toBeTruthy();
    expect(typeof result.segments[0].start).toBe("number");
    expect(typeof result.segments[0].duration).toBe("number");
  });

  it("should accept a full URL and optional lang", async () => {
    ctx = setupPolly("youtube/transcript-url");
    const provider = youtube();

    const result = await provider.transcripts.get({
      videoId: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      lang: "en",
    });

    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.plainText.length).toBeGreaterThan(0);
  });

  it("should throw a typed error when captions are unavailable", async () => {
    ctx = setupPolly("youtube/transcript-unavailable");
    const provider = youtube();

    // This video ID is intentionally invalid/unavailable to trigger the
    // "No captions available" or "Could not extract player response" path.
    await expect(
      provider.transcripts.get({
        videoId: "xxxxxxxxxxx",
      })
    ).rejects.toMatchObject({
      name: "YouTubeError",
      status: expect.any(Number),
    });
  });
});
