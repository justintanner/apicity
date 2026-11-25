import {
  createFal,
  type FalHeygenHeygenVideoReferenceToVideoRequest,
} from "@apicity/fal";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Video 1 charsheet pratfall", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a video for the red umbrella pratfall", async () => {
    ctx = setupPolly("fal/heygen-video-charsheet-pratfall");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const request: FalHeygenHeygenVideoReferenceToVideoRequest = {
      prompt: CHARSHEET_PRATFALL_PROMPT,
      reference_image_urls: [CHARSHEET_URL],
      // Five seconds is the live schema minimum. The silent gag is requested
      // in the shared prompt because HeyGen exposes no audio-off switch.
      duration: 5,
      resolution: "768p",
      aspect_ratio: "9:16",
    };
    const generate = provider.run.heygen.heygenVideo.referenceToVideo;
    expect(generate.schema.safeParse(request).success).toBe(true);

    // The synchronous fal.run route returns HTTP 200 with the finished video.
    let status: number | undefined;
    ctx.polly.server.any().on("beforeResponse", (_request, response) => {
      status = response.statusCode;
    });
    const result = await generate(request);
    expect(status).toBe(200);
    expect(new URL(result.video.url).protocol).toBe("https:");
  }, 900000);
});
