import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// The cheapest valid request: a 2 s 480p edit of the 3 s cat clip, no audio
// (0.25 USD list: the 3 input seconds and the 2 output seconds).
const PAYLOAD = {
  prompt: "Make the cat's fur bright orange.",
  video: WAVESPEED_VIDEO,
  resolution: "480p",
  duration: 2,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.alibaba.wan3p0.videoEdit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip into a 2 s 480p Wan 3.0 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-wan-3-0-video-edit");
      const videoEdit = wavespeedClient().api.v3.alibaba.wan3p0.videoEdit;
      expect(videoEdit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        videoEdit,
        PAYLOAD,
        "wavespeed/alibaba-wan-3-0-video-edit",
        "alibaba/wan-3.0/video-edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
