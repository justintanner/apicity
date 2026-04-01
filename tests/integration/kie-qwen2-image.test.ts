import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie qwen2/text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/qwen2-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a text-to-image task and poll status", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const task = await provider.post.api.v1.jobs.createTask({
      model: "qwen2/text-to-image",
      input: {
        prompt: "A serene mountain landscape at sunrise",
        image_size: "16:9",
      },
    });

    expect(task.data?.taskId).toBeTruthy();
    expect(typeof task.data?.taskId).toBe("string");

    const info = await provider.get.api.v1.jobs.recordInfo(task.data?.taskId);

    expect(info.data?.taskId).toBe(task.data?.taskId);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );
  });
});
