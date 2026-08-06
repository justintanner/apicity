import { describe, it, expect } from "vitest";
import {
  Flux2ProTextToImageRequestSchema,
  Flux2FlexTextToImageRequestSchema,
  Flux2ProImageToImageRequestSchema,
  Flux2FlexImageToImageRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Flux-2 createTask models (ac-i4exil)", () => {
  const models = [
    "flux-2/flex-image-to-image",
    "flux-2/flex-text-to-image",
    "flux-2/pro-image-to-image",
    "flux-2/pro-text-to-image",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates flux-2/pro-text-to-image via schema and guard", () => {
    const req = {
      model: "flux-2/pro-text-to-image" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        prompt:
          "Hyperrealistic supermarket blister pack with pink 3D letters spelling FLUX.2",
        aspect_ratio: "1:1" as const,
        resolution: "1K" as const,
        nsfw_checker: false,
      },
    };
    expect(Flux2ProTextToImageRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates flux-2/flex-text-to-image via schema and guard", () => {
    const req = {
      model: "flux-2/flex-text-to-image" as const,
      input: {
        prompt:
          "A humanoid figure with a vintage television set for a head saying Hello FLUX.2",
        aspect_ratio: "16:9" as const,
        resolution: "2K" as const,
      },
    };
    expect(Flux2FlexTextToImageRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates flux-2/pro-image-to-image via schema and guard", () => {
    const req = {
      model: "flux-2/pro-image-to-image" as const,
      input: {
        input_urls: [
          "https://static.aiquickdraw.com/tools/example/1764235041265_kjJ2sTMR.png",
          "https://static.aiquickdraw.com/tools/example/1764235045490_9SjAUr4Z.png",
        ],
        prompt:
          "The jar in image 1 is filled with capsules exactly same as image 2 with the exact logo",
        aspect_ratio: "auto" as const,
        resolution: "1K" as const,
      },
    };
    expect(Flux2ProImageToImageRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates flux-2/flex-image-to-image via schema and guard", () => {
    const req = {
      model: "flux-2/flex-image-to-image" as const,
      input: {
        input_urls: [
          "https://static.aiquickdraw.com/tools/example/1764235158281_tABmx723.png",
        ],
        prompt: "Replace the can in image 2 with the can from image 1",
        aspect_ratio: "1:1" as const,
        resolution: "2K" as const,
        nsfw_checker: true,
      },
    };
    expect(Flux2FlexImageToImageRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects text-to-image without aspect_ratio", () => {
    expect(
      Flux2ProTextToImageRequestSchema.safeParse({
        model: "flux-2/pro-text-to-image",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          resolution: "1K",
        },
      }).success
    ).toBe(false);
  });

  it("rejects text-to-image without resolution", () => {
    expect(
      Flux2FlexTextToImageRequestSchema.safeParse({
        model: "flux-2/flex-text-to-image",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          aspect_ratio: "1:1",
        },
      }).success
    ).toBe(false);
  });

  it("rejects text-to-image prompt shorter than 3 chars", () => {
    expect(
      Flux2ProTextToImageRequestSchema.safeParse({
        model: "flux-2/pro-text-to-image",
        input: {
          prompt: "ab",
          aspect_ratio: "1:1",
          resolution: "1K",
        },
      }).success
    ).toBe(false);
  });

  it("rejects image-to-image without input_urls", () => {
    expect(
      Flux2ProImageToImageRequestSchema.safeParse({
        model: "flux-2/pro-image-to-image",
        input: {
          prompt: "Replace the product packaging with a glass jar",
          aspect_ratio: "1:1",
          resolution: "1K",
        },
      }).success
    ).toBe(false);
  });

  it("rejects image-to-image with empty input_urls", () => {
    expect(
      Flux2FlexImageToImageRequestSchema.safeParse({
        model: "flux-2/flex-image-to-image",
        input: {
          input_urls: [],
          prompt: "Replace the product packaging with a glass jar",
          aspect_ratio: "1:1",
          resolution: "1K",
        },
      }).success
    ).toBe(false);
  });

  it("rejects image-to-image with more than 8 input_urls", () => {
    expect(
      Flux2ProImageToImageRequestSchema.safeParse({
        model: "flux-2/pro-image-to-image",
        input: {
          input_urls: Array.from(
            { length: 9 },
            (_, i) => `https://example.com/${i}.png`
          ),
          prompt: "Replace the product packaging with a glass jar",
          aspect_ratio: "1:1",
          resolution: "1K",
        },
      }).success
    ).toBe(false);
  });

  it("rejects text-to-image auto aspect_ratio (i2i-only)", () => {
    expect(
      Flux2ProTextToImageRequestSchema.safeParse({
        model: "flux-2/pro-text-to-image",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          aspect_ratio: "auto",
          resolution: "1K",
        },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for all four Flux-2 models", () => {
    for (const model of models) {
      expect(modelInputSchemas[model].type).toBe("image");
      expect(modelInputSchemas[model].fields.prompt?.required).toBe(true);
      expect(modelInputSchemas[model].fields.aspect_ratio?.required).toBe(true);
      expect(modelInputSchemas[model].fields.resolution?.required).toBe(true);
    }

    expect(
      modelInputSchemas["flux-2/pro-image-to-image"].fields.input_urls?.required
    ).toBe(true);
    expect(
      modelInputSchemas["flux-2/flex-image-to-image"].fields.input_urls
        ?.maxItems
    ).toBe(8);
    expect(
      modelInputSchemas["flux-2/pro-text-to-image"].fields.input_urls
    ).toBeUndefined();
    expect(
      modelInputSchemas["flux-2/flex-text-to-image"].fields.aspect_ratio?.enum
    ).not.toContain("auto");
    expect(
      modelInputSchemas["flux-2/pro-image-to-image"].fields.aspect_ratio?.enum
    ).toContain("auto");
  });
});
