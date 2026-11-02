import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedMinimaxH3ReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 768p with the cat photo as the one
// reference (0.40 USD list: the first five reference images add nothing).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  reference_images: [WAVESPEED_IMAGE],
  resolution: "768p",
  duration: 4,
} satisfies WaveSpeedMinimaxH3ReferenceToVideoRequest;

describe("wavespeed api.v3.minimax.h3.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo reference into a 4 s 768p MiniMax H3 video",
    async () => {
      ctx = setupPolly("wavespeed/minimax-h3-reference-to-video");
      const referenceToVideo =
        wavespeedClient().api.v3.minimax.h3.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/minimax-h3-reference-to-video",
        "minimax/h3/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
