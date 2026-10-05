import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalFlux3EditImageRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "blackforestlabs/flux-3/edit-image";
const input = {
  prompt: "Watercolor",
  image_urls: ["https://example.com/image.png"],
};
describe("FLUX3 edit image", () => {
  it("exposes run aliases and queue schema", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.blackforestlabs.flux3.editImage).toBe(
      p.post.run.blackforestlabs.flux3.editImage
    );
    expect(p.run.blackforestlabs.flux3.editImage.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("applies documented defaults", () =>
    expect(schema.parse(input)).toEqual({
      ...input,
      aspect_ratio: "auto",
      resolution: "1k",
      enable_prompt_expansion: false,
      safety_tolerance: 2,
      output_format: "jpeg",
      sync_mode: false,
      version: "latest",
    }));
  it.each([1, 10])("accepts%s references", (count) =>
    expect(
      schema.safeParse({
        ...input,
        image_urls: Array(count).fill("data:image/png;base64,AA=="),
      }).success
    ).toBe(true)
  );
  it.each([0, 11])("rejects%s references", (count) =>
    expect(
      schema.safeParse({ ...input, image_urls: Array(count).fill("image") })
        .success
    ).toBe(false)
  );
  it.each(["512sq", "768sq", "1k", "2k", "4k"])(
    "accepts resolution%s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );
  it.each([-1, 1.5, 5])("rejects safety tolerance%s", (safety_tolerance) =>
    expect(schema.safeParse({ ...input, safety_tolerance }).success).toBe(false)
  );
  it("supports sync data URI mode", () =>
    expect(
      schema.parse({ ...input, sync_mode: true, output_format: "png" })
        .sync_mode
    ).toBe(true));
  it("requires the documented version", () =>
    expect(schema.safeParse({ ...input, version: "invalid" }).success).toBe(
      false
    ));
  it("directs uncertain billing to fal pricing", () => {
    const e = computeEstimate({ provider: "fal", endpoint, payload: input });
    expect(e.usd).toBe(0);
    expect(e.warnings.join(" ")).toContain("fal.v1.models.pricing.estimate");
  });
});
