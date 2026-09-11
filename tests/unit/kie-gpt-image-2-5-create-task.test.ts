import { describe, expect, expectTypeOf, it } from "vitest";

import {
  GptImage25FlareTextToImageRequestSchema as RootGptImage25FlareTextToImageRequestSchema,
  GptImage25FlareImageToImageRequestSchema as RootGptImage25FlareImageToImageRequestSchema,
  GptImage25SunburstTextToImageRequestSchema as RootGptImage25SunburstTextToImageRequestSchema,
  GptImage25SunburstImageToImageRequestSchema as RootGptImage25SunburstImageToImageRequestSchema,
  type GptImage25FlareTextToImageParsedRequest,
  type GptImage25FlareTextToImageRequest,
  type GptImage25FlareTextToImageRequestInput,
  type GptImage25FlareImageToImageParsedRequest,
  type GptImage25FlareImageToImageRequest,
  type GptImage25FlareImageToImageRequestInput,
  type GptImage25SunburstTextToImageParsedRequest,
  type GptImage25SunburstTextToImageRequest,
  type GptImage25SunburstTextToImageRequestInput,
  type GptImage25SunburstImageToImageParsedRequest,
  type GptImage25SunburstImageToImageRequest,
  type GptImage25SunburstImageToImageRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  GptImage25FlareTextToImageRequestSchema,
  GptImage25FlareImageToImageRequestSchema,
  GptImage25SunburstTextToImageRequestSchema,
  GptImage25SunburstImageToImageRequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const GPT_IMAGE_25_CONTRACTS = [
  {
    model: "gpt-image-2-5-flare-image-to-image",
    schema: GptImage25FlareImageToImageRequestSchema,
    request: {
      model: "gpt-image-2-5-flare-image-to-image",
      input: {
        prompt: "Add a red bow tie to the subject.",
        input_urls: ["https://example.com/"],
        aspect_ratio: "auto",
        resolution: "4K",
        background: "transparent",
      },
    } satisfies GptImage25FlareImageToImageRequest,
  },
  {
    model: "gpt-image-2-5-flare-text-to-image",
    schema: GptImage25FlareTextToImageRequestSchema,
    request: {
      model: "gpt-image-2-5-flare-text-to-image",
      input: {
        prompt:
          "A cinematic night city poster with neon reflections on a rainy street.",
        aspect_ratio: "3:2",
        resolution: "1K",
        background: "transparent",
      },
    } satisfies GptImage25FlareTextToImageRequest,
  },
  {
    model: "gpt-image-2-5-sunburst-image-to-image",
    schema: GptImage25SunburstImageToImageRequestSchema,
    request: {
      model: "gpt-image-2-5-sunburst-image-to-image",
      input: {
        prompt: "Add a red bow tie to the subject.",
        input_urls: ["https://example.com/"],
        aspect_ratio: "auto",
        resolution: "4K",
        background: "opaque",
      },
    } satisfies GptImage25SunburstImageToImageRequest,
  },
  {
    model: "gpt-image-2-5-sunburst-text-to-image",
    schema: GptImage25SunburstTextToImageRequestSchema,
    request: {
      model: "gpt-image-2-5-sunburst-text-to-image",
      input: {
        prompt: "A sunburst poster with warm golden rays over a skyline.",
        aspect_ratio: "4:3",
        resolution: "2K",
        background: "opaque",
      },
    } satisfies GptImage25SunburstTextToImageRequest,
  },
] as const;

const GPT_IMAGE_25_MODELS = GPT_IMAGE_25_CONTRACTS.map(({ model }) => model);

const GPT_IMAGE_25_ALIAS_REJECTS = [
  "gpt-image-2-5",
  "gpt-image-2-5-flare",
  "gpt-image-x-flare-text-to-image",
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

describe("Kie GPT Image 2.5 request contracts", () => {
  it("accepts all documented examples directly, through the guard, and through the aggregate", () => {
    for (const contract of GPT_IMAGE_25_CONTRACTS) {
      expect(contract.schema.safeParse(contract.request).success).toBe(true);
      expect(
        CREATE_TASK_GUARDS[contract.model].safeParse(contract.request).success
      ).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(contract.request).success).toBe(
        true
      );
      expect(
        MediaGenerationRequestSchema.safeParse(contract.request).success
      ).toBe(true);
    }
  });

  it("injects the 1K resolution default when resolution is omitted", () => {
    for (const contract of GPT_IMAGE_25_CONTRACTS) {
      const { resolution: _omit, ...inputWithoutResolution } = contract.request
        .input as Record<string, unknown>;
      void _omit;
      const request = { model: contract.model, input: inputWithoutResolution };

      const viaContract = contract.schema.parse(request);
      expect(viaContract.input.resolution, contract.model).toBe("1K");

      const viaGuard = CREATE_TASK_GUARDS[contract.model].parse(request);
      expect(
        (viaGuard as { input: { resolution?: string } }).input.resolution,
        contract.model
      ).toBe("1K");

      const viaAggregate = CreateTaskRequestSchema.parse(request);
      expect(
        (viaAggregate as { input: { resolution?: string } }).input.resolution,
        contract.model
      ).toBe("1K");
    }
  });

  it.each(GPT_IMAGE_25_ALIAS_REJECTS)(
    "rejects the truncated alias %j",
    (model) => {
      for (const contract of GPT_IMAGE_25_CONTRACTS) {
        const result = contract.schema.safeParse({
          ...contract.request,
          model,
        });
        expect(result.success).toBe(false);
      }
    }
  );

  it("rejects an unknown aspect_ratio", () => {
    const base = GPT_IMAGE_25_CONTRACTS[1];
    const result = base.schema.safeParse({
      model: base.model,
      input: { ...base.request.input, aspect_ratio: "5:5" },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "aspect_ratio"])).toBe(true);
  });

  it('rejects background "blurred"', () => {
    const base = GPT_IMAGE_25_CONTRACTS[1];
    const result = base.schema.safeParse({
      model: base.model,
      input: { ...base.request.input, background: "blurred" },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "background"])).toBe(true);
  });

  it("accepts every documented background value", () => {
    const base = GPT_IMAGE_25_CONTRACTS[1];
    for (const background of ["transparent", "opaque", "auto"] as const) {
      const result = base.schema.safeParse({
        model: base.model,
        input: { ...base.request.input, background },
      });
      expect(result.success, background).toBe(true);
    }
  });

  it("rejects 2K/4K for the four 1K-only aspect ratios, and accepts 1K or an omitted resolution", () => {
    const base = GPT_IMAGE_25_CONTRACTS[1];
    for (const aspect_ratio of ["27:16", "16:27", "9:8", "8:9"] as const) {
      const rejected = base.schema.safeParse({
        model: base.model,
        input: { ...base.request.input, aspect_ratio, resolution: "2K" },
      });
      expect(rejected.success, aspect_ratio).toBe(false);
      expect(issueAt(rejected, ["input", "resolution"])).toBe(true);

      const acceptedWith1K = base.schema.safeParse({
        model: base.model,
        input: { ...base.request.input, aspect_ratio, resolution: "1K" },
      });
      expect(acceptedWith1K.success, aspect_ratio).toBe(true);

      const acceptedBare = base.schema.safeParse({
        model: base.model,
        input: {
          prompt: base.request.input.prompt,
          aspect_ratio,
        },
      });
      expect(acceptedBare.success, aspect_ratio).toBe(true);
    }
  });

  it("rejects missing, empty, and oversized input_urls for the image-to-image ids", () => {
    for (const contract of GPT_IMAGE_25_CONTRACTS.filter((c) =>
      c.model.endsWith("image-to-image")
    )) {
      const { input_urls: _omit, ...inputWithoutUrls } = contract.request
        .input as Record<string, unknown>;
      void _omit;

      const missing = contract.schema.safeParse({
        model: contract.model,
        input: inputWithoutUrls,
      });
      expect(missing.success, contract.model).toBe(false);
      expect(issueAt(missing, ["input", "input_urls"])).toBe(true);

      const empty = contract.schema.safeParse({
        model: contract.model,
        input: { ...inputWithoutUrls, input_urls: [] },
      });
      expect(empty.success, contract.model).toBe(false);
      expect(issueAt(empty, ["input", "input_urls"])).toBe(true);

      const oversized = contract.schema.safeParse({
        model: contract.model,
        input: {
          ...inputWithoutUrls,
          input_urls: Array.from(
            { length: 17 },
            (_, i) => `https://example.com/${i}`
          ),
        },
      });
      expect(oversized.success, contract.model).toBe(false);
      expect(issueAt(oversized, ["input", "input_urls"])).toBe(true);
    }
  });

  it("rejects an empty prompt for every id", () => {
    for (const contract of GPT_IMAGE_25_CONTRACTS) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { ...contract.request.input, prompt: "" },
      });
      expect(result.success, contract.model).toBe(false);
      expect(issueAt(result, ["input", "prompt"])).toBe(true);
    }
  });
});

