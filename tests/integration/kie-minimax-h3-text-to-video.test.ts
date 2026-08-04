import { afterEach, describe, expect, it } from "vitest";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import {
  mintKieCreateTaskOtp,
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";

describe("kie minimax-h3/text-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates a MiniMax H3 text-to-video task", async () => {
    ctx = setupPolly("kie/minimax-h3-text-to-video");

    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });
    const request = {
      model: "minimax-h3/text-to-video",
      input: {
        prompt: "A paper kite glides above sunlit ocean waves.",
        aspect_ratio: "16:9",
        duration: 4,
        resolution: "768P",
      },
    } satisfies MediaGenerationRequest;

    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();
  });
});
