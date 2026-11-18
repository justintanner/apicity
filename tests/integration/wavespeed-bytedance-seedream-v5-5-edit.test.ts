import { afterEach, describe, expect, it } from "vitest";
import type { WaveSpeedBytedanceSeedreamV5p5EditRequest } from "@apicity/wavespeed";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_IMAGE,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

// The cheapest valid request: a 1k edit of the cat photo (0.028 USD list:
// 0.02 for the image plus 0.008 for the one input).
const PAYLOAD = {
  prompt: "Give the cat a small red knitted scarf.",
  images: [WAVESPEED_IMAGE],
  resolution: "1k",
} satisfies WaveSpeedBytedanceSeedreamV5p5EditRequest;

describe("wavespeed api.v3.bytedance.seedreamV5p5.edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits the cat photo into a 1k Seedream 5.5 image",
    async () => {
      ctx = setupPolly("wavespeed/bytedance-seedream-v5-5-edit");
      const edit = wavespeedClient().api.v3.bytedance.seedreamV5p5.edit;
      expect(edit.schema.safeParse(PAYLOAD).success).toBe(true);

      await recordWaveSpeed(
        edit,
        PAYLOAD,
        "wavespeed/bytedance-seedream-v5-5-edit",
        "bytedance/seedream-v5.5/edit"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
