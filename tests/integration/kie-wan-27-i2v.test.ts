import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie wan/2-7-image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a wan 2.7 i2v task and poll status", async () => {
    ctx = setupPolly("kie/wan-27-i2v");

    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const task = await provider.post.api.v1.jobs.createTask({
      model: "wan/2-7-image-to-video",
      input: {
        prompt:
          "A cat stretches lazily then turns to look at the camera with curious eyes",
        negative_prompt: "blurry, low quality, distorted",
        first_frame_url:
          "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
        resolution: "720p",
        duration: 5,
        prompt_extend: true,
        watermark: false,
        nsfw_checker: false,
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

  it("should validate wan/2-7-image-to-video payload", () => {
    const provider = kie({ apiKey: "test-key" });

    const valid = provider.post.api.v1.jobs.createTask.validatePayload({
      model: "wan/2-7-image-to-video",
      input: {
        prompt: "A cat watching birds outside a window",
        first_frame_url: "https://example.com/frame.png",
        resolution: "1080p",
        duration: 5,
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

  it("should expose model input schema for wan/2-7-image-to-video", () => {
    const provider = kie({ apiKey: "test-key" });
    const schema = provider.modelInputSchemas["wan/2-7-image-to-video"];

    expect(schema).toBeDefined();
    expect(schema.type).toBe("video");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.resolution.enum).toContain("720p");
    expect(schema.fields.resolution.enum).toContain("1080p");
    expect(schema.fields.duration.type).toBe("number");
    expect(schema.fields.first_frame_url).toBeDefined();
    expect(schema.fields.last_frame_url).toBeDefined();
    expect(schema.fields.first_clip_url).toBeDefined();
    expect(schema.fields.driving_audio_url).toBeDefined();
    expect(schema.fields.negative_prompt).toBeDefined();
    expect(schema.fields.prompt_extend.type).toBe("boolean");
    expect(schema.fields.watermark.type).toBe("boolean");
    expect(schema.fields.seed.type).toBe("number");
    expect(schema.fields.nsfw_checker).toBeDefined();
    expect(schema.fields.nsfw_checker.type).toBe("boolean");
  });
});
