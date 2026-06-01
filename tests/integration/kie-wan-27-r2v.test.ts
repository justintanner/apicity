import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie wan/2-7-r2v integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a wan 2.7 r2v task and poll status", async () => {
    ctx = setupPolly("kie/wan-27-r2v");

    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const task = await provider.post.api.v1.jobs.createTask({
      model: "wan/2-7-r2v",
      input: {
        prompt:
          "Image 1 is eating, while video 1 and image 2 are singing beside it.",
        negative_prompt:
          "low resolution, errors, worst quality, low quality, malformed, extra fingers, bad proportions",
        reference_image: [
          "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
        ],
        resolution: "720p",
        aspect_ratio: "16:9",
        duration: 5,
        prompt_extend: true,
        watermark: false,
        nsfw_checker: false,
      },
    }, 10);

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId);

    expect(info.data?.taskId).toBe(task.data?.taskId);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );
  });

  it("should validate wan/2-7-r2v payload", () => {
    const provider = kie({ apiKey: "test-key" });

    const valid = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "wan/2-7-r2v",
      input: {
        prompt: "A character walks through a garden",
        reference_image: ["https://example.com/ref.png"],
        resolution: "1080p",
        aspect_ratio: "16:9",
        duration: 5,
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

  it("should expose model input schema for wan/2-7-r2v", () => {
    const provider = kie({ apiKey: "test-key" });
    const schema = provider.modelInputSchemas["wan/2-7-r2v"];

    expect(schema).toBeDefined();
    expect(schema.type).toBe("video");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.resolution.enum).toContain("720p");
    expect(schema.fields.resolution.enum).toContain("1080p");
    expect(schema.fields.aspect_ratio.enum).toContain("16:9");
    expect(schema.fields.aspect_ratio.enum).toContain("9:16");
    expect(schema.fields.aspect_ratio.enum).toContain("1:1");
    expect(schema.fields.aspect_ratio.enum).toContain("4:3");
    expect(schema.fields.aspect_ratio.enum).toContain("3:4");
    expect(schema.fields.duration.type).toBe("number");
    expect(schema.fields.reference_image).toBeDefined();
    expect(schema.fields.reference_image.type).toBe("array");
    expect(schema.fields.reference_video).toBeDefined();
    expect(schema.fields.reference_video.type).toBe("array");
    expect(schema.fields.first_frame).toBeDefined();
    expect(schema.fields.reference_voice).toBeDefined();
    expect(schema.fields.negative_prompt).toBeDefined();
    expect(schema.fields.prompt_extend.type).toBe("boolean");
    expect(schema.fields.watermark.type).toBe("boolean");
    expect(schema.fields.seed.type).toBe("number");
    expect(schema.fields.nsfw_checker).toBeDefined();
    expect(schema.fields.nsfw_checker.type).toBe("boolean");
  });
});
