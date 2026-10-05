import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalIdeogramV4p5EditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";
const endpoint = "ideogram/v4.5/edit";
const base = {
  prompt: "Add a welcome sign",
  image_url: "https://example.com/image.png",
};
describe("Ideogram 4.5 edit", () => {
  it("registers model metadata under fal", () => {
    expect(modelSlug("fal", endpoint)).toBe("ideo45");
    expect(modelDisplay("fal", endpoint)).toBe("Ideogram 4.5 Edit");
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes aliases and queue schema", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.ideogram.v4p5.edit;
    expect(leaf).toBe(p.post.run.ideogram.v4p5.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("uses documented editing defaults", () => {
    expect(schema.parse(base)).toEqual({
      ...base,
      edit_precision: "regular",
      quality: "medium",
      image_size: "auto",
      num_images: 1,
      sync_mode: false,
    });
  });
  it("requires source and nonempty prompt, and rejects unknown fields", () => {
    expect(schema.safeParse({ prompt: "test" }).success).toBe(false);
    expect(schema.safeParse({ ...base, prompt: "" }).success).toBe(false);
    expect(
      schema.safeParse({ ...base, prompt: "x".repeat(10000) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...base, prompt: "x".repeat(10001) }).success
    ).toBe(false);
    expect(schema.safeParse({ ...base, legacy: true }).success).toBe(false);
  });
  it("limits reference images according to mask presence", () => {
    const refs = Array<string>(4).fill(base.image_url);
    expect(
      schema.safeParse({ ...base, reference_image_urls: refs }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...base,
        reference_image_urls: [...refs, base.image_url],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, reference_image_urls: refs, mask_url: null })
        .success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...base,
        reference_image_urls: refs,
        mask_url: base.image_url,
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...base,
        reference_image_urls: refs.slice(1),
        mask_url: base.image_url,
      }).success
    ).toBe(true);
  });
  it("preserves geometry for masked and high-precision edits", () => {
    for (const mode of [
      { mask_url: base.image_url },
      { edit_precision: "high" },
    ]) {
      expect(schema.safeParse({ ...base, ...mode }).success).toBe(true);
      expect(
        schema.safeParse({ ...base, ...mode, image_size: "square_hd" }).success
      ).toBe(false);
    }
  });
  it.each([
    [256, 1536],
    [2048, 2048],
    [1024, 512],
  ])("accepts custom %sx%s", (width, height) => {
    expect(
      schema.safeParse({ ...base, image_size: { width, height } }).success
    ).toBe(true);
  });
  it.each([
    [255, 512],
    [257, 512],
    [256, 1568],
    [2080, 2048],
  ])("rejects custom %sx%s", (width, height) => {
    expect(
      schema.safeParse({ ...base, image_size: { width, height } }).success
    ).toBe(false);
  });
  it("defaults omitted custom dimensions and permits nullable seed", () => {
    expect(
      schema.parse({ ...base, image_size: {}, seed: null }).image_size
    ).toEqual({ width: 512, height: 512 });
  });
  it.each([0, 9, 1.5])("rejects image count %s", (num_images) => {
    expect(schema.safeParse({ ...base, num_images }).success).toBe(false);
  });
  it.each([
    ["very_low", 0.008],
    ["low", 0.03],
    ["medium", 0.06],
    ["high", 0.22],
  ] as const)(
    "prices %s independently of size and precision",
    (quality, rate) => {
      for (const edit_precision of ["regular", "high"]) {
        const e = computeEstimate({
          provider: "fal",
          endpoint,
          payload: { ...base, quality, edit_precision, num_images: 3 },
        });
        expect(e.usd).toBeCloseTo(rate * 3);
        expect(e.warnings).toEqual([]);
      }
    }
  );
  it("estimates one medium image by default", () => {
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: base }).usd
    ).toBe(0.06);
  });
});
