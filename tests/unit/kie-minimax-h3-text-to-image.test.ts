import { describe, expect, expectTypeOf, it } from "vitest";

import {
  MiniMaxH3ImageTaskResultJsonSchema as RootMiniMaxH3ImageTaskResultJsonSchema,
  MiniMaxH3TextToImageRequestSchema as RootMiniMaxH3TextToImageRequestSchema,
  type MiniMaxH3ImageTaskResultJson,
  type MiniMaxH3TextToImageParsedRequest,
  type MiniMaxH3TextToImageRequest,
  type MiniMaxH3TextToImageRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
  MiniMaxH3ImageAspectRatioSchema,
  MiniMaxH3ImageOutputFormatSchema,
  MiniMaxH3ImageResolutionSchema,
  MiniMaxH3ImageTaskResultJsonSchema,
  MiniMaxH3TextToImageRequestSchema,
} from "@apicity/kie/zod";

import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "minimax-h3/text-to-image" as const;

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      "A cozy bookstore cafe on a rainy evening, warm lights glowing through the window, a ginger cat sleeping on a stack of books",
    aspect_ratio: "16:9",
    resolution: "2K",
    output_format: "png",
  },
} satisfies MiniMaxH3TextToImageRequest;

// The recorded pin (tests/integration/kie-minimax-h3-text-to-image.test.ts).
const RECORDED_REQUEST = {
  model: MODEL,
  input: {
    prompt: "A red balloon.",
    aspect_ratio: "1:1",
    resolution: "1K",
    output_format: "jpeg",
  },
} satisfies MiniMaxH3TextToImageRequest;

const ASPECT_RATIOS = [
  "auto",
  "1:1",
  "5:4",
  "4:3",
  "3:2",
  "16:9",
  "21:9",
  "4:5",
  "3:4",
  "2:3",
  "9:16",
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
  return MiniMaxH3TextToImageRequestSchema.safeParse({ model: MODEL, input });
}

