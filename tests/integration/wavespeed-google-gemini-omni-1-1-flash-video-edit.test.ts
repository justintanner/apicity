import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// The cheapest valid request: a 360p edit of the 3 s cat clip (0.18 USD
// list: 0.02 USD/s to read the clip, then 3 output seconds at 0.04).
const PAYLOAD = {
  video: WAVESPEED_VIDEO,
  prompt: "Make the cat's fur bright orange.",
  resolution: "360p",
} as const;

describe("wavespeed api.v3.google.geminiOmni1p1Flash.videoEdit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip into a 360p Gemini Omni 1.1 Flash video",
    async () => {
      ctx = setupPolly("wavespeed/google-gemini-omni-1-1-flash-video-edit");
      const videoEdit =
        wavespeedClient().api.v3.google.geminiOmni1p1Flash.videoEdit;
      expect(videoEdit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        videoEdit,
        PAYLOAD,
        "wavespeed/google-gemini-omni-1-1-flash-video-edit",
        "google/gemini-omni-1.1-flash/video-edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
