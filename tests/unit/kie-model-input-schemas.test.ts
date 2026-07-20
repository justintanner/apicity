import { describe, expect, it } from "vitest";

import { createKie } from "@apicity/kie";
import {
  KlingVideoRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
} from "../../packages/provider/kie/src/zod";

describe("KIE modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("exposes Grok manual constraints as public metadata", () => {
    const fields =
      provider.modelInputSchemas["grok-imagine/image-to-video"].fields;

    expect(fields.prompt.maxLength).toBe(4096);
    expect(fields.image_urls.minItems).toBe(1);
    expect(fields.image_urls.maxItems).toBe(7);
    expect(fields.index.type).toBe("integer");
    expect(fields.index.minimum).toBe(0);
    expect(fields.index.maximum).toBe(5);
    expect(fields.index.default).toBe(0);
    expect(fields.duration.type).toBe("integer");
    expect(fields.duration.minimum).toBe(6);
    expect(fields.duration.maximum).toBe(30);
    expect(fields.duration.default).toBe(6);
  });

  it("exposes Wan image numeric, string, and array constraints", () => {
    const fields = provider.modelInputSchemas["wan/2-7-image-pro"].fields;

    expect(fields.prompt.maxLength).toBe(5000);
    expect(fields.input_urls.maxItems).toBe(9);
    expect(fields.n.type).toBe("integer");
    expect(fields.n.minimum).toBe(1);
    expect(fields.n.maximum).toBe(12);
    expect(fields.color_palette.minItems).toBe(3);
    expect(fields.color_palette.maxItems).toBe(10);
    expect(fields.seed.type).toBe("integer");
    expect(fields.seed.minimum).toBe(0);
    expect(fields.seed.maximum).toBe(2147483647);
  });

  it("exposes HappyHorse duration and prompt constraints", () => {
    const fields =
      provider.modelInputSchemas["happyhorse/text-to-video"].fields;

    expect(fields.prompt.minLength).toBe(1);
    expect(fields.prompt.maxLength).toBe(5000);
    expect(fields.duration.type).toBe("integer");
    expect(fields.duration.minimum).toBe(3);
    expect(fields.duration.maximum).toBe(15);
    expect(fields.duration.default).toBe(5);
  });

  it("exposes HappyHorse 1.1 metadata and widened aspect ratios", () => {
    const textFields =
      provider.modelInputSchemas["happyhorse-1-1/text-to-video"].fields;
    const imageFields =
      provider.modelInputSchemas["happyhorse-1-1/image-to-video"].fields;
    const referenceFields =
      provider.modelInputSchemas["happyhorse-1-1/reference-to-video"].fields;

    expect(textFields.prompt.required).toBe(true);
    expect(textFields.prompt.maxLength).toBe(5000);
    expect(textFields.resolution.default).toBe("1080p");
    expect(textFields.aspect_ratio.enum).toContain("21:9");
    expect(textFields.duration.minimum).toBe(3);
    expect(textFields.duration.maximum).toBe(15);

    expect(imageFields.prompt.default).toBe("");
    expect(imageFields.image_urls.required).toBe(true);
    expect(imageFields.image_urls.maxItems).toBe(1);
    expect(imageFields.duration.default).toBe(5);

    expect(referenceFields.reference_image.required).toBe(true);
    expect(referenceFields.reference_image.maxItems).toBe(9);
    expect(referenceFields.aspect_ratio.enum).toContain("9:21");
    expect(referenceFields.duration.default).toBe(5);
  });
});

