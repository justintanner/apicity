import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 keyframes-to-video draft", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux3-keyframes-to-video-draft");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("generates a five-second silent draft from pinned keyframes", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result =
      await provider.run.blackforestlabs.flux3.keyframesToVideo.draft({
        prompt:
          "The camera moves smoothly from the cat to the man, ending on the final keyframe.",
        keyframes: [
          {
            image_url: `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
            frame_index: 0,
          },
          {
            image_url: `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/man.jpg", import.meta.url)).toString("base64")}`,
            frame_index: 120,
          },
        ],
        duration: 5,
        generate_audio: false,
      });
    expect(result.video.url).toMatch(/^https?:\/\//);
    if (result.draft_cache) {
      expect(result.draft_cache.url).toMatch(/^https?:\/\//);
    }
  }, 900000);
});
