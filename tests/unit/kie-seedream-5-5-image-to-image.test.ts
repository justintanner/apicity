import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Seedream55BackgroundSchema as RootSeedream55BackgroundSchema,
  Seedream55ImageToImageRequestSchema as RootSeedream55ImageToImageRequestSchema,
  Seedream55OutputFormatSchema as RootSeedream55OutputFormatSchema,
  Seedream55SizeSchema as RootSeedream55SizeSchema,
  type Seedream55ImageToImageParsedRequest,
  type Seedream55ImageToImageRequest,
  type Seedream55ImageToImageRequestInput,
  type Seedream55Size,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
  Seedream55BackgroundSchema,
  Seedream55ImageToImageRequestSchema,
  Seedream55OutputFormatSchema,
  Seedream55SizeSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "seedream/5-5-image-to-image" as const;

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      "Keep the model's pose and the flowing shape of the liquid dress unchanged. Change the clothing material from silver metal to completely transparent clear water (or glass).",
    image_urls: [
      "https://static.aiquickdraw.com/tools/example/1764851484363_ScV1s2aq.webp",
    ],
    aspect_ratio: "1:1",
    size: "2K",
    output_format: "png",
    background: "auto",
    nsfw_checker: false,
  },
} satisfies Seedream55ImageToImageRequest;

const IMAGE = "https://example.com/a.png";

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

function parseInput(input: Record<string, unknown>) {
  return Seedream55ImageToImageRequestSchema.safeParse({ model: MODEL, input });
}

describe("Kie Seedream 5.5 image-to-image request contract", () => {
  it("accepts the documented example directly, through the guard, and through the aggregates", () => {
    expect(
      Seedream55ImageToImageRequestSchema.safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
    expect(
      CREATE_TASK_GUARDS[MODEL].safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(DOCUMENTED_REQUEST).success).toBe(
      true
    );
    expect(
      MediaGenerationRequestSchema.safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
  });

  it("injects the documented defaults", () => {
    const parsed = Seedream55ImageToImageRequestSchema.parse({
      model: MODEL,
      input: { prompt: "Make it blue", image_urls: [IMAGE] },
    });
    expect(parsed.input).toEqual({
      prompt: "Make it blue",
      image_urls: [IMAGE],
      aspect_ratio: "auto",
      size: "2K",
      output_format: "png",
      background: "auto",
      nsfw_checker: false,
    });
  });

  it("bounds the prompt to 5-5000 characters and image_urls to 1-10 URLs", () => {
    for (const prompt of ["Blue!", "x".repeat(5000)]) {
      expect(parseInput({ prompt, image_urls: [IMAGE] }).success).toBe(true);
    }
    for (const prompt of ["blue", "x".repeat(5001)]) {
      const result = parseInput({ prompt, image_urls: [IMAGE] });
      expect(result.success, String(prompt.length)).toBe(false);
      expect(issueAt(result, ["input", "prompt"])).toBe(true);
    }
    const urls = (count: number) =>
      Array.from({ length: count }, (_, i) => `https://example.com/${i}.png`);
    expect(
      parseInput({ prompt: "Make it blue", image_urls: urls(10) }).success
    ).toBe(true);
    for (const image_urls of [undefined, [], urls(11), ["not a url"]]) {
      const result = parseInput({ prompt: "Make it blue", image_urls });
      expect(result.success, JSON.stringify(image_urls)).toBe(false);
      expect(
        result.error?.issues.some(
          (issue) => issue.path.slice(0, 2).join(".") === "input.image_urls"
        )
      ).toBe(true);
    }
  });

  it("rejects values outside the documented enums", () => {
    for (const [field, value] of [
      ["size", "4K"],
      ["aspect_ratio", "5:4"],
      ["output_format", "webp"],
      ["background", "blurred"],
    ] as const) {
      const result = parseInput({
        prompt: "Make it blue",
        image_urls: [IMAGE],
        [field]: value,
      });
      expect(result.success, field).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
  });

  it("allows a transparent background only with png output", () => {
    expect(
      parseInput({
        prompt: "Make it blue",
        image_urls: [IMAGE],
        background: "transparent",
      }).success
    ).toBe(true);
    const jpeg = parseInput({
      prompt: "Make it blue",
      image_urls: [IMAGE],
      background: "transparent",
      output_format: "jpeg",
    });
    expect(jpeg.success).toBe(false);
    expect(issueAt(jpeg, ["input", "background"])).toBe(true);
  });
});

describe("Kie Seedream 5.5 model ids", () => {
  it("lists the id and reads kie's dashed minor version as a Seedream version", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    for (const model of [
      MODEL,
      "seedream/5-5-text-to-image",
      "seedream/5-6-pro-text-to-image",
      "seedream/5-pro-image-to-image",
      "seedream/4.5-edit",
    ]) {
      expect(KieMediaModelSchema.safeParse(model).success, model).toBe(true);
    }
    for (const model of ["seedream/5-5", "seedream/5--5-edit", "seedream/5"]) {
      expect(KieMediaModelSchema.safeParse(model).success, model).toBe(false);
    }
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(Seedream55ImageToImageRequestSchema);
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "image_urls",
      "aspect_ratio",
      "size",
      "output_format",
      "background",
      "nsfw_checker",
    ]);
    expect(descriptor.fields.prompt.required).toBe(true);
    expect(descriptor.fields.image_urls.required).toBe(true);
    expect(descriptor.fields.image_urls.maxItems).toBe(10);
    expect(descriptor.fields.size.enum).toEqual(["1K", "1.5K", "2K"]);
    expect(descriptor.fields.size.default).toBe("2K");
    expect(descriptor.fields.aspect_ratio.default).toBe("auto");
  });
});

describe("Kie Seedream 5.5 public exports", () => {
  it("keeps root schema values identical to the zod subpath", () => {
    expect(RootSeedream55ImageToImageRequestSchema).toBe(
      Seedream55ImageToImageRequestSchema
    );
    expect(RootSeedream55SizeSchema).toBe(Seedream55SizeSchema);
    expect(RootSeedream55OutputFormatSchema).toBe(Seedream55OutputFormatSchema);
    expect(RootSeedream55BackgroundSchema).toBe(Seedream55BackgroundSchema);
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<Seedream55ImageToImageRequestInput>().toEqualTypeOf<Seedream55ImageToImageRequest>();
    expectTypeOf(
      Seedream55ImageToImageRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<Seedream55ImageToImageParsedRequest>();
    expectTypeOf<
      Seedream55ImageToImageRequest["model"]
    >().toEqualTypeOf<"seedream/5-5-image-to-image">();
    expectTypeOf<Seedream55Size>().toEqualTypeOf<"1K" | "1.5K" | "2K">();
  });
});
