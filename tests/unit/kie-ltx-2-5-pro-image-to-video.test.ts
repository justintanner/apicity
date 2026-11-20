import { describe, expect, it } from "vitest";
import {
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  Ltx25ProImageToVideoInputSchema,
  Ltx25ProImageToVideoRequestSchema,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// LTX 2.5 Pro image-to-video, from
// https://docs.kie.ai/market/ltx/2-5-pro-image-to-video as read on 2026-11-19
// and re-read on 2026-11-20 (ac-kevvtj).
const model = "ltx/2-5-pro-image-to-video";
const image_url = "https://example.com/cat.jpg";

const parse = (input: Record<string, unknown>) =>
  Ltx25ProImageToVideoRequestSchema.safeParse({ model, input });

describe("LTX 2.5 Pro image-to-video request schema", () => {
  it("applies the documented defaults and leaves seed unset", () => {
    expect(
      Ltx25ProImageToVideoRequestSchema.parse({
        model,
        input: { image_url, prompt: "x" },
      }).input
    ).toEqual({
      image_url,
      prompt: "x",
      resolution: "1080p",
      fps: 24,
      duration: 10,
    });
  });

  it("is registered, guarded and in the createTask union", () => {
    expect(KIE_MEDIA_MODELS).toContain(model);
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    expect(CREATE_TASK_GUARDS[model]).toBe(Ltx25ProImageToVideoRequestSchema);
    expect(
      MediaGenerationRequestSchema.safeParse({
        model,
        input: { image_url, prompt: "x", resolution: "720p", duration: 6 },
      }).success
    ).toBe(true);
  });

  it("requires an image URL and a prompt of 1-5000 characters", () => {
    expect(parse({ prompt: "x" }).success).toBe(false);
    expect(parse({ image_url: "cat.jpg", prompt: "x" }).success).toBe(false);
    expect(parse({ image_url }).success).toBe(false);
    expect(parse({ image_url, prompt: "" }).success).toBe(false);
    expect(parse({ image_url, prompt: "x".repeat(5000) }).success).toBe(true);
    expect(parse({ image_url, prompt: "x".repeat(5001) }).success).toBe(false);
  });

  it("has no aspect_ratio: the image sets it", () => {
    expect(Object.keys(Ltx25ProImageToVideoInputSchema.shape).sort()).toEqual([
      "duration",
      "fps",
      "image_url",
      "prompt",
      "resolution",
      "seed",
    ]);
    const parsed = Ltx25ProImageToVideoRequestSchema.parse({
      model,
      input: { image_url, prompt: "x", aspect_ratio: "9:16" },
    });
    expect(parsed.input).not.toHaveProperty("aspect_ratio");
  });

  it.each(["720p", "1080p"])("accepts resolution %s", (resolution) => {
    expect(parse({ image_url, prompt: "x", resolution }).success).toBe(true);
  });

  it.each(["1440p", "480p"])("rejects resolution %s: Pro has none", (r) => {
    expect(parse({ image_url, prompt: "x", resolution: r }).success).toBe(
      false
    );
  });

  it.each([24, 25, 48, 50])("accepts fps %d", (fps) => {
    expect(parse({ image_url, prompt: "x", fps }).success).toBe(true);
  });

  it.each([30, "24"])("rejects fps %j", (fps) => {
    expect(parse({ image_url, prompt: "x", fps }).success).toBe(false);
  });

  it.each([6, 8, 10])(
    "accepts duration %d at every resolution and frame rate",
    (duration) => {
      for (const resolution of ["720p", "1080p"])
        for (const fps of [24, 25, 48, 50])
          expect(
            parse({ image_url, prompt: "x", resolution, fps, duration }).success
          ).toBe(true);
    }
  );

  it.each([4, 7, 12, 20, "6"])("rejects duration %j", (duration) => {
    expect(parse({ image_url, prompt: "x", duration }).success).toBe(false);
  });

  it.each([0, 2147483647])("accepts seed %d", (seed) => {
    expect(parse({ image_url, prompt: "x", seed }).success).toBe(true);
  });

  it.each([-1, 2147483648, 1.5])("rejects seed %j", (seed) => {
    expect(parse({ image_url, prompt: "x", seed }).success).toBe(false);
  });
});

describe("LTX 2.5 Pro image-to-video descriptor", () => {
  const fields = modelInputSchemas[model].fields;

  it("describes every schema field, with the documented enums and defaults", () => {
    expect(modelInputSchemas[model].type).toBe("video");
    expect(Object.keys(fields).sort()).toEqual(
      Object.keys(Ltx25ProImageToVideoInputSchema.shape).sort()
    );
    expect(fields.image_url).toMatchObject({ type: "string", required: true });
    expect(fields.prompt).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 5000,
    });
    expect(fields.resolution).toMatchObject({
      enum: ["720p", "1080p"],
      default: "1080p",
    });
    expect(fields.fps).toMatchObject({ enum: [24, 25, 48, 50], default: 24 });
    expect(fields.duration).toMatchObject({
      enum: [6, 8, 10],
      default: 10,
    });
    expect(fields.seed).toMatchObject({ minimum: 0, maximum: 2147483647 });
  });

  it("lists only values the schema accepts", () => {
    for (const field of ["resolution", "fps", "duration"])
      for (const value of fields[field].enum ?? [])
        expect(
          parse({ image_url, prompt: "x", duration: 6, [field]: value })
            .success,
          `${field}=${String(value)}`
        ).toBe(true);
  });
});
