import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalGoogleLyria3p5RequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "google/lyria-3.5";
const payload = {
  prompt: "A red panda waves once, then holds still.",
};

describe("Google Lyria 3.5", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("googlelyria3");
    expect(modelDisplay("fal", endpoint)).toBe("Google Lyria 3.5");
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.google.lyria3p5;
    expect(leaf).toBe(provider.post.run.google.lyria3p5);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("prices one generation at the published flat rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { prompt: "A red panda waves once, then holds still." },
    });
    expect(estimate.usd).toBeCloseTo(0.1);
    expect(estimate.warnings).toEqual([]);
  });
});
