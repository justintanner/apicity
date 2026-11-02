import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 480p from the cat photo, no audio
// (0.48 USD list).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  resolution: "480p",
  duration: 4,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.bytedance.seedance2p0.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 4 s 480p Seedance 2.0 video",
    async () => {
      ctx = setupPolly("wavespeed/bytedance-seedance-2-0-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.bytedance.seedance2p0.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/bytedance-seedance-2-0-image-to-video",
        "bytedance/seedance-2.0/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
