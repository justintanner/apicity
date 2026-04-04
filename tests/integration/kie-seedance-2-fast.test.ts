import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie bytedance/seedance-2-fast integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a seedance-2-fast task and poll status", async () => {
    ctx = setupPolly("kie/seedance-2-fast");

    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const task = await provider.post.api.v1.jobs.createTask({
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "A calm lake at dawn with mist rising over the water",
        resolution: "480p",
        aspect_ratio: "16:9",
        duration: 4,
        generate_audio: false,
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

  it("should validate seedance-2-fast payload", () => {
    const provider = kie({ apiKey: "test-key" });

    const valid = provider.post.api.v1.jobs.createTask.validatePayload({
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "A calm lake at dawn with mist rising over the water",
        resolution: "480p",
        aspect_ratio: "16:9",
        duration: 4,
        generate_audio: false,
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

  it("should expose model input schema for bytedance/seedance-2-fast", () => {
    const provider = kie({ apiKey: "test-key" });
    const schema = provider.modelInputSchemas["bytedance/seedance-2-fast"];

    expect(schema).toBeDefined();
    expect(schema.type).toBe("video");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.aspect_ratio.enum).toContain("adaptive");
    expect(schema.fields.aspect_ratio.enum).toContain("16:9");
    expect(schema.fields.resolution.enum).toContain("480p");
    expect(schema.fields.resolution.enum).toContain("720p");
    expect(schema.fields.duration.type).toBe("number");
    expect(schema.fields.first_frame_url).toBeDefined();
    expect(schema.fields.last_frame_url).toBeDefined();
    expect(schema.fields.reference_image_urls.type).toBe("array");
    expect(schema.fields.web_search.type).toBe("boolean");
  });
});
