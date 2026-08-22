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

describe("kie wan/2-7 i2v man upload integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload man.jpg, create a wan 2.7 i2v task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/wan-27-i2v-man-upload");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const image = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/man.jpg"))],
        { type: "image/jpeg" }
      );
      const upload = await provider.post.api.fileStreamUpload({
        file: image,
        filename: "man.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "wan/2-7-image-to-video",
        input: {
          prompt:
            "The man turns his head slowly toward the camera and smiles, subtle natural motion",
          negative_prompt: "blurry, low quality, distorted",
          first_frame_url: upload.data!.downloadUrl,
          resolution: "720p",
          duration: 5,
          prompt_extend: true,
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
