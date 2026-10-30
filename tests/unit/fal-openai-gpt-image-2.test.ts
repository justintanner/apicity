import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalOpenaiGptImage2Request,
  type FalRunOpenaiGptImage2Namespace,
} from "@apicity/fal";
import {
  FalOpenaiGptImage2RequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_BILLED_UNITS } from "../../packages/provider/cost/src/pricing/fal";
const endpoint = "openai/gpt-image-2";
const pin = {
  prompt: "A blue ceramic cup on a white table.",
  quality: "low",
  num_images: 1,
  image_size: { width: 1024, height: 640 },
};

describe("fal GPT Image 2", () => {
  it("owns a callable scaffold while preserving GPT Image 2.5", () => {
    const provider = createFal({ apiKey: "test-key" });
    expectTypeOf(
      provider.run.openai.gptImage2
    ).toEqualTypeOf<FalRunOpenaiGptImage2Namespace>();
    expectTypeOf<FalOpenaiGptImage2Request>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expect(provider.run.openai.gptImage2).toBe(
      provider.post.run.openai.gptImage2
    );
    expect(provider.run.openai.gptImage2.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof provider.run.openai.gptImage2p5.sunburst.textToImage).toBe(
      "function"
    );
    expect(typeof provider.run.openai.gptImage2p5.flare.edit).toBe("function");
  });

  it("matches defaults and accepts the minimum-area low-quality pin", () => {
    expect(schema.parse({ prompt: "cup" })).toEqual({
      prompt: "cup",
      image_size: "landscape_4_3",
      background: "auto",
      quality: "high",
      num_images: 1,
      output_format: "png",
      sync_mode: false,
      enable_safety_checker: true,
    });
    expect(schema.safeParse(pin).success).toBe(true);
    expect(schema.safeParse({ prompt: "" }).success).toBe(false);
    expect(schema.safeParse({ prompt: "x".repeat(32001) }).success).toBe(false);
    for (const quality of ["auto", "low", "medium", "high"])
      expect(schema.safeParse({ ...pin, quality }).success).toBe(true);
    for (const quality of ["xhigh", "max"])
      expect(schema.safeParse({ ...pin, quality }).success).toBe(false);
    for (const num_images of [0, 11, 1.5])
      expect(schema.safeParse({ ...pin, num_images }).success).toBe(false);
    expect(
      schema.safeParse({
        ...pin,
        output_format: "webp",
        output_compression: 100,
      }).success
    ).toBe(true);
    expect(schema.safeParse({ ...pin, output_compression: 101 }).success).toBe(
      false
    );
  });

  it("enforces concrete dimensions, area and aspect ratio", () => {
    for (const image_size of [
      { width: 1024, height: 640 },
      { width: 3840, height: 2160 },
      { width: 1536, height: 512 },
    ])
      expect(schema.safeParse({ ...pin, image_size }).success).toBe(true);
    for (const image_size of [
      { width: 1023, height: 640 },
      { width: 3856, height: 2160 },
      { width: 512, height: 512 },
      { width: 3840, height: 2176 },
      { width: 2048, height: 512 },
    ])
      expect(schema.safeParse({ ...pin, image_size }).success).toBe(false);
  });

  it("reports dynamic token billing instead of treating the reservation as a price", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: pin,
    });
    expect(estimate.warnings.length).toBeGreaterThan(0);
    expect(FAL_DYNAMIC_BILLED_UNITS[endpoint].unit).toContain("$30 output");
    expect(FAL_DYNAMIC_BILLED_UNITS[endpoint].unit).toContain("$0.0001");
  });
});
