import { describe, expect, expectTypeOf, it } from "vitest";

import {
  GrokImagineImage2ImageEditRequestSchema as RootGrokImagineImage2ImageEditRequestSchema,
  GrokImagineImage2SegmentEditRequestSchema as RootGrokImagineImage2SegmentEditRequestSchema,
  GrokImagineImage2SegmentMapRequestSchema as RootGrokImagineImage2SegmentMapRequestSchema,
  GrokImagineImage2TextToImageRequestSchema as RootGrokImagineImage2TextToImageRequestSchema,
  type GrokImagineImage2ImageEditParsedRequest,
  type GrokImagineImage2ImageEditRequest,
  type GrokImagineImage2ImageEditRequestInput,
  type GrokImagineImage2SegmentEditParsedRequest,
  type GrokImagineImage2SegmentEditRequest,
  type GrokImagineImage2SegmentEditRequestInput,
  type GrokImagineImage2SegmentMapParsedRequest,
  type GrokImagineImage2SegmentMapRequest,
  type GrokImagineImage2SegmentMapRequestInput,
  type GrokImagineImage2TextToImageParsedRequest,
  type GrokImagineImage2TextToImageRequest,
  type GrokImagineImage2TextToImageRequestInput,
} from "@apicity/kie";
import {
  GrokImagineImage2ImageEditRequestSchema,
  GrokImagineImage2SegmentEditRequestSchema,
  GrokImagineImage2SegmentMapRequestSchema,
  GrokImagineImage2TextToImageRequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const GROK_IMAGINE_IMAGE_2_CONTRACTS = [
  {
    model: "grok-imagine-image-2-0/text-to-image",
    schema: GrokImagineImage2TextToImageRequestSchema,
    request: {
      model: "grok-imagine-image-2-0/text-to-image",
      input: {
        prompt:
          "A white cat with mismatched yellow and blue eyes in soft light",
        aspect_ratio: "1:1",
      },
    } satisfies GrokImagineImage2TextToImageRequest,
  },
  {
    model: "grok-imagine-image-2-0/segment-map",
    schema: GrokImagineImage2SegmentMapRequestSchema,
    request: {
      model: "grok-imagine-image-2-0/segment-map",
      input: { task_id: "task-cat-source" },
    } satisfies GrokImagineImage2SegmentMapRequest,
  },
  {
    model: "grok-imagine-image-2-0/image-edit",
    schema: GrokImagineImage2ImageEditRequestSchema,
    request: {
      model: "grok-imagine-image-2-0/image-edit",
      input: {
        prompt: "Give the cat a red bow tie",
        task_id: "task-cat-source",
        mask_indexs: [0],
      },
    } satisfies GrokImagineImage2ImageEditRequest,
  },
  {
    model: "grok-imagine-image-2-0/segment-edit",
    schema: GrokImagineImage2SegmentEditRequestSchema,
    request: {
      model: "grok-imagine-image-2-0/segment-edit",
      input: {
        prompt: "Give the cat a red bow tie",
        task_id: "task-cat-source",
        mask_indexs: [1],
      },
    } satisfies GrokImagineImage2SegmentEditRequest,
  },
] as const;

const GROK_IMAGINE_IMAGE_2_MODELS = GROK_IMAGINE_IMAGE_2_CONTRACTS.map(
  ({ model }) => model
);

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

describe("Kie Grok Imagine Image 2.0 request contracts", () => {
  it("accepts all documented examples directly and through the aggregate", () => {
    for (const contract of GROK_IMAGINE_IMAGE_2_CONTRACTS) {
      expect(contract.schema.safeParse(contract.request).success).toBe(true);
      expect(
        MediaGenerationRequestSchema.safeParse(contract.request).success
      ).toBe(true);
    }
  });

  it("preserves returned zero-based segment indices", () => {
    const parsed = GrokImagineImage2ImageEditRequestSchema.parse({
      model: "grok-imagine-image-2-0/image-edit",
      input: {
        prompt: "Remove the selected person",
        task_id: "task-source",
        mask_indexs: [0, 2],
      },
    });
    expect(parsed.input.mask_indexs).toEqual([0, 2]);
  });

  it("rejects invalid text-to-image prompts and aspect ratios", () => {
    const base = GROK_IMAGINE_IMAGE_2_CONTRACTS[0].request;
    const cases = [
      { input: { aspect_ratio: "1:1" }, path: ["input", "prompt"] },
      {
        input: { prompt: "", aspect_ratio: "1:1" },
        path: ["input", "prompt"],
      },
      {
        input: { prompt: base.input.prompt },
        path: ["input", "aspect_ratio"],
      },
      {
        input: { prompt: base.input.prompt, aspect_ratio: "4:3" },
        path: ["input", "aspect_ratio"],
      },
    ] as const;

    for (const invalid of cases) {
      const result = GrokImagineImage2TextToImageRequestSchema.safeParse({
        model: base.model,
        input: invalid.input,
      });
      expect(result.success).toBe(false);
      expect(issueAt(result, [...invalid.path])).toBe(true);
    }
  });

  it("rejects missing and empty segment-map task ids", () => {
    for (const input of [{}, { task_id: "" }]) {
      const result = GrokImagineImage2SegmentMapRequestSchema.safeParse({
        model: "grok-imagine-image-2-0/segment-map",
        input,
      });
      expect(result.success).toBe(false);
      expect(issueAt(result, ["input", "task_id"])).toBe(true);
    }
  });

  it("rejects invalid image-edit prompts, task ids, and mask indices", () => {
    const base = GROK_IMAGINE_IMAGE_2_CONTRACTS[2].request;
    const cases = [
      {
        input: { task_id: base.input.task_id },
        path: ["input", "prompt"],
      },
      {
        input: { prompt: "", task_id: base.input.task_id },
        path: ["input", "prompt"],
      },
      {
        input: { prompt: base.input.prompt },
        path: ["input", "task_id"],
      },
      {
        input: { prompt: base.input.prompt, task_id: "" },
        path: ["input", "task_id"],
      },
      {
        input: { ...base.input, mask_indexs: [] },
        path: ["input", "mask_indexs"],
      },
      {
        input: { ...base.input, mask_indexs: [-1] },
        path: ["input", "mask_indexs", "0"],
      },
      {
        input: { ...base.input, mask_indexs: [1.5] },
        path: ["input", "mask_indexs", "0"],
      },
    ] as const;

    for (const invalid of cases) {
      const result = GrokImagineImage2ImageEditRequestSchema.safeParse({
        model: base.model,
        input: invalid.input,
      });
      expect(result.success).toBe(false);
      expect(issueAt(result, [...invalid.path])).toBe(true);
    }
  });

  it("rejects segment-edit inputs and its one-based mask indices", () => {
    const base = GROK_IMAGINE_IMAGE_2_CONTRACTS[3].request;
    const cases = [
      { input: { task_id: base.input.task_id }, path: ["input", "prompt"] },
      {
        input: { prompt: base.input.prompt },
        path: ["input", "task_id"],
      },
      {
        input: { prompt: base.input.prompt, task_id: "" },
        path: ["input", "task_id"],
      },
      {
        input: { ...base.input, mask_indexs: [] },
        path: ["input", "mask_indexs"],
      },
      // image-edit accepts index 0; segment-edit documents `minimum: 1`.
      {
        input: { ...base.input, mask_indexs: [0] },
        path: ["input", "mask_indexs", "0"],
      },
      {
        input: { ...base.input, mask_indexs: [1.5] },
        path: ["input", "mask_indexs", "0"],
      },
    ] as const;

    for (const invalid of cases) {
      const result = GrokImagineImage2SegmentEditRequestSchema.safeParse({
        model: base.model,
        input: invalid.input,
      });
      expect(result.success).toBe(false);
      expect(issueAt(result, [...invalid.path])).toBe(true);
    }
  });

  it("keeps every input object strict", () => {
    for (const contract of GROK_IMAGINE_IMAGE_2_CONTRACTS) {
      const result = contract.schema.safeParse({
        ...contract.request,
        input: { ...contract.request.input, unexpected: true },
      });
      expect(result.success, contract.model).toBe(false);
    }
  });
});

describe("Kie Grok Imagine Image 2.0 registries and descriptors", () => {
  it("has exactly the same four ids in the roster, guards, and descriptors", () => {
    const prefix = "grok-imagine-image-2-0/";
    expect(
      KIE_MEDIA_MODELS.filter((model) => model.startsWith(prefix))
    ).toEqual(GROK_IMAGINE_IMAGE_2_MODELS);
    expect(
      Object.keys(CREATE_TASK_GUARDS).filter((model) =>
        model.startsWith(prefix)
      )
    ).toEqual(GROK_IMAGINE_IMAGE_2_MODELS);
    expect(
      Object.keys(modelInputSchemas).filter((model) => model.startsWith(prefix))
    ).toEqual(GROK_IMAGINE_IMAGE_2_MODELS);

    for (const contract of GROK_IMAGINE_IMAGE_2_CONTRACTS) {
      expect(CREATE_TASK_GUARDS[contract.model]).toBe(contract.schema);
    }
  });

  it("exposes exact descriptor fields and constraints", () => {
    const textToImage =
      modelInputSchemas["grok-imagine-image-2-0/text-to-image"];
    expect(textToImage.type).toBe("image");
    expect(Object.keys(textToImage.fields).sort()).toEqual([
      "aspect_ratio",
      "prompt",
    ]);
    expect(textToImage.fields.prompt).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
    });
    expect(textToImage.fields.aspect_ratio).toMatchObject({
      type: "string",
      required: true,
      enum: ["1:1", "2:3", "3:2", "16:9", "9:16"],
    });
    expect(textToImage.fields.aspect_ratio.default).toBeUndefined();

    const segmentMap = modelInputSchemas["grok-imagine-image-2-0/segment-map"];
    expect(segmentMap.type).toBe("image");
    expect(Object.keys(segmentMap.fields)).toEqual(["task_id"]);
    expect(segmentMap.fields.task_id).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
    });
    expect(segmentMap.fields.task_id.description).toContain("segments[]");
    expect(segmentMap.fields.task_id.description).toContain("maskUrl");
    expect(segmentMap.fields.task_id.description).toContain("name");
    expect(segmentMap.fields.task_id.description).toContain("index");

    const imageEdit = modelInputSchemas["grok-imagine-image-2-0/image-edit"];
    expect(imageEdit.type).toBe("image");
    expect(Object.keys(imageEdit.fields).sort()).toEqual([
      "mask_indexs",
      "prompt",
      "task_id",
    ]);
    expect(imageEdit.fields.prompt).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
    });
    expect(imageEdit.fields.task_id).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
    });
    expect(imageEdit.fields.mask_indexs).toMatchObject({
      type: "array",
      minItems: 1,
      items: { type: "integer", minimum: 0 },
    });
    expect(imageEdit.fields.mask_indexs.required).toBeUndefined();

    const segmentEdit =
      modelInputSchemas["grok-imagine-image-2-0/segment-edit"];
    expect(segmentEdit.type).toBe("image");
    expect(Object.keys(segmentEdit.fields).sort()).toEqual([
      "mask_indexs",
      "prompt",
      "task_id",
    ]);
    expect(segmentEdit.fields.prompt).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
    });
    expect(segmentEdit.fields.task_id).toMatchObject({
      type: "string",
      required: true,
      minLength: 1,
    });
    expect(segmentEdit.fields.mask_indexs).toMatchObject({
      type: "array",
      minItems: 1,
      items: { type: "integer", minimum: 1 },
    });
    expect(segmentEdit.fields.mask_indexs.required).toBeUndefined();
  });
});

