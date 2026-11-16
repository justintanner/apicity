import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedGoogleNanoBanana2p1EditRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: a 1k edit of the cat photo with no search
// (0.042 USD list: 0.04 for the image plus 0.002 for the one input).
const PAYLOAD = {
  prompt: "Give the cat a small red knitted scarf.",
  images: [WAVESPEED_IMAGE],
  resolution: "1k",
} satisfies WaveSpeedGoogleNanoBanana2p1EditRequest;

describe("wavespeed api.v3.google.nanoBanana2p1.edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat photo into a 1k Nano Banana 2.1 image",
    async () => {
      ctx = setupPolly("wavespeed/google-nano-banana-2-1-edit");
      const edit = wavespeedClient().api.v3.google.nanoBanana2p1.edit;
      expect(edit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        edit,
        PAYLOAD,
        "wavespeed/google-nano-banana-2-1-edit",
        "google/nano-banana-2.1/edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
