import { describe, it, expect } from "vitest";
import {
  InfinitalkFromAudioRequestSchema,
  ZImageRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Singleton vendors createTask models (ac-64c647)", () => {
  const models = ["infinitalk/from-audio", "z-image"] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates infinitalk/from-audio via dedicated schema and guard", () => {
    const req = {
      model: "infinitalk/from-audio" as const,
      input: {
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/x.png",
        audio_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/x.mp3",
        prompt: "A young woman with long dark hair talking on a podcast.",
        resolution: "480p" as const,
      },
    };
    expect(InfinitalkFromAudioRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates z-image via dedicated schema and guard", () => {
    const req = {
      model: "z-image" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        prompt: "A cafe terrace in the Marais district of Paris",
        aspect_ratio: "1:1" as const,
      },
    };
    expect(ZImageRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects incomplete infinitalk input", () => {
    expect(
      InfinitalkFromAudioRequestSchema.safeParse({
        model: "infinitalk/from-audio",
        input: {
          image_url: "https://example.com/x.png",
        },
      }).success
    ).toBe(false);
  });

  it("rejects z-image without aspect_ratio", () => {
    expect(
      ZImageRequestSchema.safeParse({
        model: "z-image",
        input: {
          prompt: "A red bicycle",
        },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for both models", () => {
    expect(modelInputSchemas["infinitalk/from-audio"].type).toBe("video");
    expect(
      modelInputSchemas["infinitalk/from-audio"].fields.image_url?.required
    ).toBe(true);
    expect(
      modelInputSchemas["infinitalk/from-audio"].fields.audio_url?.required
    ).toBe(true);
    expect(modelInputSchemas["z-image"].type).toBe("image");
    expect(modelInputSchemas["z-image"].fields.prompt?.required).toBe(true);
    expect(modelInputSchemas["z-image"].fields.aspect_ratio?.required).toBe(
      true
    );
  });
});
