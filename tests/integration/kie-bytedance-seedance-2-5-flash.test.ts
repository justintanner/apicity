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
import { Seedance25FlashRequestSchema } from "@apicity/kie/zod";

// ac-zrziuf: one paid generation (operator approval ac-toif62, cap 1 USD).
// The shortest duration at the cheaper resolution, with no video input:
// 4 s x 18.5 credits = 74 credits (0.37 USD) on the 480p no-video row. The
// recording billed exactly that, at success (0.0 while waiting), for a
// 640x640, 4.04 s H.264 clip with no audio track.
describe("kie bytedance/seedance-2-5-flash integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "creates a 4 s 480p text-to-video task and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPolly("kie/bytedance-seedance-2-5-flash");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "bytedance/seedance-2-5-flash",
        input: {
          prompt: "A red kite drifts across a clear blue sky",
          resolution: "480p",
          aspect_ratio: "1:1",
          duration: 4,
          output_format: "mp4",
          generate_audio: false,
          nsfw_checker: false,
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
      let creditsConsumed: number | undefined;

      for (let i = 0; i < 180; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          creditsConsumed = (
            info.data as { creditsConsumed?: number } | undefined
          )?.creditsConsumed;
          break;
        }
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(state).toBe("success");
      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls![0]).toMatch(/^https:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("reads a task that does not exist without a paid call", async () => {
    ctx = setupPolly("kie/bytedance-seedance-2-5-flash-record-info-not-found");

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const info = await provider.get.api.v1.jobs.recordInfo(
      "apicity-test-nonexistent-task-id-do-not-record-real"
    );

    // KIE answers HTTP 200 with a 422 envelope and no data.
    expect(info.code).toBe(422);
    expect(info.msg).toBe("recordInfo is null");
    expect(info.data).toBeNull();
  });

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    expect(
      schema.safeParse({
        model: "bytedance/seedance-2-5-flash",
        input: { prompt: "A paper boat drifts down a rainy street." },
      }).success
    ).toBe(true);

    // Flash has no 1080p tier and no draft mode.
    const at1080p = {
      model: "bytedance/seedance-2-5-flash",
      input: { prompt: "A paper boat", resolution: "1080p" },
    };
    expect(Seedance25FlashRequestSchema.safeParse(at1080p).success).toBe(false);
    expect(schema.safeParse(at1080p).success).toBe(false);
  });
});
