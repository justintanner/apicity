import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";
import { Seedance2MiniTaskResultJsonSchema } from "@apicity/kie/zod";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie bytedance/seedance-2-mini i2v integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload an image reference, create a seedance-2-mini i2v task, and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/bytedance-seedance-2-mini-i2v");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const imageBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );

      const upload = await provider.post.api.fileStreamUpload({
        file: imageBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(upload.code).toBe(200);
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "bytedance/seedance-2-mini",
        input: {
          prompt:
            "The cat in the reference photo blinks slowly and turns toward the camera.",
          reference_image_urls: [upload.data!.downloadUrl],
          resolution: "480p",
          aspect_ratio: "16:9",
          duration: 4,
          generate_audio: false,
          web_search: false,
          nsfw_checker: false,
        },
      };
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
      let resultJson: string | undefined;

      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        expect(
          provider.get.api.v1.jobs.recordInfo.seedance2MiniResponseSchema.safeParse(
            info
          ).success
        ).toBe(true);

        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();

      const result = Seedance2MiniTaskResultJsonSchema.parse(
        JSON.parse(resultJson!)
      );
      expect(result.resultUrls?.length ?? 0).toBeGreaterThan(0);
    }
  );
});
