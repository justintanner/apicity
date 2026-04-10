import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { alibaba } from "@nakedapi/alibaba";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("alibaba wan i2v integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  // Skipped: wan2.7-i2v is only available on the Beijing endpoint
  // (https://dashscope.aliyuncs.com), and the current DASHSCOPE_API_KEY is an
  // intl-region key. Enable once a Beijing-scoped key is available.
  it.skip("should submit an image-to-video task and poll status", async () => {
    ctx = setupPolly("alibaba/wan-i2v");

    const provider = alibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
      // wan2.7-i2v is only listed in the Beijing (cn-beijing) console, not
      // on the Singapore intl endpoint the package defaults to.
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const imgDataUrl = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;

    const submit =
      await provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis({
        model: "wan2.7-i2v",
        input: {
          prompt:
            "The odd-eyed white cat blinks slowly, whiskers twitching, then turns its head toward the camera",
          img_url: imgDataUrl,
        },
        parameters: {
          resolution: "720P",
          duration: 5,
          prompt_extend: true,
          watermark: false,
          audio: false,
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

  it("should validate video-synthesis payload", () => {
    const provider = alibaba({ apiKey: "test-key" });

    const valid =
      provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis.validatePayload(
        {
          model: "wan2.7-i2v",
          input: {
            prompt: "a cat looking at the camera",
            img_url: "https://example.com/cat.jpg",
          },
          parameters: { resolution: "720P", duration: 5 },
        }
      );
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const missingInput =
      provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis.validatePayload(
        { model: "wan2.7-i2v" }
      );
    expect(missingInput.valid).toBe(false);
    expect(missingInput.errors.length).toBeGreaterThan(0);

    const missingImg =
      provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis.validatePayload(
        {
          model: "wan2.7-i2v",
          input: { prompt: "hi" },
        }
      );
    expect(missingImg.valid).toBe(false);
    expect(missingImg.errors.some((e) => e.includes("img_url"))).toBe(true);
  });
});
