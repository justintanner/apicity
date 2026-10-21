import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBriaFibo2GenerateRequest,
  type FalBriaFibo2GenerateParsedRequest,
} from "@apicity/fal";
import {
  FalBriaFibo2GenerateRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

describe("Bria Fibo 2 generate contract", () => {
  it("exposes the leaf, aliases, registry and input/output types", () => {
    const provider = createFal({ apiKey: "test-key" });
    expect(provider.run.bria.fibo2.generate).toBe(
      provider.post.run.bria.fibo2.generate
    );
    expect(provider.run.bria.fibo2.generate.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS["bria/fibo-2/generate"]).toBe(schema);
    expectTypeOf<FalBriaFibo2GenerateRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBriaFibo2GenerateParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("preserves the request on the sync route", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          image: { url: "https://example.com/cat.png" },
          vgl: {},
        })
      )
    );
    const provider = createFal({ apiKey: "test-key", fetch });
    const input = {
      prompt: "A cat",
      vgl: { short_description: "A cat", text_render: [{ text: "CAT" }] },
    };
    await provider.run.bria.fibo2.generate(input);
    expect(fetch.mock.calls[0][0]).toBe("https://fal.run/bria/fibo-2/generate");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(input);
  });
  it("matches archived defaults, seed bounds and nullable inputs", () => {
    expect(schema.parse({})).toEqual({
      aspect_ratio: "1:1",
      seed: 5555,
      sync_mode: false,
    });
    expect(
      schema.safeParse({
        prompt: null,
        vgl: null,
        style: null,
        image_url: null,
      }).success
    ).toBe(true);
    for (const seed of [-1, 2147483648, 1.5])
      expect(schema.safeParse({ seed }).success).toBe(false);
    for (const seed of [0, 2147483647])
      expect(schema.safeParse({ seed }).success).toBe(true);
    expect(
      schema.safeParse({ aspect_ratio: "21:9", style: "Kodak Film" }).success
    ).toBe(true);
    expect(schema.safeParse({ aspect_ratio: "6:7" }).success).toBe(false);
    expect(schema.safeParse({ style: "unknown" }).success).toBe(false);
  });
  it("validates nested VGL fields and required object/text members", () => {
    expect(
      schema.safeParse({
        vgl: {
          objects: [{ relationship: "beside vase" }],
          text_render: [{ text: "CAT" }],
        },
      }).success
    ).toBe(true);
    for (const vgl of [
      { objects: [{}] },
      { text_render: [{}] },
      { lighting: { direction: 42 } },
      { objects: [{ relationship: "alone", number_of_objects: 1.5 }] },
    ])
      expect(schema.safeParse({ vgl }).success).toBe(false);
  });
  it("estimates the single output image at the archived card rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint: "bria/fibo-2/generate",
      payload: { prompt: "A cat" },
    });
    expect(estimate.usd).toBeCloseTo(0.04, 8);
    expect(estimate.warnings).toEqual([]);
  });
});
