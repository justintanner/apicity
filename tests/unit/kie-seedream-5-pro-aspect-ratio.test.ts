import { describe, expect, it } from "vitest";
import {
  SeedreamProAspectRatioSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// Seedream 5 Pro aspect ratios, from
// https://docs.kie.ai/market/seedream/5-pro-text-to-image.md and
// .../5-pro-image-to-image.md as read on 2026-11-19 (ac-51w0vl). Both pages
// list eight ratios; the models shipped with the first seven.
const DOCUMENTED = ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"];

const CASES = [
  {
    model: "seedream/5-pro-text-to-image",
    schema: SeedreamProTextToImageRequestSchema,
    base: { prompt: "A lighthouse at dusk", quality: "basic" },
  },
  {
    model: "seedream/5-pro-image-to-image",
    schema: SeedreamProImageToImageRequestSchema,
    base: {
      prompt: "Make it a poster",
      image_urls: ["https://example.com/a.png"],
      quality: "basic",
    },
  },
] as const;

describe("Seedream 5 Pro aspect ratio vocabulary", () => {
  it("is the eight documented ratios", () => {
    expect(SeedreamProAspectRatioSchema.options).toEqual(DOCUMENTED);
  });
});

describe.each(CASES)("$model aspect_ratio", ({ model, schema, base }) => {
  it("is the createTask guard for the model", () => {
    expect(CREATE_TASK_GUARDS[model]).toBe(schema);
  });

  it.each(DOCUMENTED)("accepts %s", (aspect_ratio) => {
    const result = schema.safeParse({
      model,
      input: { ...base, aspect_ratio },
    });
    expect(result.success).toBe(true);
    expect(result.data?.input.aspect_ratio).toBe(aspect_ratio);
  });

  it("accepts 21:9 at both quality tiers", () => {
    for (const quality of ["basic", "high"] as const) {
      expect(
        schema.safeParse({
          model,
          input: { ...base, quality, aspect_ratio: "21:9" },
        }).success
      ).toBe(true);
    }
  });

  it("still defaults an omitted ratio to 1:1", () => {
    expect(schema.parse({ model, input: base }).input.aspect_ratio).toBe("1:1");
  });

  it.each(["9:21", "auto", "21:09"])("rejects %s", (aspect_ratio) => {
    const result = schema.safeParse({
      model,
      input: { ...base, aspect_ratio },
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes("aspect_ratio"))
    ).toBe(true);
  });

  it("describes the same ratios it parses", () => {
    expect(modelInputSchemas[model].fields.aspect_ratio.enum).toEqual(
      SeedreamProAspectRatioSchema.options
    );
  });
});
