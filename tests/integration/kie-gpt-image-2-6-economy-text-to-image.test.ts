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
  GptImage26EconomyTextToImageRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie gpt-image-2-6/economy-text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/gpt-image-2-6-economy-text-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The documented defaults (png, auto aspect ratio): the economy channel
      // bills a flat 5 credits per 1K image, its only size.
      const request = {
        model: "gpt-image-2-6/economy-text-to-image",
        input: {
          prompt: "A red balloon.",
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

    const gif = schema.safeParse({
      model: "gpt-image-2-6/economy-text-to-image",
      input: {
        prompt: "A bouncing ball.",
        output_format: "gif",
        frame_count: "9",
        frame_duration_ms: 120,
      },
    });
    expect(gif.success).toBe(true);

    // The GIF-field rule is asserted on the model schema: createTask.schema is
    // a plain z.union, and a union failure nests every member's issues under
    // one invalid_union issue.
    const pngFrames = {
      model: "gpt-image-2-6/economy-text-to-image",
      input: { prompt: "A bouncing ball.", frame_count: "9" },
    };
    const model =
      GptImage26EconomyTextToImageRequestSchema.safeParse(pngFrames);
    expect(model.success).toBe(false);
    expect(
      model.error?.issues.some(
        (issue) => issue.path.join(".") === "input.frame_count"
      )
    ).toBe(true);
    expect(schema.safeParse(pngFrames).success).toBe(false);

    const jpeg = schema.safeParse({
      model: "gpt-image-2-6/economy-text-to-image",
      input: { prompt: "A bouncing ball.", output_format: "jpeg" },
    });
    expect(jpeg.success).toBe(false);
  });
});
