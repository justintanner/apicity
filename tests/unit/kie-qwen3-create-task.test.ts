import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Qwen3ImageToImageRequestSchema as RootQwen3ImageToImageRequestSchema,
  Qwen3ProImageToImageRequestSchema as RootQwen3ProImageToImageRequestSchema,
  Qwen3ProTextToImageRequestSchema as RootQwen3ProTextToImageRequestSchema,
  Qwen3TextToImageRequestSchema as RootQwen3TextToImageRequestSchema,
  type Qwen3ImageToImageParsedRequest,
  type Qwen3ImageToImageRequest,
  type Qwen3ImageToImageRequestInput,
  type Qwen3ProImageToImageParsedRequest,
  type Qwen3ProImageToImageRequest,
  type Qwen3ProImageToImageRequestInput,
  type Qwen3ProTextToImageParsedRequest,
  type Qwen3ProTextToImageRequest,
  type Qwen3ProTextToImageRequestInput,
  type Qwen3TextToImageParsedRequest,
  type Qwen3TextToImageRequest,
  type Qwen3TextToImageRequestInput,
} from "@apicity/kie";
import {
  MediaGenerationRequestSchema,
  Qwen3ImageToImageRequestSchema,
  Qwen3ProImageToImageRequestSchema,
  Qwen3ProTextToImageRequestSchema,
  Qwen3TextToImageRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const QWEN3_IMAGE_URLS = [
  "https://example.com/source-one.png",
  "https://example.com/source-two.png",
] as const;

const QWEN3_CONTRACTS = [
  {
    model: "qwen3/text-to-image",
    schema: Qwen3TextToImageRequestSchema,
    imageToImage: false,
    request: {
      model: "qwen3/text-to-image",
      input: { prompt: "A paper city at sunrise" },
    } satisfies Qwen3TextToImageRequest,
  },
  {
    model: "qwen3/image-to-image",
    schema: Qwen3ImageToImageRequestSchema,
    imageToImage: true,
    request: {
      model: "qwen3/image-to-image",
      input: {
        prompt: "Turn this sketch into a painted scene",
        image_urls: [QWEN3_IMAGE_URLS[0]],
      },
    } satisfies Qwen3ImageToImageRequest,
  },
  {
    model: "qwen3/pro-text-to-image",
    schema: Qwen3ProTextToImageRequestSchema,
    imageToImage: false,
    request: {
      model: "qwen3/pro-text-to-image",
      input: { prompt: "A paper city at sunrise" },
    } satisfies Qwen3ProTextToImageRequest,
  },
  {
    model: "qwen3/pro-image-to-image",
    schema: Qwen3ProImageToImageRequestSchema,
    imageToImage: true,
    request: {
      model: "qwen3/pro-image-to-image",
      input: {
        prompt: "Turn this sketch into a painted scene",
        image_urls: [QWEN3_IMAGE_URLS[0]],
      },
    } satisfies Qwen3ProImageToImageRequest,
  },
] as const;

const QWEN3_MODELS = QWEN3_CONTRACTS.map(({ model }) => model);
const TEXT_TO_IMAGE_MODELS = [
  "qwen3/text-to-image",
  "qwen3/pro-text-to-image",
] as const;
const IMAGE_TO_IMAGE_MODELS = [
  "qwen3/image-to-image",
  "qwen3/pro-image-to-image",
] as const;

function issueAt(
  result: { success: boolean; error?: { issues: unknown[] } },
  path: string[]
) {
  if (result.success || !result.error) return false;
  return result.error.issues.some((issue) => {
    if (typeof issue !== "object" || issue === null || !("path" in issue)) {
      return false;
    }
    const issuePath = issue.path;
    return Array.isArray(issuePath) && issuePath.join(".") === path.join(".");
  });
}

describe("Kie Qwen Image 3 request contracts", () => {
  it("accepts every minimal request directly and through the aggregate", () => {
    for (const contract of QWEN3_CONTRACTS) {
      expect(contract.schema.safeParse(contract.request).success).toBe(true);
      expect(
        MediaGenerationRequestSchema.safeParse(contract.request).success
      ).toBe(true);
    }
  });

  it("applies the documented defaults by operation", () => {
    for (const contract of QWEN3_CONTRACTS) {
      const parsed = contract.schema.safeParse(contract.request);
      expect(parsed.success).toBe(true);
      if (!parsed.success) continue;

      expect(parsed.data.input).toMatchObject({
        image_size: "16:9",
        output_format: "png",
        prompt_extend: true,
        nsfw_checker: false,
        seed: 1,
      });
      expect(parsed.data.input).not.toHaveProperty("negative_prompt");
      if (contract.imageToImage) {
        expect(parsed.data.input).toHaveProperty("resolution", "1K");
      } else {
        expect(parsed.data.input).not.toHaveProperty("resolution");
      }
    }
  });

  it("preserves explicit enums, booleans, negative prompts, and seed bounds", () => {
    for (const contract of QWEN3_CONTRACTS) {
      const input = {
        ...contract.request.input,
        image_size: "21:9",
        output_format: "jpeg",
        prompt_extend: false,
        nsfw_checker: true,
        negative_prompt: "no visible text",
        seed: 2147483647,
        resolution: "2K",
        ...(contract.imageToImage ? { image_urls: [...QWEN3_IMAGE_URLS] } : {}),
      };
      const parsed = contract.schema.safeParse({
        model: contract.model,
        input,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) continue;
      expect(parsed.data.input).toMatchObject({
        image_size: "21:9",
        output_format: "jpeg",
        prompt_extend: false,
        nsfw_checker: true,
        negative_prompt: "no visible text",
        seed: 2147483647,
        resolution: "2K",
      });
    }
  });

  it("accepts three image URLs and preserves their order", () => {
    const imageUrls = [
      "https://example.com/source-one.png",
      "https://example.com/source-two.png",
      "https://example.com/source-three.png",
    ];

    for (const contract of QWEN3_CONTRACTS.filter(
      ({ imageToImage }) => imageToImage
    )) {
      const result = contract.schema.safeParse({
        ...contract.request,
        input: { ...contract.request.input, image_urls: imageUrls },
      });

      expect(result.success).toBe(true);
      if (!result.success) continue;
      expect(result.data.input).toMatchObject({ image_urls: imageUrls });
    }
  });

  it("rejects prompt, callback, enum, seed, URL, and cardinality violations", () => {
    for (const contract of QWEN3_CONTRACTS) {
      const baseInput = { ...contract.request.input } as Record<
        string,
        unknown
      >;
      const cases = [
        {
          name: "missing prompt",
          value: (() => {
            const input = { ...baseInput };
            delete input.prompt;
            return input;
          })(),
          path: ["input", "prompt"],
        },
        {
          name: "overlong prompt",
          value: { ...baseInput, prompt: "x".repeat(5001) },
          path: ["input", "prompt"],
        },
        {
          name: "overlong negative prompt",
          value: { ...baseInput, negative_prompt: "x".repeat(5001) },
          path: ["input", "negative_prompt"],
        },
        {
          name: "bad image size",
          value: { ...baseInput, image_size: "2:2" },
          path: ["input", "image_size"],
        },
        {
          name: "bad output format",
          value: { ...baseInput, output_format: "webp" },
          path: ["input", "output_format"],
        },
        {
          name: "bad resolution",
          value: { ...baseInput, resolution: "4K" },
          path: ["input", "resolution"],
        },
        {
          name: "fractional seed",
          value: { ...baseInput, seed: 1.5 },
          path: ["input", "seed"],
        },
        {
          name: "negative seed",
          value: { ...baseInput, seed: -1 },
          path: ["input", "seed"],
        },
        {
          name: "seed above maximum",
          value: { ...baseInput, seed: 2147483648 },
          path: ["input", "seed"],
        },
      ] as const;

      for (const invalid of cases) {
        const result = contract.schema.safeParse({
          model: contract.model,
          input: invalid.value,
        });
        expect(result.success, `${contract.model}: ${invalid.name}`).toBe(
          false
        );
        expect(
          issueAt(result, [...invalid.path]),
          `${contract.model}: ${invalid.name}`
        ).toBe(true);
      }

      const invalidCallback = contract.schema.safeParse({
        ...contract.request,
        callBackUrl: "not-a-url",
      });
      expect(invalidCallback.success).toBe(false);
      expect(issueAt(invalidCallback, ["callBackUrl"])).toBe(true);
    }

    for (const contract of QWEN3_CONTRACTS.filter(
      ({ imageToImage }) => imageToImage
    )) {
      const baseInput = { ...contract.request.input } as Record<
        string,
        unknown
      >;
      const imageCases = [
        {
          name: "malformed URL",
          image_urls: ["not-a-url"],
          path: ["input", "image_urls", "0"],
        },
        {
          name: "zero URLs",
          image_urls: [],
          path: ["input", "image_urls"],
        },
        {
          name: "four URLs",
          image_urls: [
            "https://example.com/1.png",
            "https://example.com/2.png",
            "https://example.com/3.png",
            "https://example.com/4.png",
          ],
          path: ["input", "image_urls"],
        },
      ] as const;
      for (const invalid of imageCases) {
        const result = contract.schema.safeParse({
          model: contract.model,
          input: { ...baseInput, image_urls: invalid.image_urls },
        });
        expect(result.success, `${contract.model}: ${invalid.name}`).toBe(
          false
        );
        expect(issueAt(result, [...invalid.path])).toBe(true);
      }
    }
  });

  it("keeps the four input objects strict and operation-specific", () => {
    const legacyFields = [
      ["image_url", "https://example.com/legacy.png"],
      ["strength", 0.5],
      ["acceleration", "none"],
      ["num_inference_steps", 30],
      ["guidance_scale", 2.5],
      ["enable_safety_checker", true],
      ["num_images", 1],
    ] as const;

    for (const contract of QWEN3_CONTRACTS) {
      const baseInput = { ...contract.request.input } as Record<
        string,
        unknown
      >;
      for (const [field, value] of legacyFields) {
        const result = contract.schema.safeParse({
          model: contract.model,
          input: { ...baseInput, [field]: value },
        });
        expect(result.success, `${contract.model}: legacy ${field}`).toBe(
          false
        );
      }
    }

    for (const contract of QWEN3_CONTRACTS.filter(
      ({ imageToImage }) => !imageToImage
    )) {
      const result = contract.schema.safeParse({
        ...contract.request,
        input: {
          ...contract.request.input,
          image_urls: ["https://example.com/not-allowed.png"],
        },
      });
      expect(result.success).toBe(false);
    }

    for (const contract of QWEN3_CONTRACTS.filter(
      ({ imageToImage }) => imageToImage
    )) {
      const input = { ...contract.request.input } as Record<string, unknown>;
      delete input.image_urls;
      const result = contract.schema.safeParse({
        model: contract.model,
        input,
      });
      expect(result.success).toBe(false);
      expect(issueAt(result, ["input", "image_urls"])).toBe(true);
    }
  });
});

describe("Kie Qwen Image 3 registry and descriptors", () => {
  it("binds every exact model to its exact request schema", () => {
    for (const contract of QWEN3_CONTRACTS) {
      expect(CREATE_TASK_GUARDS[contract.model]).toBe(contract.schema);
    }
  });

  it("exposes exact descriptor fields and constraints", () => {
    const expectedImageSize = [
      "1:1",
      "3:2",
      "2:3",
      "4:3",
      "3:4",
      "16:9",
      "9:16",
      "21:9",
    ];
    const expectedFields = [
      "image_size",
      "negative_prompt",
      "nsfw_checker",
      "output_format",
      "prompt",
      "prompt_extend",
      "resolution",
      "seed",
    ];

    for (const model of QWEN3_MODELS) {
      const descriptor = modelInputSchemas[model];
      expect(descriptor.type).toBe("image");
      const fields = descriptor.fields;
      const imageToImage = IMAGE_TO_IMAGE_MODELS.includes(
        model as (typeof IMAGE_TO_IMAGE_MODELS)[number]
      );
      expect(Object.keys(fields).sort()).toEqual(
        imageToImage ? [...expectedFields, "image_urls"].sort() : expectedFields
      );
      expect(fields.prompt).toMatchObject({
        type: "string",
        required: true,
        maxLength: 5000,
      });
      expect(fields.image_size).toMatchObject({
        type: "string",
        enum: expectedImageSize,
        default: "16:9",
      });
      expect(fields.output_format).toMatchObject({
        type: "string",
        enum: ["png", "jpeg"],
        default: "png",
      });
      expect(fields.prompt_extend).toMatchObject({
        type: "boolean",
        default: true,
      });
      expect(fields.nsfw_checker).toMatchObject({
        type: "boolean",
        default: false,
      });
      expect(fields.negative_prompt).toMatchObject({
        type: "string",
        maxLength: 5000,
      });
      expect(fields.seed).toMatchObject({
        type: "integer",
        minimum: 0,
        maximum: 2147483647,
        default: 1,
      });
      expect(fields.resolution).toMatchObject({
        type: "string",
        enum: ["1K", "2K"],
      });
      expect(fields.resolution.default).toBe(imageToImage ? "1K" : undefined);

      if (imageToImage) {
        expect(fields.image_urls).toMatchObject({
          type: "array",
          required: true,
          minItems: 1,
          maxItems: 3,
          items: { type: "string" },
        });
      } else {
        expect(fields.image_urls).toBeUndefined();
      }
    }
  });

  it("keeps standard and Pro descriptors equal within each operation", () => {
    expect(modelInputSchemas[TEXT_TO_IMAGE_MODELS[0]].fields).toEqual(
      modelInputSchemas[TEXT_TO_IMAGE_MODELS[1]].fields
    );
    expect(modelInputSchemas[IMAGE_TO_IMAGE_MODELS[0]].fields).toEqual(
      modelInputSchemas[IMAGE_TO_IMAGE_MODELS[1]].fields
    );
    expect(
      modelInputSchemas[TEXT_TO_IMAGE_MODELS[0]].fields.image_urls
    ).toBeUndefined();
    expect(
      modelInputSchemas[IMAGE_TO_IMAGE_MODELS[0]].fields.image_urls
    ).toBeDefined();
    expect(
      modelInputSchemas[TEXT_TO_IMAGE_MODELS[0]].fields.resolution.default
    ).toBeUndefined();
    expect(
      modelInputSchemas[IMAGE_TO_IMAGE_MODELS[0]].fields.resolution.default
    ).toBe("1K");
  });
});

describe("Kie Qwen Image 3 public exports", () => {
  it("keeps root schema values identical to the zod subpath", () => {
    expect(RootQwen3TextToImageRequestSchema).toBe(
      Qwen3TextToImageRequestSchema
    );
    expect(RootQwen3ImageToImageRequestSchema).toBe(
      Qwen3ImageToImageRequestSchema
    );
    expect(RootQwen3ProTextToImageRequestSchema).toBe(
      Qwen3ProTextToImageRequestSchema
    );
    expect(RootQwen3ProImageToImageRequestSchema).toBe(
      Qwen3ProImageToImageRequestSchema
    );
  });

  it("preserves the literal request types and parsed defaults", () => {
    expectTypeOf<Qwen3TextToImageRequestInput>().toEqualTypeOf<Qwen3TextToImageRequest>();
    expectTypeOf<Qwen3ImageToImageRequestInput>().toEqualTypeOf<Qwen3ImageToImageRequest>();
    expectTypeOf<Qwen3ProTextToImageRequestInput>().toEqualTypeOf<Qwen3ProTextToImageRequest>();
    expectTypeOf<Qwen3ProImageToImageRequestInput>().toEqualTypeOf<Qwen3ProImageToImageRequest>();
    expectTypeOf<
      Qwen3TextToImageRequest["model"]
    >().toEqualTypeOf<"qwen3/text-to-image">();
    expectTypeOf<
      Qwen3ImageToImageRequest["model"]
    >().toEqualTypeOf<"qwen3/image-to-image">();
    expectTypeOf<
      Qwen3ProTextToImageRequest["model"]
    >().toEqualTypeOf<"qwen3/pro-text-to-image">();
    expectTypeOf<
      Qwen3ProImageToImageRequest["model"]
    >().toEqualTypeOf<"qwen3/pro-image-to-image">();
    expectTypeOf<
      Qwen3TextToImageParsedRequest["input"]["resolution"]
    >().toEqualTypeOf<"1K" | "2K" | undefined>();
    expectTypeOf<
      Qwen3ImageToImageParsedRequest["input"]["resolution"]
    >().toEqualTypeOf<"1K" | "2K">();
    expectTypeOf<
      Qwen3ProTextToImageParsedRequest["input"]["resolution"]
    >().toEqualTypeOf<"1K" | "2K" | undefined>();
    expectTypeOf<
      Qwen3ProImageToImageParsedRequest["input"]["resolution"]
    >().toEqualTypeOf<"1K" | "2K">();
  });
});
