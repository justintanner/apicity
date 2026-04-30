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

describe("kie happyhorse/reference-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload a reference image, create a happyhorse reference-to-video task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/happyhorse-reference-to-video");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const refBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );

      const refUpload = await provider.post.api.fileStreamUpload({
        file: refBlob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(refUpload.data?.downloadUrl).toBeTruthy();

      const task = await provider.post.api.v1.jobs.createTask({
        model: "happyhorse/reference-to-video",
        input: {
          prompt:
            "character1 looks at the camera and slowly tilts its head to one side",
          reference_image: [refUpload.data!.downloadUrl],
          resolution: "720p",
          aspect_ratio: "16:9",
          duration: 3,
          seed: 1308038620,
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
