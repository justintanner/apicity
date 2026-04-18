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

describe("kie bytedance/seedance-2 multimodal reference integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload image+video+audio references, create a seedance-2 task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/bytedance-seedance-2-multimodal");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const imageBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const videoBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/seedance-ref.mp4"))],
        { type: "video/mp4" }
      );
      const audioBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/dialog.mp3"))],
        { type: "audio/mpeg" }
      );

      const imageUpload = await provider.post.api.fileStreamUpload({
        file: imageBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      const videoUpload = await provider.post.api.fileStreamUpload({
        file: videoBlob,
        filename: "seedance-ref.mp4",
        uploadPath: "videos/test-uploads",
      });
      const audioUpload = await provider.post.api.fileStreamUpload({
        file: audioBlob,
        filename: "dialog.mp3",
        uploadPath: "audio/test-uploads",
      });

      expect(imageUpload.data?.downloadUrl).toBeTruthy();
      expect(videoUpload.data?.downloadUrl).toBeTruthy();
      expect(audioUpload.data?.downloadUrl).toBeTruthy();

      const task = await provider.post.api.v1.jobs.createTask({
        model: "bytedance/seedance-2",
        input: {
          prompt:
            "A cinematic short inspired by the reference style and pacing",
          reference_image_urls: [imageUpload.data!.downloadUrl],
          reference_video_urls: [videoUpload.data!.downloadUrl],
          reference_audio_urls: [audioUpload.data!.downloadUrl],
          resolution: "480p",
          aspect_ratio: "16:9",
          duration: 4,
          generate_audio: true,
          web_search: false,
          nsfw_checker: false,
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
