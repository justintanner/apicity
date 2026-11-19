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
import { GoogleGeminiOmniFlash12ExtendRequestSchema } from "@apicity/kie/zod";

// ac-20k2yx: one paid recording under the operator's KIE pre-approval of
// 2026-11-19. An extend needs a completed 360p or 720p source task, so the
// recording makes a fresh 3 s 360p google/gemini-omni-flash-1-2 source (12
// credits) and extends it by the minimum 3 s at 360p (12 credits).

type Provider = ReturnType<typeof createKie>;

async function runToCompletion(
  provider: Provider,
  request: MediaGenerationRequest
): Promise<{ taskId: string; resultJson: string; creditsConsumed?: number }> {
  const task = await provider.post.api.v1.jobs.createTask(
    request,
    mintKieCreateTaskOtp(request)
  );
  expect(task.code).toBe(200);
  expect(task.data?.taskId).toBeTruthy();
  const taskId = task.data!.taskId!;

  const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
  for (let i = 0; i < 180; i++) {
    const info = await provider.get.api.v1.jobs.recordInfo(taskId);
    const state = info.data?.state ?? "waiting";
    if (state === "success" || state === "fail") {
      expect(state).toBe("success");
      expect(info.data?.taskId).toBe(taskId);
      return {
        taskId,
        resultJson: info.data!.resultJson!,
        creditsConsumed: (info.data as { creditsConsumed?: number } | undefined)
          ?.creditsConsumed,
      };
    }
    if (pollDelay)
      await new Promise((resolve) => setTimeout(resolve, pollDelay));
  }
  throw new Error(`KIE task ${taskId} did not finish`);
}

describe("kie google/gemini-omni-flash-1-2-extend integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "extends a fresh 3 s 360p source by 3 s and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPolly("kie/gemini-omni-flash-1-2-extend");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const source = await runToCompletion(provider, {
        model: "google/gemini-omni-flash-1-2",
        input: {
          prompt: "A red panda waves once, then holds still.",
          duration: 3,
          resolution: "360p",
          aspect_ratio: "16:9",
        },
      } satisfies MediaGenerationRequest);

      const extendRequest = {
        model: "google/gemini-omni-flash-1-2-extend",
        input: {
          task_id: source.taskId,
          prompt: "The red panda turns and walks out of frame.",
          duration: 3,
        },
      } satisfies MediaGenerationRequest;
      expect(
        GoogleGeminiOmniFlash12ExtendRequestSchema.safeParse(extendRequest)
          .success
      ).toBe(true);

      const extended = await runToCompletion(provider, extendRequest);
      const result = JSON.parse(extended.resultJson) as {
        resultUrls?: string[];
      };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls![0]).toMatch(/^https:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (extended.creditsConsumed !== undefined) {
        expect(extended.creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("reads a task that does not exist without a paid call", async () => {
    ctx = setupPolly("kie/gemini-omni-flash-1-2-extend-record-info-not-found");

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
        model: "google/gemini-omni-flash-1-2-extend",
        input: {
          task_id: "task-source",
          prompt: "Then it rains.",
          duration: 3,
        },
      }).success
    ).toBe(true);

    // duration is the added seconds, 3-10.
    const tooLong = {
      model: "google/gemini-omni-flash-1-2-extend",
      input: { task_id: "task-source", prompt: "Then it rains.", duration: 11 },
    };
    expect(
      GoogleGeminiOmniFlash12ExtendRequestSchema.safeParse(tooLong).success
    ).toBe(false);
    expect(schema.safeParse(tooLong).success).toBe(false);
  });
});
