import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { kie } from "@apicity/kie";

describe("kie happyhorse/video-edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload a video, create a happyhorse video-edit task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/happyhorse-video-edit");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const videoBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/jump.mp4"))],
        { type: "video/mp4" }
      );

      const videoUpload = await provider.post.api.fileStreamUpload({
        file: videoBlob,
        filename: "jump.mp4",
        uploadPath: "videos/test-uploads",
      });

      expect(videoUpload.data?.downloadUrl).toBeTruthy();

      const task = await provider.post.api.v1.jobs.createTask({
        model: "happyhorse/video-edit",
        input: {
          prompt: "Restyle the scene to look like a watercolor painting",
          video_url: videoUpload.data!.downloadUrl,
          resolution: "720p",
          audio_setting: "auto",
          seed: 1764574909,
        },
      });

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          if (state === "success") {
            expect(info.data?.resultJson).toBeTruthy();
          }
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
    }
  );
});
