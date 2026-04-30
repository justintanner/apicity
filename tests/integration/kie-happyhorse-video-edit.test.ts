import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { kie } from "@apicity/kie";

describe("kie happyhorse/video-edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload a video, create a happyhorse video-edit task and poll status",
    { timeout: 120_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/happyhorse-video-edit");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const videoBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/jump.mp4"))],
        { type: "video/mp4" }
      );
      const refBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );

      const videoUpload = await provider.post.api.fileStreamUpload({
        file: videoBlob,
        filename: "jump.mp4",
        uploadPath: "videos/test-uploads",
      });
      const refUpload = await provider.post.api.fileStreamUpload({
        file: refBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(videoUpload.data?.downloadUrl).toBeTruthy();
      expect(refUpload.data?.downloadUrl).toBeTruthy();

      const task = await provider.post.api.v1.jobs.createTask({
        model: "happyhorse/video-edit",
        input: {
          prompt: "Restyle the scene to look like a watercolor painting",
          video_url: videoUpload.data!.downloadUrl,
          reference_image: [refUpload.data!.downloadUrl],
          resolution: "720p",
          audio_setting: "auto",
          seed: 1764574909,
        },
      });

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId);

      expect(info.data?.taskId).toBe(task.data?.taskId);
      expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
        info.data?.state
      );
    }
  );
});
