import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 5 s at 480p (0.125 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  duration: 5,
  resolution: "480p",
} as const;

describe("wavespeed api.v3.heygen.video1p0.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders a 5 s 480p HeyGen video",
    async () => {
      ctx = setupPolly("wavespeed/heygen-video-1-0-text-to-video");
      const textToVideo = wavespeedClient().api.v3.heygen.video1p0.textToVideo;
      expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToVideo,
        PAYLOAD,
        "wavespeed/heygen-video-1-0-text-to-video",
        "heygen/video-1.0/text-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
