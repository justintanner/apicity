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
import { Kling40TaskResultJsonSchema } from "@apicity/kie/zod";

async function uploadFixture(
  provider: ReturnType<typeof createKie>,
  filename: string
): Promise<string> {
  const upload = await provider.post.api.fileStreamUpload({
    file: new Blob(
      [readFileSync(resolve(__dirname, "../fixtures", filename))],
      { type: "image/jpeg" }
    ),
    filename,
    uploadPath: "images/test-uploads",
  });
  expect(upload.data?.downloadUrl).toBeTruthy();
  return upload.data!.downloadUrl;
}

// Operator-approved recording (ac-0t56dd): one 3 s 720p clip, 3 x 28.5 =
// 85.5 credits ($0.4275). Three frames (first, one keyframe, last) stay
// within the 4-frame cap of a 3 s video.
describe("kie kling-4.0/keyframe-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "moves through first, middle and last frames and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-40-keyframe-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const front = await uploadFixture(provider, "cat1.jpg");
      const side = await uploadFixture(provider, "cat2.jpg");
      const request = {
        model: "kling-4.0/keyframe-to-video",
        input: {
          prompt:
            "The cat in @first_frame turns its head as in @keyframe_1, then looks back as in @last_frame.",
          duration: 3,
          resolution: "720p",
          first_frame_url: front,
          keyframe_urls: [side],
          last_frame_url: front,
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

      for (let i = 0; i < 180; i++) {
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
      const result = Kling40TaskResultJsonSchema.parse(JSON.parse(resultJson!));
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );
});
