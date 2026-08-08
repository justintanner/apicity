import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";

describe("kie seedream/5-pro-layer-decomposition integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a layer-decomposition task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/seedream-5-pro-layer-decomposition");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "seedream/5-pro-layer-decomposition",
        input: {
          image_url:
            "https://storage.googleapis.com/falserverless/model_tests/wan/dragon-warrior.jpg",
          prompt:
            "Separate the foreground subject from the background while preserving its silhouette. <bbox>100 120 900 950</bbox>",
          size: "auto",
          output_format: "jpeg",
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
            expect(typeof info.data?.resultJson).toBe("string");
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
