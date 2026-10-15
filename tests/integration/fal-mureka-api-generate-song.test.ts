import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Mureka song generation", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/mureka-api-generate-song");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a song and a reusable song id", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Prompt reused from tests/integration/fal-minimax-music-3.test.ts;
    // mureka-7.6 is the cheapest documented model.
    const result = await provider.run.mureka.api.generate.song({
      model: "mureka-7.6",
      lyrics: "[verse]\nMorning light filtering through the pine\n",
      prompt: "acoustic pop",
    });
    expect(typeof result.audio.url).toBe("string");
    expect(result.audio.url).toMatch(/^https:\/\//);
    expect(typeof result.song_id).toBe("string");
  }, 900000);
});
