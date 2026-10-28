import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalFlux3KleinTextToImageLoraRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Owned LoRA from P1 (ac-tra7ie), request 01a18151-24d5-7312-8d17-a9179541765f.
const LORA_URL =
  "https://v3b.fal.media/files/b/0ab029a5/JcXRpMRG_eVrKeu1xO1sE_flux3_klein_lora_af8f29c6b86c4b8a835d593c001a850c.safetensors";

describe("fal FLUX 3 Klein text-to-image LoRA", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-klein-text-to-image-lora");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates an image using the owned cat LoRA", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });
    const input = {
      loras: [{ path: LORA_URL, scale: 1 }],
      prompt: "A photo of apct cat sitting on a windowsill in soft daylight.",
      enable_prompt_expansion: false,
      seed: 5555,
      num_images: 1,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    } satisfies FalFlux3KleinTextToImageLoraRequest;
    const leaf = provider.run.blackforestlabs.flux3.klein.textToImage.lora;
    expect(leaf.schema.safeParse(input).success).toBe(true);
    const result = await leaf(input);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(result.seed).toBe(5555);
  }, 300000);
});
