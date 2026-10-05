import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Tripo3d P2 Text To 3d", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/tripo3d-p2-text-to-3d");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.tripo3d.p2.textTo3d({
      prompt: "A red panda waves once, then holds still.",
    });
    expect(result.model_mesh.url).toMatch(/^https?:\/\//);
    expect(result.model_urls.glb?.url ?? result.model_urls.fbx?.url).toMatch(
      /^https?:\/\//
    );
  }, 900000);
});
