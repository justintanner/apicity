import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Lightricks LTX-2.5 text-to-video fast", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/lightricks-ltx-2-5-text-to-video-fast");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the prompt's video for the minimum duration at the cheapest resolution", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.lightricks.ltx2p5.textToVideo.fast({
      prompt:
        "Through-the-veil shot of a bride's face during an Indian wedding ceremony, camera positioned behind the sheer red dupatta fabric, the embroidered pattern creating a textured overlay on her face, her eyes lined with kohl looking down at henna-covered hands, marigold garlands in soft background bokeh, 85mm f/1.2 focused through the fabric layer, warm tungsten and candlelight, Mira Nair Monsoon Wedding intimacy",
      duration: 6,
      resolution: "720p",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
