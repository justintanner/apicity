import { afterEach, describe, expect, it } from "vitest";

import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { recordWaveSpeed, wavespeedClient } from "../wavespeed-helpers";

// The cheapest valid request: 2 s at 480p, no audio (0.10 USD list).
const PAYLOAD = {
  prompt: "A red paper boat drifts across a calm pond at sunrise.",
  resolution: "480p",
  duration: 2,
  generate_audio: false,
} as const;

describe("wavespeed api.v3.alibaba.wan3p0.textToVideo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("renders a 2 s 480p Wan 3.0 video", async () => {
    ctx = setupPolly("wavespeed/alibaba-wan-3-0-text-to-video");
    const textToVideo = wavespeedClient().api.v3.alibaba.wan3p0.textToVideo;
    expect(textToVideo.schema.safeParse(PAYLOAD).success).toBe(true);

    await recordWaveSpeed(
      textToVideo,
      PAYLOAD,
      "wavespeed/alibaba-wan-3-0-text-to-video",
      "alibaba/wan-3.0/text-to-video"
    );
  }, 2_000_000);
});
