import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal FLUX 3 edit-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/blackforestlabs-flux-3-edit-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.blackforestlabs.flux3.editVideo({
      prompt: "Make it snow heavily; give the scene a cold winter palette.",
      video_url:
        "https://storage.googleapis.com/falserverless/example_inputs/flux-3-red-panda.mp4",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
