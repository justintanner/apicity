import { describe, expect, expectTypeOf, it } from "vitest";

import {
  MiniMaxH3ImageEditRequestSchema as RootMiniMaxH3ImageEditRequestSchema,
  type MiniMaxH3ImageEditParsedRequest,
  type MiniMaxH3ImageEditRequest,
  type MiniMaxH3ImageEditRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
  MiniMaxH3ImageAspectRatioSchema,
  MiniMaxH3ImageEditRequestSchema,
  MiniMaxH3ImageTaskResultJsonSchema,
} from "@apicity/kie/zod";

import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "minimax-h3/image-edit" as const;
const IMAGE = "https://example.com/cat.jpg";

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      "Place the skincare products from <Picture 1> on a sunlit white marble bathroom counter. Keep the product shapes, colors and label text unchanged.",
    image_urls: [
      "https://static.aiquickdraw.com/tools/example/1794319554733_LhkHjUSS.png",
    ],
    aspect_ratio: "auto",
    resolution: "2K",
    output_format: "png",
  },
} satisfies MiniMaxH3ImageEditRequest;

// The recorded pin (tests/integration/kie-minimax-h3-image-edit.test.ts);
// the recording sent KIE's upload URL for cat1.jpg.
const RECORDED_REQUEST = {
  model: MODEL,
  input: {
    prompt: "Add a small red scarf to the cat in <Picture 1>.",
    image_urls: [IMAGE],
    resolution: "1K",
    aspect_ratio: "auto",
    output_format: "jpeg",
  },
} satisfies MiniMaxH3ImageEditRequest;

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
  return MiniMaxH3ImageEditRequestSchema.safeParse({ model: MODEL, input });
}

describe("Kie MiniMax H3 image-edit request contract", () => {
  it("accepts the documented example and the recorded pin directly, through the guard, and through the aggregates", () => {
    for (const request of [DOCUMENTED_REQUEST, RECORDED_REQUEST]) {
      expect(MiniMaxH3ImageEditRequestSchema.safeParse(request).success).toBe(
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
    const parsed = MiniMaxH3ImageEditRequestSchema.parse({
      model: MODEL,
      input: { prompt: "Add a scarf.", image_urls: [IMAGE] },
    });
    expect(parsed.input).toEqual({
      prompt: "Add a scarf.",
      image_urls: [IMAGE],
      expand_prompt: true,
      output_format: "png",
    });
  });

  it("requires 1-16 http(s) image_urls", () => {
    for (const image_urls of [[IMAGE], Array(16).fill(IMAGE)]) {
      expect(
        parseInput({ prompt: "Add a scarf.", image_urls }).success,
        String(image_urls.length)
      ).toBe(true);
    }
    for (const image_urls of [
      undefined,
      [],
      Array(17).fill(IMAGE),
      ["ftp://example.com/cat.jpg"],
      [""],
      "https://example.com/cat.jpg",
    ]) {
      const result = parseInput({ prompt: "Add a scarf.", image_urls });
      expect(result.success, JSON.stringify(image_urls)).toBe(false);
      expect(
        result.error?.issues.some(
          (issue) => issue.path.slice(0, 2).join(".") === "input.image_urls"
        ),
        JSON.stringify(image_urls)
      ).toBe(true);
    }
  });

  it("shares text-to-image's tiers, ratios, prompt bounds and size rule", () => {
    for (const aspect_ratio of MiniMaxH3ImageAspectRatioSchema.options) {
      expect(
        parseInput({
          prompt: "Add a scarf.",
          image_urls: [IMAGE],
          aspect_ratio,
        }).success,
        aspect_ratio
      ).toBe(true);
    }
    for (const prompt of ["A", "x".repeat(5000)]) {
      expect(parseInput({ prompt, image_urls: [IMAGE] }).success).toBe(true);
    }
    for (const prompt of ["", "x".repeat(5001)]) {
      const result = parseInput({ prompt, image_urls: [IMAGE] });
      expect(result.success).toBe(false);
      expect(issueAt(result, ["input", "prompt"])).toBe(true);
    }
    const custom = parseInput({
      prompt: "Add a scarf.",
      image_urls: [IMAGE],
      width: 1920,
      height: 1080,
    });
    expect(custom.success).toBe(true);
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ width: 1920 }, "height"],
      [{ width: 1920, height: 1080, resolution: "1K" }, "resolution"],
      [{ width: 1920, height: 1080, aspect_ratio: "auto" }, "aspect_ratio"],
      [{ width: 800, height: 800 }, "width"],
      [{ width: 3001, height: 1000 }, "width"],
      [{ resolution: "8K" }, "resolution"],
      [{ seed: -1 }, "seed"],
    ];
    for (const [fields, field] of cases) {
      const result = parseInput({
        prompt: "Add a scarf.",
        image_urls: [IMAGE],
        ...fields,
      });
      expect(result.success, JSON.stringify(fields)).toBe(false);
      expect(issueAt(result, ["input", field]), JSON.stringify(fields)).toBe(
        true
      );
    }
  });

  it("rejects fields the docs do not list", () => {
    const extra = parseInput({
      prompt: "Add a scarf.",
      image_urls: [IMAGE],
      mask_url: IMAGE,
    });
    expect(extra.success).toBe(false);
  });

  it("carries the docs' field text into the JSON schema that apicity describe prints", () => {
    interface JsonNode {
      required?: string[];
      properties?: Record<string, JsonNode>;
      description?: string;
      minItems?: number;
      maxItems?: number;
    }
    const json = zodToJsonSchema(MiniMaxH3ImageEditRequestSchema) as JsonNode;
    const input = json.properties?.input;
    expect(input?.required).toEqual(["prompt", "image_urls"]);
    const properties = input?.properties ?? {};
    expect(Object.keys(properties)).toEqual([
      "prompt",
      "aspect_ratio",
      "resolution",
      "seed",
      "expand_prompt",
      "output_format",
      "image_urls",
      "width",
      "height",
    ]);
    expect(properties.prompt?.description).toContain("<Picture 1>");
    expect(properties.aspect_ratio?.description).toContain(
      "follows the aspect ratio of the first reference image"
    );
    expect(properties.image_urls).toMatchObject({ minItems: 1, maxItems: 16 });
    expect(properties.image_urls?.description).toContain(
      "Every reference image is billed, the first included"
    );
  });
});

