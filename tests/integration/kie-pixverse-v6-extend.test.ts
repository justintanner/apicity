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

describe("kie pixverse-v6/extend integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload a source video, create a pixverse-v6 extend task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/pixverse-v6-extend");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The source clip is uploaded rather than hard-coded: kie.ai fetches
      // `video_url` server-side, so the recording needs a URL it can actually
      // reach at record time.
      const videoBlob = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/jump.mp4"))],
        { type: "video/mp4" }
      );

      const upload = await provider.post.api.fileStreamUpload({
        file: videoBlob,
        filename: "jump.mp4",
        uploadPath: "videos/test-uploads",
      });

      expect(upload.code).toBe(200);
      expect(upload.data?.downloadUrl).toBeTruthy();

      // `video_url` rather than `taskId`, so this test does not depend on
      // another generation completing first — and so the recorded happy path
      // is itself a statement of the `taskId` XOR `video_url` rule.
      const request = {
        model: "pixverse-v6/extend",
        input: {
          prompt:
            "The camera holds steady as the motion continues naturally into the next moment.",
          video_url: upload.data!.downloadUrl,
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
