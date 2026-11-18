import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_IMAGE,
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxBytedanceTask,
} from "../nunchux-helpers";

describe("Nunchux Seedance 2.0 image-to-video", () => {
  it(
    "animates the cat first frame and reports video token usage",
    async () => {
      const ctx = setupPolly("nunchux/seedance-2-0-image-to-video");
      try {
        const task = await recordNunchuxBytedanceTask(
          {
            model: "dreamina-seedance-2-0-260128",
            content: [
              {
                type: "text",
                text: "The cat turns its head toward the window and blinks slowly; the camera holds still.",
              },
              {
                type: "image_url",
                role: "first_frame",
                image_url: { url: NUNCHUX_IMAGE },
              },
            ],
            duration: 4,
            resolution: "480p",
            generate_audio: false,
          },
          ctx
        );
        expect(task).toMatchObject({
          status: "succeeded",
          ratio: "3:4",
          resolution: "480p",
          duration: 4,
          framespersecond: 24,
          generate_audio: false,
        });
        expect(task.usage?.completion_tokens).toBeGreaterThan(0);
      } finally {
        await teardownPolly(ctx);
      }
    },
    NUNCHUX_TEST_TIMEOUT_MS
  );
});
