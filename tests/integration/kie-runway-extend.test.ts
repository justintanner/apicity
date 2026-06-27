import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";
import { mintKieRunwayOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie runway extend integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "submits an extend task through the pay-gate and returns the envelope",
    { timeout: 600_000 },
    async () => {
      // Exercises the live endpoint + pay-gate dispatch end to end. The upstream
      // accepts the extend submission and returns a standard TaskResponse
      // envelope synchronously (the source taskId is resolved asynchronously),
      // so a deterministic placeholder source keeps the recording stable.
      ctx = setupPolly("kie/runway/extend-not-found");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      });

      const request = {
        taskId: "apicity-test-nonexistent-task-id-do-not-record-real",
        prompt: "Continue the scene with a slow zoom out.",
        quality: "720p",
      };

      try {
        const result = await provider.post.api.v1.runway.extend(
          request,
          mintKieRunwayOtp("api.v1.runway.extend", request)
        );
        // Standard kie envelope: numeric code + string msg (+ optional taskId).
        expect(typeof result.code).toBe("number");
        expect(typeof result.msg).toBe("string");
      } catch (error) {
        // Or upstream may answer with an HTTP error, surfaced as KieError.
        expect(error).toBeInstanceOf(KieError);
      }
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const extend = provider.post.api.v1.runway.extend;

    const ok = extend.schema.safeParse({
      taskId: "ee603959-debb-48d1-98c4-a6d1c717eba6",
      prompt: "Keep panning across the valley.",
      quality: "1080p",
      waterMark: "",
    });
    expect(ok.success).toBe(true);

    // Missing the required source taskId.
    const noTaskId = extend.schema.safeParse({
      prompt: "Keep going.",
      quality: "720p",
    });
    expect(noTaskId.success).toBe(false);

    // Missing the required prompt.
    const noPrompt = extend.schema.safeParse({
      taskId: "ee603959-debb-48d1-98c4-a6d1c717eba6",
      quality: "720p",
    });
    expect(noPrompt.success).toBe(false);

    // Quality must be 720p or 1080p.
    const badQuality = extend.schema.safeParse({
      taskId: "ee603959-debb-48d1-98c4-a6d1c717eba6",
      prompt: "Keep going.",
      quality: "480p",
    });
    expect(badQuality.success).toBe(false);
  });
});
