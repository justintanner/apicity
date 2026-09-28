import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

// Qwen Image 2.1 text-to-image (`qwen2-1/text-to-image`, KIE market):
// createTask -> poll recordInfo to a completed image. Like the other kie
// image lifecycle tests (ac-x8rgr), the poll runs to `success` BEFORE
// teardownPolly so the committed recording.har ends on the finished media
// URL, which is what the Telegram preview renders.

describe("kie qwen2-1/text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "creates a text-to-image task and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/qwen21-text-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "qwen2-1/text-to-image",
        input: {
          prompt:
            "A corgi wearing a yellow rain hat sitting on stone steps after the rain, shallow depth of field",
          aspect_ratio: "16:9",
          resolution: "1K",
          output_format: "png",
          seed: 20260921,
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
