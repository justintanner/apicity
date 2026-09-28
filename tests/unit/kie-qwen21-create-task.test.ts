import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Qwen21TextToImageRequestSchema as RootQwen21TextToImageRequestSchema,
  Qwen21ImageToImageRequestSchema as RootQwen21ImageToImageRequestSchema,
  type Qwen21TextToImageParsedRequest,
  type Qwen21TextToImageRequest,
  type Qwen21TextToImageRequestInput,
  type Qwen21ImageToImageParsedRequest,
  type Qwen21ImageToImageRequest,
  type Qwen21ImageToImageRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  Qwen21TextToImageRequestSchema,
  Qwen21ImageToImageRequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const QWEN21_CONTRACTS = [
  {
    model: "qwen2-1/text-to-image",
    schema: Qwen21TextToImageRequestSchema,
    request: {
      model: "qwen2-1/text-to-image",
      input: {
        prompt:
          "A corgi wearing a yellow rain hat sitting on stone steps after the rain, shallow depth of field",
        aspect_ratio: "16:9",
        resolution: "1K",
        background: "opaque",
        output_format: "png",
        enhance_prompt: true,
        seed: 20260921,
      },
    } satisfies Qwen21TextToImageRequest,
  },
  {
    model: "qwen2-1/image-to-image",
    schema: Qwen21ImageToImageRequestSchema,
    request: {
      model: "qwen2-1/image-to-image",
      input: {
        image_urls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
        prompt:
          "Replace the backpack in the first image with the colour scheme from the second image, and leave everything else unchanged",
        aspect_ratio: "auto",
        resolution: "1K",
      },
    } satisfies Qwen21ImageToImageRequest,
  },
] as const;

const QWEN21_MODELS = QWEN21_CONTRACTS.map(({ model }) => model);

const QWEN21_ALIAS_REJECTS = ["qwen2-1", "qwen2.1/text-to-image"] as const;

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

