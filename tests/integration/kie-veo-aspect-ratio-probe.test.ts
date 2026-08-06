import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieVeoOtp, TEST_PAYGATE_SECRET } from "../harness";

/**
 * Live probe (ac-kd11of): does upstream honour camelCase aspectRatio,
 * snake_case aspect_ratio, or both?
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

  it("accepts camelCase aspectRatio=9:16 and echoes it in task params", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const body = {
      prompt:
        "Apicity aspect probe camelCase: solid blue sky, still camera, no people",
      model: "veo3_lite" as const,
      generationType: "TEXT_2_VIDEO" as const,
      aspectRatio: "9:16" as const,
      duration: 4 as const,
      resolution: "720p" as const,
    };

    const submit = await provider.veo.post.api.v1.veo.generate(
      body,
      mintKieVeoOtp("api.v1.veo.generate", body)
    );

    expect(submit.code).toBe(200);
    expect(submit.data?.taskId).toBeTruthy();
    const taskId = submit.data!.taskId!;

    const info = await provider.veo.get.api.v1.veo.recordInfo(taskId);
    expect(info.code).toBe(200);
    expect(info.data?.paramJson).toBeTruthy();
    const params = JSON.parse(info.data!.paramJson!) as Record<string, unknown>;
    // Upstream normalizes to camelCase aspectRatio and keeps 9:16.
    expect(params.aspectRatio).toBe("9:16");
  });

  it("accepts snake_case aspect_ratio=9:16 when sent on the wire", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    // Bypass typed interface: send snake_case via raw body cast for probe.
    const body = {
      prompt:
        "Apicity aspect probe snake_case: solid blue sky, still camera, no people",
      model: "veo3_lite",
      generationType: "TEXT_2_VIDEO",
      aspect_ratio: "9:16",
      duration: 4,
      resolution: "720p",
    };

    const submit = await provider.veo.post.api.v1.veo.generate(
      body as never,
      mintKieVeoOtp("api.v1.veo.generate", body)
    );

    expect(submit.code).toBe(200);
    expect(submit.data?.taskId).toBeTruthy();
    const taskId = submit.data!.taskId!;

    const info = await provider.veo.get.api.v1.veo.recordInfo(taskId);
    expect(info.code).toBe(200);
    expect(info.data?.paramJson).toBeTruthy();
    const params = JSON.parse(info.data!.paramJson!) as Record<string, unknown>;
    // Snake_case input is also stored as camelCase aspectRatio — both accepted.
    expect(params.aspectRatio).toBe("9:16");
  });
});
