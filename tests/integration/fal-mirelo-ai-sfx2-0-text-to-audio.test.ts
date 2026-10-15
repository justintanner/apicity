import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Mirelo SFX 2.0 text-to-audio", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/mirelo-ai-sfx2-0-text-to-audio");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the documented sound effect output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Prompt reused from tests/integration/kie-suno-sounds.test.ts.
    const result = await provider.run.mireloAi.sfx2p0.textToAudio({
      prompt: "Rain falling on a tin roof, gentle thunder in distance",
      duration: 1.5,
      num_samples: 1,
    });
    expect(result.model).toMatch(/^sfx-[0-9]+\.[0-9]+$/);
    expect(result.seeds).toHaveLength(1);
    expect(Number.isInteger(result.seeds[0])).toBe(true);
    expect(result.audio).toHaveLength(1);
    expect(result.audio[0].url).toMatch(/^https?:\/\//);
    expect(result.audio[0].content_type).toBe("audio/wav");
  }, 900000);
});
