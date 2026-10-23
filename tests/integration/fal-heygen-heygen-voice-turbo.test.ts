import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalHeygenHeygenVoiceTurboRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Voice Turbo", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-heygen-voice-turbo");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("speaks the house prompt in the default public voice", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      text: "A red panda waves once, then holds still.",
    } satisfies FalHeygenHeygenVoiceTurboRequest;
    expect(
      provider.run.heygen.heygenVoice.turbo.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.heygenVoice.turbo(input);
    expect(result.audio.url).toMatch(/^https:\/\//);
    expect(result.duration).toBeGreaterThan(0);
  }, 900000);
});
