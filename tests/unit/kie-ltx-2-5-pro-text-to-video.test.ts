import { describe, expect, it } from "vitest";
import {
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  Ltx25ProTextToVideoInputSchema,
  Ltx25ProTextToVideoRequestSchema,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// LTX 2.5 Pro text-to-video, from
// https://docs.kie.ai/market/ltx/2-5-pro-text-to-video as read on 2026-11-19
// and re-read on 2026-11-20 (ac-dwmekr).
const model = "ltx/2-5-pro-text-to-video";

const parse = (input: Record<string, unknown>) =>
  Ltx25ProTextToVideoRequestSchema.safeParse({ model, input });

describe("LTX 2.5 Pro text-to-video request schema", () => {
  it("applies the documented defaults and leaves seed unset", () => {
    expect(
      Ltx25ProTextToVideoRequestSchema.parse({ model, input: { prompt: "x" } })
        .input
    ).toEqual({
      prompt: "x",
      resolution: "1080p",
      fps: 24,
      duration: 10,
      aspect_ratio: "16:9",
    });
  });

  it("is registered, guarded and in the createTask union", () => {
    expect(KIE_MEDIA_MODELS).toContain(model);
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    expect(CREATE_TASK_GUARDS[model]).toBe(Ltx25ProTextToVideoRequestSchema);
    expect(
      MediaGenerationRequestSchema.safeParse({
        model,
        input: { prompt: "x", resolution: "720p", duration: 6 },
      }).success
    ).toBe(true);
  });

  it("requires a prompt of 1-5000 characters", () => {
    expect(parse({}).success).toBe(false);
    expect(parse({ prompt: "" }).success).toBe(false);
    expect(parse({ prompt: "x".repeat(5000) }).success).toBe(true);
    expect(parse({ prompt: "x".repeat(5001) }).success).toBe(false);
  });

  it.each(["720p", "1080p"])("accepts resolution %s", (resolution) => {
    expect(parse({ prompt: "x", resolution }).success).toBe(true);
  });

  it.each(["1440p", "480p"])("rejects resolution %s: Pro has none", (r) => {
    expect(parse({ prompt: "x", resolution: r }).success).toBe(false);
  });

  it.each([6, 8, 10])(
    "accepts duration %d at every resolution and frame rate",
    (duration) => {
      for (const resolution of ["720p", "1080p"])
        for (const fps of [24, 25, 48, 50])
          expect(
            parse({ prompt: "x", resolution, fps, duration }).success
          ).toBe(true);
    }
  );

  it.each([4, 7, 12, 20, "6"])("rejects duration %j", (duration) => {
    expect(parse({ prompt: "x", duration }).success).toBe(false);
  });

  it.each([30, "24"])("rejects fps %j", (fps) => {
    expect(parse({ prompt: "x", fps }).success).toBe(false);
  });

  it.each(["16:9", "9:16", "1:1", "3:2", "2:3"])(
    "accepts aspect_ratio %s",
    (aspect_ratio) => {
      expect(parse({ prompt: "x", aspect_ratio }).success).toBe(true);
    }
  );

  it.each(["4:3", "auto"])("rejects aspect_ratio %s", (aspect_ratio) => {
    expect(parse({ prompt: "x", aspect_ratio }).success).toBe(false);
  });

  it.each([-1, 2147483648, 1.5])("rejects seed %j", (seed) => {
    expect(parse({ prompt: "x", seed }).success).toBe(false);
  });
});

describe("LTX 2.5 Pro text-to-video descriptor", () => {
  const fields = modelInputSchemas[model].fields;

  it("describes every schema field, with the documented enums and defaults", () => {
    expect(modelInputSchemas[model].type).toBe("video");
    expect(Object.keys(fields).sort()).toEqual(
      Object.keys(Ltx25ProTextToVideoInputSchema.shape).sort()
    );
    expect(fields.prompt).toMatchObject({ required: true, maxLength: 5000 });
    expect(fields.resolution).toMatchObject({
      enum: ["720p", "1080p"],
      default: "1080p",
    });
    expect(fields.fps).toMatchObject({ enum: [24, 25, 48, 50], default: 24 });
    expect(fields.duration).toMatchObject({
      type: "integer",
      enum: [6, 8, 10],
      default: 10,
    });
    expect(fields.aspect_ratio).toMatchObject({
      enum: ["16:9", "9:16", "1:1", "3:2", "2:3"],
      default: "16:9",
    });
    expect(fields.seed).toMatchObject({ minimum: 0, maximum: 2147483647 });
  });

  it("lists only values the schema accepts", () => {
    for (const field of ["resolution", "fps", "duration", "aspect_ratio"])
      for (const value of fields[field].enum ?? [])
        expect(
          parse({ prompt: "x", [field]: value }).success,
          `${field}=${String(value)}`
        ).toBe(true);
  });
});
