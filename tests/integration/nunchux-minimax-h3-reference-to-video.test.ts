import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_IMAGE,
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxMinimaxTask,
} from "../nunchux-helpers";

describe("Nunchux MiniMax H3 reference-to-video", () => {
  it(
    "renders a four-second 768P video from a reference image",
    async () => {
      const ctx = setupPolly("nunchux/minimax-h3-reference-to-video");
      try {
        // No ratio: the output follows the reference set.
        const result = await recordNunchuxMinimaxTask(
          {
            model: "MiniMax-H3",
            content: [
              {
                type: "text",
                text: "The cat from the reference image walks across a sunlit wooden floor; the camera follows at floor level.",
              },
              {
                type: "image_url",
                role: "reference_image",
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
