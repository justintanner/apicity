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

describe("kie wan/2-7 first+last-frame integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload first and last frames, create a wan 2.7 task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/wan-27-first-last-frame");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const firstImage = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const lastImage = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat2.jpg"))],
        { type: "image/jpeg" }
      );

      const firstUpload = await provider.post.api.fileStreamUpload({
        file: firstImage,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(firstUpload.data?.downloadUrl).toBeTruthy();

      const lastUpload = await provider.post.api.fileStreamUpload({
        file: lastImage,
        filename: "cat2.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(lastUpload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "wan/2-7-image-to-video",
        input: {
          prompt:
            "Smooth natural motion as the cat transitions from the first pose to the second",
          first_frame_url: firstUpload.data!.downloadUrl,
          last_frame_url: lastUpload.data!.downloadUrl,
          resolution: "720p",
          duration: 5,
          prompt_extend: false,
          watermark: false,
          nsfw_checker: false,
        },
      } satisfies MediaGenerationRequest;
      expect(
        provider.post.api.v1.jobs.createTask.schema.safeParse(request).success
      ).toBe(true);

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
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(state).toBe("success");
    }
  );
});
