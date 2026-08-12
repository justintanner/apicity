import { describe, it, expect } from "vitest";
import {
  IdeogramV3TextToImageRequestSchema,
  IdeogramV3EditRequestSchema,
  IdeogramV3RemixRequestSchema,
  IdeogramCharacterRequestSchema,
  IdeogramCharacterEditRequestSchema,
  IdeogramCharacterRemixRequestSchema,
  KieMediaModelSchema,
  KIE_MEDIA_MODELS,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const IDEOGRAM_MODELS = [
  "ideogram/character",
  "ideogram/character-edit",
  "ideogram/character-remix",
  "ideogram/v3-edit",
  "ideogram/v3-remix",
  "ideogram/v3-text-to-image",
] as const;

describe("Ideogram createTask models (ac-biksxr)", () => {
  it.each(IDEOGRAM_MODELS)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates ideogram/v3-text-to-image via dedicated schema and guard", () => {
    const req = {
      model: "ideogram/v3-text-to-image" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        prompt: "A tranquil lakeside at twilight with soft golden light",
        rendering_speed: "BALANCED" as const,
        style: "AUTO" as const,
        expand_prompt: true,
        image_size: "square_hd" as const,
        seed: 123456,
        negative_prompt: "blurry, watermark",
      },
    };
    expect(IdeogramV3TextToImageRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates ideogram/v3-edit via dedicated schema and guard", () => {
    const req = {
      model: "ideogram/v3-edit" as const,
      input: {
        prompt: "A dog wearing a cowboy hat",
        image_url: "https://example.com/dog.png",
        mask_url: "https://example.com/mask.png",
        rendering_speed: "BALANCED" as const,
        expand_prompt: true,
      },
    };
    expect(IdeogramV3EditRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates ideogram/v3-remix via dedicated schema and guard", () => {
    const req = {
      model: "ideogram/v3-remix" as const,
      input: {
        prompt: "Change the cube into a sphere",
        image_url: "https://example.com/cube.png",
        strength: 0.8,
        num_images: "1" as const,
      },
    };
    expect(IdeogramV3RemixRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates ideogram/character via dedicated schema and guard", () => {
    const req = {
      model: "ideogram/character" as const,
      input: {
        prompt: "Place the woman from the portrait in a peaceful garden",
        reference_image_urls: ["https://example.com/portrait.png"],
        style: "REALISTIC" as const,
        num_images: "1" as const,
      },
    };
    expect(IdeogramCharacterRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates ideogram/character-edit via dedicated schema and guard", () => {
    const req = {
      model: "ideogram/character-edit" as const,
      input: {
        prompt: "A fabulous look head tilted down, smiling",
        image_url: "https://example.com/face.png",
        mask_url: "https://example.com/mask.png",
        reference_image_urls: ["https://example.com/ref.png"],
      },
    };
    expect(IdeogramCharacterEditRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates ideogram/character-remix via dedicated schema and guard", () => {
    const req = {
      model: "ideogram/character-remix" as const,
      input: {
        prompt: "A fisheye selfie on a night street",
        image_url: "https://example.com/scene.png",
        reference_image_urls: ["https://example.com/character.png"],
        strength: 0.8,
        negative_prompt: "",
      },
    };
    expect(IdeogramCharacterRemixRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects incomplete v3-edit without mask_url", () => {
    expect(
      IdeogramV3EditRequestSchema.safeParse({
        model: "ideogram/v3-edit",
        input: {
          prompt: "A dog wearing a cowboy hat",
          image_url: "https://example.com/dog.png",
        },
      }).success
    ).toBe(false);
  });

  it("rejects character without reference_image_urls", () => {
    expect(
      IdeogramCharacterRequestSchema.safeParse({
        model: "ideogram/character",
        input: {
          prompt: "A garden portrait",
        },
      }).success
    ).toBe(false);
  });

  it("rejects v3-remix strength below 0.01 and character-remix below 0.1", () => {
    expect(
      IdeogramV3RemixRequestSchema.safeParse({
        model: "ideogram/v3-remix",
        input: {
          prompt: "Remix",
          image_url: "https://example.com/x.png",
          strength: 0.005,
        },
      }).success
    ).toBe(false);

    expect(
      IdeogramCharacterRemixRequestSchema.safeParse({
        model: "ideogram/character-remix",
        input: {
          prompt: "Remix",
          image_url: "https://example.com/x.png",
          reference_image_urls: ["https://example.com/ref.png"],
          strength: 0.05,
        },
      }).success
    ).toBe(false);
  });

  it("rejects numeric num_images and overlong character-remix negative_prompt", () => {
    expect(
      IdeogramV3RemixRequestSchema.safeParse({
        model: "ideogram/v3-remix",
        input: {
          prompt: "Remix",
          image_url: "https://example.com/x.png",
          num_images: 1,
        },
      }).success
    ).toBe(false);

    expect(
      IdeogramCharacterRemixRequestSchema.safeParse({
        model: "ideogram/character-remix",
        input: {
          prompt: "Remix",
          image_url: "https://example.com/x.png",
          reference_image_urls: ["https://example.com/ref.png"],
          negative_prompt: "x".repeat(501),
        },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for all six Ideogram models", () => {
    expect(
      KIE_MEDIA_MODELS.filter((model) => model.startsWith("ideogram/"))
    ).toEqual(IDEOGRAM_MODELS);
    for (const model of IDEOGRAM_MODELS) {
      expect(modelInputSchemas[model].type).toBe("image");
      expect(modelInputSchemas[model].fields.prompt?.required).toBe(true);
    }
    expect(
      modelInputSchemas["ideogram/character"].fields.reference_image_urls
        ?.required
    ).toBe(true);
    expect(
      modelInputSchemas["ideogram/v3-edit"].fields.mask_url?.required
    ).toBe(true);
    expect(
      modelInputSchemas["ideogram/v3-remix"].fields.strength?.minimum
    ).toBe(0.01);
    expect(
      modelInputSchemas["ideogram/character-remix"].fields.strength?.minimum
    ).toBe(0.1);
    expect(
      modelInputSchemas["ideogram/character-remix"].fields.negative_prompt
        ?.maxLength
    ).toBe(500);
  });

  it("rejects the plausible but undocumented Reframe slug", () => {
    const reframeModel = "ideogram/v3-reframe";

    expect(KieMediaModelSchema.safeParse(reframeModel).success).toBe(false);
    expect(Object.hasOwn(CREATE_TASK_GUARDS, reframeModel)).toBe(false);
    expect(Object.hasOwn(modelInputSchemas, reframeModel)).toBe(false);
  });
});
