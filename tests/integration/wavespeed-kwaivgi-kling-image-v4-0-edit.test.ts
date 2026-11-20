import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedKwaivgiKlingImageV4p0EditRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: one cat photo at the 2k default (0.066 USD
// list: 0.063 for the output plus 0.003 for the one input). num_images
// defaults to 1. Aspect ratio and output format stay omitted.
const PAYLOAD = {
  prompt: "Give the cat a small red knitted scarf.",
  images: [WAVESPEED_IMAGE],
} satisfies WaveSpeedKwaivgiKlingImageV4p0EditRequest;

describe("wavespeed api.v3.kwaivgi.klingImageV4p0.edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat photo into a 2k Kling Image 4.0 image",
    async () => {
      ctx = setupPolly("wavespeed/kwaivgi-kling-image-v4-0-edit");
      const edit = wavespeedClient().api.v3.kwaivgi.klingImageV4p0.edit;
      expect(edit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        edit,
        PAYLOAD,
        "wavespeed/kwaivgi-kling-image-v4-0-edit",
        "kwaivgi/kling-image-v4.0/edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/kwaivgi-kling-image-v4-0-edit-prediction-not-found"
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
