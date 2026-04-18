import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie seedream/5-lite-text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/seedream-5-lite-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a text-to-image task and poll status", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const task = await provider.post.api.v1.jobs.createTask({
      model: "seedream/5-lite-text-to-image",
      input: {
        prompt: "A serene mountain landscape at sunrise, photorealistic",
        aspect_ratio: "16:9",
        quality: "basic",
        nsfw_checker: false,
      },
    });

    expect(task).toBeDefined();
    expect(typeof task.code).toBe("number");
    if (task.code === 200) {
      expect(task.data?.taskId).toBeTruthy();
      expect(typeof task.data?.taskId).toBe("string");

      const info = await provider.get.api.v1.jobs.recordInfo(
        task.data?.taskId as string
      );
      expect(info.data?.taskId).toBe(task.data?.taskId);
      expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
        info.data?.state
      );
    }
  });

  it("should validate payload via schema", () => {
    const provider = kie({ apiKey: "test-key" });

    const ok = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "seedream/5-lite-text-to-image",
      input: {
        prompt: "A futuristic city skyline at dusk",
        aspect_ratio: "1:1",
        quality: "high",
      },
    });
    expect(ok.success).toBe(true);

    const badModel = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "not-a-real-model",
      input: { prompt: "hello world" },
    });
    expect(badModel.success).toBe(false);
  });
});
