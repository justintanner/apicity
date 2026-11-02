import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 4 s at 480p, no audio (0.72 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  resolution: "480p",
  duration: 4,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.bytedance.seedance2p5.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders a 4 s 480p Seedance 2.5 video",
    async () => {
      ctx = setupPolly("wavespeed/bytedance-seedance-2-5-text-to-video");
      const textToVideo =
        wavespeedClient().api.v3.bytedance.seedance2p5.textToVideo;
      expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToVideo,
        PAYLOAD,
        "wavespeed/bytedance-seedance-2-5-text-to-video",
        "bytedance/seedance-2.5/text-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
