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
import { Ltx25ProTextToVideoRequestSchema } from "@apicity/kie/zod";

// ac-dwmekr: one paid generation under the operator's pre-approval of
// 2026-11-19 (survey ac-vmq3cy). The minimal request: 720p and 6 s set
// explicitly (the defaults are 1080p and 10 s), default fps, no seed:
// 6 x 14.4 credits = 86.4 credits (0.432 USD) on the 720p row.
describe("kie ltx/2-5-pro-text-to-video integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "creates a 6 s 720p text-to-video task and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPolly("kie/ltx-2-5-pro-text-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "ltx/2-5-pro-text-to-video",
        input: {
          prompt: "A paper lantern drifts over a calm lake at dusk",
          resolution: "720p",
          duration: 6,
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
    ctx = setupPolly("kie/ltx-2-5-pro-text-to-video-record-info-not-found");

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
        model: "ltx/2-5-pro-text-to-video",
        input: { prompt: "A paper lantern drifts over a calm lake." },
      }).success
    ).toBe(true);

    // Pro has no 1440p tier and no clip past 10 seconds.
    for (const input of [
      { prompt: "A paper lantern", resolution: "1440p" },
      { prompt: "A paper lantern", duration: 12 },
    ]) {
      const request = { model: "ltx/2-5-pro-text-to-video", input };
      expect(Ltx25ProTextToVideoRequestSchema.safeParse(request).success).toBe(
        false
      );
      expect(schema.safeParse(request).success).toBe(false);
    }
  });
});
