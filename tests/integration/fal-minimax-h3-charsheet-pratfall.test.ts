import {
  createFal,
  type FalMinimaxH3ReferenceToVideoParams,
} from "@apicity/fal";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 charsheet pratfall", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a video for the red umbrella pratfall", async () => {
    ctx = setupPolly("fal/minimax-h3-charsheet-pratfall");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });
    const request: FalMinimaxH3ReferenceToVideoParams = {
      // MiniMax refers to each reference by its modality and one-based index.
      prompt: `Image 1 is the reference character sheet.\n${CHARSHEET_PRATFALL_PROMPT}`,
      reference_image_urls: [CHARSHEET_URL],
      duration: 5,
      resolution: "768P",
      aspect_ratio: "9:16",
    };
    const generate = provider.run.minimax.h3.referenceToVideo;
    expect(generate.schema.safeParse(request).success).toBe(true);

    // The synchronous fal.run route returns HTTP 200 with the finished video.
    let status: number | undefined;
    ctx.polly.server.any().on("beforeResponse", (_request, response) => {
      status = response.statusCode;
    });
    const result = await generate(request);
    expect(status).toBe(200);
    expect(new URL(result.video.url).protocol).toBe("https:");
  }, 300000);
});
