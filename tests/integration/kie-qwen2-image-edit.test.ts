import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie qwen2/image-edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create an image-edit task and poll status", async () => {
    ctx = setupPolly("kie/qwen2-image-edit");

    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const task = await provider.post.api.v1.jobs.createTask({
      model: "qwen2/image-edit",
      input: {
        prompt: "Add sunglasses to the subject",
        image_url:
          "https://static.aiquickdraw.com/tools/example/1773473208660_6EO8TFjh.webp",
        image_size: "1:1",
        output_format: "png",
      },
    });

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId);

    expect(info.data?.taskId).toBe(task.data?.taskId);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );
  });

  it("should validate image-edit payload", () => {
    const provider = kie({ apiKey: "test-key" });

    // image_size and output_format are optional per spec
    const valid = provider.post.api.v1.jobs.createTask.validatePayload({
      model: "qwen2/image-edit",
      input: {
        prompt: "Edit this image",
        image_url: "https://example.com/image.jpg",
      },
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    // Missing required model field
    const invalid = provider.post.api.v1.jobs.createTask.validatePayload({
      input: {},
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it("should expose model input schema for qwen2/image-edit", () => {
    const provider = kie({ apiKey: "test-key" });
    const schema = provider.modelInputSchemas["qwen2/image-edit"];

    expect(schema).toBeDefined();
    expect(schema.type).toBe("image");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.image_url.required).toBe(true);
    expect(schema.fields.image_url.type).toBe("string");
    expect(schema.fields.image_size.required).toBeUndefined();
    expect(schema.fields.image_size.enum).toContain("1:1");
    expect(schema.fields.image_size.enum).toContain("21:9");
    expect(schema.fields.output_format.required).toBeUndefined();
    expect(schema.fields.output_format.enum).toEqual(["png", "jpeg"]);
    expect(schema.fields.seed).toBeDefined();
  });
});
