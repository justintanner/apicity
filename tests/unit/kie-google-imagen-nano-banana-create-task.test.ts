import { describe, it, expect } from "vitest";
import {
  GoogleImagen4RequestSchema,
  GoogleImagen4FastRequestSchema,
  GoogleImagen4UltraRequestSchema,
  GoogleNanoBananaRequestSchema,
  GoogleNanoBananaEditRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Google Imagen + Nano Banana createTask models (ac-ukhr7p)", () => {
  const models = [
    "google/imagen4",
    "google/imagen4-fast",
    "google/imagen4-ultra",
    "google/nano-banana",
    "google/nano-banana-edit",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates google/imagen4 via schema and guard", () => {
    const req = {
      model: "google/imagen4" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        prompt:
          "A lively comic scene where two colleagues discuss Google Imagen 4",
        negative_prompt: "blurry, low quality",
        aspect_ratio: "1:1" as const,
        seed: "42",
      },
    };
    expect(GoogleImagen4RequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates google/imagen4-fast via schema and guard (integer seed)", () => {
    const req = {
      model: "google/imagen4-fast" as const,
      input: {
        prompt:
          "Cinematic photorealistic medium shot of a young woman with pink hair",
        aspect_ratio: "16:9" as const,
        seed: 12345,
      },
    };
    expect(GoogleImagen4FastRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates google/imagen4-ultra via schema and guard", () => {
    const req = {
      model: "google/imagen4-ultra" as const,
      input: {
        prompt: "Ultra-detailed product shot of a glass perfume bottle",
        aspect_ratio: "4:3" as const,
      },
    };
    expect(GoogleImagen4UltraRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates google/nano-banana via schema and guard", () => {
    const req = {
      model: "google/nano-banana" as const,
      input: {
        prompt:
          "A surreal painting of a giant banana floating in space, stars and galaxies",
        output_format: "png" as const,
        aspect_ratio: "1:1" as const,
        nsfw_checker: false,
      },
    };
    expect(GoogleNanoBananaRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates google/nano-banana-edit via schema and guard", () => {
    const req = {
      model: "google/nano-banana-edit" as const,
      input: {
        prompt:
          "turn this photo into a character figure with a box and blender screen",
        image_urls: [
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png",
        ],
        output_format: "jpeg" as const,
        aspect_ratio: "1:1" as const,
      },
    };
    expect(GoogleNanoBananaEditRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects imagen4 without prompt", () => {
    expect(
      GoogleImagen4RequestSchema.safeParse({
        model: "google/imagen4",
        input: { aspect_ratio: "1:1" },
      }).success
    ).toBe(false);
  });

  it("rejects imagen4 when seed is an integer (string seed only)", () => {
    expect(
      GoogleImagen4RequestSchema.safeParse({
        model: "google/imagen4",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          seed: 42,
        },
      }).success
    ).toBe(false);
  });

  it("rejects imagen4-fast when seed is a string (integer seed only)", () => {
    expect(
      GoogleImagen4FastRequestSchema.safeParse({
        model: "google/imagen4-fast",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          seed: "42",
        },
      }).success
    ).toBe(false);
  });

  it("rejects imagen4 with invalid aspect_ratio", () => {
    expect(
      GoogleImagen4UltraRequestSchema.safeParse({
        model: "google/imagen4-ultra",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          aspect_ratio: "21:9",
        },
      }).success
    ).toBe(false);
  });

  it("rejects nano-banana with jpg output_format (jpeg only)", () => {
    expect(
      GoogleNanoBananaRequestSchema.safeParse({
        model: "google/nano-banana",
        input: {
          prompt: "A surreal painting of a giant banana floating in space",
          output_format: "jpg",
        },
      }).success
    ).toBe(false);
  });

  it("rejects nano-banana-edit without image_urls", () => {
    expect(
      GoogleNanoBananaEditRequestSchema.safeParse({
        model: "google/nano-banana-edit",
        input: {
          prompt: "turn this photo into a character figure",
        },
      }).success
    ).toBe(false);
  });

  it("rejects nano-banana-edit with empty image_urls", () => {
    expect(
      GoogleNanoBananaEditRequestSchema.safeParse({
        model: "google/nano-banana-edit",
        input: {
          prompt: "turn this photo into a character figure",
          image_urls: [],
        },
      }).success
    ).toBe(false);
  });

  it("rejects nano-banana-edit with more than 10 image_urls", () => {
    expect(
      GoogleNanoBananaEditRequestSchema.safeParse({
        model: "google/nano-banana-edit",
        input: {
          prompt: "turn this photo into a character figure",
          image_urls: Array.from(
            { length: 11 },
            (_, i) => `https://example.com/${i}.png`
          ),
        },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for all five Google Imagen/Nano Banana models", () => {
    for (const model of models) {
      expect(modelInputSchemas[model].type).toBe("image");
      expect(modelInputSchemas[model].fields.prompt).toBeDefined();
    }
    expect(
      modelInputSchemas["google/nano-banana-edit"].fields.image_urls
    ).toBeDefined();
    expect(
      modelInputSchemas["google/nano-banana-edit"].fields.image_urls
    ).toMatchObject({ required: true, minItems: 1, maxItems: 10 });
  });
});
