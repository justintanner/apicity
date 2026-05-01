import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { ig } from "@apicity/ig";
import { free } from "@apicity/free";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recordingName = "ig/post-video";

describe("ig post video end-to-end", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("uploads jump.mp4, hosts it publicly, and publishes a reel", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = ig({
      accessToken: process.env.IG_ACCESS_TOKEN ?? "ig-test-token",
    });
    const igUserId = process.env.IG_USER_ID ?? "17841400000000000";

    // Step 1: upload jump.mp4 to a public URL via @apicity/free (catbox).
    const videoPath = resolve(__dirname, "../fixtures/jump.mp4");
    const bytes = readFileSync(videoPath);
    const blob = new Blob([bytes], { type: "video/mp4" });

    const host = free({});
    const videoUrl = await host.catbox.upload({
      file: blob,
      filename: "jump.mp4",
    });
    expect(videoUrl).toMatch(/^https?:\/\//);

    // Step 2: create the IG container.
    const container = await provider.post.v25.media(igUserId, {
      media_type: "REELS",
      video_url: videoUrl,
      caption: "jump",
    });
    expect(container.id).toMatch(/^[0-9]+$/);

    // Step 3: poll until processing is FINISHED. Skip the wall-clock sleep
    // in replay mode so the test runs in milliseconds offline.
    let statusCode: string = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 60;
    while (
      (statusCode === "IN_PROGRESS" ||
        statusCode === "EXPIRED" ||
        statusCode === undefined) &&
      attempts < maxAttempts
    ) {
      if (getPollyMode() !== "replay") {
        await new Promise((r) => setTimeout(r, 5000));
      }
      const s = await provider.get.v25.container(container.id, {
        fields: "status_code,status",
      });
      statusCode = s.status_code ?? "FINISHED";
      attempts += 1;
      if (statusCode === "FINISHED" || statusCode === "ERROR") break;
    }
    expect(statusCode).toBe("FINISHED");

    // Step 4: publish.
    const post = await provider.post.v25.mediaPublish(igUserId, {
      creation_id: container.id,
    });
    expect(post.id).toMatch(/^[0-9]+$/);
  });
});