describe("Kie GPT Image 2.5 registries and descriptors", () => {
  it("has exactly the same four ids in the roster, guards, and descriptors", () => {
    const prefix = "gpt-image-2-5-";
    expect(
      KIE_MEDIA_MODELS.filter((model) => model.startsWith(prefix))
    ).toEqual(GPT_IMAGE_25_MODELS);
    expect(
      Object.keys(CREATE_TASK_GUARDS).filter((model) =>
        model.startsWith(prefix)
      )
    ).toEqual(GPT_IMAGE_25_MODELS);
    expect(
      Object.keys(modelInputSchemas).filter((model) => model.startsWith(prefix))
    ).toEqual(GPT_IMAGE_25_MODELS);

    for (const contract of GPT_IMAGE_25_CONTRACTS) {
      expect(CREATE_TASK_GUARDS[contract.model]).toBe(contract.schema);
    }
  });

  it("exposes exact descriptor fields with prompt and input_urls required and resolution defaulting to 1K", () => {
    for (const contract of GPT_IMAGE_25_CONTRACTS) {
      const descriptor = modelInputSchemas[contract.model];
      expect(descriptor.type, contract.model).toBe("image");
      expect(descriptor.fields.prompt.required, contract.model).toBe(true);
      expect(descriptor.fields.resolution.default, contract.model).toBe("1K");
      if (contract.model.endsWith("image-to-image")) {
        expect(descriptor.fields.input_urls.required, contract.model).toBe(
          true
        );
      } else {
        expect(descriptor.fields.input_urls, contract.model).toBeUndefined();
      }
    }
  });
});

