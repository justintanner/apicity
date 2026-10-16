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

// Qwen Image edit (`qwen/image-edit`, KIE market) fed with OUR OWN fixture:
// cat1.jpg (686x667) is uploaded through fileStreamUpload and edited at the
// square_hd preset. This recording is billing evidence behind @apicity/cost's
// per-megapixel image-edit estimate (ac-dgvqms probe P3): only prompt,
// image_url and image_size are sent, so every other input keeps its upstream
// default and the terminal recordInfo's creditsConsumed varies with the preset
// alone. The output measured 2048x2048, not the page's nominal 1024x1024. The
// poll runs to `success` BEFORE teardownPolly so the committed recording.har
// ends on the finished media URL.

describe("kie qwen/image-edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits our cat fixture at square_hd and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-square-hd");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const blob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures", "cat1.jpg"))],
        { type: "image/jpeg" }
      );
      const upload = await provider.post.api.fileStreamUpload({
        file: blob,
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "qwen/image-edit",
        input: {
          prompt:
            "Give the cat a small red bow tie and keep everything else unchanged",
          image_url: upload.data!.downloadUrl,
          image_size: "square_hd",
        },
      } satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;
      for (let i = 0; i < 55; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          creditsConsumed = (
            info.data as { creditsConsumed?: number } | undefined
          )?.creditsConsumed;
          break;
        }
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();
      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls!.length).toBeGreaterThan(0);
      expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );
});
