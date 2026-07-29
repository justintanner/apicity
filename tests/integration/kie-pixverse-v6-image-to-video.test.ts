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

describe("kie pixverse-v6/image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload source images, create a pixverse-v6 image-to-video task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/pixverse-v6-image-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const firstImageBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const secondImageBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat2.jpg"))],
        { type: "image/jpeg" }
      );

      const firstImageUpload = await provider.post.api.fileStreamUpload({
        file: firstImageBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      const secondImageUpload = await provider.post.api.fileStreamUpload({
        file: secondImageBlob,
        filename: "cat2.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(firstImageUpload.data?.downloadUrl).toBeTruthy();
      expect(secondImageUpload.data?.downloadUrl).toBeTruthy();

      const prompt =
        "The cats stay still as the camera slowly pushes in; soft daylight drifts across their fur.";

      // Two images with `duration` and no `template_id` passes the SDK schema —
      // upstream documents the two fields as exclusive and states no cross-field
      // rule against `image_urls` — but the server rejects it. Recorded because
      // this envelope is the only statement of the rule that exists: a
      // multi-image payload must carry the `template_id` whose `effect_type`
      // matches the image count. The single-image happy path below is
      // upstream's own documented example shape.
      const multiImageRequest = {
        model: "pixverse-v6/image-to-video",
        input: {
          prompt,
          image_urls: [
            firstImageUpload.data!.downloadUrl,
            secondImageUpload.data!.downloadUrl,
          ],
          quality: "360p",
          duration: 1,
          generate_audio_switch: false,
          generate_multi_clip_switch: false,
          seed: 123456789,
        },
      } satisfies MediaGenerationRequest;
      const rejected = await provider.post.api.v1.jobs.createTask(
        multiImageRequest,
        mintKieCreateTaskOtp(multiImageRequest)
      );

      expect(rejected.code).toBe(422);
      expect(rejected.msg).toContain("template_id");
      expect(rejected.data).toBeNull();

      const request = {
        model: "pixverse-v6/image-to-video",
        input: {
          prompt,
          image_urls: [firstImageUpload.data!.downloadUrl],
          quality: "360p",
          duration: 1,
          generate_audio_switch: false,
          generate_multi_clip_switch: false,
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