describe("Kie Qwen 2.1 request contracts", () => {
  it("accepts all documented examples directly, through the guard, and through the aggregate", () => {
    for (const contract of QWEN21_CONTRACTS) {
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

  it("injects the documented defaults for omitted fields", () => {
    const t2i = QWEN21_CONTRACTS[0];
    const t2iParsed = t2i.schema.parse({
      model: t2i.model,
      input: { prompt: "A quiet harbour at first light" },
    });
    expect(t2iParsed.input.aspect_ratio).toBe("1:1");
    expect(t2iParsed.input.resolution).toBe("1K");
    expect(t2iParsed.input.background).toBe("opaque");
    expect(t2iParsed.input.output_format).toBe("png");
    expect(t2iParsed.input.enhance_prompt).toBe(true);
    expect(t2iParsed.input.nsfw_checker).toBe(false);

    const i2i = QWEN21_CONTRACTS[1];
    const i2iParsed = i2i.schema.parse({
      model: i2i.model,
      input: {
        image_urls: i2i.request.input.image_urls,
        prompt: i2i.request.input.prompt,
      },
    });
    expect(i2iParsed.input.aspect_ratio).toBe("auto");
    expect(i2iParsed.input.mask_url).toBeUndefined();
  });

  it.each(QWEN21_ALIAS_REJECTS)(
    "rejects the malformed model id %j",
    (model) => {
      for (const contract of QWEN21_CONTRACTS) {
        const result = contract.schema.safeParse({
          ...contract.request,
          model,
        });
        expect(result.success).toBe(false);
      }
    }
  );

  it("rejects an unknown aspect_ratio, background, and output_format", () => {
    const base = QWEN21_CONTRACTS[0];
    for (const [field, value] of [
      ["aspect_ratio", "5:5"],
      ["background", "blurred"],
      ["output_format", "jpg"],
    ] as const) {
      const result = base.schema.safeParse({
        model: base.model,
        input: { ...base.request.input, [field]: value },
      });
      expect(result.success, `${field}=${value}`).toBe(false);
      expect(issueAt(result, ["input", field])).toBe(true);
    }
  });

  it("rejects 2K-tied invalid resolutions and an overlong prompt", () => {
    const base = QWEN21_CONTRACTS[0];
    const badResolution = base.schema.safeParse({
      model: base.model,
      input: { ...base.request.input, resolution: "4K" },
    });
    expect(badResolution.success).toBe(false);
    expect(issueAt(badResolution, ["input", "resolution"])).toBe(true);

    const overlong = base.schema.safeParse({
      model: base.model,
      input: { prompt: "x".repeat(5001) },
    });
    expect(overlong.success).toBe(false);
    expect(issueAt(overlong, ["input", "prompt"])).toBe(true);
  });

  it("rejects missing, empty, and oversized image_urls for image-to-image", () => {
    const base = QWEN21_CONTRACTS[1];
    const { image_urls: _omit, ...inputWithoutUrls } = base.request.input;
    void _omit;

    const missing = base.schema.safeParse({
      model: base.model,
      input: inputWithoutUrls,
    });
    expect(missing.success).toBe(false);
    expect(issueAt(missing, ["input", "image_urls"])).toBe(true);

    const empty = base.schema.safeParse({
      model: base.model,
      input: { ...inputWithoutUrls, image_urls: [] },
    });
    expect(empty.success).toBe(false);
    expect(issueAt(empty, ["input", "image_urls"])).toBe(true);

    const oversized = base.schema.safeParse({
      model: base.model,
      input: {
        ...inputWithoutUrls,
        image_urls: Array.from(
          { length: 11 },
          (_, i) => `https://example.com/${i}`
        ),
      },
    });
    expect(oversized.success).toBe(false);
    expect(issueAt(oversized, ["input", "image_urls"])).toBe(true);
  });

  it("rejects a mask over more than one reference and with a transparent background", () => {
    const base = QWEN21_CONTRACTS[1];
    const twoReferences = base.schema.safeParse({
      model: base.model,
      input: {
        ...base.request.input,
        mask_url: "https://example.com/mask.png",
      },
    });
    expect(twoReferences.success).toBe(false);
    expect(issueAt(twoReferences, ["input", "mask_url"])).toBe(true);

    const singleReference = {
      model: base.model,
      input: {
        image_urls: ["https://example.com/a.jpg"],
        prompt: base.request.input.prompt,
        mask_url: "https://example.com/mask.png",
        background: "transparent",
      },
    };
    const transparent = base.schema.safeParse(singleReference);
    expect(transparent.success).toBe(false);
    expect(issueAt(transparent, ["input", "background"])).toBe(true);

    const validLocalEdit = base.schema.safeParse({
      ...singleReference,
      input: { ...singleReference.input, background: "opaque" },
    });
    expect(validLocalEdit.success).toBe(true);
  });

  it("rejects an unknown input key (strict input object)", () => {
    const base = QWEN21_CONTRACTS[0];
    const result = base.schema.safeParse({
      model: base.model,
      input: { ...base.request.input, image_size: "16:9" },
    });
    expect(result.success).toBe(false);
  });
});

describe("Kie Qwen 2.1 registries and descriptors", () => {
  it("has exactly the same two ids in the roster, guards, and descriptors", () => {
    const prefix = "qwen2-1/";
    expect(
      KIE_MEDIA_MODELS.filter((model) => model.startsWith(prefix))
    ).toEqual(QWEN21_MODELS);
    expect(
      Object.keys(CREATE_TASK_GUARDS).filter((model) =>
        model.startsWith(prefix)
      )
    ).toEqual(QWEN21_MODELS);
    expect(
      Object.keys(modelInputSchemas).filter((model) => model.startsWith(prefix))
    ).toEqual(QWEN21_MODELS);

    for (const contract of QWEN21_CONTRACTS) {
      expect(CREATE_TASK_GUARDS[contract.model]).toBe(contract.schema);
    }
  });

  it("exposes exact descriptor fields with prompt required and defaults pinned", () => {
    const t2i = modelInputSchemas["qwen2-1/text-to-image"];
    expect(t2i.type).toBe("image");
    expect(t2i.fields.prompt.required).toBe(true);
    expect(t2i.fields.prompt.maxLength).toBe(5000);
    expect(t2i.fields.aspect_ratio.default).toBe("1:1");
    expect(t2i.fields.aspect_ratio.enum).toEqual([
      "1:1",
      "4:3",
      "3:4",
      "3:2",
      "2:3",
      "16:9",
      "9:16",
      "21:9",
      "9:21",
    ]);
    expect(t2i.fields.resolution.default).toBe("1K");
    expect(t2i.fields.background.default).toBe("opaque");
    expect(t2i.fields.output_format.default).toBe("png");
    expect(t2i.fields.enhance_prompt.default).toBe(true);
    expect(t2i.fields.image_urls).toBeUndefined();

    const i2i = modelInputSchemas["qwen2-1/image-to-image"];
    expect(i2i.type).toBe("image");
    expect(i2i.fields.image_urls.required).toBe(true);
    expect(i2i.fields.image_urls.minItems).toBe(1);
    expect(i2i.fields.image_urls.maxItems).toBe(10);
    expect(i2i.fields.aspect_ratio.default).toBe("auto");
    expect(i2i.fields.aspect_ratio.enum).toEqual([
      "auto",
      "1:1",
      "4:3",
      "3:4",
      "3:2",
      "2:3",
      "16:9",
      "9:16",
      "21:9",
      "9:21",
    ]);
    expect(i2i.fields.mask_url.required).toBeUndefined();
  });
});

describe("Kie Qwen 2.1 public exports", () => {
  it("keeps root schema values identical to the zod subpath", () => {
    expect(RootQwen21TextToImageRequestSchema).toBe(
      Qwen21TextToImageRequestSchema
    );
    expect(RootQwen21ImageToImageRequestSchema).toBe(
      Qwen21ImageToImageRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and model literals", () => {
    expectTypeOf<Qwen21TextToImageRequestInput>().toEqualTypeOf<Qwen21TextToImageRequest>();
    expectTypeOf<Qwen21ImageToImageRequestInput>().toEqualTypeOf<Qwen21ImageToImageRequest>();
    expectTypeOf(
      Qwen21TextToImageRequestSchema.parse(QWEN21_CONTRACTS[0].request)
    ).toEqualTypeOf<Qwen21TextToImageParsedRequest>();
    expectTypeOf(
      Qwen21ImageToImageRequestSchema.parse(QWEN21_CONTRACTS[1].request)
    ).toEqualTypeOf<Qwen21ImageToImageParsedRequest>();
    expectTypeOf<
      Qwen21TextToImageRequest["model"]
    >().toEqualTypeOf<"qwen2-1/text-to-image">();
    expectTypeOf<
      Qwen21ImageToImageRequest["model"]
    >().toEqualTypeOf<"qwen2-1/image-to-image">();
  });
});
