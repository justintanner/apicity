import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalMinimaxH3MaxReframeVideoRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max reframe video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-reframe-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("reframes the shortest house video at 480p without a prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      video_url: `data:video/mp4;base64,${readFileSync(new URL("../fixtures/seedance-ref.mp4", import.meta.url)).toString("base64")}`,
      resolution: "480p",
      aspect_ratio: "9:16",
      seed: 5555,
    } satisfies FalMinimaxH3MaxReframeVideoRequest;
    expect(
      provider.run.minimax.h3Max.reframeVideo.schema.safeParse(input).success
    ).toBe(true);
    const job = await provider.v1.queue.submit({
      endpoint_id: "minimax/h3-max/reframe-video",
      input,
      no_retry: true,
    });
    const params = {
      endpoint_id: "minimax/h3-max",
      request_id: job.request_id,
    };
    let status = await provider.v1.queue.status(params);
    for (let i = 0; status.status !== "COMPLETED" && i < 180; i++) {
      if (ctx.mode !== "replay")
        await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await provider.v1.queue.status(params);
    }
    expect(status.status).toBe("COMPLETED");
    const result = await provider.v1.queue.result(params);
    expect(result.video).toMatchObject({
      url: expect.stringMatching(/^https:\/\//),
    });
    expect(result.seed).toEqual(expect.any(Number));
    expect(result.frame_count).toBeGreaterThan(0);
    expect(result.placement).toEqual(expect.any(Object));
  }, 900000);
});
