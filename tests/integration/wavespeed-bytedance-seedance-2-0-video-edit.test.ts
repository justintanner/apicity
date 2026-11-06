import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// The cheapest valid request: a 4 s 480p edit of the 3 s cat clip, no audio
// (0.525 USD list: 3 source seconds and 4 output seconds at 0.075 USD/s).
const PAYLOAD = {
  prompt: "Make the cat's fur bright orange.",
  video: WAVESPEED_VIDEO,
  resolution: "480p",
  duration: 4,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.bytedance.seedance2p0.videoEdit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip into a 4 s 480p Seedance 2 video",
    async () => {
      ctx = setupPolly("wavespeed/bytedance-seedance-2-0-video-edit");
      const videoEdit =
        wavespeedClient().api.v3.bytedance.seedance2p0.videoEdit;
      expect(videoEdit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        videoEdit,
        PAYLOAD,
        "wavespeed/bytedance-seedance-2-0-video-edit",
        "bytedance/seedance-2.0/video-edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
