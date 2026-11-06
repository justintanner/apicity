import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// The cheapest valid request: a 2 s 720p edit of the 3 s cat clip that adds no
// audio of its own (0.40 USD list: 2 output seconds at 0.20 USD/s).
const PAYLOAD = {
  prompt: "Make the cat's fur bright orange.",
  video: WAVESPEED_VIDEO,
  resolution: "720p",
  duration: 2,
  audio_setting: "origin",
} as const;

describe("wavespeed api.v3.alibaba.wan2p7.videoEdit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip into a 2 s 720p Wan 2.7 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-wan-2-7-video-edit");
      const videoEdit = wavespeedClient().api.v3.alibaba.wan2p7.videoEdit;
      expect(videoEdit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        videoEdit,
        PAYLOAD,
        "wavespeed/alibaba-wan-2-7-video-edit",
        "alibaba/wan-2.7/video-edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
