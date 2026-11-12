import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Seedream55LayerDecompositionRequestSchema as RootSeedream55LayerDecompositionRequestSchema,
  type Seedream55LayerDecompositionParsedRequest,
  type Seedream55LayerDecompositionRequest,
  type Seedream55LayerDecompositionRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
  Seedream55LayerDecompositionRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "seedream/5-5-layer-decomposition" as const;
const IMAGE = "https://example.com/a.png";

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    image_url:
      "https://static.aiquickdraw.com/tools/example/1786019968051_cKRYLHHu.png",
    prompt:
      "Separate the title text <bbox>179 58 809 197</bbox> and the parrot <bbox>330 274 641 991</bbox> into independent layers",
    size: "auto",
    output_format: "png",
    max_images: 30,
    text_recognition: false,
    nsfw_checker: false,
  },
} satisfies Seedream55LayerDecompositionRequest;

function issueAt(
  result: { success: boolean; error?: { issues: unknown[] } },
  path: string[]
) {
  if (result.success || !result.error) return false;
  return result.error.issues.some((issue) => {
    if (typeof issue !== "object" || issue === null || !("path" in issue)) {
      return false;
    }
    const issuePath = issue.path;
    return Array.isArray(issuePath) && issuePath.join(".") === path.join(".");
  });
}

function parseInput(input: Record<string, unknown>) {
  return Seedream55LayerDecompositionRequestSchema.safeParse({
    model: MODEL,
    input,
  });
}

describe("Kie Seedream 5.5 layer decomposition request contract", () => {
  it("accepts the documented example directly, through the guard, and through the aggregates", () => {
    expect(
      Seedream55LayerDecompositionRequestSchema.safeParse(DOCUMENTED_REQUEST)
        .success
    ).toBe(true);
    expect(
      CREATE_TASK_GUARDS[MODEL].safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(DOCUMENTED_REQUEST).success).toBe(
      true
    );
    expect(
      MediaGenerationRequestSchema.safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
  });

  it("injects the documented defaults and leaves the prompt optional", () => {
    const parsed = Seedream55LayerDecompositionRequestSchema.parse({
      model: MODEL,
      input: { image_url: IMAGE },
    });
    expect(parsed.input).toEqual({
      image_url: IMAGE,
      size: "auto",
      output_format: "png",
      max_images: 30,
      text_recognition: false,
      nsfw_checker: false,
    });
  });

  it("requires exactly one image URL", () => {
    for (const image_url of [undefined, "not a url", [IMAGE]]) {
      const result = parseInput({ image_url });
      expect(result.success, JSON.stringify(image_url)).toBe(false);
      expect(issueAt(result, ["input", "image_url"])).toBe(true);
    }
  });

  it("bounds the prompt to 2000 characters, empty included", () => {
    for (const prompt of ["", "x".repeat(2000)]) {
      expect(parseInput({ image_url: IMAGE, prompt }).success).toBe(true);
    }
    const long = parseInput({ image_url: IMAGE, prompt: "x".repeat(2001) });
    expect(long.success).toBe(false);
    expect(issueAt(long, ["input", "prompt"])).toBe(true);
  });

  it("takes max_images as an integer from 2 to 100", () => {
    for (const max_images of [2, 100]) {
      expect(parseInput({ image_url: IMAGE, max_images }).success).toBe(true);
    }
    for (const max_images of [1, 101, 2.5, "30"]) {
      const result = parseInput({ image_url: IMAGE, max_images });
      expect(result.success, String(max_images)).toBe(false);
      expect(issueAt(result, ["input", "max_images"])).toBe(true);
    }
  });

  it("rejects values outside the documented enums and non-boolean flags", () => {
    for (const [field, value] of [
      ["size", "4K"],
      ["output_format", "webp"],
      ["text_recognition", "true"],
      ["nsfw_checker", 0],
    ] as const) {
      const result = parseInput({ image_url: IMAGE, [field]: value });
      expect(result.success, field).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
    for (const size of ["auto", "1K", "1.5K", "2K"]) {
      expect(parseInput({ image_url: IMAGE, size }).success, size).toBe(true);
    }
  });
});

describe("Kie Seedream 5.5 layer decomposition model id", () => {
  it("lists the id, which the Seedream alias also reads", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(
      Seedream55LayerDecompositionRequestSchema
    );
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "image_url",
      "prompt",
      "size",
      "output_format",
      "max_images",
      "text_recognition",
      "nsfw_checker",
    ]);
    expect(descriptor.fields.image_url.required).toBe(true);
    expect(descriptor.fields.prompt.required).toBeUndefined();
    expect(descriptor.fields.size.enum).toEqual(["auto", "1K", "1.5K", "2K"]);
    expect(descriptor.fields.size.default).toBe("auto");
    expect(descriptor.fields.output_format.default).toBe("png");
    expect(descriptor.fields.max_images).toMatchObject({
      type: "integer",
      minimum: 2,
      maximum: 100,
      default: 30,
    });
  });
});

describe("Kie Seedream 5.5 layer decomposition public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootSeedream55LayerDecompositionRequestSchema).toBe(
      Seedream55LayerDecompositionRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<Seedream55LayerDecompositionRequestInput>().toEqualTypeOf<Seedream55LayerDecompositionRequest>();
    expectTypeOf(
      Seedream55LayerDecompositionRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<Seedream55LayerDecompositionParsedRequest>();
    expectTypeOf<
      Seedream55LayerDecompositionRequest["model"]
    >().toEqualTypeOf<"seedream/5-5-layer-decomposition">();
    expectTypeOf<
      Seedream55LayerDecompositionParsedRequest["input"]["max_images"]
    >().toEqualTypeOf<number>();
  });
});