describe("Kie Grok Imagine Image 2.0 public exports", () => {
  it("keeps root schema values identical to the zod subpath", () => {
    expect(RootGrokImagineImage2TextToImageRequestSchema).toBe(
      GrokImagineImage2TextToImageRequestSchema
    );
    expect(RootGrokImagineImage2SegmentMapRequestSchema).toBe(
      GrokImagineImage2SegmentMapRequestSchema
    );
    expect(RootGrokImagineImage2ImageEditRequestSchema).toBe(
      GrokImagineImage2ImageEditRequestSchema
    );
    expect(RootGrokImagineImage2SegmentEditRequestSchema).toBe(
      GrokImagineImage2SegmentEditRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and model literals", () => {
    expectTypeOf<GrokImagineImage2TextToImageRequestInput>().toEqualTypeOf<GrokImagineImage2TextToImageRequest>();
    expectTypeOf<GrokImagineImage2SegmentMapRequestInput>().toEqualTypeOf<GrokImagineImage2SegmentMapRequest>();
    expectTypeOf<GrokImagineImage2ImageEditRequestInput>().toEqualTypeOf<GrokImagineImage2ImageEditRequest>();
    expectTypeOf<GrokImagineImage2SegmentEditRequestInput>().toEqualTypeOf<GrokImagineImage2SegmentEditRequest>();
    expectTypeOf(
      GrokImagineImage2TextToImageRequestSchema.parse(
        GROK_IMAGINE_IMAGE_2_CONTRACTS[0].request
      )
    ).toEqualTypeOf<GrokImagineImage2TextToImageParsedRequest>();
    expectTypeOf(
      GrokImagineImage2SegmentMapRequestSchema.parse(
        GROK_IMAGINE_IMAGE_2_CONTRACTS[1].request
      )
    ).toEqualTypeOf<GrokImagineImage2SegmentMapParsedRequest>();
    expectTypeOf(
      GrokImagineImage2ImageEditRequestSchema.parse(
        GROK_IMAGINE_IMAGE_2_CONTRACTS[2].request
      )
    ).toEqualTypeOf<GrokImagineImage2ImageEditParsedRequest>();
    expectTypeOf(
      GrokImagineImage2SegmentEditRequestSchema.parse(
        GROK_IMAGINE_IMAGE_2_CONTRACTS[3].request
      )
    ).toEqualTypeOf<GrokImagineImage2SegmentEditParsedRequest>();
    expectTypeOf<
      GrokImagineImage2TextToImageRequest["model"]
    >().toEqualTypeOf<"grok-imagine-image-2-0/text-to-image">();
    expectTypeOf<
      GrokImagineImage2SegmentMapRequest["model"]
    >().toEqualTypeOf<"grok-imagine-image-2-0/segment-map">();
    expectTypeOf<
      GrokImagineImage2ImageEditRequest["model"]
    >().toEqualTypeOf<"grok-imagine-image-2-0/image-edit">();
    expectTypeOf<
      GrokImagineImage2SegmentEditRequest["model"]
    >().toEqualTypeOf<"grok-imagine-image-2-0/segment-edit">();
  });
});
