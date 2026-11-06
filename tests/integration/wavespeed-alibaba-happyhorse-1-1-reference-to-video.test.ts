import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 480p with the cat photo as the one
// reference (0.21 USD list: 3 s at 0.07 USD/s; a reference adds nothing).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  images: [WAVESPEED_IMAGE],
  resolution: "480p",
  duration: 3,
} satisfies WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequest;

describe("wavespeed api.v3.alibaba.happyhorse1p1.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo into a 3 s 480p Happy Horse 1.1 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-happyhorse-1-1-reference-to-video");
      const referenceToVideo =
        wavespeedClient().api.v3.alibaba.happyhorse1p1.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/alibaba-happyhorse-1-1-reference-to-video",
        "alibaba/happyhorse-1.1/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
