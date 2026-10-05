import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalFlux3TextToImageRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "blackforestlabs/flux-3/text-to-image";
describe("FLUX 3 text-to-image", () => {
  it("registers the leaf and queue schema", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.blackforestlabs.flux3.textToImage).toBe(
      p.post.run.blackforestlabs.flux3.textToImage
    );
    expect(p.run.blackforestlabs.flux3.textToImage.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("requires no reference image and applies defaults", () =>
    expect(schema.parse({ prompt: "Fox" })).toEqual({
      prompt: "Fox",
      aspect_ratio: "auto",
      resolution: "1k",
      enable_prompt_expansion: false,
      safety_tolerance: 2,
      output_format: "jpeg",
      sync_mode: false,
      version: "latest",
    }));
  it("omits the edit-only image field from the request schema", () =>
    expect(schema.shape).not.toHaveProperty("image_urls"));
  it.each(["512sq", "768sq", "1k", "2k", "4k"])(
    "supports resolution%s",
    (resolution) =>
      expect(schema.safeParse({ prompt: "Fox", resolution }).success).toBe(true)
  );
  it("rejects unsupported output controls", () => {
    expect(schema.safeParse({ prompt: "Fox", resolution: "8k" }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ prompt: "Fox", safety_tolerance: 5 }).success
    ).toBe(false);
  });
  it("routes unknown local costs to dynamic pricing", () => {
    const e = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { prompt: "Fox" },
    });
    expect(e.usd).toBe(0);
    expect(e.warnings.join(" ")).toContain("fal.v1.models.pricing.estimate");
  });
});
