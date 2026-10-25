import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { PixverseV6MaxTaskResultJsonSchema } from "@apicity/kie/zod";

// Paid recording under the ac-hp0emr batch budget: one 1 s 360p clip without
// audio from the cat1.jpg first frame, 4.8 credits ($0.024), the cheapest
// cell of the V6 Max ladder. No aspect_ratio: the output follows the image.
describe("kie pixverse-v6-max/image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "uploads a first frame, creates an image-to-video task and polls to a successful video",
    { timeout: 1_500_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/pixverse-v6-max-image-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const upload = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
          { type: "image/jpeg" }
        ),
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "pixverse-v6-max/image-to-video",
        input: {
          prompt:
            "The cat slowly blinks and turns its head toward the camera in one continuous shot.",
          image_urls: [upload.data!.downloadUrl],
          quality: "360p",
          duration: 1,
          generate_audio_switch: false,
          seed: 123456,
        },
      } satisfies MediaGenerationRequest;

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5_000;
      let state = "waiting";
      let resultJson: string | undefined;

      for (let i = 0; i < 240; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          break;
        }
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(state).toBe("success");
      const result = PixverseV6MaxTaskResultJsonSchema.parse(
        JSON.parse(resultJson!)
      );
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );
});
