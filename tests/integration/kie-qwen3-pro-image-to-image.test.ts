import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie qwen3/pro-image-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create an image-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/qwen3-pro-image-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "qwen3/pro-image-to-image",
        input: {
          prompt:
            "Turn the reference into a polished watercolor travel poster with warm morning light.",
          image_urls: [
            "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
          ],
          resolution: "1K",
          image_size: "16:9",
          output_format: "png",
          prompt_extend: false,
          nsfw_checker: false,
          negative_prompt: "blurry, distorted, low contrast",
          seed: 1,
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
