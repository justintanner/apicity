import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 1 s at 480p with the cat photo as the one
// reference (0.09 USD list: 0.08 for the second and 0.01 for the image).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  reference_images: [WAVESPEED_IMAGE],
  duration: 1,
  resolution: "480p",
} satisfies WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequest;

describe("wavespeed api.v3.xAi.grokImagineVideoV1p5.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo into a 1 s 480p Grok Imagine Video 1.5 video",
    async () => {
      ctx = setupPolly(
        "wavespeed/x-ai-grok-imagine-video-v1-5-reference-to-video"
      );
      const referenceToVideo =
        wavespeedClient().api.v3.xAi.grokImagineVideoV1p5.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/x-ai-grok-imagine-video-v1-5-reference-to-video",
        "x-ai/grok-imagine-video-v1.5/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
