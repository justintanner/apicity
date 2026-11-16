import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedGoogleNanoBanana2p1TextToImageRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: one 1k image with no search (0.04 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  resolution: "1k",
} satisfies WaveSpeedGoogleNanoBanana2p1TextToImageRequest;

describe("wavespeed api.v3.google.nanoBanana2p1.textToImage integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "draws a 1k Nano Banana 2.1 image",
    async () => {
      ctx = setupPolly("wavespeed/google-nano-banana-2-1-text-to-image");
      const textToImage =
        wavespeedClient().api.v3.google.nanoBanana2p1.textToImage;
      expect(textToImage.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToImage,
        PAYLOAD,
        "wavespeed/google-nano-banana-2-1-text-to-image",
        "google/nano-banana-2.1/text-to-image"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
