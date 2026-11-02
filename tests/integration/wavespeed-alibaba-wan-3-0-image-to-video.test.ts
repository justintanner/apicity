import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 2 s at 480p from the cat photo, no audio
// (0.10 USD list).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  resolution: "480p",
  duration: 2,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.alibaba.wan3p0.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 2 s 480p Wan 3.0 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-wan-3-0-image-to-video");
      const imageToVideo = wavespeedClient().api.v3.alibaba.wan3p0.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/alibaba-wan-3-0-image-to-video",
        "alibaba/wan-3.0/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
