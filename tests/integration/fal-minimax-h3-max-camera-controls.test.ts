import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max camera controls", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-camera-controls");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("moves the camera along keyframes at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.cameraControls({
      prompt:
        "Orbit precisely around the subject while preserving its identity and the scene.",
      duration: 0.92,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/hailuo23/pro_i2v_in.jpg",
      camera_trajectory: [
        { time: 0, azimuth: 0, elevation: 0, distance: 1 },
        { time: 0.3, azimuth: 45, elevation: 15, distance: 0.2 },
        { time: 0.8, azimuth: 90, elevation: -90, distance: 1 },
      ],
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 900000);
});