describe("Kie MiniMax H3 text-to-image request contract", () => {
  it("accepts the documented example and the recorded pin directly, through the guard, and through the aggregates", () => {
    for (const request of [DOCUMENTED_REQUEST, RECORDED_REQUEST]) {
      expect(MiniMaxH3TextToImageRequestSchema.safeParse(request).success).toBe(
        true
      );
      expect(CREATE_TASK_GUARDS[MODEL].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    }
  });

  it("injects only the conflict-free defaults: expand_prompt and output_format", () => {
    const parsed = MiniMaxH3TextToImageRequestSchema.parse({
      model: MODEL,
      input: { prompt: "A red balloon." },
    });
    // resolution (2K) and aspect_ratio (auto) are documented upstream
    // defaults, left unset so a custom size is never read as a conflict.
    expect(parsed.input).toEqual({
      prompt: "A red balloon.",
      expand_prompt: true,
      output_format: "png",
    });
  });

  it("takes the eleven documented ratios and the three size tiers", () => {
    for (const aspect_ratio of ASPECT_RATIOS) {
      expect(
        parseInput({ prompt: "A red balloon.", aspect_ratio }).success,
        aspect_ratio
      ).toBe(true);
    }
    for (const resolution of ["1K", "2K", "4K"]) {
      expect(
        parseInput({ prompt: "A red balloon.", resolution }).success,
        resolution
      ).toBe(true);
    }
    // Upstream also reads the tier case-insensitively; this schema takes the
    // documented spelling only.
    for (const [field, value] of [
      ["aspect_ratio", "adaptive"],
      ["aspect_ratio", "9:21"],
      ["resolution", "8K"],
      ["resolution", "2k"],
      ["resolution", "768P"],
      ["output_format", "webp"],
      ["expand_prompt", "false"],
    ] as const) {
      const result = parseInput({ prompt: "A red balloon.", [field]: value });
      expect(result.success, `${field}=${value}`).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
  });

  it("bounds the prompt to 1-5000 characters, not the video models' 7000", () => {
    for (const prompt of ["A", "x".repeat(5000)]) {
      expect(parseInput({ prompt }).success).toBe(true);
    }
    for (const prompt of [undefined, "", "x".repeat(5001)]) {
      const result = parseInput({ prompt });
      expect(result.success, String(prompt?.length)).toBe(false);
      expect(issueAt(result, ["input", "prompt"])).toBe(true);
    }
  });

  it("bounds seed to an integer 0-2147483647", () => {
    for (const seed of [0, 7, 2147483647]) {
      expect(parseInput({ prompt: "A red balloon.", seed }).success).toBe(true);
    }
    for (const seed of [-1, 2147483648, 1.5, "7"]) {
      const result = parseInput({ prompt: "A red balloon.", seed });
      expect(result.success, String(seed)).toBe(false);
      expect(issueAt(result, ["input", "seed"])).toBe(true);
    }
  });

  it("accepts a custom width x height alone, inside the pixel and ratio bounds", () => {
    for (const [width, height] of [
      [1920, 1080],
      [3840, 2160],
      [1024, 640], // 655,360 pixels, the lower bound
      [5000, 4000], // 20,000,000 pixels, the upper bound
      [3000, 1000], // exactly 3:1
      [1000, 3000], // exactly 1:3
    ]) {
      expect(
        parseInput({ prompt: "A red balloon.", width, height }).success,
        `${width}x${height}`
      ).toBe(true);
    }
  });

  it("rejects a lone dimension, a custom size with a tier or ratio, and sizes out of bounds", () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ width: 1920 }, "height"],
      [{ height: 1080 }, "width"],
      [{ width: 1920, height: 1080, resolution: "2K" }, "resolution"],
      [{ width: 1920, height: 1080, aspect_ratio: "16:9" }, "aspect_ratio"],
      [{ width: 800, height: 800 }, "width"], // 640,000 pixels
      [{ width: 5000, height: 4001 }, "width"], // 20,005,000 pixels
      [{ width: 3001, height: 1000 }, "width"], // wider than 3:1
      [{ width: 1000, height: 3001 }, "width"], // taller than 1:3
      [{ width: 8193, height: 2731 }, "width"], // past the 8192 edge
      [{ width: 1920.5, height: 1080 }, "width"],
    ];
    for (const [size, field] of cases) {
      const result = parseInput({ prompt: "A red balloon.", ...size });
      expect(result.success, JSON.stringify(size)).toBe(false);
      expect(issueAt(result, ["input", field]), JSON.stringify(size)).toBe(
        true
      );
    }
  });

  it("rejects fields the docs do not list and a non-URL callBackUrl", () => {
    const extra = parseInput({ prompt: "A red balloon.", num_images: 2 });
    expect(extra.success).toBe(false);
    const callBack = MiniMaxH3TextToImageRequestSchema.safeParse({
      ...RECORDED_REQUEST,
      callBackUrl: "not a url",
    });
    expect(callBack.success).toBe(false);
    expect(issueAt(callBack, ["callBackUrl"])).toBe(true);
  });

  it("carries the docs' field text into the JSON schema that apicity describe prints", () => {
    interface JsonNode {
      required?: string[];
      properties?: Record<string, JsonNode>;
      description?: string;
      default?: unknown;
    }
    const json = zodToJsonSchema(MiniMaxH3TextToImageRequestSchema) as JsonNode;
    const input = json.properties?.input;
    expect(input?.required).toEqual(["prompt"]);
    const properties = input?.properties ?? {};
    expect(Object.keys(properties)).toEqual([
      "prompt",
      "aspect_ratio",
      "resolution",
      "seed",
      "expand_prompt",
      "output_format",
      "width",
      "height",
    ]);
    expect(properties.aspect_ratio?.description).toContain(
      "when expand_prompt is false, auto uses 1:1"
    );
    expect(properties.resolution?.description).toContain(
      "Optional, default 2K"
    );
    expect(properties.resolution?.default).toBeUndefined();
    expect(properties.expand_prompt?.default).toBe(true);
    expect(properties.output_format?.default).toBe("png");
    expect(properties.width?.description).toContain(
      "between 655,360 and 20,000,000"
    );
    expect(properties.width?.description).toContain("up to 4,500,000 -> 2K");
  });
});

