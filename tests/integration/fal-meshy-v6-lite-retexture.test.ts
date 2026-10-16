import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";

// The GLB our own meshy v7.1 text-to-3d recording generated (see
// tests/recordings/fal_2801268556/meshy-v7-1-text-to-3d_3859015023).
const OWNED_MODEL_GLB =
  "https://v3b.fal.media/files/b/0aad25a0/zKZ5AnFvG08mYptABK7Jd_model.glb";

describe("fal meshy v6-lite retexture integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/meshy-v6-lite-retexture");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should retexture our own GLB from a text style", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.meshy.v6Lite.retexture({
      model_url: OWNED_MODEL_GLB,
      text_style_prompt: "watercolor painting",
    });

    expect(result).toBeDefined();
    expect(typeof result.model_glb.url).toBe("string");
    expect(result.model_glb.url.startsWith("http")).toBe(true);
    expect(result.model_urls).toBeDefined();
  }, 900000);
});
