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

const PROMPT = "A glass observatory above a quiet desert at blue hour.";
const INTEGER_COORDINATES = [
  Number.MIN_SAFE_INTEGER - 1,
  0,
  42,
  Number.MAX_SAFE_INTEGER + 1,
] as const;

const MODEL_CASES = [
  {
    model: "wan/2-7-image",
    schema: Wan27ImageRequestSchema,
    invalidCoordinateIndex: 0,
    invalidRequest: {
      model: "wan/2-7-image",
      input: {
        prompt: PROMPT,
        resolution: "2K",
        bbox_list: [[[0.5, 1, 2, 3]]],
      },
    } satisfies MediaGenerationRequest,
  },
  {
    model: "wan/2-7-image-pro",
    schema: Wan27ImageProRequestSchema,
    invalidCoordinateIndex: 3,
    invalidRequest: {
      model: "wan/2-7-image-pro",
      input: {
        prompt: PROMPT,
        resolution: "2K",
        bbox_list: [[[0, 1, 2, 3.25]]],
      },
    } satisfies MediaGenerationRequest,
  },
] as const;

function jsonSchema(value: unknown, location: string): JsonSchema {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Expected JSON Schema object at ${location}`);
  }
  return value as JsonSchema;
}

function bboxCoordinateSchema(schema: (typeof MODEL_CASES)[number]["schema"]) {
  const request = zodToJsonSchema(schema);
  const requestProperties = jsonSchema(
    request.properties,
    "request.properties"
  );
  const input = jsonSchema(requestProperties.input, "request.input");
  const inputProperties = jsonSchema(input.properties, "input.properties");
  const bboxList = jsonSchema(inputProperties.bbox_list, "input.bbox_list");
  const perImage = jsonSchema(bboxList.items, "bbox_list.items");
  const box = jsonSchema(perImage.items, "bbox_list.items.items");
  return jsonSchema(box.items, "bbox_list.items.items.items");
}

describe("KIE WAN 2.7 image bounding-box contract", () => {
  it("accepts and preserves representative unbounded integers", () => {
    const result = Wan27ImageInputSchema.safeParse({
      prompt: PROMPT,
      bbox_list: [[INTEGER_COORDINATES]],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw result.error;
    expect(result.data.bbox_list).toEqual([[INTEGER_COORDINATES]]);
  });

  it.each([
    { label: "first-coordinate fraction", index: 0, value: 0.5 },
    { label: "fourth-coordinate fraction", index: 3, value: 3.25 },
    { label: "numeric string", index: 1, value: "1" },
    { label: "NaN", index: 2, value: Number.NaN },
    { label: "positive infinity", index: 0, value: Number.POSITIVE_INFINITY },
    { label: "negative infinity", index: 3, value: Number.NEGATIVE_INFINITY },
  ])("rejects $label at its exact shared-input path", ({ index, value }) => {
    const coordinates: unknown[] = [0, 1, 2, 3];
    coordinates[index] = value;

    const result = Wan27ImageInputSchema.safeParse({
      prompt: PROMPT,
      bbox_list: [[coordinates]],
    });

    expect(result.success).toBe(false);
    if (result.success)
      throw new Error("expected coordinate validation failure");
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["bbox_list", 0, 0, index] }),
      ])
    );
  });

  describe.each(MODEL_CASES)(
    "$model",
    ({ model, schema, invalidCoordinateIndex, invalidRequest }) => {
      it("keeps exact and aggregate schema outcomes aligned", () => {
        const validRequest = {
          model,
          input: {
            prompt: PROMPT,
            resolution: "2K",
            bbox_list: [[INTEGER_COORDINATES]],
          },
        };

        const exactValid = schema.safeParse(validRequest);
        const aggregateValid = CreateTaskRequestSchema.safeParse(validRequest);
        expect(exactValid.success).toBe(true);
        expect(aggregateValid.success).toBe(true);
        if (!exactValid.success || !aggregateValid.success) {
          throw new Error("expected exact and aggregate schema success");
        }
        expect(exactValid.data.input.bbox_list).toEqual([
          [INTEGER_COORDINATES],
        ]);
        expect(aggregateValid.data).toMatchObject({
          input: { bbox_list: [[INTEGER_COORDINATES]] },
        });

        const exactInvalid = schema.safeParse(invalidRequest);
        expect(exactInvalid.success).toBe(false);
        if (exactInvalid.success) {
          throw new Error("expected exact schema coordinate failure");
        }
        expect(exactInvalid.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["input", "bbox_list", 0, 0, invalidCoordinateIndex],
            }),
          ])
        );
        expect(CreateTaskRequestSchema.safeParse(invalidRequest).success).toBe(
          false
        );

        const numericStringRequest = {
          model,
          input: {
            prompt: PROMPT,
            resolution: "2K",
            bbox_list: [[[0, "1", 2, 3]]],
          },
        };
        const exactNumericString = schema.safeParse(numericStringRequest);
        expect(exactNumericString.success).toBe(false);
        if (exactNumericString.success) {
          throw new Error("expected exact schema numeric-string failure");
        }
        expect(exactNumericString.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ["input", "bbox_list", 0, 0, 1],
            }),
          ])
        );
        expect(
          CreateTaskRequestSchema.safeParse(numericStringRequest).success
        ).toBe(false);
      });

      it("rejects a fraction before fetch at the exact coordinate path", async () => {
        const mockFetch = vi.fn<typeof globalThis.fetch>(async () => {
          throw new Error(`fractional bbox must not reach fetch for ${model}`);
        });
        const provider = createKie({
          apiKey: "test-key",
          fetch: mockFetch,
          paygate: { secret: TEST_PAYGATE_SECRET },
        });

        const rejection: unknown = await provider.post.api.v1.jobs
          .createTask(invalidRequest, mintKieCreateTaskOtp(invalidRequest))
          .catch((error: unknown) => error);

        expect(rejection).toBeInstanceOf(KieError);
        if (!(rejection instanceof KieError)) throw rejection;
        const expectedPath = [
          "input",
          "bbox_list",
          0,
          0,
          invalidCoordinateIndex,
        ];
        expect(rejection.status).toBe(400);
        expect(rejection.body).toMatchObject({
          issues: expect.arrayContaining([
            expect.objectContaining({ path: expectedPath }),
          ]),
        });
        expect(rejection.message).toContain(expectedPath.join("."));
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("emits an unbounded integer coordinate in derived JSON Schema", () => {
        const coordinate = bboxCoordinateSchema(schema);

        expect(coordinate.type).toBe("integer");
        expect(coordinate).not.toHaveProperty("minimum");
        expect(coordinate).not.toHaveProperty("maximum");
      });
    }
  );

  it.each([
    { label: "bbox_list omitted", input: { prompt: PROMPT }, accepted: true },
    {
      label: "empty outer list",
      input: { prompt: PROMPT, bbox_list: [] },
      accepted: true,
    },
    {
      label: "empty per-image list",
      input: { prompt: PROMPT, bbox_list: [[]] },
      accepted: true,
    },
    {
      label: "unbounded outer list",
      input: {
        prompt: PROMPT,
        bbox_list: Array.from({ length: 10 }, () => []),
      },
      accepted: true,
    },
    {
      label: "two boxes per image",
      input: {
        prompt: PROMPT,
        bbox_list: [
          [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
          ],
        ],
      },
      accepted: true,
    },
    {
      label: "three-coordinate box",
      input: { prompt: PROMPT, bbox_list: [[[0, 1, 2]]] },
      accepted: false,
    },
    {
      label: "five-coordinate box",
      input: { prompt: PROMPT, bbox_list: [[[0, 1, 2, 3, 4]]] },
      accepted: false,
    },
    {
      label: "three boxes per image",
      input: {
        prompt: PROMPT,
        bbox_list: [
          [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [8, 9, 10, 11],
          ],
        ],
      },
      accepted: false,
    },
  ])("preserves structure for $label", ({ input, accepted }) => {
    expect(Wan27ImageInputSchema.safeParse(input).success).toBe(accepted);
  });

  it("publishes one shared nested integer descriptor for both models", () => {
    const image = modelInputSchemas["wan/2-7-image"].fields.bbox_list;
    const pro = modelInputSchemas["wan/2-7-image-pro"].fields.bbox_list;

    expect(image).toBe(pro);
    expect(image).toMatchObject({
      type: "array",
      items: {
        type: "array",
        maxItems: 2,
        items: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: { type: "integer" },
        },
      },
    });
    expect(image.description).toMatch(/4 integer coordinates/i);
    expect(image.description).toContain("max 2 per image");
    expect(image.description).toContain("[x1, y1, x2, y2]");
    expect(image).not.toHaveProperty("minItems");
    expect(image).not.toHaveProperty("maxItems");
    expect(image).not.toHaveProperty("default");
    expect(image).not.toHaveProperty("required");
    expect(image.items?.items?.items).not.toHaveProperty("minimum");
    expect(image.items?.items?.items).not.toHaveProperty("maximum");
    expect(image.items?.items?.items).not.toHaveProperty("default");
  });

  it("keeps request and parsed coordinate leaves inferred as number", () => {
    type ImageCoordinate = NonNullable<
      Wan27ImageRequest["input"]["bbox_list"]
    >[number][number][number];
    type ImageInputCoordinate = NonNullable<
      Wan27ImageRequestInput["input"]["bbox_list"]
    >[number][number][number];
    type ImageParsedCoordinate = NonNullable<
      Wan27ImageParsedRequest["input"]["bbox_list"]
    >[number][number][number];
    type ProCoordinate = NonNullable<
      Wan27ImageProRequest["input"]["bbox_list"]
    >[number][number][number];
    type ProInputCoordinate = NonNullable<
      Wan27ImageProRequestInput["input"]["bbox_list"]
    >[number][number][number];
    type ProParsedCoordinate = NonNullable<
      Wan27ImageProParsedRequest["input"]["bbox_list"]
    >[number][number][number];

    expectTypeOf<ImageCoordinate>().toEqualTypeOf<number>();
    expectTypeOf<ImageInputCoordinate>().toEqualTypeOf<number>();
    expectTypeOf<ImageParsedCoordinate>().toEqualTypeOf<number>();
    expectTypeOf<ProCoordinate>().toEqualTypeOf<number>();
    expectTypeOf<ProInputCoordinate>().toEqualTypeOf<number>();
    expectTypeOf<ProParsedCoordinate>().toEqualTypeOf<number>();
  });
});
