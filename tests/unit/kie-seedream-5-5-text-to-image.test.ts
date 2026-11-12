import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Seedream55TextToImageRequestSchema as RootSeedream55TextToImageRequestSchema,
  type Seedream55TextToImageParsedRequest,
  type Seedream55TextToImageRequest,
  type Seedream55TextToImageRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
  Seedream55TextToImageRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "seedream/5-5-text-to-image" as const;

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      "A premium skincare e-commerce hero image: a glass serum bottle on a pure white display stand under soft light, commercial photorealistic photography",
    aspect_ratio: "16:9",
    size: "2K",
    output_format: "png",
    background: "auto",
    nsfw_checker: false,
  },
} satisfies Seedream55TextToImageRequest;

const ASPECT_RATIOS = [
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
  "2:3",
  "3:2",
  "21:9",
] as const;

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
  return Seedream55TextToImageRequestSchema.safeParse({ model: MODEL, input });
}

describe("Kie Seedream 5.5 text-to-image request contract", () => {
  it("accepts the documented example directly, through the guard, and through the aggregates", () => {
    expect(
      Seedream55TextToImageRequestSchema.safeParse(DOCUMENTED_REQUEST).success
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

  it("injects the documented defaults and keeps the required aspect ratio", () => {
    const parsed = Seedream55TextToImageRequestSchema.parse({
      model: MODEL,
      input: { prompt: "A red balloon", aspect_ratio: "1:1" },
    });
    expect(parsed.input).toEqual({
      prompt: "A red balloon",
      aspect_ratio: "1:1",
      size: "2K",
      output_format: "png",
      background: "auto",
      nsfw_checker: false,
    });
  });

  it("requires aspect_ratio, takes the eight documented ratios, and has no auto", () => {
    for (const aspect_ratio of ASPECT_RATIOS) {
      expect(
        parseInput({ prompt: "A red balloon", aspect_ratio }).success,
        aspect_ratio
      ).toBe(true);
    }
    for (const aspect_ratio of [undefined, "auto", "5:4"]) {
      const result = parseInput({ prompt: "A red balloon", aspect_ratio });
      expect(result.success, String(aspect_ratio)).toBe(false);
      expect(issueAt(result, ["input", "aspect_ratio"])).toBe(true);
    }
  });

  it("bounds the prompt to 5-5000 characters", () => {
    for (const prompt of ["Blue!", "x".repeat(5000)]) {
      expect(parseInput({ prompt, aspect_ratio: "1:1" }).success).toBe(true);
    }
    for (const prompt of [undefined, "blue", "x".repeat(5001)]) {
      const result = parseInput({ prompt, aspect_ratio: "1:1" });
      expect(result.success, String(prompt?.length)).toBe(false);
      expect(issueAt(result, ["input", "prompt"])).toBe(true);
    }
  });

  it("rejects values outside the documented enums and a non-boolean nsfw_checker", () => {
    for (const [field, value] of [
      ["size", "4K"],
      ["output_format", "webp"],
      ["background", "blurred"],
      ["nsfw_checker", "false"],
    ] as const) {
      const result = parseInput({
        prompt: "A red balloon",
        aspect_ratio: "1:1",
        [field]: value,
      });
      expect(result.success, field).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
  });

  it("allows a transparent background only with png output", () => {
    expect(
      parseInput({
        prompt: "A red balloon",
        aspect_ratio: "1:1",
        background: "transparent",
      }).success
    ).toBe(true);
    const jpeg = parseInput({
      prompt: "A red balloon",
      aspect_ratio: "1:1",
      background: "transparent",
      output_format: "jpeg",
    });
    expect(jpeg.success).toBe(false);
    expect(issueAt(jpeg, ["input", "background"])).toBe(true);
  });
});

describe("Kie Seedream 5.5 text-to-image model id", () => {
  it("lists the id, which the Seedream alias also reads", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(Seedream55TextToImageRequestSchema);
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "aspect_ratio",
      "size",
      "output_format",
      "background",
      "nsfw_checker",
    ]);
    expect(descriptor.fields.prompt.required).toBe(true);
    expect(descriptor.fields.aspect_ratio.required).toBe(true);
    expect(descriptor.fields.aspect_ratio.enum).toEqual([...ASPECT_RATIOS]);
    expect(descriptor.fields.aspect_ratio.default).toBeUndefined();
    expect(descriptor.fields.size.enum).toEqual(["1K", "1.5K", "2K"]);
    expect(descriptor.fields.size.default).toBe("2K");
    expect(descriptor.fields.output_format.default).toBe("png");
    expect(descriptor.fields.background.default).toBe("auto");
  });
});

describe("Kie Seedream 5.5 text-to-image public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootSeedream55TextToImageRequestSchema).toBe(
      Seedream55TextToImageRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<Seedream55TextToImageRequestInput>().toEqualTypeOf<Seedream55TextToImageRequest>();
    expectTypeOf(
      Seedream55TextToImageRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<Seedream55TextToImageParsedRequest>();
    expectTypeOf<
      Seedream55TextToImageRequest["model"]
    >().toEqualTypeOf<"seedream/5-5-text-to-image">();
    expectTypeOf<
      Seedream55TextToImageRequest["input"]["aspect_ratio"]
    >().toEqualTypeOf<
      "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "2:3" | "3:2" | "21:9"
    >();
  });
});
