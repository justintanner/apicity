import { describe, expect, it } from "vitest";
import {
  createKie,
  HappyHorseDurationSchema,
  type HappyHorseDuration,
} from "@apicity/kie";

const validInputs = {
  "happyhorse/text-to-video": {
    prompt: "A small paper train rolls through a handmade city.",
  },
  "happyhorse/image-to-video": {
    image_urls: ["https://example.com/frame.png"],
  },
  "happyhorse/reference-to-video": {
    prompt: "character1 looks toward the camera.",
    reference_image: ["https://example.com/reference.png"],
  },
  "happyhorse-1-1/text-to-video": {
    prompt: "A small paper train rolls through a handmade city.",
  },
  "happyhorse-1-1/image-to-video": {
    image_urls: ["https://example.com/frame.png"],
  },
  "happyhorse-1-1/reference-to-video": {
    prompt: "character1 looks toward the camera.",
    reference_image: ["https://example.com/reference.png"],
  },
} as const;

describe("kie happyhorse duration schema", () => {
  it("exports a public HappyHorse duration schema and type", () => {
    const duration: HappyHorseDuration = 3;

    expect(HappyHorseDurationSchema.safeParse(duration).success).toBe(true);
    expect(HappyHorseDurationSchema.safeParse(15).success).toBe(true);
    expect(HappyHorseDurationSchema.safeParse(2).success).toBe(false);
    expect(HappyHorseDurationSchema.safeParse(16).success).toBe(false);
    expect(HappyHorseDurationSchema.safeParse(3.5).success).toBe(false);
  });

  it("validates shared HappyHorse duration bounds on video generation models", () => {
    const provider = createKie({ apiKey: "test-key" });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    for (const [model, input] of Object.entries(validInputs)) {
      expect(
        schema.safeParse({
          model,
          input: { ...input, duration: 3 },
        }).success
      ).toBe(true);
      expect(
        schema.safeParse({
          model,
          input: { ...input, duration: 15 },
        }).success
      ).toBe(true);
      expect(
        schema.safeParse({
          model,
          input: { ...input, duration: 2 },
        }).success
      ).toBe(false);
      expect(
        schema.safeParse({
          model,
          input: { ...input, duration: 16 },
        }).success
      ).toBe(false);
    }
  });

  it("exposes matching HappyHorse duration metadata without adding video-edit duration", () => {
    const provider = createKie({ apiKey: "test-key" });

    const models = Object.keys(validInputs) as (keyof typeof validInputs)[];
    for (const model of models) {
      const duration = provider.modelInputSchemas[model].fields.duration;

      expect(duration.type).toBe("integer");
      expect(duration.minimum).toBe(3);
      expect(duration.maximum).toBe(15);
      expect(duration.default).toBe(5);
    }

    expect(
      provider.modelInputSchemas["happyhorse/video-edit"].fields.duration
    ).toBeUndefined();
  });
});
