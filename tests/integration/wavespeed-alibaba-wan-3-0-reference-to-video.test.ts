import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedAlibabaWan3p0ReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 2 s at 480p from the cat photo as the one
// reference, no audio (0.10 USD list: a reference image adds nothing).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  reference_images: [WAVESPEED_IMAGE],
  resolution: "480p",
  duration: 2,
  generate_audio: false,
} satisfies WaveSpeedAlibabaWan3p0ReferenceToVideoRequest;

describe("wavespeed api.v3.alibaba.wan3p0.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo reference into a 2 s 480p Wan 3.0 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-wan-3-0-reference-to-video");
      const referenceToVideo =
        wavespeedClient().api.v3.alibaba.wan3p0.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/alibaba-wan-3-0-reference-to-video",
        "alibaba/wan-3.0/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
