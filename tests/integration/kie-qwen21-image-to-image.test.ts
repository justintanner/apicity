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

// Qwen Image 2.1 image-to-image (`qwen2-1/image-to-image`, KIE market) fed
// with OUR OWN fixture assets, not third-party example URLs: cat1.jpg and
// man.jpg are uploaded through fileStreamUpload and passed as the two
// reference images, exercising the model's multi-reference path (docs: when
// combining several people or objects, a landscape ratio such as 16:9 gives
// better results). The poll runs to `success` BEFORE teardownPolly so the
// committed recording.har ends on the finished media URL for the Telegram
// preview (ac-x8rgr).

async function uploadFixture(
  provider: ReturnType<typeof createKie>,
  filename: string,
  mimeType: string
): Promise<string> {
  const blob = new Blob(
    [readFileSync(resolve(__dirname, "../fixtures", filename))],
    { type: mimeType }
  );
  const upload = await provider.post.api.fileStreamUpload({
    file: blob,
    filename,
    uploadPath: "images/test-uploads",
  });
  expect(upload.data?.downloadUrl).toBeTruthy();
  return upload.data!.downloadUrl;
}

describe("kie qwen2-1/image-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "uploads our own cat+man fixtures, runs qwen2-1/image-to-image, and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen21-image-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const catUrl = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");

      const request = {
        model: "qwen2-1/image-to-image",
        input: {
          image_urls: [manUrl, catUrl],
          prompt:
            "Combine the two reference images into one photo: the man in the blue suit holds the white cat in his arms and smiles at the camera, cozy sunlit living room background, photorealistic",
          aspect_ratio: "16:9",
          resolution: "1K",
          output_format: "png",
          nsfw_checker: false,
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
      for (let i = 0; i < 60; i++) {
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
      expect(resultJson).toBeTruthy();

      const result: unknown = JSON.parse(resultJson!);
      expect(result).toMatchObject({
        resultUrls: expect.arrayContaining([expect.any(String)]),
      });
      expect((result as { resultUrls: string[] }).resultUrls[0]).toMatch(
        /^https?:\/\//
      );
    }
  );
});
