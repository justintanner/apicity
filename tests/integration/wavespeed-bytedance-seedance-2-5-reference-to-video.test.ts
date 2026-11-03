import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 480p with the cat photo as the one
// reference, no audio (0.72 USD list: a reference image adds nothing).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  reference_images: [WAVESPEED_IMAGE],
  resolution: "480p",
  duration: 4,
  generate_audio: false,
} satisfies WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequest;

describe("wavespeed api.v3.bytedance.seedance2p5.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo reference into a 4 s 480p Seedance 2.5 video",
    async () => {
      ctx = setupPolly("wavespeed/bytedance-seedance-2-5-reference-to-video");
      const referenceToVideo =
        wavespeedClient().api.v3.bytedance.seedance2p5.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/bytedance-seedance-2-5-reference-to-video",
        "bytedance/seedance-2.5/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
