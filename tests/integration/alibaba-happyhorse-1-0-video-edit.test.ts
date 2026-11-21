import { afterEach, describe, expect, it } from "vitest";
import { createAlibaba } from "@apicity/alibaba";
import { AlibabaTaskStatusResponseSchema } from "@apicity/alibaba/zod";
import {
  getPollyMode,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";

const SOURCE_VIDEO =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4";

describe("alibaba happyhorse 1.0 video edit integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should submit a minimal happyhorse-1.0-video-edit task and poll until completion", async () => {
    ctx = setupPolly("alibaba/happyhorse-1-0-video-edit");

    const provider = createAlibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const submit =
      await provider.post.api.v1.services.aigc.videoGeneration.videoSynthesis({
        model: "happyhorse-1.0-video-edit",
        input: {
          prompt: "Restyle the clip as a soft watercolor painting",
          media: [{ type: "video", url: SOURCE_VIDEO }],
        },
        parameters: {
          resolution: "720P",
        },
      });

    expect(submit.output.task_id).toBeTruthy();
    expect(["PENDING", "RUNNING", "SUSPENDED", "SUCCEEDED"]).toContain(
      submit.output.task_status
    );

    const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
    const maxPolls = getPollyMode() === "replay" ? 120 : 36;
    let status = await provider.get.api.v1.tasks(submit.output.task_id);
    for (
      let i = 0;
      i < maxPolls &&
      (status.output.task_status === "PENDING" ||
        status.output.task_status === "RUNNING" ||
        status.output.task_status === "SUSPENDED");
      i++
    ) {
      await new Promise((r) => setTimeout(r, pollDelay));
      status = await provider.get.api.v1.tasks(submit.output.task_id);
    }

    expect(status.output.task_id).toBe(submit.output.task_id);
    expect(status.output.task_status).toBe("SUCCEEDED");
    expect(status.output.video_url).toBeTruthy();
    expect(status.usage?.duration).toBeGreaterThan(0);
    expect(status.usage?.output_video_duration).toBeGreaterThan(0);
    expect(AlibabaTaskStatusResponseSchema.safeParse(status).success).toBe(
      true
    );
  }, 420_000);

  it("should return UNKNOWN for a nonexistent task id", async () => {
    ctx = setupPolly("alibaba/happyhorse-1-0-video-edit-not-found");

    const provider = createAlibaba({
      apiKey: process.env.DASHSCOPE_API_KEY ?? "test-key",
    });

    const bogusId = "00000000-0000-0000-0000-000000000000";
    const status = await provider.get.api.v1.tasks(bogusId);

    expect(status.output.task_id).toBe(bogusId);
    expect(status.output.task_status).toBe("UNKNOWN");
  });
});
