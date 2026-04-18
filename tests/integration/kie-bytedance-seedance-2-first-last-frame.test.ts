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

describe("kie bytedance/seedance-2 first+last-frame integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload first and last frames, create a seedance-2 task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads(
        "kie/bytedance-seedance-2-first-last-frame"
      );

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const firstBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const lastBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat2.jpg"))],
        { type: "image/jpeg" }
      );

      const firstUpload = await provider.post.api.fileStreamUpload({
        file: firstBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(firstUpload.data?.downloadUrl).toBeTruthy();

      const lastUpload = await provider.post.api.fileStreamUpload({
        file: lastBlob,
        filename: "cat2.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(lastUpload.data?.downloadUrl).toBeTruthy();

      const task = await provider.post.api.v1.jobs.createTask({
        model: "bytedance/seedance-2",
        input: {
          prompt:
            "Smooth transition from the first pose to the second, natural motion",
          first_frame_url: firstUpload.data!.downloadUrl,
          last_frame_url: lastUpload.data!.downloadUrl,
          resolution: "480p",
          aspect_ratio: "16:9",
          duration: 4,
          generate_audio: false,
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
