import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  AlibabaVideoMediaTypeSchema,
  AlibabaVideoSynthesisModelSchema,
  AlibabaVideoSynthesisRequestObjectSchema,
  AlibabaVideoSynthesisRequestSchema,
} from "../../packages/provider/alibaba/src/zod";
import {
  GrokImageToVideoRequestSchema,
  Seedance2FastRequestSchema,
  Wan27VideoEditRequestSchema,
} from "../../packages/provider/kie/src/zod";
import {
  getZodDefaultValue,
  getZodEnumValues,
  getZodObjectShape,
  isOptionalZodSchema,
  zodToJsonSchema,
} from "../../packages/mcp-server/src/schema";

function propertiesOf(schema: unknown): Record<string, unknown> {
  expect(schema).toMatchObject({ type: "object" });
  const properties = (schema as { properties?: unknown }).properties;
  expect(properties).toBeDefined();
  return properties as Record<string, unknown>;
}

describe("MCP Zod schema introspection helpers", () => {
  it("extracts enum values without direct unwrap/options access", () => {
    const wrapped = z
      .enum(["square", "wide"])
      .default("square")
      .optional()
      .nullable();

    expect(getZodEnumValues(wrapped)).toEqual(["square", "wide"]);
    expect(getZodDefaultValue(wrapped)).toBe("square");
  });

  it("extracts shapes across optional/default/nullable/refined fields", () => {
    const refinedString = z
      .string()
      .min(1)
      .refine((v) => v !== "nope");
    const schema = z.object({
      bare: z.string(),
      optional: z.string().optional(),
      defaulted: z.enum(["small", "large"]).default("small"),
      nullable: z.string().nullable(),
      refined: refinedString,
    });

    const shape = getZodObjectShape(schema);
    expect(Object.keys(shape ?? {})).toEqual([
      "bare",
      "optional",
      "defaulted",
      "nullable",
      "refined",
    ]);
    expect(isOptionalZodSchema(shape?.optional)).toBe(true);
    expect(isOptionalZodSchema(shape?.defaulted)).toBe(true);
    expect(isOptionalZodSchema(shape?.nullable)).toBe(false);

    const json = zodToJsonSchema(schema);
    const properties = propertiesOf(json);
    expect(json.required).toEqual(["bare", "nullable", "refined"]);
    expect(properties.defaulted).toMatchObject({
      type: "string",
      enum: ["small", "large"],
      default: "small",
    });
    expect(properties.nullable).toMatchObject({
      anyOf: [{ type: "string" }, { type: "null" }],
    });
  });

  it("extracts Zod 3 enum values and refined object shapes from Alibaba", () => {
    expect(getZodEnumValues(AlibabaVideoMediaTypeSchema.optional())).toEqual([
      "first_frame",
      "last_frame",
      "driving_audio",
      "first_clip",
      "video",
      "reference_image",
    ]);

    expect(getZodEnumValues(AlibabaVideoSynthesisModelSchema)).toEqual([
      "wan2.7-i2v",
      "wan2.7-videoedit",
    ]);

    const objectShape = getZodObjectShape(
      AlibabaVideoSynthesisRequestObjectSchema
    );
    expect(Object.keys(objectShape ?? {})).toEqual([
      "model",
      "input",
      "parameters",
    ]);
    expect(getZodEnumValues(objectShape?.model)).toEqual([
      "wan2.7-i2v",
      "wan2.7-videoedit",
    ]);

    const shape = getZodObjectShape(AlibabaVideoSynthesisRequestSchema);
    expect(Object.keys(shape ?? {})).toEqual(["model", "input", "parameters"]);
    expect(getZodEnumValues(shape?.model)).toEqual([
      "wan2.7-i2v",
      "wan2.7-videoedit",
    ]);

    const json = zodToJsonSchema(AlibabaVideoSynthesisRequestSchema);
    const properties = propertiesOf(json);
    expect(properties.model).toMatchObject({
      type: "string",
      enum: ["wan2.7-i2v", "wan2.7-videoedit"],
    });
  });

  it("lists KIE Zod 4 media enum defaults in MCP JSON Schema output", () => {
    const json = zodToJsonSchema(GrokImageToVideoRequestSchema);
    const requestProperties = propertiesOf(json);
    const input = requestProperties.input;
    const inputProperties = propertiesOf(input);

    expect(inputProperties.mode).toMatchObject({
      type: "string",
      enum: ["fun", "normal", "spicy"],
      default: "normal",
    });
    expect(inputProperties.resolution).toMatchObject({
      type: "string",
      enum: ["480p", "720p"],
      default: "480p",
    });
    expect(inputProperties.duration).toMatchObject({ default: 6 });
    expect(inputProperties.nsfw_checker).toMatchObject({
      type: "boolean",
      default: false,
    });
  });

  it("extracts shapes from KIE refined request objects", () => {
    const seedanceShape = getZodObjectShape(Seedance2FastRequestSchema);
    const wanShape = getZodObjectShape(Wan27VideoEditRequestSchema);

    expect(Object.keys(seedanceShape ?? {})).toEqual([
      "model",
      "callBackUrl",
      "input",
    ]);
    expect(Object.keys(wanShape ?? {})).toEqual([
      "model",
      "callBackUrl",
      "input",
    ]);

    const wanJson = zodToJsonSchema(Wan27VideoEditRequestSchema);
    const wanInput = propertiesOf(propertiesOf(wanJson).input);
    expect(wanInput.duration).toMatchObject({
      type: "integer",
    });
    expect(wanInput.audio_setting).toMatchObject({
      type: "string",
      enum: ["auto", "origin"],
    });
  });
});
