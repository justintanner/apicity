import { afterEach, describe, expect, it } from "vitest";
import {
  createWaveSpeed,
  WaveSpeedError,
  type WaveSpeedOpenaiGptImage2p5FlareEditRequest,
} from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: a low-quality 1k edit of the cat photo
// (0.025 USD list: 0.01 for the image plus 0.015 for the one input).
// Aspect ratio, mask and output format stay omitted.
const PAYLOAD = {
  prompt: "Give the cat a small red knitted scarf.",
  images: [WAVESPEED_IMAGE],
  quality: "low",
  resolution: "1k",
} satisfies WaveSpeedOpenaiGptImage2p5FlareEditRequest;

describe("wavespeed api.v3.openai.gptImage2p5Flare.edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat photo into a low-quality 1k GPT Image 2.5 Flare image",
    async () => {
      ctx = setupPolly("wavespeed/openai-gpt-image-2-5-flare-edit");
      const edit = wavespeedClient().api.v3.openai.gptImage2p5Flare.edit;
      expect(edit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        edit,
        PAYLOAD,
        "wavespeed/openai-gpt-image-2-5-flare-edit",
        "openai/gpt-image-2.5-flare/edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );

  // A free read: a prediction id WaveSpeed never issued is a 404.
  it("reads a prediction that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "wavespeed/openai-gpt-image-2-5-flare-edit-prediction-not-found"
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
