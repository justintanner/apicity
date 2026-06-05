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
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

// Grok Imagine Video 1.5 Preview (grok-imagine-video-1-5-preview) — a new
// image-to-video model on the createTask jobs endpoint. Upload a single image,
// animate it, and poll to completion. Mirrors the structure of
// kie-grok-imagine-reference-bakeoff.test.ts.

const PROMPT =
  "The man smiles warmly and waves at the camera, gentle natural light, subtle head movement.";

describe("kie grok-imagine-video-1-5-preview integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload an image, run grok-imagine-video-1-5-preview, and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/grok-imagine-video-1-5-preview");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const blob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures", "man.jpg"))],
        { type: "image/jpeg" }
      );
      const upload = await provider.post.api.fileStreamUpload({
        file: blob,
        filename: "man.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();
      const imageUrl = upload.data!.downloadUrl;

      const request = {
        model: "grok-imagine-video-1-5-preview",
        input: {
          prompt: PROMPT,
          image_urls: [imageUrl],
          aspect_ratio: "16:9",
          resolution: "480p",
          duration: 8,
          nsfw_checker: true,
        },
      };
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
      let state = "waiting";
      let resultJson: string | undefined;

      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
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

      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls!.length).toBeGreaterThan(0);
      expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
    }
  );
});
