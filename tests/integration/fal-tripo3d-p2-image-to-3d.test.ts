import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Tripo3d P2 Image To 3d", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/tripo3d-p2-image-to-3d");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.tripo3d.p2.imageTo3d({
      image_url:
        "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
    });
    expect(result.model_mesh.url).toMatch(/^https?:\/\//);
    expect(result.model_urls.glb?.url ?? result.model_urls.fbx?.url).toMatch(
      /^https?:\/\//
    );
  }, 900000);
});
