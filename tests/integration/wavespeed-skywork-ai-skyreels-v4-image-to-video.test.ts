import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: the cat photo as the first frame, 3 s at 480p
// in fast mode, which needs sound off (0.24 USD list). The catalog defaults
// (5 s, 1080p, std) would quote 1.75 USD, so all three are set.
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  image: WAVESPEED_IMAGE,
  duration: 3,
  resolution: "480p",
  sound: false,
  mode: "fast",
} satisfies WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequest;

describe("wavespeed api.v3.skyworkAi.skyreelsV4.imageToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the cat photo into a 3 s 480p SkyReels V4 video in fast mode",
    async () => {
      ctx = setupPolly("wavespeed/skywork-ai-skyreels-v4-image-to-video");
      const imageToVideo =
        wavespeedClient().api.v3.skyworkAi.skyreelsV4.imageToVideo;
      expect(imageToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        imageToVideo,
        PAYLOAD,
        "wavespeed/skywork-ai-skyreels-v4-image-to-video",
        "skywork-ai/skyreels-v4/image-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/skywork-ai-skyreels-v4-image-to-video-prediction-not-found"
    );
    const wavespeed = createWaveSpeed({
      apiKey: process.env.WAVESPEED_API_KEY ?? "wavespeed-test-key",
    });

    const error = await wavespeed.api.v3.predictions
      .result("00000000000000000000000000000001")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({ status: 404, code: 404 });
    expect((error as WaveSpeedError).message).toContain("Prediction not found");
  });
});
