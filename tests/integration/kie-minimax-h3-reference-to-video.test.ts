import { afterEach, describe, expect, it } from "vitest";

import { createKie, type MediaGenerationRequest } from "@apicity/kie";

import {
  mintKieCreateTaskOtp,
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";

describe("kie MiniMax H3 reference-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates a reference-to-video task and returns a task ID", async () => {
    ctx = setupPolly("kie/minimax-h3-reference-to-video");

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "minimax-h3/reference-to-video",
      input: {
        prompt:
          "Preserve the subject identity while adding natural motion and gentle camera movement.",
        reference_image_urls: [
          "https://static.aiquickdraw.com/tools/example/1785486917618_1ENVS1T7.png",
        ],
        aspect_ratio: "adaptive",
        duration: 4,
        resolution: "768P",
      },
    } satisfies MediaGenerationRequest;

    expect(request.model).toBe("minimax-h3/reference-to-video");

    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(typeof task.data?.taskId).toBe("string");
    expect(task.data?.taskId.length).toBeGreaterThan(0);
  });
});
