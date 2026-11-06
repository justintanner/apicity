import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// The cheapest valid request: a 720p edit of the 3 s cat clip (0.84 USD list:
// the source's 3 seconds at 0.28 USD/s, which is also the formula's floor).
const PAYLOAD = {
  prompt: "Make the cat's fur bright orange.",
  video: WAVESPEED_VIDEO,
  resolution: "720p",
} as const;

describe("wavespeed api.v3.alibaba.happyhorse1p0.videoEdit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip into a 720p Happy Horse 1.0 video",
    async () => {
      ctx = setupPolly("wavespeed/alibaba-happyhorse-1-0-video-edit");
      const videoEdit =
        wavespeedClient().api.v3.alibaba.happyhorse1p0.videoEdit;
      expect(videoEdit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        videoEdit,
        PAYLOAD,
        "wavespeed/alibaba-happyhorse-1-0-video-edit",
        "alibaba/happyhorse-1.0/video-edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
