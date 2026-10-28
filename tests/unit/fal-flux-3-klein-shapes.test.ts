import { describe, expect, it } from "vitest";
import {
  FalFlux3KleinEditImageLoraRequestSchema,
  FalFlux3KleinLoraSchema,
  FalFlux3KleinTextToImageLoraRequestSchema,
  FalFlux3KleinTrainerRequestSchema,
} from "@apicity/fal/zod";

// Bounds from each endpoint's queue OpenAPI, read 2026-10-28 (archived under
// plans/ac-v8q1o7/planning/live/).
const LORA = "https://v3b.fal.media/files/b/klein/lora.safetensors";

describe("FLUX 3 Klein shared shapes", () => {
  it("accepts the minimal trainer payload and applies the defaults", () => {
    const parsed = FalFlux3KleinTrainerRequestSchema.parse({
      images_data_url: "https://v3b.fal.media/files/b/klein/images.zip",
      trigger_phrase: "apct cat",
      steps: 100,
      resolution: 512,
    });
    expect(parsed.learning_rate).toBe(0.0001);
    expect(
      FalFlux3KleinTrainerRequestSchema.parse({ images_data_url: "u" })
    ).toMatchObject({
      trigger_phrase: "",
      steps: 1000,
      resolution: 1024,
    });
  });

  it.each([
    [{ steps: 99 }],
    [{ steps: 10001 }],
    [{ steps: 150.5 }],
    [{ resolution: 640 }],
    [{ learning_rate: 0.02 }],
    [{ learning_rate: 0.0000001 }],
  ])("rejects the out-of-range trainer field %j", (field) => {
    expect(
      FalFlux3KleinTrainerRequestSchema.safeParse({
        images_data_url: "u",
        ...field,
      }).success
    ).toBe(false);
  });

  it("requires images_data_url", () => {
    expect(
      FalFlux3KleinTrainerRequestSchema.safeParse({ steps: 100 }).success
    ).toBe(false);
  });

  it("bounds a LoRA scale to 0..4 and defaults it to 1", () => {
    expect(FalFlux3KleinLoraSchema.parse({ path: LORA }).scale).toBe(1);
    for (const scale of [0, 4]) {
      expect(FalFlux3KleinLoraSchema.parse({ path: LORA, scale }).scale).toBe(
        scale
      );
    }
    expect(
      FalFlux3KleinLoraSchema.safeParse({ path: LORA, scale: -0.1 }).success
    ).toBe(false);
    expect(
      FalFlux3KleinLoraSchema.safeParse({ path: LORA, scale: 4.5 }).success
    ).toBe(false);
    expect(FalFlux3KleinLoraSchema.safeParse({ scale: 1 }).success).toBe(false);
  });

  it("accepts the minimal text-to-image LoRA payload", () => {
    const parsed = FalFlux3KleinTextToImageLoraRequestSchema.parse({
      loras: [{ path: LORA }],
      prompt: "A photo of apct cat sitting on a windowsill in soft daylight.",
      enable_prompt_expansion: false,
      seed: 5555,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    });
    expect(parsed.num_images).toBe(1);
    expect(
      FalFlux3KleinTextToImageLoraRequestSchema.parse({ prompt: "p" })
        .image_size
    ).toBe("square_hd");
  });

  it.each([
    [
      {
        loras: [{ path: LORA }, { path: LORA }, { path: LORA }, { path: LORA }],
      },
    ],
    [{ num_images: 5 }],
    [{ num_images: 0 }],
    [{ num_images: 1.5 }],
    [{ image_size: { width: 240, height: 256 } }],
    [{ image_size: { width: 4112, height: 256 } }],
    [{ image_size: { width: 260, height: 256 } }],
    [{ image_size: "square_xl" }],
    [{ output_format: "gif" }],
    [
      {
        bounding_boxes: [
          {
            description: "a cat",
            box: { x_min: 0, y_min: 0, x_max: 1.5, y_max: 1 },
          },
        ],
      },
    ],
    [
      {
        bounding_boxes: [
          {
            label: "9cat",
            description: "a cat",
            box: { x_min: 0, y_min: 0, x_max: 1, y_max: 1 },
          },
        ],
      },
    ],
  ])("rejects the text-to-image LoRA field %j", (field) => {
    expect(
      FalFlux3KleinTextToImageLoraRequestSchema.safeParse({
        prompt: "p",
        ...field,
      }).success
    ).toBe(false);
  });

  it("accepts the minimal edit LoRA payload and leaves image_size unset", () => {
    const parsed = FalFlux3KleinEditImageLoraRequestSchema.parse({
      loras: [{ path: LORA }],
      prompt: "Make the photo black and white.",
      image_urls: ["data:image/jpeg;base64,AAAA"],
      enable_prompt_expansion: false,
      seed: 5555,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    });
    expect(parsed.image_urls).toHaveLength(1);
    expect(
      FalFlux3KleinEditImageLoraRequestSchema.parse({
        prompt: "p",
        image_urls: ["u"],
      }).image_size
    ).toBeUndefined();
  });

  it("bounds the edit references to 1..10 and takes edit boxes", () => {
    expect(
      FalFlux3KleinEditImageLoraRequestSchema.safeParse({
        prompt: "p",
        image_urls: [],
      }).success
    ).toBe(false);
    expect(
      FalFlux3KleinEditImageLoraRequestSchema.safeParse({
        prompt: "p",
        image_urls: Array(11).fill("u"),
      }).success
    ).toBe(false);
    expect(
      FalFlux3KleinEditImageLoraRequestSchema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        bounding_boxes: [
          {
            description: "remove the cat",
            source_image_index: 0,
            source_box: { x_min: 0, y_min: 0, x_max: 1, y_max: 1 },
          },
        ],
      }).success
    ).toBe(true);
  });

  it("accepts the trainer upper bounds and middle resolution", () => {
    for (const learning_rate of [0.000001, 0.01]) {
      expect(
        FalFlux3KleinTrainerRequestSchema.safeParse({
          images_data_url: "u",
          steps: 10000,
          learning_rate,
          resolution: 768,
        }).success
      ).toBe(true);
    }
  });

  it("caps both layouts at 32 boxes", () => {
    const box = {
      label: "Cat_1",
      description: "a cat",
      box: { x_min: 0, y_min: 0, x_max: 1, y_max: 1 },
    };
    for (const count of [32, 33]) {
      const input = {
        prompt: "p",
        image_urls: Array(10).fill("u"),
        bounding_boxes: Array.from({ length: count }, () => box),
      };
      expect(
        FalFlux3KleinTextToImageLoraRequestSchema.safeParse(input).success
      ).toBe(count === 32);
      expect(
        FalFlux3KleinEditImageLoraRequestSchema.safeParse(input).success
      ).toBe(count === 32);
    }
  });

  it("accepts the six planned recording inputs", () => {
    for (const trigger_phrase of [
      "apct cat",
      "Make the photo black and white.",
    ]) {
      expect(
        FalFlux3KleinTrainerRequestSchema.safeParse({
          images_data_url: "https://v3b.fal.media/files/b/klein/images.zip",
          trigger_phrase,
          steps: 100,
          resolution: 512,
        }).success
      ).toBe(true);
    }
    const common = {
      loras: [{ path: LORA, scale: 1 }],
      enable_prompt_expansion: false,
      seed: 5555,
      num_images: 1,
      output_format: "jpeg",
      image_size: { width: 256, height: 256 },
    };
    // Base and distilled endpoints share the same respective request schema.
    expect(
      FalFlux3KleinTextToImageLoraRequestSchema.safeParse({
        ...common,
        prompt: "A photo of apct cat sitting on a windowsill in soft daylight.",
      }).success
    ).toBe(true);
    expect(
      FalFlux3KleinEditImageLoraRequestSchema.safeParse({
        ...common,
        prompt: "Make the photo black and white.",
        image_urls: ["data:image/jpeg;base64,AAAA"],
      }).success
    ).toBe(true);
  });
});
