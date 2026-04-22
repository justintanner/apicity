import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { kie } from "@apicity/kie";

describe("kie gpt-image-2-text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/gpt-image-2-text-to-image");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const task = await provider.post.api.v1.jobs.createTask({
        model: "gpt-image-2-text-to-image",
        input: {
          prompt:
            "A cinematic night city poster with neon reflections on a rainy street.",
          aspect_ratio: "16:9",
          nsfw_checker: false,
        },
      });

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      for (let i = 0; i < 200; i++) {
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

  it("should validate payload via schema", () => {
    const provider = kie({ apiKey: "test-key" });

    const ok = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "gpt-image-2-text-to-image",
      input: {
        prompt: "A serene mountain lake at sunrise.",
        aspect_ratio: "1:1",
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
