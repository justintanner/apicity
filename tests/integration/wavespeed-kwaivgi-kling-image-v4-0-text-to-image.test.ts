import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedKwaivgiKlingImageV4p0TextToImageRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: prompt only. Resolution defaults to 2k
// (0.063 USD), num_images to 1, aspect ratio to 1:1, and format to png.
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
} satisfies WaveSpeedKwaivgiKlingImageV4p0TextToImageRequest;

describe("wavespeed api.v3.kwaivgi.klingImageV4p0.textToImage integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "generates a 2k Kling Image 4.0 image from a prompt",
    async () => {
      ctx = setupPolly("wavespeed/kwaivgi-kling-image-v4-0-text-to-image");
      const textToImage =
        wavespeedClient().api.v3.kwaivgi.klingImageV4p0.textToImage;
      expect(textToImage.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToImage,
        PAYLOAD,
        "wavespeed/kwaivgi-kling-image-v4-0-text-to-image",
        "kwaivgi/kling-image-v4.0/text-to-image"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/kwaivgi-kling-image-v4-0-text-to-image-prediction-not-found"
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
