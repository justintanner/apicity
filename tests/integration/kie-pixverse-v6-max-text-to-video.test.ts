import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { PixverseV6MaxTaskResultJsonSchema } from "@apicity/kie/zod";

// Paid recording under the ac-hp0emr batch budget: one 1 s 360p clip with
// native audio, 7.2 credits ($0.036), the cheapest with-audio cell of the
// V6 Max ladder.
describe("kie pixverse-v6-max/text-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "creates a text-to-video task with audio and polls to a successful video",
    { timeout: 1_500_000 },
    async () => {
      ctx = setupPolly("kie/pixverse-v6-max-text-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const request = {
        model: "pixverse-v6-max/text-to-video",
        input: {
          prompt:
            "A paper boat drifts across a calm pond at sunrise while soft birdsong plays.",
          aspect_ratio: "16:9",
          quality: "360p",
          duration: 1,
          generate_audio_switch: true,
          seed: 123456,
        },
      } satisfies MediaGenerationRequest;

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5_000;
      let state = "waiting";
      let resultJson: string | undefined;

      for (let i = 0; i < 240; i++) {
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
      const result = PixverseV6MaxTaskResultJsonSchema.parse(
        JSON.parse(resultJson!)
      );
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );
});
