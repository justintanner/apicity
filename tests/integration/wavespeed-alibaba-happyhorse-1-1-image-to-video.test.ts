import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 480p from the cat photo (0.21 USD list).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  resolution: "480p",
  duration: 3,
} as const;

describe("wavespeed api.v3.alibaba.happyhorse1p1.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 3 s 480p HappyHorse 1.1 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-happyhorse-1-1-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.alibaba.happyhorse1p1.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/alibaba-happyhorse-1-1-image-to-video",
        "alibaba/happyhorse-1.1/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
