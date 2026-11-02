import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 1 s at 480p from the cat photo (0.09 USD list,
// 0.01 of it the input image).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  duration: 1,
  resolution: "480p",
} as const;

describe("wavespeed api.v3.xAi.grokImagineVideoV1p5.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 1 s 480p Grok Imagine Video 1.5 clip",
    async () => {
      ctx = setupPolly("wavespeed/x-ai-grok-imagine-video-v1-5-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.xAi.grokImagineVideoV1p5.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/x-ai-grok-imagine-video-v1-5-image-to-video",
        "x-ai/grok-imagine-video-v1.5/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
