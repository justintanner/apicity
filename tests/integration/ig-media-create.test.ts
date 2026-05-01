import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { ig } from "@apicity/ig";

const recordingName = "ig/media-create";

describe("ig post.v25.media", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("creates a REELS container from a public video_url", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = ig({
      accessToken: process.env.IG_ACCESS_TOKEN ?? "ig-test-token",
    });

    const igUserId = process.env.IG_USER_ID ?? "17841400000000000";
    const videoUrl =
      process.env.IG_TEST_VIDEO_URL ??
      "https://files.catbox.moe/example-reel.mp4";

    const res = await provider.post.v25.media(igUserId, {
      media_type: "REELS",
      video_url: videoUrl,
      caption: "hello from @apicity/ig",
    });

    expect(typeof res.id).toBe("string");
    expect(res.id).toMatch(/^[0-9]+$/);
  });

  it("exposes a Zod schema with safeParse", () => {
    const provider = ig({ accessToken: "ig-test-token" });
    const endpoint = provider.post.v25.media;
    expect(endpoint.schema).toBeDefined();
    expect(typeof endpoint.schema.safeParse).toBe("function");

    const reels = endpoint.schema.safeParse({
      media_type: "REELS",
      video_url: "https://example.com/clip.mp4",
      caption: "hi",
    });
    expect(reels.success).toBe(true);

    const image = endpoint.schema.safeParse({
      media_type: "IMAGE",
      image_url: "https://example.com/photo.jpg",
    });
    expect(image.success).toBe(true);

    // media_type is a closed enum
    const badType = endpoint.schema.safeParse({
      media_type: "STORY",
      video_url: "https://example.com/clip.mp4",
    });
    expect(badType.success).toBe(false);

    // video_url must be a URL when supplied
    const badUrl = endpoint.schema.safeParse({
      media_type: "REELS",
      video_url: "not-a-url",
    });
    expect(badUrl.success).toBe(false);

    // caption capped at 2200 chars per Meta docs
    const longCaption = endpoint.schema.safeParse({
      media_type: "REELS",
      video_url: "https://example.com/clip.mp4",
      caption: "x".repeat(2201),
    });
    expect(longCaption.success).toBe(false);

    // tagged_user_ids → user_tags shape requires `username`
    const badUserTag = endpoint.schema.safeParse({
      media_type: "IMAGE",
      image_url: "https://example.com/photo.jpg",
      user_tags: [{ x: 0.5, y: 0.5 }],
    });
    expect(badUserTag.success).toBe(false);
  });
});
