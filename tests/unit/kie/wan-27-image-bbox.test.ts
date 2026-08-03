import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  createKie,
  KieError,
  type MediaGenerationRequest,
  type Wan27ImageParsedRequest,
  type Wan27ImageProParsedRequest,
  type Wan27ImageProRequest,
  type Wan27ImageProRequestInput,
  type Wan27ImageRequest,
  type Wan27ImageRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  MediaGenerationRequestSchema,
  Wan27ImageInputSchema,
  Wan27ImageProRequestSchema,
  Wan27ImageRequestSchema,
} from "@apicity/kie/zod";

import { modelInputSchemas } from "../../../packages/provider/kie/src/model-schemas";
import {
  type JsonSchema,
  zodToJsonSchema,
} from "../../../packages/mcp-server/src/schema";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const PROMPT = "Place a small lantern beside the cabin door.";
const COORDINATE_INDEXES = [0, 1, 2, 3] as const;
const INTEGER_BOX = [
  Number.MIN_SAFE_INTEGER - 1,
  0,
  42,
  Number.MAX_SAFE_INTEGER + 1,
] as const;
const OMITTED_BBOX = Symbol("omitted bbox_list");

const MODEL_CASES = [
  {
    model: "wan/2-7-image",
    schema: Wan27ImageRequestSchema,
    guardedFractionIndex: 0,
  },
  {
    model: "wan/2-7-image-pro",
    schema: Wan27ImageProRequestSchema,
    guardedFractionIndex: 3,
  },
] as const;

const NON_INTEGER_COORDINATES = [
  { label: "numeric string", value: "1" },
  { label: "NaN", value: Number.NaN },
  { label: "positive infinity", value: Number.POSITIVE_INFINITY },
  { label: "negative infinity", value: Number.NEGATIVE_INFINITY },
] as const;

function boxWithCoordinate(index: number, value: unknown): unknown[] {
  const box: unknown[] = [0, 1, 2, 3];
  box[index] = value;
  return box;
}

function requestWithBbox(
  model: (typeof MODEL_CASES)[number]["model"],
  bboxList: unknown
): Record<string, unknown> {
  return {
    model,
    input: {
      prompt: PROMPT,
      resolution: "2K",
      bbox_list: bboxList,
    },
  };
}

