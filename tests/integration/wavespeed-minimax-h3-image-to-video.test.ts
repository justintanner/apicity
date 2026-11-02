import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 768p from the cat photo (0.40 USD list).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  resolution: "768p",
  duration: 4,
} as const;

describe("wavespeed api.v3.minimax.h3.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 4 s 768p MiniMax H3 video",
    async () => {
      ctx = setupPolly("wavespeed/minimax-h3-image-to-video");
      const imageToVideo = wavespeedClient().api.v3.minimax.h3.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/minimax-h3-image-to-video",
        "minimax/h3/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
