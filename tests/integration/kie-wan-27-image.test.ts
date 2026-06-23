import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie wan/2-7-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create an image generation task and poll to completion",
    { timeout: 660_000 },
    async () => {
      ctx = setupPolly("kie/wan-27-image");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "wan/2-7-image",
        input: {
          prompt:
            "A serene mountain landscape at sunrise with misty valleys and golden light.",
          n: 1,
          resolution: "2K",
          aspect_ratio: "1:1",
          enable_sequential: false,
          thinking_mode: false,
          watermark: false,
          seed: 0,
          nsfw_checker: false,
        },
      };
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      // Poll until terminal state (skip delay in replay mode)
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      for (let i = 0; i < 120; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          if (state === "success") {
            expect(info.data?.resultJson).toBeTruthy();
          }
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
    }
  );

  it("should validate wan/2-7-image payload", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const valid = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "wan/2-7-image",
      input: {
        prompt: "A cat sitting on a windowsill",
      },
    });
    expect(valid.success).toBe(true);

    // Missing required model field
    const invalid = provider.post.api.v1.jobs.createTask.schema.safeParse({
      input: {},
    });
    expect(invalid.success).toBe(false);
    expect(invalid.error?.issues.length).toBeGreaterThan(0);
  });

  it("should expose model input schema for wan/2-7-image", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.modelInputSchemas["wan/2-7-image"];

    expect(schema).toBeDefined();
    expect(schema.type).toBe("image");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.prompt.type).toBe("string");
    expect(schema.fields.input_urls.type).toBe("array");
    expect(schema.fields.aspect_ratio.enum).toContain("1:1");
    expect(schema.fields.aspect_ratio.enum).toContain("16:9");
    expect(schema.fields.aspect_ratio.enum).toContain("21:9");
    expect(schema.fields.aspect_ratio.enum).toContain("8:1");
    expect(schema.fields.aspect_ratio.enum).toContain("1:8");
    expect(schema.fields.enable_sequential.type).toBe("boolean");
    expect(schema.fields.n.type).toBe("integer");
    expect(schema.fields.resolution.enum).toContain("1K");
    expect(schema.fields.resolution.enum).toContain("2K");
    expect(schema.fields.resolution.enum).toContain("4K");
    expect(schema.fields.thinking_mode.type).toBe("boolean");
    expect(schema.fields.color_palette.type).toBe("array");
    expect(schema.fields.bbox_list.type).toBe("array");
    expect(schema.fields.watermark.type).toBe("boolean");
    expect(schema.fields.seed.type).toBe("integer");
    expect(schema.fields.nsfw_checker.type).toBe("boolean");
  });
});
