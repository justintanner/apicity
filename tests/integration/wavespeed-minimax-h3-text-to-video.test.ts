import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 768p (0.40 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  resolution: "768p",
  duration: 4,
} as const;

describe("wavespeed api.v3.minimax.h3.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders a 4 s 768p MiniMax H3 video",
    async () => {
      ctx = setupPolly("wavespeed/minimax-h3-text-to-video");
      const textToVideo = wavespeedClient().api.v3.minimax.h3.textToVideo;
      expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToVideo,
        PAYLOAD,
        "wavespeed/minimax-h3-text-to-video",
        "minimax/h3/text-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
