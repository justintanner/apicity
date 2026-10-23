import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalIdeogramVectorTextToVectorParsedRequest,
  type FalIdeogramVectorTextToVectorRequest,
  type FalIdeogramVectorTextToVectorRequestInput,
  type FalIdeogramVectorTextToVectorResponse,
  type FalRunIdeogramVectorNamespace,
} from "@apicity/fal";
import {
  FalIdeogramVectorTextToVectorRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 8141fc19a5f3a5fbe9b59247ab983a5804d268dfbae311963cd6e4ae88cd6dfe).
const endpoint = "ideogram/vector/text-to-vector";
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  quality: "low",
} satisfies FalIdeogramVectorTextToVectorRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const usd = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload }).usd;

describe("Ideogram Vector text-to-vector contract", () => {
  it("adds textToVector to the vector object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.ideogram.vector.textToVector;
    expect(provider.run.ideogram.vector).toHaveProperty("textToVector", leaf);
    expect(leaf).toBe(provider.post.run.ideogram.vector.textToVector);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.ideogram.vector
    ).toEqualTypeOf<FalRunIdeogramVectorNamespace>();
    expectTypeOf<FalIdeogramVectorTextToVectorRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalIdeogramVectorTextToVectorRequestInput>().toEqualTypeOf<FalIdeogramVectorTextToVectorRequest>();
    expectTypeOf<FalIdeogramVectorTextToVectorParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalIdeogramVectorTextToVectorResponse>().toEqualTypeOf<{
      images: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      }>;
      seed?: number | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ images: [{ url: "https://example.com/out.svg" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.ideogram.vector.textToVector(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/ideogram/vector/text-to-vector");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "quality",
      "num_images",
      "aspect_ratio",
      "seed",
      "image_urls",
    ]);
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      quality: "medium",
      num_images: 1,
      aspect_ratio: "auto",
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ style: "flat" })).toBe(false);
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: "   " })).toBe(true);
    expect(accepts({ prompt: "x".repeat(9501) })).toBe(false);
    expect(accepts({ quality: "ultra" })).toBe(false);
    expect(accepts({ num_images: 0 })).toBe(false);
    expect(accepts({ num_images: 8 })).toBe(true);
    expect(accepts({ num_images: 9 })).toBe(false);
    expect(accepts({ aspect_ratio: "10:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "7:5" })).toBe(false);
    expect(accepts({ seed: -1 })).toBe(false);
    expect(accepts({ seed: 2147483647 })).toBe(true);
    expect(accepts({ seed: 2147483648 })).toBe(false);
    expect(accepts({ seed: null, image_urls: null })).toBe(true);
    expect(accepts({ image_urls: ["a", "b", "c", "d", "e"] })).toBe(true);
    expect(accepts({ image_urls: ["a", "b", "c", "d", "e", "f"] })).toBe(false);
  });

  it("prices each SVG from the card by quality, with the high reference surcharge", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.13, 10);
    expect(estimate.breakdown).toMatchObject({ units: 1, unit: "images" });
    expect(estimate.warnings).toEqual([]);
    expect(usd({ prompt: "x" })).toBeCloseTo(0.16, 10);
    expect(usd({ prompt: "x", quality: "high" })).toBeCloseTo(0.2, 10);
    expect(
      usd({ prompt: "x", quality: "high", image_urls: ["https://e/a.png"] })
    ).toBeCloseTo(0.32, 10);
    expect(
      usd({ prompt: "x", quality: "medium", image_urls: ["https://e/a.png"] })
    ).toBeCloseTo(0.16, 10);
    expect(usd({ prompt: "x", quality: "medium", num_images: 2 })).toBeCloseTo(
      0.32,
      10
    );
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/ideogram/vector/text-to-vector",
      asOf: "2026-10-23",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "ideovector"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Ideogram Vector"
    );
  });
});
