import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { x } from "@apicity/x";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recordingName = "x/post-video";

describe("x post video end-to-end", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("uploads jump.mp4 and posts it with text 'jump'", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPollyForFileUploads(recordingName);

    const provider = x({
      accessToken: process.env.X_ACCESS_TOKEN ?? "x-test-token",
    });

    const videoPath = resolve(__dirname, "../fixtures/jump.mp4");
    const bytes = readFileSync(videoPath);
    const blob = new Blob([bytes], { type: "video/mp4" });

    const init = await provider.post.v2.media.upload.initialize({
      media_type: "video/mp4",
      total_bytes: bytes.length,
      media_category: "tweet_video",
    });
    const mediaId = init.data.id;
    expect(mediaId).toMatch(/^[0-9]+$/);

    await provider.post.v2.media.upload.append(mediaId, {
      media: blob,
      segment_index: 0,
    });

    const fin = await provider.post.v2.media.upload.finalize(mediaId);

    let state = fin.data.processing_info?.state ?? "succeeded";
    let checkAfterSecs = fin.data.processing_info?.check_after_secs ?? 1;
    let attempts = 0;
    const maxAttempts = 30;

    while (
      (state === "pending" || state === "in_progress") &&
      attempts < maxAttempts
    ) {
      if (getPollyMode() !== "replay") {
        await new Promise((r) => setTimeout(r, checkAfterSecs * 1000));
      }
      const status = await provider.get.v2.media.upload(mediaId);
      state = status.data.processing_info?.state ?? "succeeded";
      checkAfterSecs = status.data.processing_info?.check_after_secs ?? 1;
      attempts += 1;
    }

    expect(state).toBe("succeeded");

    const tweet = await provider.post.v2.tweets({
      text: "jump",
      media: { media_ids: [mediaId] },
    });

    expect(typeof tweet.data.id).toBe("string");
    expect(tweet.data.id).toMatch(/^[0-9]+$/);
    // X auto-appends the attached media's t.co URL to the tweet text on
    // return, so the response shape is `"jump https://t.co/..."` rather
    // than the literal request text.
    expect(tweet.data.text).toMatch(/^jump( |$)/);
  });
});
