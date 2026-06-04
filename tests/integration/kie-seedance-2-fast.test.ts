import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie bytedance/seedance-2-fast integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a seedance-2-fast task and poll status", async () => {
    ctx = setupPolly("kie/seedance-2-fast");

    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const request = {
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "A calm lake at dawn with mist rising over the water",
        resolution: "480p",
        aspect_ratio: "16:9",
        duration: 4,
        generate_audio: false,
        web_search: false,
      },
    };
    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId);

    expect(info.data?.taskId).toBe(task.data?.taskId);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );
  });

  it("should validate seedance-2-fast payload", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const valid = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "bytedance/seedance-2-fast",
      input: {
        prompt: "A calm lake at dawn with mist rising over the water",
        resolution: "480p",
        aspect_ratio: "16:9",
        duration: 4,
        generate_audio: false,
        web_search: false,
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

  it("should expose model input schema for bytedance/seedance-2-fast", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
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
    expect(schema.fields.web_search.required).toBe(true);
    expect(schema.fields.nsfw_checker).toBeDefined();
    expect(schema.fields.nsfw_checker.type).toBe("boolean");
  });
});
