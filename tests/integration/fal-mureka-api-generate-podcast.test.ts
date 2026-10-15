import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Mureka podcast generation", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/mureka-api-generate-podcast");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a podcast and a reusable podcast id", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Prompts reused from kie-gemini-3-8-flash-tts and fal-ideogram-v4-5.
    const result = await provider.run.mureka.api.generate.podcast({
      conversations: [
        { text: "Hello from Apicity. Have a wonderful day.", voice: "Emma" },
        { text: "A red panda waves once, then holds still.", voice: "Ethan" },
      ],
    });
    expect(typeof result.audio.url).toBe("string");
    expect(result.audio.url).toMatch(/^https:\/\//);
    if (result.song_id != null) expect(typeof result.song_id).toBe("string");
    if (result.duration != null)
      expect(Number.isInteger(result.duration)).toBe(true);
  }, 900000);
});
