import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedXAiGrokImagineImageV2p0TextToImageRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: one low-quality 1k image (0.04 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  quality: "low",
  resolution: "1k",
} satisfies WaveSpeedXAiGrokImagineImageV2p0TextToImageRequest;

describe("wavespeed api.v3.xAi.grokImagineImageV2p0.textToImage integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "draws a low-quality 1k Grok Imagine Image 2.0 image",
    async () => {
      ctx = setupPolly("wavespeed/x-ai-grok-imagine-image-v2-0-text-to-image");
      const textToImage =
        wavespeedClient().api.v3.xAi.grokImagineImageV2p0.textToImage;
      expect(textToImage.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToImage,
        PAYLOAD,
        "wavespeed/x-ai-grok-imagine-image-v2-0-text-to-image",
        "x-ai/grok-imagine-image-v2.0/text-to-image"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
