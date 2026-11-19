import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";
import { GrokVideoUpscaleRequestSchema } from "@apicity/kie/zod";

// ac-xnzcl4: grok-imagine/upscale's documented resolution input (the target,
// 720p or 1080p) is priced from the 2026-11-19 feed rows alone. No upscale is
// recorded here: one would need a paid grok-imagine source video. The paid
// upscale recording stays kie/grok-video-upscale (tests/integration/kie-video.test.ts).
describe("kie grok-imagine/upscale integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it("reads a task that does not exist without a paid call", async () => {
    ctx = setupPolly("kie/grok-imagine-upscale-record-info-not-found");

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const info = await provider.get.api.v1.jobs.recordInfo(
      "apicity-test-nonexistent-task-id-do-not-record-real"
    );

    // KIE answers HTTP 200 with a 422 envelope and no data.
    expect(info.code).toBe(422);
    expect(info.msg).toBe("recordInfo is null");
    expect(info.data).toBeNull();
  });

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    for (const input of [
      { task_id: "task_grok_12345678" },
      { task_id: "task_grok_12345678", resolution: "720p" },
      { task_id: "task_grok_12345678", resolution: "1080p" },
    ]) {
      const request = { model: "grok-imagine/upscale", input };
      expect(schema.safeParse(request).success, JSON.stringify(input)).toBe(
        true
      );
    }

    // The target is 720p or 1080p; 480p is a source, never a target.
    const sourceAsTarget = {
      model: "grok-imagine/upscale",
      input: { task_id: "task_grok_12345678", resolution: "480p" },
    };
    expect(
      GrokVideoUpscaleRequestSchema.safeParse(sourceAsTarget).success
    ).toBe(false);
    expect(schema.safeParse(sourceAsTarget).success).toBe(false);
  });
});
