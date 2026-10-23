import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalHeygenV3VideoAgentRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Video Agent 3", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-v3-video-agent");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("asks the agent for a short landscape presenter clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt:
        "A five-second clip in which a presenter says: A red panda waves once, then holds still. Keep it under ten seconds.",
      orientation: "landscape",
    } satisfies FalHeygenV3VideoAgentRequest;
    expect(
      provider.run.heygen.v3.videoAgent.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.v3.videoAgent(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
