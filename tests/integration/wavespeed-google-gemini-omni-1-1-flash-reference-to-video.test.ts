import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 360p with the cat photo as the one
// reference (0.09 USD list: 3 s at 0.03 USD/s; a reference adds nothing).
const PAYLOAD = {
  prompt:
    "The cat from the reference image walks across a sunlit wooden floor.",
  images: [WAVESPEED_IMAGE],
  resolution: "360p",
  duration: 3,
} satisfies WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequest;

describe("wavespeed api.v3.google.geminiOmni1p1Flash.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "turns the cat photo into a 3 s 360p Gemini Omni 1.1 Flash video",
    async () => {
      ctx = setupPolly(
        "wavespeed/google-gemini-omni-1-1-flash-reference-to-video"
      );
      const referenceToVideo =
        wavespeedClient().api.v3.google.geminiOmni1p1Flash.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/google-gemini-omni-1-1-flash-reference-to-video",
        "google/gemini-omni-1.1-flash/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
