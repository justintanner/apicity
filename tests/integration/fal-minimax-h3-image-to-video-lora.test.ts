import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Weights from the already-billed H3 t2v trainer recording. No new training.
const LORA_URL =
  "https://v3b.fal.media/files/b/0ab058f9/aofDUIQaypkDoDSR5qbeD_lora_weights_step_00001.safetensors";

describe("fal MiniMax H3 image-to-video LoRA", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-image-to-video-lora");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("animates cat1.jpg for 5s at 480P with the trained LoRA", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const image = readFileSync(
      new URL("../fixtures/cat1.jpg", import.meta.url)
    );
    const result = await provider.run.minimax.h3.imageToVideo.lora({
      prompt: "apct cat blinks slowly and tilts its head.",
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      duration: 5,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
      loras: [{ path: LORA_URL, scale: 1 }],
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 900000);
});
