import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedPrunaAiPVideo2ProImageToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 5 s at 480p in cost mode from the cat photo
// (0.05 USD list).
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  duration: 5,
  resolution: "480p",
  mode: "cost",
} satisfies WaveSpeedPrunaAiPVideo2ProImageToVideoRequest;

describe("wavespeed api.v3.prunaAi.pVideo2Pro.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo for 5 s at 480p in cost mode",
    async () => {
      ctx = setupPolly("wavespeed/pruna-ai-p-video-2-pro-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.prunaAi.pVideo2Pro.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/pruna-ai-p-video-2-pro-image-to-video",
        "pruna-ai/p-video-2-pro/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
