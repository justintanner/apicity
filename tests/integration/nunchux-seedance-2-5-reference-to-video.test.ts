import { describe, expect, it } from "vitest";
import { setupPolly, teardownPolly } from "../harness";
import {
  NUNCHUX_IMAGE,
  NUNCHUX_TEST_TIMEOUT_MS,
  recordNunchuxBytedanceTask,
} from "../nunchux-helpers";

describe("Nunchux Seedance 2.5 reference-to-video", () => {
  it(
    "generates a four-second video using a reference image",
    async () => {
      const ctx = setupPolly("nunchux/seedance-2-5-reference-to-video");
      try {
        const task = await recordNunchuxBytedanceTask(
          {
            model: "dreamina-seedance-2-5-260628",
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
