import { describe, it, expect } from "vitest";
import {
  Seedance15ProRequestSchema,
  GptImage15TextToImageRequestSchema,
  NanoBanana2LiteRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Assorted single-model createTask schemas (ac-qn3r5n)", () => {
  const models = [
    "bytedance/seedance-1.5-pro",
    "gpt-image/1.5-text-to-image",
    "nano-banana-2-lite",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates bytedance/seedance-1.5-pro request via schema and guard", () => {
    const req = {
      model: "bytedance/seedance-1.5-pro" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        prompt:
          "A serene beach at sunset with waves gently crashing on the shore",
        aspect_ratio: "16:9" as const,
        duration: 8,
        resolution: "720p" as const,
        fixed_lens: false,
        generate_audio: false,
      },
    };
    expect(Seedance15ProRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects seedance-1.5-pro without duration", () => {
    expect(
      Seedance15ProRequestSchema.safeParse({
        model: "bytedance/seedance-1.5-pro",
        input: {
          prompt: "A quiet forest path in morning light",
          aspect_ratio: "1:1",
        },
      }).success
    ).toBe(false);
  });

  it("rejects seedance-1.5-pro duration outside 4-12", () => {
    expect(
      Seedance15ProRequestSchema.safeParse({
        model: "bytedance/seedance-1.5-pro",
        input: {
          prompt: "A quiet forest path in morning light",
          aspect_ratio: "1:1",
          duration: 15,
        },
      }).success
    ).toBe(false);
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

  it("exposes modelInputSchemas for all three models", () => {
    expect(modelInputSchemas["bytedance/seedance-1.5-pro"].type).toBe("video");
    expect(
      modelInputSchemas["bytedance/seedance-1.5-pro"].fields.duration?.required
    ).toBe(true);

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
