import { describe, it, expect } from "vitest";
import {
  Hailuo02TextToVideoProRequestSchema,
  Hailuo02TextToVideoStandardRequestSchema,
  Hailuo02ImageToVideoProRequestSchema,
  Hailuo02ImageToVideoStandardRequestSchema,
  Hailuo23ImageToVideoProRequestSchema,
  Hailuo23ImageToVideoStandardRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("Hailuo createTask models (ac-la0bbj)", () => {
  const models = [
    "hailuo/02-image-to-video-pro",
    "hailuo/02-image-to-video-standard",
    "hailuo/02-text-to-video-pro",
    "hailuo/02-text-to-video-standard",
    "hailuo/2-3-image-to-video-pro",
    "hailuo/2-3-image-to-video-standard",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("validates hailuo/02-text-to-video-pro via schema and guard", () => {
    const req = {
      model: "hailuo/02-text-to-video-pro" as const,
      callBackUrl: "https://example.com/api/callback",
      input: {
        prompt:
          "High top angle wide mid close-up tracking shot over prehistoric ferns",
        prompt_optimizer: true,
      },
    };
    expect(Hailuo02TextToVideoProRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates hailuo/02-text-to-video-standard via schema and guard", () => {
    const req = {
      model: "hailuo/02-text-to-video-standard" as const,
      input: {
        prompt:
          "A llama and a raccoon battle it out in an intense table tennis match",
        duration: "6" as const,
        prompt_optimizer: true,
      },
    };
    expect(
      Hailuo02TextToVideoStandardRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates hailuo/02-image-to-video-pro via schema and guard", () => {
    const req = {
      model: "hailuo/02-image-to-video-pro" as const,
      input: {
        prompt:
          "Cinematic wide shot: A colossal starship drifts silently above Saturn",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/17585210783150ispzfo7.png",
        prompt_optimizer: true,
      },
    };
    expect(Hailuo02ImageToVideoProRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates hailuo/02-image-to-video-standard via schema and guard", () => {
    const req = {
      model: "hailuo/02-image-to-video-standard" as const,
      input: {
        prompt: "Epic aerial shot: A lone samurai stands atop a jagged peak",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/17585207681646umf3lz8.png",
        end_image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1758521423357w8586uq8.png",
        duration: "10" as const,
        resolution: "768P" as const,
        prompt_optimizer: true,
      },
    };
    expect(
      Hailuo02ImageToVideoStandardRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates hailuo/2-3-image-to-video-pro via schema and guard", () => {
    const req = {
      model: "hailuo/2-3-image-to-video-pro" as const,
      input: {
        prompt:
          "A graceful geisha performs a traditional Japanese dance indoors",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1761736831884xl56xfiw.webp",
        duration: "6" as const,
        resolution: "768P" as const,
      },
    };
    expect(Hailuo23ImageToVideoProRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates hailuo/2-3-image-to-video-standard via schema and guard", () => {
    const req = {
      model: "hailuo/2-3-image-to-video-standard" as const,
      input: {
        prompt:
          "Two armored medieval knights clash in an intense duel at sunset",
        image_url:
          "https://file.aiquickdraw.com/custom-page/akr/section-images/1761736401898mpm67du5.webp",
        duration: "6" as const,
        resolution: "1080P" as const,
      },
    };
    expect(
      Hailuo23ImageToVideoStandardRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects text-to-video-pro without prompt", () => {
    expect(
      Hailuo02TextToVideoProRequestSchema.safeParse({
        model: "hailuo/02-text-to-video-pro",
        input: {},
      }).success
    ).toBe(false);
  });

  it("rejects image-to-video without image_url", () => {
    expect(
      Hailuo02ImageToVideoProRequestSchema.safeParse({
        model: "hailuo/02-image-to-video-pro",
        input: {
          prompt: "Animate this still frame into a gentle camera push-in",
        },
      }).success
    ).toBe(false);
  });

  it("rejects numeric duration strings that are not 6 or 10", () => {
    expect(
      Hailuo02TextToVideoStandardRequestSchema.safeParse({
        model: "hailuo/02-text-to-video-standard",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          duration: "8",
        },
      }).success
    ).toBe(false);
  });

  it("rejects number duration (numeric-string-only)", () => {
    expect(
      Hailuo02TextToVideoStandardRequestSchema.safeParse({
        model: "hailuo/02-text-to-video-standard",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          duration: 6,
        },
      }).success
    ).toBe(false);
  });

  it("rejects 10s at 1080P on 2-3 image-to-video", () => {
    expect(
      Hailuo23ImageToVideoProRequestSchema.safeParse({
        model: "hailuo/2-3-image-to-video-pro",
        input: {
          prompt: "Animate this still frame into a gentle camera push-in",
          image_url: "https://example.com/frame.png",
          duration: "10",
          resolution: "1080P",
        },
      }).success
    ).toBe(false);
  });

  it("rejects prompt longer than 1500 on 02 models", () => {
    expect(
      Hailuo02TextToVideoProRequestSchema.safeParse({
        model: "hailuo/02-text-to-video-pro",
        input: {
          prompt: "x".repeat(1501),
        },
      }).success
    ).toBe(false);
  });

  it("accepts prompt up to 5000 on 2-3 models", () => {
    expect(
      Hailuo23ImageToVideoStandardRequestSchema.safeParse({
        model: "hailuo/2-3-image-to-video-standard",
        input: {
          prompt: "x".repeat(5000),
          image_url: "https://example.com/frame.png",
        },
      }).success
    ).toBe(true);
  });

  it("exposes modelInputSchemas for all six Hailuo models", () => {
    for (const model of models) {
      expect(modelInputSchemas[model].type).toBe("video");
      expect(modelInputSchemas[model].fields.prompt?.required).toBe(true);
    }

    expect(
      modelInputSchemas["hailuo/02-image-to-video-pro"].fields.image_url
        ?.required
    ).toBe(true);
    expect(
      modelInputSchemas["hailuo/02-text-to-video-pro"].fields.image_url
    ).toBeUndefined();
    expect(
      modelInputSchemas["hailuo/02-text-to-video-standard"].fields.duration
        ?.enum
    ).toEqual(["6", "10"]);
    expect(
      modelInputSchemas["hailuo/02-image-to-video-standard"].fields.resolution
        ?.enum
    ).toEqual(["512P", "768P"]);
    expect(
      modelInputSchemas["hailuo/2-3-image-to-video-pro"].fields.resolution?.enum
    ).toEqual(["768P", "1080P"]);
    expect(
      modelInputSchemas["hailuo/2-3-image-to-video-standard"].fields
        .prompt_optimizer
    ).toBeUndefined();
  });
});
