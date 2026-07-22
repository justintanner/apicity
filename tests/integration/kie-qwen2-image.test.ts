import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie qwen2/text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/qwen2-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a text-to-image task and poll status", async () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const request = {
      model: "qwen2/text-to-image",
      input: {
        prompt: "A serene mountain landscape at sunrise",
        image_size: "16:9",
      },
    } as const;
    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.data?.taskId).toBeTruthy();
    expect(typeof task.data?.taskId).toBe("string");

    const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId!);

    expect(info.data?.taskId).toBe(task.data?.taskId);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );
  });

  it("should validate text-to-image payload", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    const valid = schema.safeParse({
      model: "qwen2/text-to-image",
      callBackUrl: "https://example.com/kie-callback",
      input: {
        prompt: "A small watercolor cabin beside a quiet lake",
        image_size: "1:1",
        seed: 42,
        output_format: "jpeg",
        nsfw_checker: true,
      },
    });
    expect(valid.success).toBe(true);

    const missingPrompt = schema.safeParse({
      model: "qwen2/text-to-image",
      input: {
        image_size: "16:9",
      },
    });
    expect(missingPrompt.success).toBe(false);
    if (missingPrompt.success) throw new Error("expected failure");
    expect(JSON.stringify(missingPrompt.error?.issues)).toContain("prompt");

    const invalidSize = schema.safeParse({
      model: "qwen2/text-to-image",
      input: {
        prompt: "A small watercolor cabin beside a quiet lake",
        image_size: "square",
      },
    });
    expect(invalidSize.success).toBe(false);

    const invalidSeed = schema.safeParse({
      model: "qwen2/text-to-image",
      input: {
        prompt: "A small watercolor cabin beside a quiet lake",
        seed: 1.5,
      },
    });
    expect(invalidSeed.success).toBe(false);

    const invalidFormat = schema.safeParse({
      model: "qwen2/text-to-image",
      input: {
        prompt: "A small watercolor cabin beside a quiet lake",
        output_format: "webp",
      },
    });
    expect(invalidFormat.success).toBe(false);

    const invalidCallback = schema.safeParse({
      model: "qwen2/text-to-image",
      callBackUrl: "not-a-url",
      input: {
        prompt: "A small watercolor cabin beside a quiet lake",
      },
    });
    expect(invalidCallback.success).toBe(false);

    const invalidLongPrompt = schema.safeParse({
      model: "qwen2/text-to-image",
      input: {
        prompt: "x".repeat(801),
      },
    });
    expect(invalidLongPrompt.success).toBe(false);
  });

  it("should expose model input schema for qwen2/text-to-image", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.modelInputSchemas["qwen2/text-to-image"];

    // Bind the identity, not just presence: consumers build this model's
    // payloads from its modelInputSchemas descriptor, so attaching a
    // sibling model's descriptor here would misstate the input contract.
    expect(schema).toBe(modelInputSchemas["qwen2/text-to-image"]);
    expect(schema.type).toBe("image");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.prompt.maxLength).toBe(800);
    expect(schema.fields.image_size.required).toBeUndefined();
    expect(schema.fields.image_size.default).toBe("16:9");
    expect(schema.fields.image_size.enum).toEqual([
      "1:1",
      "3:4",
      "4:3",
      "9:16",
      "16:9",
    ]);
    expect(schema.fields.seed.type).toBe("integer");
    expect(schema.fields.output_format.required).toBeUndefined();
    expect(schema.fields.output_format.default).toBe("png");
    expect(schema.fields.output_format.enum).toEqual(["jpeg", "png"]);
    expect(schema.fields.nsfw_checker.type).toBe("boolean");
    expect(schema.fields.nsfw_checker.default).toBe(false);
  });
});
