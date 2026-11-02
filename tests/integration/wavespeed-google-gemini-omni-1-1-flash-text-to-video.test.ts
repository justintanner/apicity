import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 360p (0.09 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  resolution: "360p",
  duration: 3,
} as const;

describe("wavespeed api.v3.google.geminiOmni1p1Flash.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders a 3 s 360p Gemini Omni 1.1 Flash video",
    async () => {
      ctx = setupPolly("wavespeed/google-gemini-omni-1-1-flash-text-to-video");
      const textToVideo =
        wavespeedClient().api.v3.google.geminiOmni1p1Flash.textToVideo;
      expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToVideo,
        PAYLOAD,
        "wavespeed/google-gemini-omni-1-1-flash-text-to-video",
        "google/gemini-omni-1.1-flash/text-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