describe("Kie MiniMax H3 image-edit model id", () => {
  it("lists the id; the H3 family stays enum-only", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
    expect(
      KieMediaModelSchema.safeParse("minimax-h3/image-edit-pro").success
    ).toBe(false);
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(MiniMaxH3ImageEditRequestSchema);
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "aspect_ratio",
      "resolution",
      "seed",
      "expand_prompt",
      "output_format",
      "image_urls",
      "width",
      "height",
    ]);
    expect(descriptor.fields.image_urls).toMatchObject({
      type: "array",
      required: true,
      minItems: 1,
      maxItems: 16,
      items: { type: "string" },
    });
    expect(descriptor.fields.prompt).toMatchObject({
      required: true,
      minLength: 1,
      maxLength: 5000,
    });
    expect(descriptor.fields.aspect_ratio.default).toBe("auto");
    // The fields text-to-image describes in the same words are the same
    // objects here.
    const textToImage = modelInputSchemas["minimax-h3/text-to-image"].fields;
    for (const field of [
      "resolution",
      "seed",
      "expand_prompt",
      "output_format",
      "width",
      "height",
    ] as const) {
      expect(descriptor.fields[field], field).toBe(textToImage[field]);
    }
  });
});

describe("Kie MiniMax H3 image-edit task result", () => {
  it("reads the recorded resultJson, seed included", () => {
    // From the 2026-11-12 recording: one JPEG URL and the seed it used.
    const recorded = JSON.parse(
      '{"resultUrls":["https://tempfile.aiquickdraw.com/js/y1/b94ea63bc1557928e63dbcd0.jpg"],"seed":838955410}'
    ) as unknown;
    expect(MiniMaxH3ImageTaskResultJsonSchema.parse(recorded).seed).toBe(
      838955410
    );
  });
});

describe("Kie MiniMax H3 image-edit public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootMiniMaxH3ImageEditRequestSchema).toBe(
      MiniMaxH3ImageEditRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<MiniMaxH3ImageEditRequestInput>().toEqualTypeOf<MiniMaxH3ImageEditRequest>();
    expectTypeOf(
      MiniMaxH3ImageEditRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<MiniMaxH3ImageEditParsedRequest>();
    expectTypeOf<
      MiniMaxH3ImageEditRequest["model"]
    >().toEqualTypeOf<"minimax-h3/image-edit">();
    expectTypeOf<
      MiniMaxH3ImageEditRequest["input"]["image_urls"]
    >().toEqualTypeOf<string[]>();
  });
});
