import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { createFal, type FalOpenaiGptImage2EditRequest } from "@apicity/fal";
import {
  FalOpenaiGptImage2EditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_BILLED_UNITS } from "../../packages/provider/cost/src/pricing/fal";
const endpoint = "openai/gpt-image-2/edit";
const request = {
  prompt: "Add a blue bow tie.",
  image_urls: ["https://example.com/cat.jpg"],
};

describe("fal GPT Image 2 edit", () => {
  it("adds only the edit leaf and preserves the callable parent", () => {
    const provider = createFal({ apiKey: "test-key" });
    const parent = provider.run.openai.gptImage2;
    expectTypeOf<FalOpenaiGptImage2EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expect(typeof parent).toBe("function");
    expect(parent.edit).toBe(provider.post.run.openai.gptImage2.edit);
    expect(parent.edit.schema).toBe(schema);
    expect(parent.schema).not.toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof provider.run.openai.gptImage2p5.sunburst.textToImage).toBe(
      "function"
    );
  });

  it("defaults edit sizing to auto and exposes the upstream mask field", () => {
    expect(schema.parse(request)).toEqual({
      ...request,
      image_size: "auto",
      background: "auto",
      quality: "high",
      num_images: 1,
      output_format: "png",
      sync_mode: false,
      enable_safety_checker: true,
    });
    expect(schema.safeParse({ prompt: "cat" }).success).toBe(false);
    expect(schema.safeParse({ ...request, mask_url: null }).success).toBe(true);
    expect(
      schema.safeParse({ ...request, mask_url: "https://example.com/mask.png" })
        .success
    ).toBe(true);
    expect(Object.keys(schema.shape)).not.toContain("mask_image_url");
    expect(
      schema.safeParse({
        ...request,
        image_urls: Array(16).fill("https://example.com/cat.jpg"),
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...request,
        image_urls: Array(17).fill("https://example.com/cat.jpg"),
      }).success
    ).toBe(false);
  });

  it("accepts the low-quality pin and rejects invalid dimensions and quality", () => {
    expect(
      schema.safeParse({
        ...request,
        quality: "low",
        num_images: 1,
        image_size: { width: 1024, height: 640 },
      }).success
    ).toBe(true);
    expect(schema.safeParse({ ...request, quality: "max" }).success).toBe(
      false
    );
    expect(schema.safeParse({ ...request, num_images: 11 }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ ...request, image_size: { width: 512, height: 512 } })
        .success
    ).toBe(false);
  });

  it("keeps input and output token billing dynamic", () => {
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: request }).warnings
        .length
    ).toBeGreaterThan(0);
    expect(FAL_DYNAMIC_BILLED_UNITS[endpoint].unit).toContain("image $8 input");
  });
});
