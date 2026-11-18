import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxMinimaxTask,
} from "../nunchux-helpers";

describe("Nunchux MiniMax H3 text-to-video", () => {
  it(
    "renders a four-second 768P video",
    async () => {
      const ctx = setupPolly("nunchux/minimax-h3-text-to-video");
      try {
        const result = await recordNunchuxMinimaxTask(
          {
            model: "MiniMax-H3",
            content: [
              {
                type: "text",
                text: "A red paper boat drifts across a calm pond at sunrise; slow push-in.",
              },
            ],
            resolution: "768P",
            duration: 4,
            ratio: "16:9",
          },
          ctx
        );
        expect(result.task).toMatchObject({
          model: "MiniMax-H3",
          resolution: "768P",
          duration: 4,
          status: "succeeded",
          usage: {
            total_seconds: 4,
            input_seconds: 0,
            output_seconds: 4,
            input_image_count: 0,
          },
        });
        expect(result.task.content?.url).toMatch(/^https:\/\//);
      } finally {
        await teardownPolly(ctx);
      }
    },
    NUNCHUX_TEST_TIMEOUT_MS
  );
});
