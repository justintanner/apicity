import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 5 s at 720p from the cat photo, no audio
// (0.85 USD list).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  resolution: "720p",
  duration: 5,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.blackForestLabs.flux3.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 5 s 720p FLUX 3 video",
    async () => {
      ctx = setupPolly("wavespeed/black-forest-labs-flux-3-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.blackForestLabs.flux3.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/black-forest-labs-flux-3-image-to-video",
        "black-forest-labs/flux-3/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
