import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: one low-quality 1k image (0.01 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  quality: "low",
  resolution: "1k",
} satisfies WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequest;

describe("wavespeed api.v3.openai.gptImage2p5Sunburst.textToImage integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "draws a low-quality 1k GPT Image 2.5 Sunburst image",
    async () => {
      ctx = setupPolly("wavespeed/openai-gpt-image-2-5-sunburst-text-to-image");
      const textToImage =
        wavespeedClient().api.v3.openai.gptImage2p5Sunburst.textToImage;
      expect(textToImage.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToImage,
        PAYLOAD,
        "wavespeed/openai-gpt-image-2-5-sunburst-text-to-image",
        "openai/gpt-image-2.5-sunburst/text-to-image"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
