import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_IMAGE,
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxMinimaxTask,
} from "../nunchux-helpers";

describe("Nunchux MiniMax H3 image-to-video", () => {
  it(
    "animates the cat photo into a four-second 768P video",
    async () => {
      const ctx = setupPolly("nunchux/minimax-h3-image-to-video");
      try {
        // No ratio: the output follows the first frame.
        const result = await recordNunchuxMinimaxTask(
          {
            model: "MiniMax-H3",
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
            resolution: "768P",
            duration: 4,
          },
          ctx
        );
        expect(result.task).toMatchObject({
          model: "MiniMax-H3",
          resolution: "768P",
          duration: 4,
          status: "succeeded",
          usage: { output_seconds: 4, input_seconds: 0, input_image_count: 1 },
        });
        expect(result.task.content?.url).toMatch(/^https:\/\//);
      } finally {
        await teardownPolly(ctx);
      }
    },
    NUNCHUX_TEST_TIMEOUT_MS
  );
});
