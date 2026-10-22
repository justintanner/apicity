import { afterEach, describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  getPollyMode,
  mintKieCreateTaskOtp,
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";

describe("kie Seedance 2.5 draft render", () => {
  let ctx: PollyContext;
  afterEach(async () => teardownPolly(ctx));

  it(
    "creates a four-second draft then renders it at 1080p",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPolly("kie/bytedance-seedance-2-5-draft");
      const provider = createKie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const poll = async (taskId: string) => {
        for (let i = 0; i < 100; i++) {
          const info = await provider.get.api.v1.jobs.recordInfo(taskId);
          expect(info.code).toBe(200);
          if (info.data?.state === "fail")
            throw new Error(info.data.failMsg ?? "Generation failed");
          if (info.data?.state === "success") {
            expect(info.data.resultJson).toBeTruthy();
            return info.data;
          }
          if (getPollyMode() !== "replay")
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        throw new Error("Timed out waiting for Seedance task");
      };
      const precursor = {
        model: "bytedance/seedance-2-5" as const,
        input: {
          prompt: "A red kite drifts across a clear blue sky",
          draft: true,
          resolution: "480p" as const,
          duration: 4,
          aspect_ratio: "1:1" as const,
          generate_audio: false,
          output_format: "mp4" as const,
          nsfw_checker: true,
        },
      };
      const draft = await provider.post.api.v1.jobs.createTask(
        precursor,
        mintKieCreateTaskOtp(precursor)
      );
      expect(draft.code).toBe(200);
      expect(draft.data?.taskId).toBeTruthy();
      await poll(draft.data!.taskId);
      const request = {
        model: "bytedance/seedance-2-5-draft" as const,
        input: {
          draft_task_id: draft.data!.taskId,
          resolution: "1080p" as const,
          output_format: "mp4" as const,
          return_last_frame: false,
          nsfw_checker: true,
        },
      };
      const render = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );
      expect(render.code).toBe(200);
      expect(render.data?.taskId).toBeTruthy();
      const renderInfo = await poll(render.data!.taskId);
      expect(
        JSON.parse(renderInfo.resultJson!).resultUrls.length
      ).toBeGreaterThan(0);
    }
  );
});
