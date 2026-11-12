import { describe, expect, expectTypeOf, it } from "vitest";

import {
  GptImage26SunburstTextToImageRequestSchema as RootGptImage26SunburstTextToImageRequestSchema,
  type GptImage26SunburstTextToImageParsedRequest,
  type GptImage26SunburstTextToImageRequest,
  type GptImage26SunburstTextToImageRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  GptImage26SunburstTextToImageRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// The three request examples of
// https://docs.kie.ai/market/gpt/gpt-image-2-6-sunburst-text-to-image (read
// 2026-11-12): a static image, a GIF and an SVG. The SVG example names
// `gpt-5.4-mini`, which the page's own svg.model enum does not list; the open
// author-model alias accepts it.
const GPT_IMAGE_26_CONTRACTS = [
  {
    model: "gpt-image-2-6/sunburst-text-to-image",
    schema: GptImage26SunburstTextToImageRequestSchema,
    request: {
      model: "gpt-image-2-6/sunburst-text-to-image",
      callBackUrl: "https://your-domain.com/api/callback",
      input: {
        prompt:
          'A cinematic product photo of a red maple leaf on dark stone, soft side light, shallow depth of field, with a small paper tag that reads "BATCH 07".',
        aspect_ratio: "16:9",
        resolution: "1K",
        quality: "medium",
        background: "auto",
        output_format: "png",
      },
    } satisfies GptImage26SunburstTextToImageRequest,
    gif: {
      model: "gpt-image-2-6/sunburst-text-to-image",
      input: {
        prompt: "a waving flag",
        output_format: "gif",
        size: "512x512",
        frame_count: 9,
        frame_duration_ms: 200,
      },
    } satisfies GptImage26SunburstTextToImageRequest,
    svg: {
      model: "gpt-image-2-6/sunburst-text-to-image",
      input: {
        prompt: "a simple maple leaf icon",
        output_format: "svg",
        svg: { model: "gpt-5.4-mini" },
      },
    } satisfies GptImage26SunburstTextToImageRequest,
  },
] as const;

const GPT_IMAGE_26_MODELS = GPT_IMAGE_26_CONTRACTS.map(({ model }) => model);

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

describe("Kie GPT Image 2.6 request contracts", () => {
  it("accepts every documented example directly, through the guard, and through the aggregates", () => {
    for (const contract of GPT_IMAGE_26_CONTRACTS) {
      for (const request of [contract.request, contract.gif, contract.svg]) {
        expect(contract.schema.safeParse(request).success).toBe(true);
        expect(
          CREATE_TASK_GUARDS[contract.model].safeParse(request).success
        ).toBe(true);
        expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
        expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
          true
        );
      }
    }
  });

  it("injects the documented defaults for an otherwise empty input", () => {
    for (const contract of GPT_IMAGE_26_CONTRACTS) {
      const parsed = contract.schema.parse({
        model: contract.model,
        input: { prompt: "A red balloon." },
      });
      expect(parsed.input).toEqual({
        prompt: "A red balloon.",
        aspect_ratio: "auto",
        resolution: "1K",
        quality: "medium",
        background: "auto",
        output_format: "png",
        complexity: "high",
        moderation: "low",
      });
    }
  });

  it("defaults svg.model to gpt-5.6-luna and keeps the author-model id open", () => {
    const contract = GPT_IMAGE_26_CONTRACTS[0];
    const parsed = contract.schema.parse({
      model: contract.model,
      input: { prompt: "an icon", output_format: "svg", svg: {} },
    });
    expect(parsed.input.svg?.model).toBe("gpt-5.6-luna");
    for (const model of ["gpt-6-sol", "gpt-5.6-terra", "gpt-6-luna"]) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { prompt: "an icon", output_format: "svg", svg: { model } },
      });
      expect(result.success, model).toBe(true);
    }
    for (const model of ["gpt6-sol", "claude-opus-5", "gpt-5-6"]) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { prompt: "an icon", output_format: "svg", svg: { model } },
      });
      expect(result.success, model).toBe(false);
      expect(issueAt(result, ["input", "svg", "model"]), model).toBe(true);
    }
  });

  it("rejects an empty or oversized prompt and unknown enum values", () => {
    const contract = GPT_IMAGE_26_CONTRACTS[0];
    const cases: Array<[string, Record<string, unknown>]> = [
      ["prompt", { prompt: "" }],
      ["prompt", { prompt: "x".repeat(32001) }],
      ["aspect_ratio", { aspect_ratio: "27:16" }],
      ["resolution", { resolution: "8K" }],
      ["quality", { quality: "ultra" }],
      ["background", { background: "blurred" }],
      ["output_format", { output_format: "jpg" }],
      ["complexity", { complexity: "max" }],
      ["moderation", { moderation: "high" }],
    ];
    for (const [field, patch] of cases) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { ...contract.request.input, ...patch },
      });
      expect(result.success, field).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
  });

  it("keeps a transparent background to png, webp and gif", () => {
    const contract = GPT_IMAGE_26_CONTRACTS[0];
    for (const output_format of ["png", "webp", "gif"] as const) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: {
          prompt: "a sticker",
          background: "transparent",
          output_format,
        },
      });
      expect(result.success, output_format).toBe(true);
    }
    for (const output_format of ["jpeg", "svg"] as const) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: {
          prompt: "a sticker",
          background: "transparent",
          output_format,
        },
      });
      expect(result.success, output_format).toBe(false);
      expect(issueAt(result, ["input", "background"]), output_format).toBe(
        true
      );
    }
  });

  it("accepts output_compression 0-100 for jpeg and webp only", () => {
    const contract = GPT_IMAGE_26_CONTRACTS[0];
    for (const output_format of ["jpeg", "webp"] as const) {
      for (const output_compression of [0, 100]) {
        const result = contract.schema.safeParse({
          model: contract.model,
          input: { prompt: "a photo", output_format, output_compression },
        });
        expect(result.success, `${output_format} ${output_compression}`).toBe(
          true
        );
      }
    }
    for (const [patch, label] of [
      [{ output_format: "png", output_compression: 50 }, "png"],
      [{ output_format: "jpeg", output_compression: 101 }, "101"],
      [{ output_format: "jpeg", output_compression: 50.5 }, "50.5"],
    ] as const) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { prompt: "a photo", ...patch },
      });
      expect(result.success, label).toBe(false);
      expect(issueAt(result, ["input", "output_compression"]), label).toBe(
        true
      );
    }
  });

  it("allows the GIF fields only with gif output, within their documented bounds", () => {
    const contract = GPT_IMAGE_26_CONTRACTS[0];
    for (const [field, value] of [
      ["size", "512x512"],
      ["frame_count", 9],
      ["frame_duration_ms", 200],
    ] as const) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { prompt: "a flag", output_format: "png", [field]: value },
      });
      expect(result.success, field).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
    for (const [field, value] of [
      ["size", "500x500"],
      ["size", "1:1"],
      ["frame_count", 1],
      ["frame_count", 17],
      ["frame_duration_ms", 10],
      ["frame_duration_ms", 2001],
    ] as const) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { prompt: "a flag", output_format: "gif", [field]: value },
      });
      expect(result.success, `${field} ${value}`).toBe(false);
      expect(issueAt(result, ["input", field]), `${field} ${value}`).toBe(true);
    }
    for (const size of ["auto", "768x768", "512x1024"]) {
      const result = contract.schema.safeParse({
        model: contract.model,
        input: { prompt: "a flag", output_format: "gif", size },
      });
      expect(result.success, size).toBe(true);
    }
  });

  it("sends the svg object only with svg output", () => {
    const contract = GPT_IMAGE_26_CONTRACTS[0];
    const result = contract.schema.safeParse({
      model: contract.model,
      input: {
        prompt: "an icon",
        output_format: "png",
        svg: { model: "gpt-5.6-luna" },
      },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "svg"])).toBe(true);
  });
});

