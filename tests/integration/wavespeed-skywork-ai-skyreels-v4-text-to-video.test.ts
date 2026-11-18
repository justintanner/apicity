import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: 3 s at 480p in fast mode, which needs sound
// off (0.24 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  duration: 3,
  resolution: "480p",
  sound: false,
  mode: "fast",
} satisfies WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequest;

describe("wavespeed api.v3.skyworkAi.skyreelsV4.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "renders a 3 s 480p SkyReels V4 video in fast mode",
    async () => {
      ctx = setupPolly("wavespeed/skywork-ai-skyreels-v4-text-to-video");
      const textToVideo =
        wavespeedClient().api.v3.skyworkAi.skyreelsV4.textToVideo;
      expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        textToVideo,
        PAYLOAD,
        "wavespeed/skywork-ai-skyreels-v4-text-to-video",
        "skywork-ai/skyreels-v4/text-to-video"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
