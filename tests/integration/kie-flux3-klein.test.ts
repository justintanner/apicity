import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";

// Operator-approved recordings: one 1K JPEG per model ($0.008 each).
// Edit uses only our cat1.jpg fixture, uploaded through KIE's file API.
describe("kie FLUX 3 Klein integration", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.each(["text-to-image", "edit-image"] as const)(
    "%s returns a completed image",
    { timeout: 600_000 },
    async (mode) => {
      ctx =
        mode === "text-to-image"
          ? setupPollyForFileUploads("kie/flux3-klein-text-to-image")
          : setupPollyForFileUploads("kie/flux3-klein-edit-image");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      let imageUrls: string[] = [];
      if (mode === "edit-image") {
        const upload = await provider.post.api.fileStreamUpload({
          file: new Blob(
            [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
            { type: "image/jpeg" }
          ),
          filename: "cat1.jpg",
          uploadPath: "images/test-uploads",
        });
        expect(upload.data?.downloadUrl).toBeTruthy();
        imageUrls = [upload.data!.downloadUrl];
      }
      const common = {
        resolution: "1K",
        num_images: 1,
        output_format: "jpeg",
      } as const;
      const request = (
        mode === "text-to-image"
          ? {
              model: "flux-3/klein-text-to-image",
              input: {
                ...common,
                prompt:
                  "A white cat wearing a small red bow tie, soft daylight, photo",
                aspect_ratio: "1:1",
              },
            }
          : {
              model: "flux-3/klein-edit-image",
              input: {
                ...common,
                prompt:
                  "Give the cat a small red bow tie and keep everything else unchanged",
                image_urls: imageUrls,
                aspect_ratio: "auto",
              },
            }
      ) satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(request);
      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();
      const taskId = task.data!.taskId;
      const delay = getPollyMode() === "replay" ? 0 : 10_000;
      let state = "waiting";
      let resultJson: string | undefined;
      for (let i = 0; i < 55; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          break;
        }
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      }
      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();
      const result = JSON.parse(resultJson!) as { resultUrls: string[] };
      expect(result.resultUrls).toHaveLength(1);
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );
});
