import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalHeygenV2VideoAgentRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Video Agent 2", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-v2-video-agent");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("asks the agent for a five-second presenter clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt:
        "A five-second clip in which a presenter says: A red panda waves once, then holds still.",
      config: { duration: 5 },
    } satisfies FalHeygenV2VideoAgentRequest;
    expect(
      provider.run.heygen.v2.videoAgent.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.v2.videoAgent(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
