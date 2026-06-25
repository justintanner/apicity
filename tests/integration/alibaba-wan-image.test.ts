import { afterEach, describe, expect, it } from "vitest";
import { createAlibaba } from "@apicity/alibaba";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";

describe("alibaba wan2.7 image generation integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should submit an async text-to-image task and poll status", async () => {
    ctx = setupPolly("alibaba/wan-image-t2i");

    const provider = createAlibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const submit =
      await provider.post.api.v1.services.aigc.imageGeneration.generation({
        model: "wan2.7-image-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: "A flower shop with exquisite windows, a beautiful wooden door, and flowers on display",
                },
              ],
            },
          ],
        },
        parameters: {
          size: "2K",
          n: 1,
          watermark: false,
          thinking_mode: true,
        },
      });

    expect(submit.output.task_id).toBeTruthy();
    expect([
      "PENDING",
      "RUNNING",
      "SUSPENDED",
      "SUCCEEDED",
      "FAILED",
    ]).toContain(submit.output.task_status);

    const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
    let status = await provider.get.api.v1.tasks(submit.output.task_id);
    for (
      let i = 0;
      i < 60 &&
      (status.output.task_status === "PENDING" ||
        status.output.task_status === "RUNNING");
      i++
    ) {
      await new Promise((r) => setTimeout(r, pollDelay));
      status = await provider.get.api.v1.tasks(submit.output.task_id);
    }

    expect(status.output.task_id).toBe(submit.output.task_id);
    expect([
      "PENDING",
      "RUNNING",
      "SUSPENDED",
      "SUCCEEDED",
      "FAILED",
    ]).toContain(status.output.task_status);
  }, 300_000);
});
