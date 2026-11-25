import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedSkyworkAiSkyreelsV4ReferenceToVideoRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// Three seconds at the 480p fast rate of 0.08 USD/s.
const PAYLOAD = {
  prompt: "The cat slowly blinks and turns its head toward the window.",
  images: [WAVESPEED_IMAGE],
  resolution: "480p",
  duration: 3,
  mode: "fast",
  sound: false,
} satisfies WaveSpeedSkyworkAiSkyreelsV4ReferenceToVideoRequest;

describe("wavespeed api.v3.skyworkAi.skyreelsV4.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/skywork-ai-skyreels-v4-reference-to-video-prediction-not-found"
    );
    const wavespeed = createWaveSpeed({
      apiKey: process.env.WAVESPEED_API_KEY ?? "wavespeed-test-key",
    });

    const error = await wavespeed.api.v3.predictions
      .result("00000000000000000000000000000002")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({ status: 404, code: 404 });
    expect((error as WaveSpeedError).message).toContain("Prediction not found");
  });

  it(
    "turns the cat photo reference into a 3 s 480p SkyReels V4 video",
    async () => {
      ctx = setupPolly("wavespeed/skywork-ai-skyreels-v4-reference-to-video");
      const referenceToVideo =
        wavespeedClient().api.v3.skyworkAi.skyreelsV4.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/skywork-ai-skyreels-v4-reference-to-video",
        "skywork-ai/skyreels-v4/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
