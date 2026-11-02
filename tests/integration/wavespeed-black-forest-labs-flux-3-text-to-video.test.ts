import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 5 s at 720p, no audio (0.85 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  resolution: "720p",
  duration: 5,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.blackForestLabs.flux3.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders a 5 s 720p FLUX 3 video",
    async () => {
      ctx = setupPolly("wavespeed/black-forest-labs-flux-3-text-to-video");
      const textToVideo =
        wavespeedClient().api.v3.blackForestLabs.flux3.textToVideo;
      expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToVideo,
        PAYLOAD,
        "wavespeed/black-forest-labs-flux-3-text-to-video",
        "black-forest-labs/flux-3/text-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
