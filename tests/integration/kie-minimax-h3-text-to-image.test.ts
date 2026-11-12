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
  MiniMaxH3TextToImageRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie minimax-h3/text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/minimax-h3-text-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The cheapest documented settings: the 1K tier costs the same 1.8
      // credits as the 2K default and keeps the output small, and jpeg is
      // much smaller than the png default.
      const request = {
        model: "minimax-h3/text-to-image",
        input: {
          prompt: "A red balloon.",
          aspect_ratio: "1:1",
          resolution: "1K",
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
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;
      for (let i = 0; i < 200; i++) {
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
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
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
      model: "minimax-h3/text-to-image",
      input: { prompt: "A red balloon.", width: 1920, height: 1080 },
    });
    expect(ok.success).toBe(true);

    // The size rule is asserted on the model schema: createTask.schema is a
    // plain z.union, and a union failure nests every member's issues under
    // one invalid_union issue.
    const customWithTier = {
      model: "minimax-h3/text-to-image",
      input: {
        prompt: "A red balloon.",
        resolution: "2K",
        width: 1920,
        height: 1080,
      },
    };
    const model = MiniMaxH3TextToImageRequestSchema.safeParse(customWithTier);
    expect(model.success).toBe(false);
    expect(
      model.error?.issues.some(
        (issue) => issue.path.join(".") === "input.resolution"
      )
    ).toBe(true);
    expect(schema.safeParse(customWithTier).success).toBe(false);
  });
});
