import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedMicrosoftMaiImage2p7EditRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: one cat photo (0.0432 USD list: 0.035 base
// plus 0.0082 for the one input image).
const PAYLOAD = {
  prompt: "Give the cat a small blue knitted scarf.",
  images: [WAVESPEED_IMAGE],
} satisfies WaveSpeedMicrosoftMaiImage2p7EditRequest;

describe("wavespeed api.v3.microsoft.maiImage2p7.edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat photo with MAI-Image-2.7",
    async () => {
      ctx = setupPolly("wavespeed/microsoft-mai-image-2-7-edit");
      const edit = wavespeedClient().api.v3.microsoft.maiImage2p7.edit;
      expect(edit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        edit,
        PAYLOAD,
        "wavespeed/microsoft-mai-image-2-7-edit",
        "microsoft/mai-image-2.7/edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/microsoft-mai-image-2-7-edit-prediction-not-found"
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
