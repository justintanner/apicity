import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalFlux3KleinEditImageLoraRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Owned LoRA from P2 (ac-9uj0pi), request 01a18185-bfa3-7c02-866e-293095f9557b.
const LORA_URL =
  "https://v3b.fal.media/files/b/0ab02ac9/p2dcEmp5srNPEw2V81PLz_flux3_klein_lora_031f628e922a4a958f3998be6ca46bfb.safetensors";

describe("fal FLUX 3 Klein base edit-image LoRA", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-klein-base-edit-image-lora");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits the owned cat photo using our trained edit LoRA", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });
    const imageDataUrl = `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`;
    const input = {
      image_urls: [imageDataUrl],
      loras: [{ path: LORA_URL, scale: 1 }],
      prompt: "Make the photo black and white.",
      enable_prompt_expansion: false,
      seed: 5555,
      num_images: 1,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    } satisfies FalFlux3KleinEditImageLoraRequest;
    const leaf = provider.run.blackforestlabs.flux3.klein.base.editImage.lora;
    expect(leaf.schema.safeParse(input).success).toBe(true);
    const result = await leaf(input);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(result.seed).toBe(5555);
  }, 300000);
});
