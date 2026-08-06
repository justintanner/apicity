import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieVeoOtp, TEST_PAYGATE_SECRET } from "../harness";

/**
 * Live probe (ac-kd11of): does upstream honour camelCase aspectRatio,
 * snake_case aspect_ratio, or both?
 *
 * Both spellings share one Polly context so record/replay keep both
 * request pairs in a single HAR (separate `it` blocks with the same
 * recording name overwrite each other on re-record).
 *
 * Record with: pnpm run dev:record -- tests/integration/kie-veo-aspect-ratio-probe.test.ts
 * Asserts on submit success + paramJson / record-info echo of the spelling sent.
 */
describe("kie veo aspect ratio wire spelling probe (ac-kd11of)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/veo/aspect-ratio-probe");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("accepts camelCase aspectRatio and snake_case aspect_ratio (both echo as aspectRatio)", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    // --- camelCase aspectRatio ---
    const camelBody = {
      prompt:
        "Apicity aspect probe camelCase: solid blue sky, still camera, no people",
      model: "veo3_lite" as const,
      generationType: "TEXT_2_VIDEO" as const,
      aspectRatio: "9:16" as const,
      duration: 4 as const,
      resolution: "720p" as const,
    };

    const camelSubmit = await provider.veo.post.api.v1.veo.generate(
      camelBody,
      mintKieVeoOtp("api.v1.veo.generate", camelBody)
    );

    expect(camelSubmit.code).toBe(200);
    expect(camelSubmit.data?.taskId).toBeTruthy();
    const camelTaskId = camelSubmit.data!.taskId!;

    const camelInfo = await provider.veo.get.api.v1.veo.recordInfo(camelTaskId);
    expect(camelInfo.code).toBe(200);
    expect(camelInfo.data?.paramJson).toBeTruthy();
    const camelParams = JSON.parse(camelInfo.data!.paramJson!) as Record<
      string,
      unknown
    >;
    // Upstream normalizes to camelCase aspectRatio and keeps 9:16.
    expect(camelParams.aspectRatio).toBe("9:16");

    // --- snake_case aspect_ratio (bypass typed interface for probe) ---
    const snakeBody = {
      prompt:
        "Apicity aspect probe snake_case: solid blue sky, still camera, no people",
      model: "veo3_lite",
      generationType: "TEXT_2_VIDEO",
      aspect_ratio: "9:16",
      duration: 4,
      resolution: "720p",
    };

    const snakeSubmit = await provider.veo.post.api.v1.veo.generate(
      snakeBody as never,
      mintKieVeoOtp("api.v1.veo.generate", snakeBody)
    );

    expect(snakeSubmit.code).toBe(200);
    expect(snakeSubmit.data?.taskId).toBeTruthy();
    const snakeTaskId = snakeSubmit.data!.taskId!;

    const snakeInfo = await provider.veo.get.api.v1.veo.recordInfo(snakeTaskId);
    expect(snakeInfo.code).toBe(200);
    expect(snakeInfo.data?.paramJson).toBeTruthy();
    const snakeParams = JSON.parse(snakeInfo.data!.paramJson!) as Record<
      string,
      unknown
    >;
    // Snake_case input is also stored as camelCase aspectRatio — both accepted.
    expect(snakeParams.aspectRatio).toBe("9:16");
  });
});
