import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { kie } from "@apicity/kie";

describe("kie happyhorse/reference-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload reference images, create a happyhorse reference-to-video task and poll status",
    { timeout: 120_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/happyhorse-reference-to-video");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Blob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const cat2Blob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/cat2.jpg"))],
        { type: "image/jpeg" }
      );

      const cat1Upload = await provider.post.api.fileStreamUpload({
        file: cat1Blob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      const cat2Upload = await provider.post.api.fileStreamUpload({
        file: cat2Blob,
        filename: "cat2.jpg",
        uploadPath: "images/test-uploads",
      });

      expect(cat1Upload.data?.downloadUrl).toBeTruthy();
      expect(cat2Upload.data?.downloadUrl).toBeTruthy();

      const task = await provider.post.api.v1.jobs.createTask({
        model: "happyhorse/reference-to-video",
        input: {
          prompt:
            "character1 and character2 sit side-by-side, gently turning toward each other and looking at the camera",
          reference_image: [
            cat1Upload.data!.downloadUrl,
            cat2Upload.data!.downloadUrl,
          ],
          resolution: "720p",
          aspect_ratio: "16:9",
          duration: 5,
          seed: 1308038620,
        },
      });

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId);

      expect(info.data?.taskId).toBe(task.data?.taskId);
      expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
        info.data?.state
      );
    }
  );
});