function asSchemaRecord(value: unknown, location: string): JsonSchema {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Expected JSON Schema object at ${location}`);
  }
  return value as JsonSchema;
}

function propertyOf(
  schema: JsonSchema,
  name: string,
  location: string
): JsonSchema {
  const properties = asSchemaRecord(
    schema.properties,
    `${location}.properties`
  );
  return asSchemaRecord(properties[name], `${location}.properties.${name}`);
}

function itemsOf(schema: JsonSchema, location: string): JsonSchema {
  return asSchemaRecord(schema.items, `${location}.items`);
}

function bboxJsonSchemas(
  schema: typeof Wan27ImageRequestSchema | typeof Wan27ImageProRequestSchema
): {
  outer: JsonSchema;
  perImage: JsonSchema;
  box: JsonSchema;
  coordinate: JsonSchema;
} {
  const request = zodToJsonSchema(schema);
  const input = propertyOf(request, "input", "request");
  const outer = propertyOf(input, "bbox_list", "request.input");
  const perImage = itemsOf(outer, "request.input.bbox_list");
  const box = itemsOf(perImage, "request.input.bbox_list[]");
  const coordinate = itemsOf(box, "request.input.bbox_list[][]");
  return { outer, perImage, box, coordinate };
}

type Coordinate<T extends number[][][] | undefined> =
  NonNullable<T>[number][number][number];

describe("KIE WAN 2.7 image bounding-box contract", () => {
  describe("shared input schema", () => {
    it("accepts and preserves representative unbounded integers", () => {
      const result = Wan27ImageInputSchema.safeParse({
        prompt: PROMPT,
        bbox_list: [[INTEGER_BOX]],
      });

      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      expect(result.data.bbox_list?.[0]?.[0]).toEqual(INTEGER_BOX);
    });

    it.each(COORDINATE_INDEXES)(
      "rejects a fraction at coordinate index %i",
      (index) => {
        const result = Wan27ImageInputSchema.safeParse({
          prompt: PROMPT,
          bbox_list: [[boxWithCoordinate(index, index + 0.5)]],
        });

        expect(result.success).toBe(false);
        if (result.success) throw new Error("expected fractional rejection");
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["bbox_list", 0, 0, index] }),
          ])
        );
      }
    );

    it.each(NON_INTEGER_COORDINATES)(
      "rejects $label without coercion",
      ({ value }) => {
        const result = Wan27ImageInputSchema.safeParse({
          prompt: PROMPT,
          bbox_list: [[boxWithCoordinate(2, value)]],
        });

        expect(result.success).toBe(false);
        if (result.success) throw new Error("expected coordinate rejection");
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["bbox_list", 0, 0, 2] }),
          ])
        );
      }
    );

    it.each([
      { label: "omission", bboxList: OMITTED_BBOX, accepted: true },
      { label: "an empty outer list", bboxList: [], accepted: true },
      { label: "an empty per-image list", bboxList: [[]], accepted: true },
      {
        label: "an outer list longer than input_urls permits",
        bboxList: Array.from({ length: 10 }, () => []),
        accepted: true,
      },
      {
        label: "two boxes for one image",
        bboxList: [
          [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
          ],
        ],
        accepted: true,
      },
      {
        label: "a three-coordinate box",
        bboxList: [[[0, 1, 2]]],
        accepted: false,
      },
      {
        label: "a five-coordinate box",
        bboxList: [[[0, 1, 2, 3, 4]]],
        accepted: false,
      },
      {
        label: "three boxes for one image",
        bboxList: [
          [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [8, 9, 10, 11],
          ],
        ],
        accepted: false,
      },
    ])("preserves structural behavior for $label", ({ bboxList, accepted }) => {
      const input = {
        prompt: PROMPT,
        ...(bboxList === OMITTED_BBOX ? {} : { bbox_list: bboxList }),
      };

      expect(Wan27ImageInputSchema.safeParse(input).success).toBe(accepted);
    });
  });

  describe.each(MODEL_CASES)("$model exact schema", ({ model, schema }) => {
    it.each(COORDINATE_INDEXES)(
      "rejects a fraction at coordinate index %i",
      (index) => {
        const result = schema.safeParse(
          requestWithBbox(model, [[boxWithCoordinate(index, index + 0.25)]])
        );

        expect(result.success).toBe(false);
        if (result.success) throw new Error("expected fractional rejection");
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["input", "bbox_list", 0, 0, index],
            }),
          ])
        );
      }
    );

    it.each(NON_INTEGER_COORDINATES)(
      "rejects $label at the coordinate leaf",
      ({ value }) => {
        const result = schema.safeParse(
          requestWithBbox(model, [[boxWithCoordinate(1, value)]])
        );

        expect(result.success).toBe(false);
        if (result.success) throw new Error("expected coordinate rejection");
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["input", "bbox_list", 0, 0, 1],
            }),
          ])
        );
      }
    );
  });

  it.each(MODEL_CASES)(
    "$model agrees across aggregate request schemas",
    ({ model }) => {
      const integerRequest = requestWithBbox(model, [[[0, 1, 2, 3]]]);
      const fractionalRequest = requestWithBbox(model, [[[0, 1.5, 2, 3]]]);
      const stringRequest = requestWithBbox(model, [[[0, "1", 2, 3]]]);

      for (const schema of [
        MediaGenerationRequestSchema,
        CreateTaskRequestSchema,
      ]) {
        expect(schema.safeParse(integerRequest).success).toBe(true);
        expect(schema.safeParse(fractionalRequest).success).toBe(false);
        expect(schema.safeParse(stringRequest).success).toBe(false);
      }
    }
  );

  it.each(MODEL_CASES)(
    "$model rejects a fractional guarded request before transport",
    async ({ model, guardedFractionIndex }) => {
      const box = boxWithCoordinate(
        guardedFractionIndex,
        guardedFractionIndex + 0.5
      );
      const request = requestWithBbox(model, [[box]]);
      const mockFetch = vi.fn<typeof globalThis.fetch>(async () => {
        throw new Error(`${model} fractional bbox must not reach fetch`);
      });
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      const rejection: unknown = await provider.post.api.v1.jobs
        .createTask(
          request as unknown as MediaGenerationRequest,
          mintKieCreateTaskOtp(request)
        )
        .catch((error: unknown) => error);
      const expectedPath = ["input", "bbox_list", 0, 0, guardedFractionIndex];

      expect(rejection).toBeInstanceOf(KieError);
      if (!(rejection instanceof KieError)) throw rejection;
      expect(rejection.status).toBe(400);
      expect(rejection.message).toContain(expectedPath.join("."));
      expect(rejection.body).toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: expectedPath }),
        ]),
      });
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it.each(MODEL_CASES)(
    "$model serializes accepted integer coordinates unchanged",
    async ({ model }) => {
      const request = requestWithBbox(model, [[INTEGER_BOX]]);
      const mockFetch = vi.fn<typeof globalThis.fetch>(
        async () =>
          new Response(
            JSON.stringify({
              code: 200,
              msg: "success",
              data: { taskId: `${model}-task` },
            }),
            { status: 200 }
          )
      );
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      await provider.post.api.v1.jobs.createTask(
        request as unknown as MediaGenerationRequest,
        mintKieCreateTaskOtp(request)
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const init = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(JSON.parse(String(init?.body))).toEqual(request);
    }
  );

  it("shares the complete nested integer descriptor across both models", () => {
    const imageField = modelInputSchemas["wan/2-7-image"].fields.bbox_list;
    const proField = modelInputSchemas["wan/2-7-image-pro"].fields.bbox_list;

    expect(imageField).toBe(proField);
    expect(imageField.type).toBe("array");
    expect(imageField).not.toHaveProperty("required");
    expect(imageField).not.toHaveProperty("minItems");
    expect(imageField).not.toHaveProperty("maxItems");
    expect(imageField).not.toHaveProperty("default");
    expect(imageField.description).toContain("max 2 per image");
    expect(imageField.description).toContain("four integer coordinates");
    expect(imageField.description).toContain("[x1, y1, x2, y2]");

    const perImage = imageField.items;
    expect(perImage).toMatchObject({ type: "array", maxItems: 2 });
    expect(perImage).not.toHaveProperty("minItems");
    const box = perImage?.items;
    expect(box).toMatchObject({
      type: "array",
      minItems: 4,
      maxItems: 4,
    });
    const coordinate = box?.items;
    expect(coordinate).toEqual({ type: "integer" });
    expect(coordinate).not.toHaveProperty("minimum");
    expect(coordinate).not.toHaveProperty("maximum");
    expect(coordinate).not.toHaveProperty("default");
  });

  it.each(MODEL_CASES)(
    "$model derives an unbounded integer JSON Schema leaf",
    ({ schema }) => {
      const { outer, perImage, box, coordinate } = bboxJsonSchemas(schema);

      expect(outer.type).toBe("array");
      expect(outer).not.toHaveProperty("minItems");
      expect(outer).not.toHaveProperty("maxItems");
      expect(perImage).toMatchObject({ type: "array", maxItems: 2 });
      expect(box).toMatchObject({
        type: "array",
        minItems: 4,
        maxItems: 4,
      });
      expect(coordinate.type).toBe("integer");
      expect(coordinate).not.toHaveProperty("minimum");
      expect(coordinate).not.toHaveProperty("maximum");
    }
  );

  it("keeps request and parsed coordinate leaves typed as numbers", () => {
    expectTypeOf<
      Coordinate<Wan27ImageRequest["input"]["bbox_list"]>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      Coordinate<Wan27ImageRequestInput["input"]["bbox_list"]>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      Coordinate<Wan27ImageParsedRequest["input"]["bbox_list"]>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      Coordinate<Wan27ImageProRequest["input"]["bbox_list"]>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      Coordinate<Wan27ImageProRequestInput["input"]["bbox_list"]>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      Coordinate<Wan27ImageProParsedRequest["input"]["bbox_list"]>
    >().toEqualTypeOf<number>();
  });
});
