import { describe, expect, it } from "vitest";
import {
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  Ltx25FastTextToVideoInputSchema,
  Ltx25FastTextToVideoRequestSchema,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// LTX 2.5 Fast text-to-video, from
// https://docs.kie.ai/market/ltx/2-5-fast-text-to-video as read on 2026-11-19
// and re-read on 2026-11-20 (ac-ujmlmh).
const model = "ltx/2-5-fast-text-to-video";

const parse = (input: Record<string, unknown>) =>
  Ltx25FastTextToVideoRequestSchema.safeParse({ model, input });

const issues = (input: Record<string, unknown>) => {
  const result = parse(input);
  return result.success
    ? []
    : result.error.issues.map(({ path, message }) => ({ path, message }));
};

describe("LTX 2.5 Fast text-to-video request schema", () => {
  it("applies the documented defaults and leaves seed unset", () => {
    expect(
      Ltx25FastTextToVideoRequestSchema.parse({
        model,
        input: { prompt: "x" },
      }).input
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
    expect(CREATE_TASK_GUARDS[model]).toBe(Ltx25FastTextToVideoRequestSchema);
    expect(
      MediaGenerationRequestSchema.safeParse({
        model,
        input: { prompt: "x", resolution: "720p", duration: 6 },
      }).success
    ).toBe(true);
  });

  it("does not admit other ltx/ ids: the family is enum-only", () => {
    for (const id of [
      "ltx/2-5-fast-text-to-vide",
      "ltx/3-0-fast-text-to-video",
    ])
      expect(KieMediaModelSchema.safeParse(id).success).toBe(false);
  });

  it("requires a prompt of 1-5000 characters", () => {
    expect(parse({}).success).toBe(false);
    expect(parse({ prompt: "" }).success).toBe(false);
    expect(parse({ prompt: "x".repeat(5000) }).success).toBe(true);
    expect(parse({ prompt: "x".repeat(5001) }).success).toBe(false);
  });

  it.each(["720p", "1080p", "1440p"])("accepts resolution %s", (resolution) => {
    expect(parse({ prompt: "x", resolution }).success).toBe(true);
  });

  it.each(["480p", "4k", "1440P"])("rejects resolution %s", (resolution) => {
    expect(parse({ prompt: "x", resolution }).success).toBe(false);
  });

  it.each([24, 25, 48, 50])("accepts fps %d", (fps) => {
    expect(parse({ prompt: "x", fps }).success).toBe(true);
  });

  it.each([30, 60, 0, "24", 24.5])("rejects fps %j", (fps) => {
    expect(parse({ prompt: "x", fps }).success).toBe(false);
  });

  it.each([6, 8, 10, 12, 14, 16, 18, 20])(
    "accepts duration %d at 720p and 1080p with 24 or 25 fps",
    (duration) => {
      for (const resolution of ["720p", "1080p"])
        for (const fps of [24, 25])
          expect(
            parse({ prompt: "x", resolution, fps, duration }).success
          ).toBe(true);
    }
  );

  it.each([4, 5, 7, 22, 9.5, "10"])("rejects duration %j", (duration) => {
    expect(parse({ prompt: "x", duration }).success).toBe(false);
  });

  it.each([6, 8, 10])(
    "accepts duration %d at 1440p and at 48 or 50 fps",
    (duration) => {
      expect(
        parse({ prompt: "x", resolution: "1440p", duration }).success
      ).toBe(true);
      for (const fps of [48, 50])
        expect(parse({ prompt: "x", fps, duration }).success).toBe(true);
      expect(
        parse({ prompt: "x", resolution: "1440p", fps: 50, duration }).success
      ).toBe(true);
    }
  );

  it("refuses more than 10 seconds at 1440p or at 48 or 50 fps", () => {
    const path = ["input", "duration"];
    expect(issues({ prompt: "x", resolution: "1440p", duration: 12 })).toEqual([
      { path, message: "LTX 2.5 Fast allows only 6, 8 or 10 seconds at 1440p" },
    ]);
    expect(issues({ prompt: "x", fps: 48, duration: 20 })).toEqual([
      {
        path,
        message: "LTX 2.5 Fast allows only 6, 8 or 10 seconds at 48 fps",
      },
    ]);
    expect(
      issues({ prompt: "x", resolution: "720p", fps: 50, duration: 14 })
    ).toEqual([
      {
        path,
        message: "LTX 2.5 Fast allows only 6, 8 or 10 seconds at 50 fps",
      },
    ]);
  });

  it("keeps the defaults inside the limit: 1440p and 48 fps alone parse", () => {
    expect(parse({ prompt: "x", resolution: "1440p" }).success).toBe(true);
    expect(parse({ prompt: "x", fps: 48 }).success).toBe(true);
  });

  it.each(["16:9", "9:16", "1:1", "3:2", "2:3"])(
    "accepts aspect_ratio %s",
    (aspect_ratio) => {
      expect(parse({ prompt: "x", aspect_ratio }).success).toBe(true);
    }
  );

  it.each(["4:3", "21:9", "auto"])(
    "rejects aspect_ratio %s",
    (aspect_ratio) => {
      expect(parse({ prompt: "x", aspect_ratio }).success).toBe(false);
    }
  );

  it.each([0, 2147483647])("accepts seed %d", (seed) => {
    expect(parse({ prompt: "x", seed }).success).toBe(true);
  });

  it.each([-1, 2147483648, 1.5, "7"])("rejects seed %j", (seed) => {
    expect(parse({ prompt: "x", seed }).success).toBe(false);
  });

  it("keeps the input a plain object with the documented fields", () => {
    expect(Object.keys(Ltx25FastTextToVideoInputSchema.shape).sort()).toEqual([
      "aspect_ratio",
      "duration",
      "fps",
      "prompt",
      "resolution",
      "seed",
    ]);
  });
});

describe("LTX 2.5 Fast text-to-video descriptor", () => {
  const fields = modelInputSchemas[model].fields;

  it("describes every schema field, with the documented enums and defaults", () => {
    expect(modelInputSchemas[model].type).toBe("video");
    expect(Object.keys(fields).sort()).toEqual(
      Object.keys(Ltx25FastTextToVideoInputSchema.shape).sort()
    );
    expect(fields.prompt).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 5000,
    });
    expect(fields.resolution).toMatchObject({
      type: "string",
      enum: ["720p", "1080p", "1440p"],
      default: "1080p",
    });
    expect(fields.fps).toMatchObject({
      type: "integer",
      enum: [24, 25, 48, 50],
      default: 24,
    });
    expect(fields.duration).toMatchObject({
      type: "integer",
      enum: [6, 8, 10, 12, 14, 16, 18, 20],
      default: 10,
    });
    expect(fields.aspect_ratio).toMatchObject({
      type: "string",
      enum: ["16:9", "9:16", "1:1", "3:2", "2:3"],
      default: "16:9",
    });
    expect(fields.seed).toMatchObject({
      type: "integer",
      minimum: 0,
      maximum: 2147483647,
    });
  });

  it("lists only values the schema accepts", () => {
    for (const field of ["resolution", "fps", "duration", "aspect_ratio"])
      for (const value of fields[field].enum ?? [])
        expect(
          parse({ prompt: "x", duration: 6, [field]: value }).success,
          `${field}=${String(value)}`
        ).toBe(true);
  });
});
