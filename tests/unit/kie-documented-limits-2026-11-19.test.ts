import { describe, expect, it } from "vitest";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  GoogleNanoBananaEditRequestSchema,
  GoogleNanoBananaRequestSchema,
  GrokImageToImageRequestSchema,
  Kling26ImageToVideoRequestSchema,
  Kling26TextToVideoRequestSchema,
  KlingV25TurboImageToVideoProRequestSchema,
  Qwen2TextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
} from "../../packages/provider/kie/src/zod";

// ac-r04q6v (K12 of the KIE survey ac-vmq3cy): input limits KIE's docs
// widened, re-read from https://docs.kie.ai/market/<model>.md on 2026-11-19.
// Each new maximum is accepted and one past it is refused, and the descriptor
// states the same limit. The limits follow the docs; no call probed them.
const IMAGE = "https://example.com/a.png";

type Schema = {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: Array<{ path: PropertyKey[] }> };
  };
};

const stringLimits: Array<{
  model: string;
  schema: Schema;
  field: string;
  max: number;
  base: Record<string, unknown>;
}> = [
  {
    model: "google/nano-banana",
    schema: GoogleNanoBananaRequestSchema,
    field: "prompt",
    max: 20000,
    base: {},
  },
  {
    model: "google/nano-banana-edit",
    schema: GoogleNanoBananaEditRequestSchema,
    field: "prompt",
    max: 20000,
    base: { image_urls: [IMAGE] },
  },
  {
    model: "kling-2.6/text-to-video",
    schema: Kling26TextToVideoRequestSchema,
    field: "prompt",
    max: 2500,
    base: { sound: false, aspect_ratio: "16:9", duration: "5" },
  },
  {
    model: "kling-2.6/image-to-video",
    schema: Kling26ImageToVideoRequestSchema,
    field: "prompt",
    max: 2500,
    base: { image_urls: [IMAGE], sound: false, duration: "5" },
  },
  {
    model: "kling/v2-5-turbo-image-to-video-pro",
    schema: KlingV25TurboImageToVideoProRequestSchema,
    field: "negative_prompt",
    max: 2496,
    base: { prompt: "a cat", image_url: IMAGE },
  },
  {
    model: "qwen2/text-to-image",
    schema: Qwen2TextToImageRequestSchema,
    field: "prompt",
    max: 5000,
    base: {},
  },
  {
    model: "seedream/5-pro-text-to-image",
    schema: SeedreamProTextToImageRequestSchema,
    field: "prompt",
    max: 5000,
    base: { quality: "basic" },
  },
  {
    model: "seedream/5-pro-image-to-image",
    schema: SeedreamProImageToImageRequestSchema,
    field: "prompt",
    max: 5000,
    base: { image_urls: [IMAGE], quality: "basic" },
  },
];

describe("KIE input limits widened on 2026-11-19", () => {
  it.each(stringLimits)(
    "$model $field takes up to $max characters",
    ({ model, schema, field, max, base }) => {
      const parse = (length: number) =>
        schema.safeParse({
          model,
          input: { prompt: "a cat", ...base, [field]: "a".repeat(length) },
        });

      expect(parse(max).success).toBe(true);
      const over = parse(max + 1);
      expect(over.success).toBe(false);
      expect(over.error?.issues[0]?.path).toEqual(["input", field]);

      const descriptor = modelInputSchemas[
        model as keyof typeof modelInputSchemas
      ]?.fields[field] as { maxLength?: number; description?: string };
      const stated =
        descriptor?.maxLength ??
        Number(descriptor?.description?.match(/-(\d+) chars/)?.[1]);
      expect(stated).toBe(max);
    }
  );

  it.each([
    SeedreamProTextToImageRequestSchema,
    SeedreamProImageToImageRequestSchema,
  ])("keeps the Seedream 5 Pro prompt minimum at 3 characters", (schema) => {
    const model = schema.shape.model.value;
    const input = (prompt: string) => ({
      prompt,
      quality: "basic",
      ...(model === "seedream/5-pro-image-to-image"
        ? { image_urls: [IMAGE] }
        : {}),
    });
    expect(schema.safeParse({ model, input: input("abc") }).success).toBe(true);
    expect(schema.safeParse({ model, input: input("ab") }).success).toBe(false);
  });

  describe("grok-imagine/image-to-image image_urls", () => {
    const parse = (count: number) =>
      GrokImageToImageRequestSchema.safeParse({
        model: "grok-imagine/image-to-image",
        input: {
          prompt: "@image1 and @image2 on a beach",
          image_urls: Array.from(
            { length: count },
            (_, i) => `https://example.com/${i + 1}.png`
          ),
        },
      });

    it.each([1, 2, 5])("accepts %i image URLs", (count) => {
      const result = parse(count);
      expect(result.success).toBe(true);
      expect(result.data?.input.image_urls).toHaveLength(count);
    });

    it.each([0, 6])("refuses %i image URLs", (count) => {
      const result = parse(count);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["input", "image_urls"]);
    });

    it("describes 1-5 images", () => {
      expect(
        modelInputSchemas["grok-imagine/image-to-image"]?.fields.image_urls
      ).toMatchObject({ type: "array", minItems: 1, maxItems: 5 });
    });
  });
});
