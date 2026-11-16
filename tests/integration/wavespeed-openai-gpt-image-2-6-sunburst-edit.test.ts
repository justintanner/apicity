import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedOpenaiGptImage2p6SunburstEditRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: a low-quality 1k edit of the cat photo
// (0.045 USD list: 0.03 for the image plus 0.015 for the one input).
const PAYLOAD = {
  prompt: "Give the cat a small red knitted scarf.",
  images: [WAVESPEED_IMAGE],
  quality: "low",
  resolution: "1k",
} satisfies WaveSpeedOpenaiGptImage2p6SunburstEditRequest;

describe("wavespeed api.v3.openai.gptImage2p6Sunburst.edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat photo into a low-quality 1k GPT Image 2.6 Sunburst image",
    async () => {
      ctx = setupPolly("wavespeed/openai-gpt-image-2-6-sunburst-edit");
      const edit = wavespeedClient().api.v3.openai.gptImage2p6Sunburst.edit;
      expect(edit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        edit,
        PAYLOAD,
        "wavespeed/openai-gpt-image-2-6-sunburst-edit",
        "openai/gpt-image-2.6-sunburst/edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
