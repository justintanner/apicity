import { describe, expect, it } from "vitest";

import type {
  KlingOmniImageToVideoRequest,
  KlingOmniReferenceToVideoRequest,
  KlingOmniTextToVideoRequest,
  KlingOmniTransformationRequest,
  MediaGenerationRequest,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KlingOmniImageToVideoInputSchema,
  KlingOmniImageToVideoRequestSchema,
  KlingOmniReferenceToVideoInputSchema,
  KlingOmniReferenceToVideoRequestSchema,
  KlingOmniTextToVideoInputSchema,
  KlingOmniTextToVideoRequestSchema,
  KlingOmniTransformationInputSchema,
  KlingOmniTransformationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const PROMPT = "A white cat pounces through fresh snow.";
const IMAGE_1 = "https://example.com/cat-front.jpg";
const IMAGE_2 = "oss://kling-omni/cat-side.png";
const VIDEO = "https://example.com/cat-reference.mp4";

const MULTI_PROMPT = [
  { prompt: "A wide establishing shot.", duration: 2 },
  { prompt: "A close-up of the cat landing.", duration: 3 },
];

function expectAccepted(request: MediaGenerationRequest): void {
  const result = CreateTaskRequestSchema.safeParse(request);
  expect(result.success).toBe(true);
  if (!result.success) throw result.error;
}

function expectRejectedAt(
  schema: {
    safeParse(
      value: unknown
    ): ReturnType<typeof CreateTaskRequestSchema.safeParse>;
  },
  request: unknown,
  expectedPath: string
): void {
  const result = schema.safeParse(request);
  expect(result.success).toBe(false);
  if (result.success) return;
  expect(
    result.error.issues.some((issue) => issue.path.join(".") === expectedPath)
  ).toBe(true);
}

describe("Kling 3.0 Omni request schemas", () => {
  it("accepts the upstream text-to-video example", () => {
    const request = {
      model: "kling-3.0-omni/text-to-video",
      input: {
        prompt: PROMPT,
        customize_multi_shots: true,
        multi_prompt: MULTI_PROMPT,
        audio: false,
        resolution: "720p",
        aspect_ratio: "16:9",
        duration: 5,
      },
    } satisfies KlingOmniTextToVideoRequest;

    expect(KlingOmniTextToVideoRequestSchema.safeParse(request).success).toBe(
      true
    );
    expectAccepted(request);
  });

  it("accepts both image-to-video frame shapes", () => {
    const firstFrame = {
      model: "kling-3.0-omni/image-to-video",
      input: {
        prompt: PROMPT,
        image_urls: [IMAGE_1],
        customize_multi_shots: true,
        multi_prompt: MULTI_PROMPT,
        aspect_ratio: "16:9",
      },
    } satisfies KlingOmniImageToVideoRequest;
    const firstAndLastFrames = {
      model: "kling-3.0-omni/image-to-video",
      input: {
        prompt: PROMPT,
        image_urls: [IMAGE_1, IMAGE_2],
        customize_multi_shots: false,
        audio: false,
        resolution: "720p",
        aspect_ratio: "auto",
        duration: 5,
      },
    } satisfies KlingOmniImageToVideoRequest;

    expect(
      KlingOmniImageToVideoRequestSchema.safeParse(firstFrame).success
    ).toBe(true);
    expect(
      KlingOmniImageToVideoRequestSchema.safeParse(firstAndLastFrames).success
    ).toBe(true);
    expectAccepted(firstFrame);
    expectAccepted(firstAndLastFrames);
  });

  it("accepts all three reference-to-video variants", () => {
    const noVideo = {
      model: "kling-3.0-omni/reference-to-video",
      input: {
        prompt: PROMPT,
        image_urls: [IMAGE_1],
        customize_multi_shots: true,
        multi_prompt: MULTI_PROMPT,
        audio: true,
        aspect_ratio: "16:9",
      },
    } satisfies KlingOmniReferenceToVideoRequest;
    const videoOnly = {
      model: "kling-3.0-omni/reference-to-video",
      input: {
        prompt: PROMPT,
        video_urls: [VIDEO],
        aspect_ratio: "auto",
        audio: false,
      },
    } satisfies KlingOmniReferenceToVideoRequest;
    const videoWithImages = {
      model: "kling-3.0-omni/reference-to-video",
      input: {
        prompt: PROMPT,
        image_urls: [IMAGE_1],
        video_urls: [VIDEO],
        aspect_ratio: "9:16",
        audio: false,
      },
    } satisfies KlingOmniReferenceToVideoRequest;

    for (const request of [noVideo, videoOnly, videoWithImages]) {
      expect(
        KlingOmniReferenceToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expectAccepted(request);
    }
  });

  it("accepts both transformation variants and string duration with images", () => {
    const videoOnly = {
      model: "kling-3.0-omni/transformation",
      input: {
        prompt: PROMPT,
        video_urls: [VIDEO],
        aspect_ratio: "auto",
        audio: false,
      },
    } satisfies KlingOmniTransformationRequest;
    const videoWithImages = {
      model: "kling-3.0-omni/transformation",
      input: {
        prompt: PROMPT,
        image_urls: [IMAGE_1],
        video_urls: [VIDEO],
        duration: "5",
        resolution: "720p",
        aspect_ratio: "16:9",
        audio: false,
      },
    } satisfies KlingOmniTransformationRequest;

    expect(
      KlingOmniTransformationRequestSchema.safeParse(videoOnly).success
    ).toBe(true);
    expect(
      KlingOmniTransformationRequestSchema.safeParse(videoWithImages).success
    ).toBe(true);
    expectAccepted(videoOnly);
    expectAccepted(videoWithImages);
  });

  it("rejects the acceptance-criteria payload failures", () => {
    expectRejectedAt(
      KlingOmniTextToVideoRequestSchema,
      {
        model: "kling-3.0-omni/text-to-video",
        input: { customize_multi_shots: false },
      },
      "input.prompt"
    );

    for (const image_urls of [[], [IMAGE_1, IMAGE_2, IMAGE_1]]) {
      expectRejectedAt(
        KlingOmniImageToVideoRequestSchema,
        {
          model: "kling-3.0-omni/image-to-video",
          input: { prompt: PROMPT, image_urls },
        },
        "input.image_urls"
      );
    }

    expectRejectedAt(
      KlingOmniReferenceToVideoRequestSchema,
      {
        model: "kling-3.0-omni/reference-to-video",
        input: {
          prompt: PROMPT,
          video_urls: [VIDEO],
          aspect_ratio: "16:9",
          audio: false,
        },
      },
      "input.aspect_ratio"
    );
    expectRejectedAt(
      KlingOmniReferenceToVideoRequestSchema,
      {
        model: "kling-3.0-omni/reference-to-video",
        input: {
          prompt: PROMPT,
          video_urls: [VIDEO],
          aspect_ratio: "auto",
          audio: true,
        },
      },
      "input.audio"
    );
    expectRejectedAt(
      KlingOmniTransformationRequestSchema,
      {
        model: "kling-3.0-omni/transformation",
        input: { prompt: PROMPT },
      },
      "input.video_urls"
    );
  });

  it("enforces the multi-shot scenario rules", () => {
    const base = {
      model: "kling-3.0-omni/text-to-video",
      input: { prompt: PROMPT },
    };

    expectRejectedAt(
      KlingOmniTextToVideoRequestSchema,
      {
        ...base,
        input: {
          ...base.input,
          customize_multi_shots: true,
          prefer_multi_shots: true,
          multi_prompt: MULTI_PROMPT,
        },
      },
      "input.prefer_multi_shots"
    );
    expectRejectedAt(
      KlingOmniTextToVideoRequestSchema,
      {
        ...base,
        input: { ...base.input, customize_multi_shots: true },
      },
      "input.multi_prompt"
    );
    expectRejectedAt(
      KlingOmniTextToVideoRequestSchema,
      {
        ...base,
        input: {
          ...base.input,
          customize_multi_shots: false,
          multi_prompt: MULTI_PROMPT,
        },
      },
      "input.multi_prompt"
    );

    expectRejectedAt(
      KlingOmniImageToVideoRequestSchema,
      {
        model: "kling-3.0-omni/image-to-video",
        input: {
          prompt: PROMPT,
          image_urls: [IMAGE_1],
          aspect_ratio: "16:9",
        },
      },
      "input.aspect_ratio"
    );
  });

  it("keeps plain input shapes and applies only unconditional defaults", () => {
    for (const schema of [
      KlingOmniTextToVideoInputSchema,
      KlingOmniImageToVideoInputSchema,
      KlingOmniReferenceToVideoInputSchema,
      KlingOmniTransformationInputSchema,
    ]) {
      expect(schema.shape).toBeDefined();
    }

    const text = KlingOmniTextToVideoInputSchema.parse({
      prompt: PROMPT,
      customize_multi_shots: false,
    });
    expect(text).toMatchObject({
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
    });
    expect(text).not.toHaveProperty("audio");
    expect(text).not.toHaveProperty("customize_multi_shots", true);

    const image = KlingOmniImageToVideoInputSchema.parse({
      prompt: PROMPT,
      image_urls: [IMAGE_1],
    });
    expect(image).toMatchObject({ duration: 5, resolution: "720p" });
    expect(image).not.toHaveProperty("aspect_ratio");
  });

  it("registers discovery metadata and createTask guards for all four ids", () => {
    const models = [
      "kling-3.0-omni/text-to-video",
      "kling-3.0-omni/image-to-video",
      "kling-3.0-omni/reference-to-video",
      "kling-3.0-omni/transformation",
    ] as const;

    for (const model of models) {
      expect(modelInputSchemas[model].type).toBe("video");
      expect(CREATE_TASK_GUARDS[model]).toBeDefined();
    }

    expect(
      modelInputSchemas["kling-3.0-omni/text-to-video"].fields
        .customize_multi_shots.description
    ).toContain("upstream defaults true");
    expect(
      modelInputSchemas["kling-3.0-omni/transformation"].fields.duration.type
    ).toBe("string");
  });
});
