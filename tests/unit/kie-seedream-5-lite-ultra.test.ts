import { describe, expect, it } from "vitest";
import {
  SeedreamImageToImageRequestSchema,
  SeedreamLiteOutputFormatSchema,
  SeedreamLiteQualitySchema,
  SeedreamTextToImageRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// Seedream 5.0 Lite quality tiers and output format, from
// https://docs.kie.ai/market/seedream/5-lite-text-to-image.md and
// https://docs.kie.ai/market/seedream-5-lite-image-to-image.md as read on
// 2026-11-19 (ac-bxpbil): basic 2K, high 3K, ultra 4K; png or jpeg.
const CASES = [
  {
    model: "seedream/5-lite-text-to-image",
    schema: SeedreamTextToImageRequestSchema,
    base: { prompt: "A lighthouse at dusk" },
  },
  {
    model: "seedream/5-lite-image-to-image",
    schema: SeedreamImageToImageRequestSchema,
    base: {
      prompt: "Make it a poster",
      image_urls: ["https://example.com/a.png"],
    },
  },
] as const;

describe("Seedream 5 Lite vocabularies", () => {
  it("has the three documented quality tiers", () => {
    expect(SeedreamLiteQualitySchema.options).toEqual([
      "basic",
      "high",
      "ultra",
    ]);
  });

  it("has the two documented output formats", () => {
    expect(SeedreamLiteOutputFormatSchema.options).toEqual(["png", "jpeg"]);
  });
});

describe.each(CASES)("$model", ({ model, schema, base }) => {
  it("is the createTask guard for the model", () => {
    expect(CREATE_TASK_GUARDS[model]).toBe(schema);
  });

  it.each(["basic", "high", "ultra"])("accepts quality %s", (quality) => {
    const result = schema.safeParse({ model, input: { ...base, quality } });
    expect(result.success).toBe(true);
    expect(result.data?.input.quality).toBe(quality);
  });

  it("still requires quality", () => {
    const result = schema.safeParse({ model, input: base });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes("quality"))
    ).toBe(true);
  });

  it.each(["png", "jpeg"])("accepts output_format %s", (output_format) => {
    const result = schema.safeParse({
      model,
      input: { ...base, quality: "ultra", output_format },
    });
    expect(result.success).toBe(true);
    expect(result.data?.input.output_format).toBe(output_format);
  });

  it("leaves output_format off the parsed request when omitted", () => {
    expect(
      schema.parse({ model, input: { ...base, quality: "basic" } }).input
    ).not.toHaveProperty("output_format");
  });

  it.each([
    ["quality", "4K"],
    ["quality", "Ultra"],
    ["output_format", "webp"],
    ["output_format", "jpg"],
  ])("rejects %s %s", (field, value) => {
    const result = schema.safeParse({
      model,
      input: { ...base, quality: "basic", [field]: value },
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes(field))
    ).toBe(true);
  });

  it("describes the same fields and values it parses", () => {
    const fields = modelInputSchemas[model].fields;
    expect(Object.keys(fields).sort()).toEqual(
      Object.keys(schema.shape.input.shape).sort()
    );
    expect(fields.quality.enum).toEqual(SeedreamLiteQualitySchema.options);
    expect(fields.output_format.enum).toEqual(
      SeedreamLiteOutputFormatSchema.options
    );
    expect(fields.output_format.required).toBeUndefined();
  });
});
