import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalIdeogramV4p5RequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "ideogram/v4.5";
const payload = {
  num_images: 1,
  quality: "low",
  prompt: "A red panda waves once, then holds still.",
};

describe("Ideogram 4.5", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("ideo45");
    expect(modelDisplay("fal", endpoint)).toBe("Ideogram 4.5");
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.ideogram.v4p5;
    expect(leaf).toBe(provider.post.run.ideogram.v4p5);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and rejects an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(false);
  });
  it("accepts documented explicit sizes and rejects the generic 512 default", () => {
    expect(
      schema.safeParse({
        ...payload,
        image_size: { width: 1024, height: 1024 },
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...payload,
        image_size: { width: 512, height: 512 },
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({ ...payload, image_size: "square_hd" }).success
    ).toBe(true);
  });

  it("prices each published quality per output image", () => {
    const cases: Array<[string, number]> = [
      ["low", 0.03],
      ["medium", 0.06],
      ["high", 0.22],
    ];
    for (const [quality, usd] of cases) {
      expect(
        computeEstimate({
          provider: "fal",
          endpoint,
          payload: { ...payload, quality, num_images: 2 },
        }).usd
      ).toBeCloseTo(usd * 2);
    }
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { prompt: "A red panda waves once, then holds still." },
      }).usd
    ).toBeCloseTo(0.06);
  });
});
