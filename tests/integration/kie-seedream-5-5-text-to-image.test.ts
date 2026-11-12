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
  Seedream55TextToImageRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie seedream/5-5-text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/seedream-5-5-text-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The cheapest documented settings: the 1K size (3.6 credits, below the
      // 2K default's 6.3). aspect_ratio is required on this model.
      const request = {
        model: "seedream/5-5-text-to-image",
        input: {
          prompt: "A red balloon floating over a quiet street.",
          aspect_ratio: "1:1",
          size: "1K",
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
      model: "seedream/5-5-text-to-image",
      input: {
        prompt: "A glass serum bottle on a white stand.",
        aspect_ratio: "16:9",
        background: "transparent",
      },
    });
    expect(ok.success).toBe(true);

    // aspect_ratio is required here, unlike image-to-image's auto default.
    const noRatio = schema.safeParse({
      model: "seedream/5-5-text-to-image",
      input: { prompt: "A glass serum bottle on a white stand." },
    });
    expect(noRatio.success).toBe(false);

    // The background rule is asserted on the model schema: createTask.schema
    // is a plain z.union, and a union failure nests every member's issues
    // under one invalid_union issue.
    const transparentJpeg = {
      model: "seedream/5-5-text-to-image",
      input: {
        prompt: "A glass serum bottle on a white stand.",
        aspect_ratio: "1:1",
        background: "transparent",
        output_format: "jpeg",
      },
    };
    const model = Seedream55TextToImageRequestSchema.safeParse(transparentJpeg);
    expect(model.success).toBe(false);
    expect(
      model.error?.issues.some(
        (issue) => issue.path.join(".") === "input.background"
      )
    ).toBe(true);
    expect(schema.safeParse(transparentJpeg).success).toBe(false);
  });
});
