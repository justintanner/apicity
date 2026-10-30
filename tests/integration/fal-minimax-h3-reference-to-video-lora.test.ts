import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Weights from the already-billed H3 ref2va trainer recording. No new training.
const LORA_URL =
  "https://v3b.fal.media/files/b/0ab05c41/nT8ZCUgg2lLF1c1awPGoA_lora_weights_step_00001.safetensors";

describe("fal MiniMax H3 reference-to-video LoRA", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-reference-to-video-lora");
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
    const result = await provider.run.minimax.h3.referenceToVideo.lora({
      prompt:
        "Image 1 is the apct cat. The cat blinks slowly and tilts its head.",
      reference_image_urls: [
        `data:image/jpeg;base64,${image.toString("base64")}`,
      ],
      duration: 5,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
      loras: [{ path: LORA_URL, scale: 1 }],
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 900000);
});
