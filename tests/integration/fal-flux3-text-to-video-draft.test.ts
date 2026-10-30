import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 text-to-video draft", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux3-text-to-video-draft");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("generates a five-second silent draft", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.blackforestlabs.flux3.textToVideo.draft({
      prompt: "A paper boat drifts across a calm pond, one continuous shot.",
      duration: 5,
      generate_audio: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    if (result.draft_cache) {
      expect(result.draft_cache.url).toMatch(/^https?:\/\//);
    }
  }, 900000);
});