// REQ-001 / AC-001. Kie documents a `basic` default for Seedream `quality`,
// but createTask answers "This field is required" when the key is absent, so
// the schemas declare it required and deliberately carry no `.default()`.
// These assertions pin that decision so a future "tidy up the defaults" pass
// cannot silently relax it back to optional.
describe("KIE Seedream quality stays required (REQ-001)", () => {
  const schemas = [
    ["seedream/5-lite-image-to-image", SeedreamImageToImageRequestSchema],
    ["seedream/5-lite-text-to-image", SeedreamTextToImageRequestSchema],
    ["seedream/5-pro-image-to-image", SeedreamProImageToImageRequestSchema],
    ["seedream/5-pro-text-to-image", SeedreamProTextToImageRequestSchema],
  ] as const;

  const baseInput = (model: string) => {
    const input: Record<string, unknown> = {
      prompt: "A quiet harbour at first light",
    };
    if (model.includes("image-to-image")) {
      input.image_urls = ["https://example.com/a.png"];
    }
    return input;
  };

  for (const [model, schema] of schemas) {
    it(`rejects ${model} without quality`, () => {
      const result = schema.safeParse({
        model,
        input: baseInput(model),
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("quality"))).toBe(
        true
      );
    });

    it(`accepts ${model} with an explicit quality`, () => {
      const result = schema.safeParse({
        model,
        input: { ...baseInput(model), quality: "high" },
      });

      expect(result.success).toBe(true);
    });

    it(`does not inject a quality default for ${model}`, () => {
      const result = schema.parse({
        model,
        input: { ...baseInput(model), quality: "basic" },
      });

      // `quality` round-trips exactly as supplied; nothing is defaulted in.
      expect(result.input.quality).toBe("basic");
    });
  }
});

// REQ-001 / AC-001. `kling-3.0/video` documents `sound` as "default false,
// true when multi_shots" and modelInputSchemas does not mark it `required`,
// but zod.ts declared it required. These assertions pin the corrected
// optional-and-undefaulted treatment: the caller may omit it, and omitting it
// must not synthesise a `false` that suppresses the upstream promotion to
// `true` under multi-shot mode.
describe("KIE kling-3.0/video sound is optional and undefaulted (REQ-001)", () => {
  const baseInput = {
    duration: "5",
    mode: "std",
    multi_shots: false,
  };

  it("accepts a request that omits sound", () => {
    const result = KlingVideoRequestSchema.safeParse({
      model: "kling-3.0/video",
      input: { ...baseInput },
    });

    expect(result.success).toBe(true);
  });

  it("does not inject a sound default when omitted", () => {
    const result = KlingVideoRequestSchema.parse({
      model: "kling-3.0/video",
      input: { ...baseInput },
    });

    // Absent stays absent — Kie applies its own context-dependent default.
    expect("sound" in result.input).toBe(false);
    expect(result.input.sound).toBeUndefined();
  });

  it("round-trips an explicit sound value unchanged", () => {
    for (const sound of [true, false]) {
      const result = KlingVideoRequestSchema.parse({
        model: "kling-3.0/video",
        input: { ...baseInput, sound },
      });

      expect(result.input.sound).toBe(sound);
    }
  });

  it("still rejects a non-boolean sound", () => {
    const result = KlingVideoRequestSchema.safeParse({
      model: "kling-3.0/video",
      input: { ...baseInput, sound: "yes" },
    });

    expect(result.success).toBe(false);
  });
});

// Drift guard for the audit behind REQ-001. modelInputSchemas is the
// doc-of-record for which Kie fields are mandatory; zod.ts is what callers
// actually validate against. The `sound` bug was these two disagreeing, so
// assert they agree for every field of the audited model rather than only
// pinning the one field that happened to be wrong.
describe("KIE kling-3.0/video zod matches modelInputSchemas (REQ-001)", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("marks exactly the documented-required fields as required", () => {
    const fields = provider.modelInputSchemas["kling-3.0/video"].fields;
    const documentedRequired = Object.entries(fields)
      .filter(([, spec]) => spec.required === true)
      .map(([name]) => name)
      .sort();

    const inputShape = KlingVideoRequestSchema.shape.input.shape;
    const zodRequired = Object.entries(inputShape)
      .filter(([, schema]) => !schema.safeParse(undefined).success)
      .map(([name]) => name)
      .sort();

    expect(zodRequired).toEqual(documentedRequired);
  });
});
