import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 draft enhancement", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux3-draft-enhance");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("enhances the saved five-second text-to-video draft", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.blackforestlabs.flux3.draftEnhance({
      // Saved by ac-81wixr with duration=5 and generate_audio=false.
      draft_cache_url:
        "https://v3b.fal.media/files/b/0ab0651b/e5ypKJpJdJ4PygzykfPnh_draft_cache.bin",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