describe("Kie GPT Image 2.6 model ids", () => {
  it("lists the ids and keeps the family alias open to the 2.6 grammar", () => {
    for (const model of GPT_IMAGE_26_MODELS) {
      expect(KIE_MEDIA_MODELS).toContain(model);
    }
    for (const model of [
      "gpt-image-2-7/sunburst-text-to-image",
      "gpt-image-2-6/flare-image-to-image",
      "gpt-image-3/economy-text-to-image",
    ]) {
      expect(KieMediaModelSchema.safeParse(model).success, model).toBe(true);
    }
    for (const model of [
      "gpt-image-2-6",
      "gpt-image-2-6/sunburst",
      "gpt-image-2-6/text-to-image",
      "gpt-image-2-6/sunburst/text-to-image",
      "gpt-image-2-6//sunburst-text-to-image",
    ]) {
      expect(KieMediaModelSchema.safeParse(model).success, model).toBe(false);
    }
  });
});

describe("Kie GPT Image 2.6 registries and descriptors", () => {
  it("has the same ids in the roster, guards, and descriptors", () => {
    const prefix = "gpt-image-2-6/";
    expect(
      KIE_MEDIA_MODELS.filter((model) => model.startsWith(prefix))
    ).toEqual(GPT_IMAGE_26_MODELS);
    expect(
      Object.keys(CREATE_TASK_GUARDS).filter((model) =>
        model.startsWith(prefix)
      )
    ).toEqual(GPT_IMAGE_26_MODELS);
    expect(
      Object.keys(modelInputSchemas).filter((model) => model.startsWith(prefix))
    ).toEqual(GPT_IMAGE_26_MODELS);
    for (const contract of GPT_IMAGE_26_CONTRACTS) {
      expect(CREATE_TASK_GUARDS[contract.model]).toBe(contract.schema);
    }
  });

  it("describes every request field with the documented defaults", () => {
    const descriptor =
      modelInputSchemas["gpt-image-2-6/sunburst-text-to-image"];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "aspect_ratio",
      "resolution",
      "quality",
      "background",
      "output_format",
      "complexity",
      "moderation",
      "output_compression",
      "size",
      "frame_count",
      "frame_duration_ms",
      "svg",
    ]);
    expect(descriptor.fields.prompt.required).toBe(true);
    expect(descriptor.fields.resolution.default).toBe("1K");
    expect(descriptor.fields.quality.default).toBe("medium");
    expect(descriptor.fields.complexity.default).toBe("high");
    expect(descriptor.fields.svg.properties?.model.default).toBe(
      "gpt-5.6-luna"
    );
  });
});

describe("Kie GPT Image 2.6 public exports", () => {
  it("keeps root schema values identical to the zod subpath", () => {
    expect(RootGptImage26SunburstTextToImageRequestSchema).toBe(
      GptImage26SunburstTextToImageRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and model literals", () => {
    expectTypeOf<GptImage26SunburstTextToImageRequestInput>().toEqualTypeOf<GptImage26SunburstTextToImageRequest>();
    expectTypeOf(
      GptImage26SunburstTextToImageRequestSchema.parse(
        GPT_IMAGE_26_CONTRACTS[0].request
      )
    ).toEqualTypeOf<GptImage26SunburstTextToImageParsedRequest>();
    expectTypeOf<
      GptImage26SunburstTextToImageRequest["model"]
    >().toEqualTypeOf<"gpt-image-2-6/sunburst-text-to-image">();
  });
});
