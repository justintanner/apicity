import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// Kling o3 Pro has no resolution or duration to lower: it bills the source,
// here the 3 s cat clip, the model's floor (0.504 USD list: 3 s at 0.168 USD/s).
const PAYLOAD = {
  prompt: "Make the cat's fur bright orange.",
  video: WAVESPEED_VIDEO,
  keep_original_sound: true,
} as const;

describe("wavespeed api.v3.kwaivgi.klingVideoO3Pro.videoEdit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip with Kling o3 Pro",
    async () => {
      ctx = setupPolly("wavespeed/kwaivgi-kling-video-o3-pro-video-edit");
      const videoEdit =
        wavespeedClient().api.v3.kwaivgi.klingVideoO3Pro.videoEdit;
      expect(videoEdit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        videoEdit,
        PAYLOAD,
        "wavespeed/kwaivgi-kling-video-o3-pro-video-edit",
        "kwaivgi/kling-video-o3-pro/video-edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
