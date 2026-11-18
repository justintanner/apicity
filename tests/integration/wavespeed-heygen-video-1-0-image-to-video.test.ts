import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedHeygenVideo1p0ImageToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// WaveSpeed quoted 0.125 USD for this five-second 480p render.
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns toward the window.",
  image: WAVESPEED_IMAGE,
  duration: 5,
  resolution: "480p",
} satisfies WaveSpeedHeygenVideo1p0ImageToVideoRequest;

describe("wavespeed api.v3.heygen.video1p0.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo into a 5 s 480p HeyGen video",
    async () => {
      ctx = setupPolly("wavespeed/heygen-video-1-0-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.heygen.video1p0.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/heygen-video-1-0-image-to-video",
        "heygen/video-1.0/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
