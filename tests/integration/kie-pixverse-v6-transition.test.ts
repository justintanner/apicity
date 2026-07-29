import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie pixverse-v6/transition integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload first and last frames, create a pixverse-v6 transition task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/pixverse-v6-transition");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const firstFrameBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const lastFrameBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat2.jpg"))],
        { type: "image/jpeg" }
      );

      const firstFrameUpload = await provider.post.api.fileStreamUpload({
        file: firstFrameBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      const lastFrameUpload = await provider.post.api.fileStreamUpload({
        file: lastFrameBlob,
        filename: "cat2.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(firstFrameUpload.data?.downloadUrl).toBeTruthy();
      expect(lastFrameUpload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "pixverse-v6/transition",
        input: {
          prompt:
            "The first cat slowly dissolves into the second cat in a smooth cinematic cross-fade, camera holding steady.",
          first_frame_image_url: firstFrameUpload.data!.downloadUrl,
          last_frame_image_url: lastFrameUpload.data!.downloadUrl,
          quality: "360p",
          duration: 1,
          generate_audio_switch: false,
          seed: 123456789,
        },
      } satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

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
