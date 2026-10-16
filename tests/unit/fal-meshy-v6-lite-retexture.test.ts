import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMeshyV6LiteRetextureRequest,
  type FalMeshyV6LiteRetextureRequestInput,
  type FalMeshyV6LiteRetextureParsedRequest,
  type FalMeshyV6LiteRetextureResponse,
  type FalRunMeshyV6LiteNamespace,
} from "@apicity/fal";
import {
  FalMeshyV6LiteRetextureRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "meshy/v6-lite/retexture";
const payload = {
  model_url: "https://example.com/model.glb",
  text_style_prompt: "watercolor painting",
} satisfies FalMeshyV6LiteRetextureRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Meshy 6 Lite retexture", () => {
  it("exports the owned v6Lite namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.meshy.v6Lite)).toEqual(["retexture"]);
    expect(p.run.meshy.v6Lite.retexture).toBe(
      p.post.run.meshy.v6Lite.retexture
    );
    expect(p.run.meshy.v6Lite.retexture.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.meshy.v6Lite
    ).toEqualTypeOf<FalRunMeshyV6LiteNamespace>();
    expectTypeOf(p.run.meshy.v6Lite.retexture)
      .parameter(0)
      .toEqualTypeOf<FalMeshyV6LiteRetextureRequest>();
    expectTypeOf(
      p.run.meshy.v6Lite.retexture
    ).returns.resolves.toEqualTypeOf<FalMeshyV6LiteRetextureResponse>();
    expectTypeOf<FalMeshyV6LiteRetextureRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMeshyV6LiteRetextureParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the existing meshy 7 and 7.1 leaves in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(typeof p.run.meshy.v7.imageTo3d).toBe("function");
    expect(typeof p.run.meshy.v7p1.textTo3d).toBe("function");
  });
  it("posts the exact body and returns the documented response", async () => {
    const file = (name: string) => ({
      url: `https://example.com/${name}`,
      content_type: "model/gltf-binary",
      file_name: name,
      file_size: 1,
    });
    const response: FalMeshyV6LiteRetextureResponse = {
      model_glb: file("model.glb"),
      thumbnail: null,
      model_urls: { glb: file("model.glb"), fbx: null },
      texture_urls: [{ base_color: file("texture_0.png") }],
      text_style_prompt: "watercolor painting",
      image_style_url: null,
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(await p.run.meshy.v6Lite.retexture(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/meshy/v6-lite/retexture");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output requires model_glb and model_urls only.
    expectTypeOf<{
      model_glb: { url: string };
      model_urls: { glb: null };
    }>().toExtend<FalMeshyV6LiteRetextureResponse>();
    expectTypeOf<{
      model_glb: { url: string };
    }>().not.toExtend<FalMeshyV6LiteRetextureResponse>();
  });
  it("requires model_url and applies all documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    for (const model_url of [undefined, null, 7])
      expect(valid({ model_url })).toBe(false);
    expect(schema.parse(payload)).toEqual({
      ...payload,
      texture_resolution: "2k",
      enable_original_uv: true,
      enable_pbr: false,
      enable_safety_checker: true,
    });
    for (const key of [
      "texture_resolution",
      "enable_original_uv",
      "enable_pbr",
      "enable_safety_checker",
    ])
      expect(valid({ [key]: null })).toBe(false);
  });
  it("requires a text style or an image style", () => {
    const styleless = schema.safeParse({ model_url: payload.model_url });
    expect(styleless.success).toBe(false);
    if (styleless.success) throw new Error("expected failure");
    expect(styleless.error.issues).toEqual([
      expect.objectContaining({
        path: ["text_style_prompt"],
        message: "Either text_style_prompt or image_style_url is required",
      }),
    ]);
    expect(
      schema.safeParse({
        model_url: payload.model_url,
        text_style_prompt: null,
        image_style_url: null,
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        model_url: payload.model_url,
        image_style_url: "https://example.com/style.png",
      }).success
    ).toBe(true);
    expect(valid({ image_style_url: "https://example.com/style.png" })).toBe(
      true
    );
  });
  it("bounds the text style prompt to 600 characters", () => {
    expect(valid({ text_style_prompt: "a".repeat(600) })).toBe(true);
    expect(valid({ text_style_prompt: "a".repeat(601) })).toBe(false);
    expect(valid({ text_style_prompt: 7 })).toBe(false);
    expect(valid({ image_style_url: 7 })).toBe(false);
  });
  it("takes the 2k, 4k and 8k texture resolutions", () => {
    for (const texture_resolution of ["2k", "4k", "8k"])
      expect(valid({ texture_resolution })).toBe(true);
    for (const texture_resolution of ["16k", "1k", "2K", 2048])
      expect(valid({ texture_resolution })).toBe(false);
  });
  it("takes booleans for the three switches", () => {
    for (const key of [
      "enable_original_uv",
      "enable_pbr",
      "enable_safety_checker",
    ]) {
      expect(valid({ [key]: true })).toBe(true);
      expect(valid({ [key]: false })).toBe(true);
      expect(valid({ [key]: "true" })).toBe(false);
    }
  });
  it("leaves the input open, as upstream does not close it", () => {
    expect(valid({ seed: 7 })).toBe(true);
  });
});

describe("Meshy 6 Lite retexture pricing", () => {
  // The card prices $0.30 per retextured model, PBR maps included. The
  // recorded call billed 1 generation; the usage API read $0.30.
  it("is statically priced at $0.30 per retextured model", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect(MODEL_SLUGS.fal[endpoint]).toBe("meshyv6l");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Meshy 6 Lite Retexture");
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(
      0.3
    );
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, enable_pbr: true },
      }).usd
    ).toBe(0.3);
  });
});
