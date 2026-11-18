import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxBytedanceTask,
} from "../nunchux-helpers";

describe("Nunchux Seedance 2.5 text-to-video", () => {
  it(
    "renders a four-second 480p clip and reports video token usage",
    async () => {
      const ctx = setupPolly("nunchux/seedance-2-5-text-to-video");
      try {
        const task = await recordNunchuxBytedanceTask(
          {
            model: "dreamina-seedance-2-5-260628",
            content: [
              {
                type: "text",
                text: "A red paper boat drifts across a calm pond at sunrise; slow push-in.",
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
          ratio: "16:9",
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
