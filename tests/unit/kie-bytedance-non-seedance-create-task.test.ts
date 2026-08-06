import { describe, it, expect } from "vitest";
import {
  BytedanceSeedreamRequestSchema,
  BytedanceSeedreamV4EditRequestSchema,
  BytedanceSeedreamV4TextToImageRequestSchema,
  BytedanceV1LiteImageToVideoRequestSchema,
  BytedanceV1LiteTextToVideoRequestSchema,
  BytedanceV1ProFastImageToVideoRequestSchema,
  BytedanceV1ProImageToVideoRequestSchema,
  BytedanceV1ProTextToVideoRequestSchema,
  KieMediaModelSchema,
  CreateTaskRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

describe("ByteDance non-Seedance createTask models (ac-ww94di)", () => {
  const models = [
    "bytedance/seedream",
    "bytedance/seedream-v4-edit",
    "bytedance/seedream-v4-text-to-image",
    "bytedance/v1-lite-image-to-video",
    "bytedance/v1-lite-text-to-video",
    "bytedance/v1-pro-fast-image-to-video",
    "bytedance/v1-pro-image-to-video",
    "bytedance/v1-pro-text-to-video",
  ] as const;

  it.each(models)("lists %s on KieMediaModelSchema", (model) => {
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
  });

  it("does not accept bare bytedance/seedream via Seedance alias alone", () => {
    // Seedance alias is product-anchored; these ids only pass via the enum.
    // (seedance-3 would pass the alias; bytedance/seedream must be listed.)
    expect(KieMediaModelSchema.safeParse("bytedance/seedream").success).toBe(
      true
    );
    expect(
      KieMediaModelSchema.safeParse("bytedance/seedream-v5-text-to-image")
        .success
    ).toBe(false);
    expect(
      KieMediaModelSchema.safeParse("bytedance/v1-ultra-text-to-video").success
    ).toBe(false);
  });

  it("validates bytedance/seedream via schema and guard", () => {
    const req = {
      model: "bytedance/seedream" as const,
      callBackUrl: "https://example.com/cb",
      input: {
        prompt:
          "A 2D flat art style campsite poster with mountains and brown tents",
        image_size: "square_hd" as const,
        guidance_scale: 2.5,
        seed: 42,
      },
    };
    expect(BytedanceSeedreamRequestSchema.safeParse(req).success).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates bytedance/seedream-v4-text-to-image via schema and guard", () => {
    const req = {
      model: "bytedance/seedream-v4-text-to-image" as const,
      input: {
        prompt:
          "Draw the following system of binary linear equations on a blackboard",
        image_size: "square_hd" as const,
        image_resolution: "1K" as const,
        max_images: 1,
      },
    };
    expect(
      BytedanceSeedreamV4TextToImageRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates bytedance/seedream-v4-edit via schema and guard", () => {
    const req = {
      model: "bytedance/seedream-v4-edit" as const,
      input: {
        prompt:
          "Create a visual showcase for an outdoor sports brand named KIE AI",
        image_urls: ["https://example.com/logo.png"],
        image_size: "square_hd" as const,
        image_resolution: "2K" as const,
      },
    };
    expect(BytedanceSeedreamV4EditRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects seedream-v4-edit without image_urls", () => {
    expect(
      BytedanceSeedreamV4EditRequestSchema.safeParse({
        model: "bytedance/seedream-v4-edit",
        input: {
          prompt: "Create a visual showcase for an outdoor sports brand",
        },
      }).success
    ).toBe(false);
  });

  it("validates bytedance/v1-lite-image-to-video via schema and guard", () => {
    const req = {
      model: "bytedance/v1-lite-image-to-video" as const,
      input: {
        prompt:
          "Multiple shots. A traveler crosses an endless desert toward a glowing archway.",
        image_url: "https://example.com/start.png",
        resolution: "720p" as const,
        duration: "5" as const,
        end_image_url: "https://example.com/end.png",
      },
    };
    expect(
      BytedanceV1LiteImageToVideoRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates bytedance/v1-lite-text-to-video via schema and guard", () => {
    const req = {
      model: "bytedance/v1-lite-text-to-video" as const,
      input: {
        prompt:
          "Wide-angle shot: A serene sailing boat gently sways in the harbor at dawn",
        aspect_ratio: "9:21" as const,
        duration: "10" as const,
      },
    };
    expect(BytedanceV1LiteTextToVideoRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects lite text-to-video with pro-only 21:9 aspect ratio", () => {
    expect(
      BytedanceV1LiteTextToVideoRequestSchema.safeParse({
        model: "bytedance/v1-lite-text-to-video",
        input: {
          prompt: "A quiet forest path in morning light with soft fog",
          aspect_ratio: "21:9",
        },
      }).success
    ).toBe(false);
  });

  it("validates bytedance/v1-pro-fast-image-to-video via schema and guard", () => {
    const req = {
      model: "bytedance/v1-pro-fast-image-to-video" as const,
      input: {
        prompt:
          "A cinematic close-up sequence of a ceramic coffee cup on a wooden table",
        image_url: "https://example.com/cup.webp",
        resolution: "1080p" as const,
        duration: "5" as const,
      },
    };
    expect(
      BytedanceV1ProFastImageToVideoRequestSchema.safeParse(req).success
    ).toBe(true);
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects pro-fast with 480p resolution", () => {
    expect(
      BytedanceV1ProFastImageToVideoRequestSchema.safeParse({
        model: "bytedance/v1-pro-fast-image-to-video",
        input: {
          prompt: "A cinematic close-up sequence of a ceramic coffee cup",
          image_url: "https://example.com/cup.webp",
          resolution: "480p",
        },
      }).success
    ).toBe(false);
  });

  it("validates bytedance/v1-pro-image-to-video via schema and guard", () => {
    const req = {
      model: "bytedance/v1-pro-image-to-video" as const,
      input: {
        prompt: "A golden retriever dashing through shallow surf at the beach",
        image_url: "https://example.com/dog.webp",
        resolution: "720p" as const,
        duration: "5" as const,
        camera_fixed: false,
        seed: -1,
      },
    };
    expect(BytedanceV1ProImageToVideoRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("validates bytedance/v1-pro-text-to-video via schema and guard", () => {
    const req = {
      model: "bytedance/v1-pro-text-to-video" as const,
      input: {
        prompt:
          "A boy with curly hair and a backpack rides a bike down a golden-lit rural road at sunset.",
        aspect_ratio: "21:9" as const,
        resolution: "720p" as const,
        duration: "10" as const,
        camera_fixed: false,
        seed: -1,
        enable_safety_checker: true,
        nsfw_checker: false,
      },
    };
    expect(BytedanceV1ProTextToVideoRequestSchema.safeParse(req).success).toBe(
      true
    );
    expect(CREATE_TASK_GUARDS[req.model].safeParse(req).success).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(req).success).toBe(true);
  });

  it("rejects video duration as a number instead of numeric string", () => {
    expect(
      BytedanceV1ProTextToVideoRequestSchema.safeParse({
        model: "bytedance/v1-pro-text-to-video",
        input: {
          prompt:
            "A boy with curly hair rides a bike at sunset on a rural road",
          duration: 5,
        },
      }).success
    ).toBe(false);
  });

  it("rejects image-to-video without image_url", () => {
    expect(
      BytedanceV1LiteImageToVideoRequestSchema.safeParse({
        model: "bytedance/v1-lite-image-to-video",
        input: {
          prompt: "A traveler crosses an endless desert toward a glowing arch",
        },
      }).success
    ).toBe(false);
  });

  it("exposes modelInputSchemas for all eight models", () => {
    expect(modelInputSchemas["bytedance/seedream"].type).toBe("image");
    expect(modelInputSchemas["bytedance/seedream-v4-edit"].type).toBe("image");
    expect(modelInputSchemas["bytedance/seedream-v4-text-to-image"].type).toBe(
      "image"
    );
    expect(modelInputSchemas["bytedance/v1-lite-image-to-video"].type).toBe(
      "video"
    );
    expect(modelInputSchemas["bytedance/v1-lite-text-to-video"].type).toBe(
      "video"
    );
    expect(modelInputSchemas["bytedance/v1-pro-fast-image-to-video"].type).toBe(
      "video"
    );
    expect(modelInputSchemas["bytedance/v1-pro-image-to-video"].type).toBe(
      "video"
    );
    expect(modelInputSchemas["bytedance/v1-pro-text-to-video"].type).toBe(
      "video"
    );

    expect(
      modelInputSchemas["bytedance/seedream-v4-edit"].fields.image_urls
        ?.maxItems
    ).toBe(10);
    expect(
      modelInputSchemas["bytedance/v1-pro-fast-image-to-video"].fields
        .resolution?.enum
    ).toEqual(["720p", "1080p"]);
    expect(
      modelInputSchemas["bytedance/v1-lite-text-to-video"].fields.aspect_ratio
        ?.enum
    ).toContain("9:21");
    expect(
      modelInputSchemas["bytedance/v1-pro-text-to-video"].fields.aspect_ratio
        ?.enum
    ).toContain("21:9");
    expect(
      modelInputSchemas["bytedance/v1-pro-text-to-video"].fields.duration?.enum
    ).toEqual(["5", "10"]);
  });
});
