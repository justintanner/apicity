import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import {
  createKie,
  GoogleGeminiOmniFlash11RequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie google/gemini-omni-flash-1-1 text-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "creates a text-to-video task and polls to a successful media result",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("kie/google-gemini-omni-flash-1-1-text-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "google/gemini-omni-flash-1-1",
        input: {
          prompt:
            "A paper boat drifts down a gentle stream through a mossy forest while the camera glides alongside in one continuous shot.",
          duration: "4",
          resolution: "720p",
          aspect_ratio: "16:9",
        },
      } satisfies MediaGenerationRequest;

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      let state = "waiting";
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;

      for (let i = 0; i < 240; i++) {
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
      expect(resultJson).toBeTruthy();

      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls!.length).toBeGreaterThan(0);
      expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    const ok = schema.safeParse({
      model: "google/gemini-omni-flash-1-1",
      input: {
        prompt:
          "A paper boat drifts down a gentle stream through a mossy forest.",
        duration: "4",
        resolution: "720p",
        aspect_ratio: "16:9",
      },
    });
    expect(ok.success).toBe(true);

    const missingDuration = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: "google/gemini-omni-flash-1-1",
      input: { prompt: "hello world", resolution: "720p" },
    });
    expect(missingDuration.success).toBe(false);
    expect(
      missingDuration.error?.issues.some(
        (issue) => issue.path.join(".") === "input.duration"
      )
    ).toBe(true);

    const badModel = schema.safeParse({
      model: "not-a-real-model",
      input: { prompt: "hello world" },
    });
    expect(badModel.success).toBe(false);
  });
});
