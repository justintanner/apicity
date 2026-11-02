import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedHeygenVideo1p0ReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 5 s at 480p with the cat photo as the one
// reference (0.425 USD list: the first two reference images add nothing).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  reference_images: [WAVESPEED_IMAGE],
  duration: 5,
  resolution: "480p",
} satisfies WaveSpeedHeygenVideo1p0ReferenceToVideoRequest;

describe("wavespeed api.v3.heygen.video1p0.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo reference into a 5 s 480p HeyGen video",
    async () => {
      ctx = setupPolly("wavespeed/heygen-video-1-0-reference-to-video");
      const referenceToVideo =
        wavespeedClient().api.v3.heygen.video1p0.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/heygen-video-1-0-reference-to-video",
        "heygen/video-1.0/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
