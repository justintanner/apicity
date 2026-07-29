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

describe("kie pixverse-v6/reference-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload subject and background references, create a pixverse-v6 reference-to-video task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/pixverse-v6-reference-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const subjectBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/man.jpg"))],
        { type: "image/jpeg" }
      );

      const subjectUpload = await provider.post.api.fileStreamUpload({
        file: subjectBlob,
        filename: "man.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(subjectUpload.data?.downloadUrl).toBeTruthy();

      const backgroundBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/studio-bg.jpg"))],
        { type: "image/jpeg" }
      );

      const backgroundUpload = await provider.post.api.fileStreamUpload({
        file: backgroundBlob,
        filename: "studio-bg.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(backgroundUpload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "pixverse-v6/reference-to-video",
        input: {
          // ref_name values are addressable in the prompt as @name; upstream
          // requires them to be unique within image_references.
          prompt:
            "@man stands still in @studio and slowly turns to face the camera; the lighting stays soft and even.",
          image_references: [
            {
              image_url: subjectUpload.data!.downloadUrl,
              type: "subject",
              ref_name: "man",
            },
            {
              image_url: backgroundUpload.data!.downloadUrl,
              type: "background",
              ref_name: "studio",
            },
          ],
          // aspect_ratio and quality are required on this model even though
          // both document defaults, so both are always on the wire.
          aspect_ratio: "16:9",
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
