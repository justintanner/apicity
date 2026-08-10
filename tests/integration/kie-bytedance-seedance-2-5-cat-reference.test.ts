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

const PROMPT =
  "The two reference images show the same white cat with mismatched yellow and blue eyes in close-up and full-body views. Preserve that cat's identity as it bats a small red ball across a sunlit floor, chases it, and catches it between its front paws.";

async function uploadFixture(
  provider: ReturnType<typeof createKie>,
  filename: string
): Promise<string> {
  const blob = new Blob(
    [readFileSync(resolve(__dirname, "../fixtures", filename))],
    { type: "image/jpeg" }
  );
  const upload = await provider.post.api.fileStreamUpload({
    file: blob,
    filename,
    uploadPath: "images/test-uploads",
  });
  const downloadUrl = upload.data?.downloadUrl;
  expect(downloadUrl).toBeTruthy();
  expect(downloadUrl).toMatch(/^https:\/\//);
  return downloadUrl!;
}

describe("kie bytedance/seedance-2-5 cat reference integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload two cat references and poll a bounded Seedance 2.5 task to an HTTPS result",
    { timeout: 1_500_000 },
    async () => {
      ctx = setupPollyForFileUploads(
        "kie/bytedance-seedance-2-5-cat-reference"
      );

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg");
      const cat2Url = await uploadFixture(provider, "cat2.jpg");

      const request = {
        model: "bytedance/seedance-2-5",
        input: {
          prompt: PROMPT,
          reference_image_urls: [cat1Url, cat2Url],
          resolution: "480p",
          aspect_ratio: "16:9",
          duration: 4,
          output_format: "mp4",
          generate_audio: false,
          web_search: false,
          nsfw_checker: false,
        },
      } satisfies MediaGenerationRequest;
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
      expect(result.resultUrls![0]).toMatch(/^https:\/\//);
    }
  );
});
