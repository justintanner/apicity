import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 360p from the cat photo (0.09 USD list).
const PAYLOAD = {
  image: WAVESPEED_IMAGE,
  prompt: "The cat slowly blinks and turns its head toward the window.",
  resolution: "360p",
  duration: 3,
} as const;

describe("wavespeed api.v3.google.geminiOmni1p1Flash.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 3 s 360p Gemini Omni 1.1 Flash video",
    async () => {
      ctx = setupPolly("wavespeed/google-gemini-omni-1-1-flash-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.google.geminiOmni1p1Flash.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/google-gemini-omni-1-1-flash-image-to-video",
        "google/gemini-omni-1.1-flash/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
