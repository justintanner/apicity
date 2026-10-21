import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBriaFibo2EditRequest,
  type FalBriaFibo2EditParsedRequest,
} from "@apicity/fal";
import {
  FalBriaFibo2EditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const image = "https://example.com/cat.jpg";
describe("Bria Fibo 2 edit contract", () => {
  it("exposes the leaf, aliases, registry and input/output types", () => {
    const provider = createFal({ apiKey: "test-key" });
    expect(provider.run.bria.fibo2.edit).toBe(
      provider.post.run.bria.fibo2.edit
    );
    expect(provider.run.bria.fibo2.edit.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS["bria/fibo-2/edit"]).toBe(schema);
    expectTypeOf<FalBriaFibo2EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBriaFibo2EditParsedRequest>().toEqualTypeOf<
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
      image_urls: [image],
      instruction: "Add a scarf",
      vgl: { edit_instruction: "Add a scarf", extra: "preserved" },
    };
    await provider.run.bria.fibo2.edit(input);
    expect(fetch.mock.calls[0][0]).toBe("https://fal.run/bria/fibo-2/edit");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(input);
  });
  it("requires one to four reference images", () => {
    expect(schema.safeParse({}).success).toBe(false);
    for (const image_urls of [null, [], [image, image, image, image, image]])
      expect(schema.safeParse({ image_urls }).success).toBe(false);
    for (const image_urls of [[image], [image, image, image, image]])
      expect(schema.safeParse({ image_urls }).success).toBe(true);
  });
  it("matches archived defaults, seed bounds and nullable inputs", () => {
    expect(schema.parse({ image_urls: [image] })).toEqual({
      image_urls: [image],
      seed: 5555,
      sync_mode: false,
    });
    expect(
      schema.safeParse({
        image_urls: [image],
        instruction: null,
        vgl: null,
        mask_url: null,
        aspect_ratio: null,
      }).success
    ).toBe(true);
    for (const seed of [-1, 2147483648, 1.5])
      expect(schema.safeParse({ image_urls: [image], seed }).success).toBe(
        false
      );
    for (const seed of [0, 2147483647])
      expect(schema.safeParse({ image_urls: [image], seed }).success).toBe(
        true
      );
    expect(
      schema.safeParse({ image_urls: [image], aspect_ratio: "21:9" }).success
    ).toBe(true);
    expect(
      schema.safeParse({ image_urls: [image], aspect_ratio: "6:7" }).success
    ).toBe(false);
  });
  it("preserves open VGL edit fields while validating nested known fields", () => {
    const vgl = {
      edit_instruction: "Add a scarf",
      custom_field: { value: 1 },
      objects: [{ relationship: "beside vase" }],
      text_render: [{ text: "CAT" }],
    };
    expect(schema.parse({ image_urls: [image], vgl }).vgl).toMatchObject(vgl);
    for (const invalid of [
      { edit_instruction: 42 },
      { objects: [{}] },
      { text_render: [{}] },
      { lighting: { direction: 42 } },
    ])
      expect(
        schema.safeParse({ image_urls: [image], vgl: invalid }).success
      ).toBe(false);
  });
  it("estimates the single output image at the archived card rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint: "bria/fibo-2/edit",
      payload: { image_urls: [image], instruction: "Add a scarf" },
    });
    expect(estimate.usd).toBeCloseTo(0.04, 8);
    expect(estimate.warnings).toEqual([]);
  });
});
