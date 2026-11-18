import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxAlibabaTask,
} from "../nunchux-helpers";

describe("Nunchux Wan 3.0 text-to-video", () => {
  it(
    "renders a two-second 480P video",
    async () => {
      const ctx = setupPolly("nunchux/wan-3-0-text-to-video");
      try {
        const task = await recordNunchuxAlibabaTask(
          {
            model: "wan3.0-video",
            input: {
              prompt: "A red paper boat drifts across a calm pond at sunrise.",
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
