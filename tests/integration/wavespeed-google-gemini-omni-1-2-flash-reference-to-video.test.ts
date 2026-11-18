import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 360p with the cat photo as the one
// reference (0.069 USD list: 3 s at 0.023 USD/s; a reference adds nothing).
const PAYLOAD = {
  prompt: "The cat from <IMAGE_REF_0> walks across a sunlit wooden floor.",
  images: [WAVESPEED_IMAGE],
  resolution: "360p",
  duration: 3,
} satisfies WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequest;

describe("wavespeed api.v3.google.geminiOmni1p2Flash.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders 3 s at 360p from the cat photo with Gemini Omni 1.2 Flash",
    async () => {
      ctx = setupPolly(
        "wavespeed/google-gemini-omni-1-2-flash-reference-to-video"
      );
      const referenceToVideo =
        wavespeedClient().api.v3.google.geminiOmni1p2Flash.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/google-gemini-omni-1-2-flash-reference-to-video",
        "google/gemini-omni-1.2-flash/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
