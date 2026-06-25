import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, KieError } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const KLING_V3_TURBO_TEXT_TO_VIDEO_REQUEST = {
  model: "kling/v3-turbo-text-to-video",
  input: {
    prompt: "A cinematic drone shot over glass towers at sunrise.",
    duration: "5",
    aspect_ratio: "16:9",
    resolution: "720p",
  },
} as const;

describe("kie kling/v3-turbo-text-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "creates a task and polls to a successful media result",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/kling-v3-turbo-text-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const task = await provider.post.api.v1.jobs.createTask(
        KLING_V3_TURBO_TEXT_TO_VIDEO_REQUEST,
        mintKieCreateTaskOtp(KLING_V3_TURBO_TEXT_TO_VIDEO_REQUEST)
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

  it("surfaces HTTP 429 rate-limit rejections without a task id", async () => {
    ctx = setupPolly("kie/kling-v3-turbo-text-to-video-rate-limit");

    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    let caught: unknown;
    try {
      await provider.post.api.v1.jobs.createTask(
        KLING_V3_TURBO_TEXT_TO_VIDEO_REQUEST,
        mintKieCreateTaskOtp(KLING_V3_TURBO_TEXT_TO_VIDEO_REQUEST)
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(KieError);
    expect((caught as KieError).status).toBe(429);
    expect((caught as KieError).message).toContain("Rate limit exceeded");
    expect((caught as KieError).body).toMatchObject({
      code: 429,
      msg: "Rate limit exceeded",
    });
  });
});
