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
  GptImage25FlareTextToImageRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie gpt-image-2-5-flare-text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/gpt-image-2-5-flare-text-to-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The OQ-001 / OQ-002 probe: `resolution` and `background` are omitted
      // on purpose, and 16:9 permits 2K and 4K, so the size kie returns is
      // its default rather than a ratio constraint (plans/ac-1m1js4 REQ-003).
      const request = {
        model: "gpt-image-2-5-flare-text-to-image",
        input: {
          prompt:
            "A lighthouse on a rocky headland at dusk, warm lamp glow against a violet sky, photorealistic.",
          aspect_ratio: "16:9",
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
      model: "gpt-image-2-5-flare-text-to-image",
      input: {
        prompt: "A serene mountain lake at sunrise.",
        aspect_ratio: "16:9",
        resolution: "2K",
      },
    });
    expect(ok.success).toBe(true);

    // The family rule (27:16, 16:27, 9:8 and 8:9 are 1K-only) is asserted on
    // the family schema: createTask.schema is a plain z.union, and a union
    // failure nests every member's issues under one invalid_union issue.
    const oneKOnly = {
      model: "gpt-image-2-5-flare-text-to-image",
      input: {
        prompt: "A tall banner.",
        aspect_ratio: "27:16",
        resolution: "2K",
      },
    };
    const family = GptImage25FlareTextToImageRequestSchema.safeParse(oneKOnly);
    expect(family.success).toBe(false);
    expect(
      family.error?.issues.some(
        (issue) => issue.path.join(".") === "input.resolution"
      )
    ).toBe(true);
    expect(schema.safeParse(oneKOnly).success).toBe(false);

    const badModel = schema.safeParse({
      model: "not-a-real-model",
      input: { prompt: "hello world" },
    });
    expect(badModel.success).toBe(false);
  });
});
