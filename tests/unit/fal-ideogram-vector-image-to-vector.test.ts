import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalIdeogramVectorImageToVectorParsedRequest,
  type FalIdeogramVectorImageToVectorRequest,
  type FalIdeogramVectorImageToVectorRequestInput,
  type FalIdeogramVectorImageToVectorResponse,
  type FalRunIdeogramVectorNamespace,
} from "@apicity/fal";
import {
  FalIdeogramVectorImageToVectorRequestSchema as schema,
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
// (sha256 91c773e92a8764a6ddbdec3d4c5e2076aa5bb97459f55d50f66f1dbda3ff18d9).
const endpoint = "ideogram/vector/image-to-vector";
const recorded = {
  image_url:
    "https://v3b.fal.media/files/b/0aaf7eca/YdKOoA8T48QoJMIc7Sflb_apicity-cat1.jpg",
} satisfies FalIdeogramVectorImageToVectorRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("Ideogram Vector image-to-vector contract", () => {
  it("owns the vector object under ideogram, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.ideogram.vector.imageToVector;
    expect(provider.run.ideogram.vector).toHaveProperty("imageToVector", leaf);
    expect(provider.run.ideogram).toHaveProperty("v4p5");
    expect(leaf).toBe(provider.post.run.ideogram.vector.imageToVector);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.ideogram.vector
    ).toEqualTypeOf<FalRunIdeogramVectorNamespace>();
    expectTypeOf<FalIdeogramVectorImageToVectorRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalIdeogramVectorImageToVectorRequestInput>().toEqualTypeOf<FalIdeogramVectorImageToVectorRequest>();
    expectTypeOf<FalIdeogramVectorImageToVectorParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalIdeogramVectorImageToVectorResponse>().toEqualTypeOf<{
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
    const result = await provider.run.ideogram.vector.imageToVector(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.svg");
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/ideogram/vector/image-to-vector");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with the mode default", () => {
    expect(Object.keys(schema.shape)).toEqual(["image_url", "mode"]);
    expect(schema.parse(recorded)).toEqual({ ...recorded, mode: "default" });
    expect(schema.shape.image_url.description).toBe(
      "The image to convert to SVG. JPEG, PNG or WebP, max 50MB."
    );
  });

  it("requires image_url, closes mode and refuses undeclared fields", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ mode: "simple" })).toBe(true);
    expect(accepts({ mode: "detailed" })).toBe(false);
    expect(accepts({ num_images: 2 })).toBe(false);
  });

  it("prices one SVG from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.1, 10);
    expect(estimate.breakdown).toMatchObject({ units: 1, unit: "images" });
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/ideogram/vector/image-to-vector",
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
