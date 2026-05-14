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
import { youtube } from "@apicity/youtube";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recordingName = "youtube/videos-insert";

describe("youtube videos.insert", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("uploads jump.mp4 with all options and verifies via videos.list", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPollyForFileUploads(recordingName);

    const provider = youtube({
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN ?? "test-token",
    });

    const videoPath = resolve(__dirname, "../fixtures/jump.mp4");
    const bytes = readFileSync(videoPath);
    const videoBlob = new Blob([bytes], { type: "video/mp4" });

    const result = await provider.videos.insert(
      {
        part: "snippet,status",
        snippet: {
          title: "jump test video",
          description: "A test upload from @apicity/youtube integration tests",
          tags: ["test", "jump", "apicity"],
          categoryId: "22",
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: "private",
          embeddable: true,
          publicStatsViewable: true,
          selfDeclaredMadeForKids: false,
          containsSyntheticMedia: false,
        },
      },
      videoBlob
    );

    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe("string");
    expect(result.snippet?.title).toBe("jump test video");
    expect(result.status?.privacyStatus).toBe("private");

    // Verify via videos.list
    const listResult = await provider.videos.list({
      part: "snippet",
      id: result.id,
    });

    expect(listResult.items.length).toBeGreaterThan(0);
    expect(listResult.items[0].id).toBe(result.id);
    expect(listResult.items[0].snippet?.title).toBe("jump test video");
  }, 120000);
});
