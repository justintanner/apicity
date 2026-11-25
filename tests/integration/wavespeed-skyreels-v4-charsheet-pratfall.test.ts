// Result-only recording from 2026-11-25. WaveSpeed completed paid prediction
// eb2882bf3b2c41c9aa7c4be8467937ca. The local recorder received SIGTERM
// (exit 143) before Polly persisted the submit exchange. This HAR captures
// the free result GET. The submit exchange is covered separately by
// tests/integration/wavespeed-skywork-ai-skyreels-v4-reference-to-video.test.ts.
import type { WaveSpeedSkyworkAiSkyreelsV4ReferenceToVideoRequest } from "@apicity/wavespeed";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

const recording = "wavespeed/skyreels-v4-charsheet-pratfall";

describe("wavespeed SkyReels V4 charsheet pratfall", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "reads the result of the completed prediction (submit exchange not recorded)",
    async () => {
      ctx = setupPolly(recording);
      const api = wavespeedClient().api.v3;
      const request = {
        prompt: CHARSHEET_PRATFALL_PROMPT,
        images: [CHARSHEET_URL],
        duration: 5,
        resolution: "720p",
        aspect_ratio: "9:16",
        mode: "std",
        sound: false,
      } satisfies WaveSpeedSkyworkAiSkyreelsV4ReferenceToVideoRequest;
      const { schema } = api.skyworkAi.skyreelsV4.referenceToVideo;
      expect(schema.safeParse(request).success).toBe(true);

      const id = "eb2882bf3b2c41c9aa7c4be8467937ca";
      const { data } = await api.predictions.result(id);
      expect(data.id).toBe(id);
      expect(data.model).toBe("skywork-ai/skyreels-v4/reference-to-video");
      expect(data.status).toBe("completed");
      expect(data.outputs?.[0]).toMatch(/^https:\/\//);
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
