import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
  WAVESPEED_VIDEO,
} from "../wavespeed-helpers";

// Aleph 2 has no resolution or duration to lower: it bills the source, here
// the 3 s cat clip (1.11 USD list: 3 seconds at 0.37 USD/s).
const PAYLOAD = {
  prompt: "Make the cat's fur bright orange.",
  video: WAVESPEED_VIDEO,
} as const;

describe("wavespeed api.v3.runwayml.aleph2 integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat clip with Runway Aleph 2",
    async () => {
      ctx = setupPolly("wavespeed/runwayml-aleph-2");
      const aleph2 = wavespeedClient().api.v3.runwayml.aleph2;
      expect(aleph2.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        aleph2,
        PAYLOAD,
        "wavespeed/runwayml-aleph-2",
        "runwayml/aleph-2"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
