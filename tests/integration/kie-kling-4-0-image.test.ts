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
import { Kling40ImageRequestSchema } from "@apicity/kie/zod";

// ac-i4vebc: one paid generation under the operator's KIE pre-approval of
// 2026-11-19. The minimal request: one 2k image in default mode with no
// reference image or element, 11.3 credits (0.0565 USD) on the feed's 2K row.
describe("kie kling-4-0/image integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "creates a 2k text-to-image task and polls to a successful image",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPolly("kie/kling-4-0-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "kling-4-0/image",
        input: {
          prompt: "A red apple on a white table, studio lighting",
          resolution: "2k",
          aspect_ratio: "1:1",
          count: 1,
        },
      } satisfies MediaGenerationRequest;
      expect(Kling40ImageRequestSchema.safeParse(request).success).toBe(true);

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
      // One URL per generated image.
      expect(result.resultUrls).toHaveLength(1);
      expect(result.resultUrls![0]).toMatch(/^https:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("reads a task that does not exist without a paid call", async () => {
    ctx = setupPolly("kie/kling-4-0-image-record-info-not-found");

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
        model: "kling-4-0/image",
        input: { prompt: "A paper boat on a rainy street" },
      }).success
    ).toBe(true);

    // Series mode needs an explicit count of 2-10.
    const seriesWithoutCount = {
      model: "kling-4-0/image",
      input: { prompt: "A paper boat", mode: "series" },
    };
    expect(
      Kling40ImageRequestSchema.safeParse(seriesWithoutCount).success
    ).toBe(false);
    expect(schema.safeParse(seriesWithoutCount).success).toBe(false);
  });
});
