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
import { Omnihuman20TaskResultJsonSchema } from "@apicity/kie/zod";

// Paid recording under the ac-bdsciv batch budget: the man.jpg portrait
// driven by the 6.008 s dialog.mp3 speech. OmniHuman 2.0 bills 14 credits
// ($0.07) per output second; the video is the audio rounded up to whole
// seconds, so this 7 s render billed 98 credits ($0.49). The audio floor is
// 4 s.
describe("kie omnihuman-2-0 integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "uploads a portrait and speech, creates a task and polls to a successful video",
    { timeout: 1_500_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/omnihuman-2-0");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const image = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [readFileSync(resolve(__dirname, "../fixtures/man.jpg"))],
          { type: "image/jpeg" }
        ),
        filename: "man.jpg",
        uploadPath: "images/test-uploads",
      });
      const audio = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [readFileSync(resolve(__dirname, "../fixtures/dialog.mp3"))],
          { type: "audio/mpeg" }
        ),
        filename: "dialog.mp3",
        uploadPath: "audio/test-uploads",
      });
      expect(image.data?.downloadUrl).toBeTruthy();
      expect(audio.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "omnihuman-2-0",
        input: {
          image_urls: [image.data!.downloadUrl],
          audio_url: audio.data!.downloadUrl,
          prompt: "A news anchor delivers the line calmly to the camera.",
          enable_watermark: false,
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

      for (let i = 0; i < 120; i++) {
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
      const result = Omnihuman20TaskResultJsonSchema.parse(
        JSON.parse(resultJson!)
      );
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );
});
