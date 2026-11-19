import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_TEST_TIMEOUT_MS,
  NUNCHUX_VIDEO,
  recordNunchuxAlibabaTask,
} from "../nunchux-helpers";

describe("Nunchux HappyHorse 1.0 video edit", () => {
  it(
    "restyles the three-second cat clip as a three-second 720P video",
    async () => {
      const ctx = setupPolly("nunchux/happyhorse-1-0-video-edit");
      try {
        const task = await recordNunchuxAlibabaTask(
          {
            model: "happyhorse-1.0-video-edit",
            input: {
              prompt:
                "Restyle the clip as a soft watercolor painting; keep the motion and framing.",
              media: [{ type: "video", url: NUNCHUX_VIDEO }],
            },
            parameters: { resolution: "720P", duration: 3, watermark: false },
          },
          ctx
        );
        expect(task.output).toMatchObject({
          task_status: "SUCCEEDED",
          resolution: "720P",
        });
        // usage settles the charge: 3 s out plus the 3 s source.
        expect(task.usage).toMatchObject({
          input_video_duration: 3,
          output_video_duration: 3,
          duration: 6,
        });
      } finally {
        await teardownPolly(ctx);
      }
    },
    NUNCHUX_TEST_TIMEOUT_MS
  );
});
