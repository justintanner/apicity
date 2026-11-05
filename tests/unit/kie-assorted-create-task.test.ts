import { describe, it, expect } from "vitest";
import {
  GptImage15TextToImageRequestSchema,
  NanoBanana2LiteRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("retired bytedance/seedance-1.5-pro (ac-x0qlnu)", () => {
  const retired = "bytedance/seedance-1.5-pro";

  it("has no per-model schema or guard", () => {
    expect(Object.hasOwn(CREATE_TASK_GUARDS, retired)).toBe(false);
    expect(Object.hasOwn(modelInputSchemas, retired)).toBe(false);
  });

  it("parses only through the open Seedance alias, so KIE answers the call", () => {
    expect(KieMediaModelSchema.safeParse(retired).success).toBe(true);
  });
});

describe("Assorted single-model createTask schemas (ac-qn3r5n)", () => {
  const models = ["gpt-image/1.5-text-to-image", "nano-banana-2-lite"] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates gpt-image/1.5-text-to-image request via schema and guard", () => {
    const req = {
      model: "gpt-image/1.5-text-to-image" as const,
      input: {
        prompt: "A photorealistic candid photograph of a sailor on a boat",
        aspect_ratio: "1:1" as const,
        quality: "medium" as const,
      },
    };
    expect(GptImage15TextToImageRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects gpt-image/1.5-text-to-image without quality", () => {
    expect(
      GptImage15TextToImageRequestSchema.safeParse({
        model: "gpt-image/1.5-text-to-image",
        input: {
          prompt: "A photorealistic candid photograph",
          aspect_ratio: "1:1",
        },
      }).success
    ).toBe(false);
  });

  it("validates nano-banana-2-lite request via schema and guard", () => {
    const req = {
      model: "nano-banana-2-lite" as const,
      input: {
        prompt: "Generate a pig on the grass, cinematic light",
        aspect_ratio: "auto" as const,
        image_urls: [
          "https://file.aiquickdraw.com/custom-page/akr/section-images/x.png",
        ],
      },
    };
    expect(NanoBanana2LiteRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("accepts nano-banana-2-lite pure text-to-image without image_urls", () => {
    expect(
      NanoBanana2LiteRequestSchema.safeParse({
        model: "nano-banana-2-lite",
        input: {
          prompt: "Generate a pig on the grass, cinematic light",
        },
      }).success
    ).toBe(true);
  });

  it("rejects nano-banana-2-lite without prompt", () => {
    expect(
      NanoBanana2LiteRequestSchema.safeParse({
        model: "nano-banana-2-lite",
        input: { aspect_ratio: "1:1" },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for both models", () => {
    expect(modelInputSchemas["gpt-image/1.5-text-to-image"].type).toBe("image");
    expect(
      modelInputSchemas["gpt-image/1.5-text-to-image"].fields.quality?.required
    ).toBe(true);

    expect(modelInputSchemas["nano-banana-2-lite"].type).toBe("image");
    expect(
      modelInputSchemas["nano-banana-2-lite"].fields.image_urls
    ).toBeDefined();
    expect(
      modelInputSchemas["nano-banana-2-lite"].fields.image_input
    ).toBeUndefined();
  });
});
