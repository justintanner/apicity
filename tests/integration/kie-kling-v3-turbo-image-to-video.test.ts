import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST = {
  model: "kling/v3-turbo-image-to-video",
  input: {
    image_urls: [
      "https://static.aiquickdraw.com/tools/example/1770688028208_jxcvxCQm.png",
    ],
    prompt: "Camera slowly pushes in while morning light crosses the table.",
    duration: "5",
    resolution: "720p",
  },
} satisfies MediaGenerationRequest;

describe("kie kling/v3-turbo-image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "creates a task and polls to a successful media result",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/kling-v3-turbo-image-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const task = await provider.post.api.v1.jobs.createTask(
        KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST,
        mintKieCreateTaskOtp(KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
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
