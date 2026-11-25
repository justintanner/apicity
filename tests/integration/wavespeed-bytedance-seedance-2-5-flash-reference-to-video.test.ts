import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedBytedanceSeedance2p5FlashReferenceToVideoRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 480p with the cat photo as the one
// reference, no audio (0.48 USD list / 0.432 USD at discount_rate 90: a
// reference image adds nothing).
const PAYLOAD = {
  prompt: "The cat from @Image 1 slowly blinks and turns its head.",
  reference_images: [WAVESPEED_IMAGE],
  resolution: "480p",
  duration: 4,
  generate_audio: false,
} satisfies WaveSpeedBytedanceSeedance2p5FlashReferenceToVideoRequest;

describe("wavespeed api.v3.bytedance.seedance2p5Flash.referenceToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/bytedance-seedance-2-5-flash-reference-to-video-prediction-not-found"
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
    "turns the cat photo reference into a 4 s 480p Seedance 2.5 Flash video",
    async () => {
      ctx = setupPolly(
        "wavespeed/bytedance-seedance-2-5-flash-reference-to-video"
      );
      const referenceToVideo =
        wavespeedClient().api.v3.bytedance.seedance2p5Flash.referenceToVideo;
      expect(referenceToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        referenceToVideo,
        PAYLOAD,
        "wavespeed/bytedance-seedance-2-5-flash-reference-to-video",
        "bytedance/seedance-2.5-flash/reference-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