describe("Kie GPT Image 2.5 public exports", () => {
  it("keeps root schema values identical to the zod subpath", () => {
    expect(RootGptImage25FlareTextToImageRequestSchema).toBe(
      GptImage25FlareTextToImageRequestSchema
    );
    expect(RootGptImage25FlareImageToImageRequestSchema).toBe(
      GptImage25FlareImageToImageRequestSchema
    );
    expect(RootGptImage25SunburstTextToImageRequestSchema).toBe(
      GptImage25SunburstTextToImageRequestSchema
    );
    expect(RootGptImage25SunburstImageToImageRequestSchema).toBe(
      GptImage25SunburstImageToImageRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and model literals", () => {
    expectTypeOf<GptImage25FlareTextToImageRequestInput>().toEqualTypeOf<GptImage25FlareTextToImageRequest>();
    expectTypeOf<GptImage25FlareImageToImageRequestInput>().toEqualTypeOf<GptImage25FlareImageToImageRequest>();
    expectTypeOf<GptImage25SunburstTextToImageRequestInput>().toEqualTypeOf<GptImage25SunburstTextToImageRequest>();
    expectTypeOf<GptImage25SunburstImageToImageRequestInput>().toEqualTypeOf<GptImage25SunburstImageToImageRequest>();
    expectTypeOf(
      GptImage25FlareImageToImageRequestSchema.parse(
        GPT_IMAGE_25_CONTRACTS[0].request
      )
    ).toEqualTypeOf<GptImage25FlareImageToImageParsedRequest>();
    expectTypeOf(
      GptImage25FlareTextToImageRequestSchema.parse(
        GPT_IMAGE_25_CONTRACTS[1].request
      )
    ).toEqualTypeOf<GptImage25FlareTextToImageParsedRequest>();
    expectTypeOf(
      GptImage25SunburstImageToImageRequestSchema.parse(
        GPT_IMAGE_25_CONTRACTS[2].request
      )
    ).toEqualTypeOf<GptImage25SunburstImageToImageParsedRequest>();
    expectTypeOf(
      GptImage25SunburstTextToImageRequestSchema.parse(
        GPT_IMAGE_25_CONTRACTS[3].request
      )
    ).toEqualTypeOf<GptImage25SunburstTextToImageParsedRequest>();
    expectTypeOf<
      GptImage25FlareTextToImageRequest["model"]
    >().toEqualTypeOf<"gpt-image-2-5-flare-text-to-image">();
    expectTypeOf<
      GptImage25SunburstTextToImageRequest["model"]
    >().toEqualTypeOf<"gpt-image-2-5-sunburst-text-to-image">();
    expectTypeOf<
      GptImage25FlareImageToImageRequest["model"]
    >().toEqualTypeOf<"gpt-image-2-5-flare-image-to-image">();
    expectTypeOf<
      GptImage25SunburstImageToImageRequest["model"]
    >().toEqualTypeOf<"gpt-image-2-5-sunburst-image-to-image">();
  });
});