describe("Kie MiniMax H3 text-to-image model id", () => {
  it("lists the id; the H3 family stays enum-only", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
    expect(
      KieMediaModelSchema.safeParse("minimax-h3/text-to-image-hd").success
    ).toBe(false);
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(MiniMaxH3TextToImageRequestSchema);
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "aspect_ratio",
      "resolution",
      "seed",
      "expand_prompt",
      "output_format",
      "width",
      "height",
    ]);
    expect(descriptor.fields.prompt).toMatchObject({
      required: true,
      minLength: 1,
      maxLength: 5000,
    });
    expect(descriptor.fields.aspect_ratio.enum).toEqual([...ASPECT_RATIOS]);
    expect(descriptor.fields.aspect_ratio.enum).toEqual(
      MiniMaxH3ImageAspectRatioSchema.options
    );
    expect(descriptor.fields.aspect_ratio.default).toBe("auto");
    expect(descriptor.fields.resolution.enum).toEqual(
      MiniMaxH3ImageResolutionSchema.options
    );
    expect(descriptor.fields.resolution.default).toBe("2K");
    expect(descriptor.fields.output_format.enum).toEqual(
      MiniMaxH3ImageOutputFormatSchema.options
    );
    expect(descriptor.fields.output_format.default).toBe("png");
    expect(descriptor.fields.expand_prompt.default).toBe(true);
    for (const field of ["seed", "width", "height"] as const) {
      expect(descriptor.fields[field].type).toBe("integer");
      expect(descriptor.fields[field].required).toBeUndefined();
    }
    expect(descriptor.fields.seed).toMatchObject({
      minimum: 0,
      maximum: 2147483647,
    });
    expect(descriptor.fields.width).toMatchObject({
      minimum: 1,
      maximum: 8192,
    });
    expect(descriptor.fields.height).toMatchObject({
      minimum: 1,
      maximum: 8192,
    });
  });
});

describe("Kie MiniMax H3 Image task result", () => {
  it("reads the recorded resultJson, seed included", () => {
    // From the 2026-11-12 recording: one JPEG URL and the seed it used.
    const recorded = JSON.parse(
      '{"resultUrls":["https://tempfile.aiquickdraw.com/js/y1/ad344ec5359d37f6a952ac9b.jpg"],"seed":1903329667}'
    ) as unknown;
    const parsed = MiniMaxH3ImageTaskResultJsonSchema.parse(recorded);
    expect(parsed.seed).toBe(1903329667);
    expect(parsed.resultUrls).toHaveLength(1);
    // The docs callback example has no seed.
    expect(
      MiniMaxH3ImageTaskResultJsonSchema.safeParse({
        resultUrls: [
          "https://tempfile.aiquickdraw.com/js/y1/9ef89580655a9e961ad0adb2.png",
        ],
      }).success
    ).toBe(true);
    expect(MiniMaxH3ImageTaskResultJsonSchema.safeParse({}).success).toBe(
      false
    );
    expect(
      MiniMaxH3ImageTaskResultJsonSchema.safeParse({ resultUrls: [] }).success
    ).toBe(false);
  });
});

describe("Kie MiniMax H3 text-to-image public exports", () => {
  it("keeps the root schema values identical to the zod subpath", () => {
    expect(RootMiniMaxH3TextToImageRequestSchema).toBe(
      MiniMaxH3TextToImageRequestSchema
    );
    expect(RootMiniMaxH3ImageTaskResultJsonSchema).toBe(
      MiniMaxH3ImageTaskResultJsonSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<MiniMaxH3TextToImageRequestInput>().toEqualTypeOf<MiniMaxH3TextToImageRequest>();
    expectTypeOf(
      MiniMaxH3TextToImageRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<MiniMaxH3TextToImageParsedRequest>();
    expectTypeOf<
      MiniMaxH3TextToImageRequest["model"]
    >().toEqualTypeOf<"minimax-h3/text-to-image">();
    expectTypeOf<
      MiniMaxH3TextToImageRequest["input"]["resolution"]
    >().toEqualTypeOf<"1K" | "2K" | "4K" | undefined>();
    expectTypeOf<MiniMaxH3ImageTaskResultJson["seed"]>().toEqualTypeOf<
      number | undefined
    >();
  });
});
