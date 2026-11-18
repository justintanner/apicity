import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_TEST_TIMEOUT_MS,
  NUNCHUX_VIDEO,
  recordNunchuxAlibabaTask,
} from "../nunchux-helpers";

describe("Nunchux Wan 2.7 video edit", () => {
  it(
    "restyles the three-second cat clip as a two-second 720P video",
    async () => {
      const ctx = setupPolly("nunchux/wan-2-7-video-edit");
      try {
        const task = await recordNunchuxAlibabaTask(
          {
            model: "wan2.7-videoedit",
            input: {
              prompt:
                "Restyle the clip as a soft watercolor painting; keep the motion and framing.",
              media: [{ type: "video", url: NUNCHUX_VIDEO }],
            },
            parameters: { resolution: "720P", duration: 2, watermark: false },
          },
          ctx
        );
        expect(task.output).toMatchObject({
          task_status: "SUCCEEDED",
          duration: 2,
          resolution: "720P",
        });
        // The 3 s source bills only up to the output length.
        expect(task.usage).toMatchObject({
          input_video_duration: 2,
          output_video_duration: 2,
          duration: 4,
        });
      } finally {
        await teardownPolly(ctx);
      }
    },
    NUNCHUX_TEST_TIMEOUT_MS
  );
});
