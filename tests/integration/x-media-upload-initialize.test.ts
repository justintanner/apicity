import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { x } from "@apicity/x";

const recordingName = "x/media-upload-initialize";

describe("x post.v2.media.upload.initialize", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("initializes a video upload and returns a media id + key", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = x({
      accessToken: process.env.X_ACCESS_TOKEN ?? "x-test-token",
    });

    const res = await provider.post.v2.media.upload.initialize({
      media_type: "video/mp4",
      total_bytes: 524288,
      media_category: "tweet_video",
    });

    expect(res.data).toBeDefined();
    expect(typeof res.data.id).toBe("string");
    expect(res.data.id).toMatch(/^[0-9]+$/);
    expect(typeof res.data.media_key).toBe("string");
    expect(typeof res.data.expires_after_secs).toBe("number");
  });

  it("exposes a Zod schema with safeParse", () => {
    const provider = x({ accessToken: "x-test-token" });
    const endpoint = provider.post.v2.media.upload.initialize;
    expect(endpoint.schema).toBeDefined();
    expect(typeof endpoint.schema.safeParse).toBe("function");

    const valid = endpoint.schema.safeParse({
      media_type: "video/mp4",
      total_bytes: 524288,
    });
    expect(valid.success).toBe(true);

    const missingTotal = endpoint.schema.safeParse({ media_type: "video/mp4" });
    expect(missingTotal.success).toBe(false);

    const negative = endpoint.schema.safeParse({
      media_type: "video/mp4",
      total_bytes: -1,
    });
    expect(negative.success).toBe(false);
  });
});
