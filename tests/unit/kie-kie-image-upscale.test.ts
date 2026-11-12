import { describe, expect, expectTypeOf, it } from "vitest";

import {
  KieImageUpscaleRequestSchema as RootKieImageUpscaleRequestSchema,
  type KieImageUpscaleFactor,
  type KieImageUpscaleParsedRequest,
  type KieImageUpscaleRequest,
  type KieImageUpscaleRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieImageUpscaleFactorSchema,
  KieImageUpscaleRequestSchema,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "kie/image-upscale" as const;
const IMAGE = "https://example.com/cat.jpg";

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    image_url:
      "https://static.aiquickdraw.com/tools/example/1794381136822_zlQCnA1z.jpg",
    upscale_factor: "2",
  },
} satisfies KieImageUpscaleRequest;

// The recorded pin (tests/integration/kie-kie-image-upscale.test.ts); the
// recording sent KIE's upload URL for cat1.jpg.
const RECORDED_REQUEST = {
  model: MODEL,
  input: { image_url: IMAGE, upscale_factor: "2" },
} satisfies KieImageUpscaleRequest;

function parseInput(input: Record<string, unknown>) {
  return KieImageUpscaleRequestSchema.safeParse({ model: MODEL, input });
}

function failsAt(input: Record<string, unknown>, field: string) {
  const result = parseInput(input);
  if (result.success) return false;
  return result.error.issues.some(
    (issue) => issue.path.join(".") === `input.${field}`
  );
}

describe("Kie Image Upscale request contract", () => {
  it("accepts the documented example and the recorded pin directly, through the guard, and through the aggregates", () => {
    for (const request of [DOCUMENTED_REQUEST, RECORDED_REQUEST]) {
      expect(KieImageUpscaleRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CREATE_TASK_GUARDS[MODEL].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    }
  });

  it('fills in the documented default factor, "2"', () => {
    const parsed = KieImageUpscaleRequestSchema.parse({
      model: MODEL,
      input: { image_url: IMAGE },
    });
    expect(parsed.input).toEqual({ image_url: IMAGE, upscale_factor: "2" });
  });

  it('takes the factor as the declared string "1", "2", "4" or "8"', () => {
    expect(KieImageUpscaleFactorSchema.options).toEqual(["1", "2", "4", "8"]);
    for (const upscale_factor of KieImageUpscaleFactorSchema.options) {
      expect(
        parseInput({ image_url: IMAGE, upscale_factor }).success,
        upscale_factor
      ).toBe(true);
    }
    // The page says numbers are accepted too, but declares and sends strings;
    // the schema keeps the declared strings, as Topaz does.
    for (const upscale_factor of ["3", "16", "x2", "", 2, 8, null]) {
      expect(
        failsAt({ image_url: IMAGE, upscale_factor }, "upscale_factor"),
        JSON.stringify(upscale_factor)
      ).toBe(true);
    }
  });

  it("requires one public http(s) image_url", () => {
    for (const image_url of [
      undefined,
      "",
      "not a url",
      "ftp://example.com/cat.jpg",
      [IMAGE],
    ]) {
      expect(
        failsAt({ image_url, upscale_factor: "2" }, "image_url"),
        JSON.stringify(image_url)
      ).toBe(true);
    }
    expect(
      parseInput({ image_url: "http://example.com/cat.png" }).success
    ).toBe(true);
  });

  it("takes an optional callBackUrl, which must be a URL", () => {
    expect(
      KieImageUpscaleRequestSchema.safeParse({
        ...RECORDED_REQUEST,
        callBackUrl: "not a url",
      }).success
    ).toBe(false);
  });

  it("carries the docs' field text into the JSON schema that apicity describe prints", () => {
    interface JsonNode {
      required?: string[];
      properties?: Record<string, JsonNode>;
      description?: string;
      enum?: unknown[];
      default?: unknown;
    }
    const json = zodToJsonSchema(KieImageUpscaleRequestSchema) as JsonNode;
    const input = json.properties?.input;
    expect(input?.required).toEqual(["image_url"]);
    const properties = input?.properties ?? {};
    expect(Object.keys(properties)).toEqual(["image_url", "upscale_factor"]);
    expect(properties.image_url?.description).toContain(
      "publicly downloadable HTTP(S) URL, at most 20 MB"
    );
    expect(properties.upscale_factor).toMatchObject({
      enum: ["1", "2", "4", "8"],
      default: "2",
    });
    expect(properties.upscale_factor?.description).toContain(
      "or KIE rejects the request with 422 and does not charge it"
    );
    expect(properties.upscale_factor?.description).toContain(
      "The billing tier (2K, 4K or 8K) follows the total output pixels."
    );
  });
});

describe("Kie Image Upscale model id", () => {
  it("lists the id, which stays enum-only", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
    for (const nearMiss of [
      "kie",
      "kie/image-upscaler",
      "kie/image_upscale",
      "kie/upscale",
      "kie-image-upscale",
      "Kie/image-upscale",
    ]) {
      expect(KieMediaModelSchema.safeParse(nearMiss).success, nearMiss).toBe(
        false
      );
    }
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(KieImageUpscaleRequestSchema);
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "image_url",
      "upscale_factor",
    ]);
    expect(descriptor.fields.image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(descriptor.fields.upscale_factor).toMatchObject({
      type: "string",
      enum: [...KieImageUpscaleFactorSchema.options],
      default: "2",
    });
    expect(descriptor.fields.upscale_factor.required).toBeUndefined();
  });
});

describe("Kie Image Upscale public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootKieImageUpscaleRequestSchema).toBe(KieImageUpscaleRequestSchema);
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<KieImageUpscaleRequestInput>().toEqualTypeOf<KieImageUpscaleRequest>();
    expectTypeOf(
      KieImageUpscaleRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<KieImageUpscaleParsedRequest>();
    expectTypeOf<
      KieImageUpscaleRequest["model"]
    >().toEqualTypeOf<"kie/image-upscale">();
    expectTypeOf<KieImageUpscaleFactor>().toEqualTypeOf<
      "1" | "2" | "4" | "8"
    >();
    expectTypeOf<
      KieImageUpscaleParsedRequest["input"]["upscale_factor"]
    >().toEqualTypeOf<KieImageUpscaleFactor>();
  });
});
