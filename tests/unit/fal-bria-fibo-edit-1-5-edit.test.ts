import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBriaFiboEdit1p5EditParsedRequest,
  type FalBriaFiboEdit1p5EditRequest,
  type FalBriaFiboEdit1p5EditRequestInput,
  type FalBriaFiboEdit1p5EditResponse,
  type FalRunBriaFiboEdit1p5Namespace,
} from "@apicity/fal";
import {
  FalBriaFiboEdit1p5EditRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-08
// (sha256 8f2dd05d32cfe817ded5a34248afc7fe915074995a3b25eb547546d09c45319a).
const endpoint = "bria/fibo-edit-1.5/edit";
const recorded = {
  image_urls: [
    "https://v3b.fal.media/files/b/0aa69153/6d2UFjgrQCRM6BoWpXpZ3_126_1.jpg",
    "https://v3b.fal.media/files/b/0aa69153/Gy-fjFofCbQP9w3lsfc2e_126_2.jpg",
  ],
  instruction:
    "Uncross her arms and place the serum bottle in her right hand raised beside her face, label toward the camera.",
} satisfies FalBriaFiboEdit1p5EditRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Bria Fibo Edit 1.5 edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bria.fiboEdit1p5.edit;
    expect(leaf).toBe(provider.post.run.bria.fiboEdit1p5.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.bria.fiboEdit1p5
    ).toEqualTypeOf<FalRunBriaFiboEdit1p5Namespace>();
    expectTypeOf<FalBriaFiboEdit1p5EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBriaFiboEdit1p5EditRequestInput>().toEqualTypeOf<FalBriaFiboEdit1p5EditRequest>();
    expectTypeOf<FalBriaFiboEdit1p5EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalBriaFiboEdit1p5EditResponse>().toEqualTypeOf<{
      image: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      };
      images?: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }>;
      structured_instruction: Record<string, unknown>;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ image: { url: "https://example.com/out.bin" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.bria.fiboEdit1p5.edit(recorded);
    expect(result.image.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/bria/fibo-edit-1.5/edit");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "image_urls",
      "instruction",
      "aspect_ratio",
      "seed",
      "mask_url",
      "sync_mode",
      "structured_instruction",
    ]);
    expect(schema.shape.image_urls.description).toBe(
      "1-4 reference images (files or URLs). Order is significant: the instruction is resolved against the images in the order they are sent."
    );
    expect(schema.shape.instruction.description).toBe(
      "Instruction for image editing."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "Output aspect ratio. Left unset, the output keeps the ratio of the first reference image. A chosen ratio applies only with two or more reference images; with a single reference the output keeps that image's ratio either way."
    );
    expect(schema.shape.seed.description).toBe(
      "Random seed for reproducibility."
    );
    expect(schema.shape.mask_url.description).toBe(
      "Mask (file or URL) marking the region to regenerate: white where the model should edit, black elsewhere. Single-reference requests only, and it must be the same size as that image. A masked edit comes back at the reference's own resolution."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If true, returns the image directly in the response (increases latency)."
    );
    expect(schema.shape.structured_instruction.description).toBe(
      "A pre-built structured prompt, used verbatim instead of having VGL build one when no instruction is sent. Accepts what a previous edit returned."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("accepts an empty body and fills documented defaults", () => {
    expect(schema.parse({})).toEqual({ sync_mode: false, seed: 5555 });
  });

  it("accepts a null image_urls", () => {
    expect(accepts({ image_urls: null })).toBe(true);
  });

  it("accepts a null instruction", () => {
    expect(accepts({ instruction: null })).toBe(true);
  });

  it("accepts the documented aspect_ratio values", () => {
    expect(accepts({ aspect_ratio: "1:1" })).toBe(true);
    expect(accepts({ aspect_ratio: "2:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:2" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:5" })).toBe(true);
    expect(accepts({ aspect_ratio: "5:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
  });

  it("accepts a null aspect_ratio", () => {
    expect(accepts({ aspect_ratio: null })).toBe(true);
  });

  it("accepts a null mask_url", () => {
    expect(accepts({ mask_url: null })).toBe(true);
  });

  it("accepts a null structured_instruction", () => {
    expect(accepts({ structured_instruction: null })).toBe(true);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.04, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/bria/fibo-edit-1.5/edit",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "briafiboedit"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Bria Fibo Edit 1.5 Edit"
    );
  });
});
