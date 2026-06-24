import { describe, expect, it } from "vitest";

import { createKie } from "@apicity/kie";

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
