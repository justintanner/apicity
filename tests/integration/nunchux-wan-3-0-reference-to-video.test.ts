import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_IMAGE,
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxAlibabaTask,
} from "../nunchux-helpers";

describe("Nunchux Wan 3.0 reference-to-video", () => {
  it(
    "renders a two-second 480P video from a reference image",
    async () => {
      const ctx = setupPolly("nunchux/wan-3-0-reference-to-video");
      try {
        const task = await recordNunchuxAlibabaTask(
          {
            model: "wan3.0-video",
            input: {
              prompt:
                "Image 1 walks slowly across a sunlit wooden floor; the camera follows at floor level.",
              media: [{ type: "reference_image", url: NUNCHUX_IMAGE }],
            },
            parameters: { resolution: "480P", duration: 2, watermark: false },
          },
          ctx
        );
        expect(task.output).toMatchObject({
          task_status: "SUCCEEDED",
          duration: 2,
          resolution: "480P",
        });
        expect(task.usage?.output_video_duration).toBe(2);
      } finally {
        await teardownPolly(ctx);
      }
    },
    NUNCHUX_TEST_TIMEOUT_MS
  );
});
