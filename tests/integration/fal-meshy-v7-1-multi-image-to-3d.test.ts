import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Meshy 7.1 Multi Image To 3d", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/meshy-v7-1-multi-image-to-3d");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.meshy.v7p1.multiImageTo3d({
      image_urls: [
        "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
      ],
    });
    expect(result).toBeTruthy();
    expect(result.model_glb.url).toMatch(/^https?:\/\//);
    expect(result.model_urls).toBeTruthy();
  }, 900000);
});
