import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { youtube } from "@apicity/youtube";
import fs from "fs";
import path from "path";

const recordingName = "youtube/videos-insert";

describe("youtube videos.insert", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined as unknown as PollyContext;
    }
  });

  it("should upload jump.mp4 with all options and verify via videos.list", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPollyForFileUploads(recordingName);

    const videoPath = path.resolve(import.meta.dirname, "../fixtures/jump.mp4");
    const videoBuffer = fs.readFileSync(videoPath);
    const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

    const provider = youtube({
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN ?? "test-token",
    });

    const insertResult = await provider.videos.insert({
      video: videoBlob,
      snippet: {
        title: "Apicity jump.mp4 test upload",
        description: "Integration test video uploaded via @apicity/youtube",
        tags: ["apicity", "test", "integration"],
        categoryId: "22",
        defaultLanguage: "en",
      },
      status: {
        privacyStatus: "unlisted",
        embeddable: true,
        license: "youtube",
        publicStatsViewable: true,
        selfDeclaredMadeForKids: false,
        containsSyntheticMedia: false,
      },
      recordingDetails: {
        recordingDate: "2026-05-14",
      },
      localizations: {
        es: {
          title: "Prueba de subida jump.mp4",
          description: "Video de prueba de integracion",
        },
      },
    });

    expect(insertResult.id).toBeTruthy();
    expect(insertResult.snippet?.title).toBe("Apicity jump.mp4 test upload");
    expect(insertResult.status?.privacyStatus).toBe("unlisted");

    const listResult = await provider.videos.list({
      part: "snippet,status",
      id: insertResult.id,
    });

    expect(listResult.items.length).toBeGreaterThan(0);
    expect(listResult.items[0].id).toBe(insertResult.id);
    expect(listResult.items[0].snippet?.title).toBe(
      "Apicity jump.mp4 test upload"
    );
  });
});
