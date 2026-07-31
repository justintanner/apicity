import { afterEach, describe, expect, it } from "vitest";

import { createKie, type MediaGenerationRequest } from "@apicity/kie";

import {
  mintKieCreateTaskOtp,
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";

describe("kie WAN 2.7 explicit resolution integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates an image task with explicit aspect ratio and resolution", async () => {
    ctx = setupPolly("kie/wan-27-image-explicit-resolution");

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "wan/2-7-image",
      input: {
        prompt:
          "A paper-cut night garden with silver leaves and warm lanterns.",
        aspect_ratio: "16:9",
        resolution: "2K",
        n: 1,
      },
    } satisfies MediaGenerationRequest;

    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(typeof task.data?.taskId).toBe("string");
    expect(task.data?.taskId.length).toBeGreaterThan(0);
  });
});
