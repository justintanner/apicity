import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { kie } from "@apicity/kie";

describe("kie happyhorse/image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload an image, create a happyhorse image-to-video task and poll status",
    { timeout: 120_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/happyhorse-image-to-video");

      const provider = kie({
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

      const task = await provider.post.api.v1.jobs.createTask({
        model: "happyhorse/image-to-video",
        input: {
          prompt: "A cat stretches and yawns, then turns to look at the camera",
          image_urls: [upload.data!.downloadUrl],
          resolution: "720p",
          duration: 5,
          seed: 1546095068,
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
