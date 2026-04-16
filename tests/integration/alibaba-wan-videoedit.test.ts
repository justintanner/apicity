import { afterEach, describe, expect, it } from "vitest";
import { alibaba } from "@apicity/alibaba";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";

const recordingName = "alibaba/wan-videoedit";

describe("alibaba wan videoedit integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should submit a video editing task and poll status", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = alibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
      baseURL:
        process.env.DASHSCOPE_BASE_URL ??
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

    const submit =
      await provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis({
        model: "wan2.7-videoedit",
        input: {
          prompt: "Convert the entire scene to a claymation style",
          media: [
            {
              type: "video",
              url: "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20260402/ldnfdf/wan2.7-videoedit-style-change.mp4",
            },
          ],
        },
        parameters: {
          resolution: "720P",
          prompt_extend: true,
          watermark: true,
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
    const maxPolls = getPollyMode() === "replay" ? 60 : 12;
    let status = await provider.get.api.v1.tasks(submit.output.task_id);
    for (
      let i = 0;
      i < maxPolls &&
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

  it("should validate wan2.7-videoedit payload via .schema.safeParse", () => {
    const provider = alibaba({ apiKey: "test-key" });

    const valid =
      provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis.schema.safeParse(
        {
          model: "wan2.7-videoedit",
          input: {
            prompt: "Convert the entire scene to a claymation style",
            media: [
              {
                type: "video",
                url: "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20260402/ldnfdf/wan2.7-videoedit-style-change.mp4",
              },
            ],
          },
          parameters: {
            resolution: "720P",
            prompt_extend: true,
            watermark: true,
          },
        }
      );
    expect(valid.success).toBe(true);

    const missingMedia =
      provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis.schema.safeParse(
        {
          model: "wan2.7-videoedit",
          input: {
            prompt: "Convert the entire scene to a claymation style",
          },
          parameters: {
            resolution: "720P",
          },
        }
      );
    expect(missingMedia.success).toBe(false);
  });
});
