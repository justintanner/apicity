import fs from "node:fs";
import path from "node:path";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBriaFiboEdit1p5ExpandParsedRequest,
  type FalBriaFiboEdit1p5ExpandRequest,
  type FalBriaFiboEdit1p5ExpandRequestInput,
  type FalBriaFiboEdit1p5ExpandResponse,
  type FalRunBriaFiboEdit1p5Namespace,
} from "@apicity/fal";
import {
  FalBriaFiboEdit1p5ExpandRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-15
// (sha256 d9b32415819fc7e1e7b4cee205718e2a16343e07a0b4fd5e4245736ae738b505).
const endpoint = "bria/fibo-edit-1.5/expand";
// The recorded call: our own tests/fixtures/cat2.jpg as a data URL, grown to
// 16:9 with no prompt, so the model only extends the image.
const recorded = {
  image_url: `data:image/jpeg;base64,${fs
    .readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat2.jpg")
    )
    .toString("base64")}`,
  aspect_ratio: "16:9",
} satisfies FalBriaFiboEdit1p5ExpandRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Bria Fibo Edit 1.5 expand contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bria.fiboEdit1p5.expand;
    expect(leaf).toBe(provider.post.run.bria.fiboEdit1p5.expand);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.bria.fiboEdit1p5
    ).toEqualTypeOf<FalRunBriaFiboEdit1p5Namespace>();
    expectTypeOf<FalBriaFiboEdit1p5ExpandRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBriaFiboEdit1p5ExpandRequestInput>().toEqualTypeOf<FalBriaFiboEdit1p5ExpandRequest>();
    expectTypeOf<FalBriaFiboEdit1p5ExpandParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalBriaFiboEdit1p5ExpandResponse>().toEqualTypeOf<{
      image: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      };
      seed: number;
      structured_instruction: Record<string, unknown>;
      model_output?: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      } | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        image: { url: "https://example.com/out.png" },
        seed: 7,
        structured_instruction: {},
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.bria.fiboEdit1p5.expand(recorded);
    expect(result.image.url).toBe("https://example.com/out.png");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/bria/fibo-edit-1.5/expand");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "image_url",
      "canvas_size",
      "aspect_ratio",
      "original_image_size",
      "original_image_location",
      "prompt",
      "seed",
      "negative_prompt",
      "sync_mode",
      "retain_original_quality",
      "preserve_alpha",
      "return_model_output",
    ]);
    expect(schema.shape.image_url.description).toBe(
      "The image to expand (file or URL)."
    );
    expect(schema.shape.canvas_size.description).toBe(
      "The desired size of the final image after the expansion, as [width, height]. Area must be under 25 megapixels. Pairs with 'original_image_location'."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "The desired aspect ratio of the final image. Used over 'original_image_size' and 'original_image_location' if provided: the original is centred and the canvas grows around it."
    );
    expect(schema.shape.original_image_size.description).toBe(
      "The desired size of the original inside the canvas, as [width, height]; it is resized to this before being placed. Ignored if 'aspect_ratio' is provided."
    );
    expect(schema.shape.original_image_location.description).toBe(
      "Top-left corner of the original within the canvas, as [x, y]. May sit outside the canvas, in which case the original is cropped. Ignored if 'aspect_ratio' is provided."
    );
    expect(schema.shape.prompt.description).toBe(
      "What should appear in the expanded area. Omit it and the model is asked only to extend the image, which is usually what you want for a plain canvas change."
    );
    expect(schema.shape.seed.description).toBe(
      "Reuse the seed from a previous response to recreate that result. Omit it for a random one, which is reported in the response either way."
    );
    expect(schema.shape.negative_prompt.description).toBe(
      "Not supported by this model, and refused rather than ignored -- see 'prompt'. Present only so a request written against the SDXL expansion endpoint fails loudly here instead of silently losing the field."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If true, returns the image directly in the response (increases latency)."
    );
    expect(schema.shape.retain_original_quality.description).toBe(
      "Keep the original's own pixels at full resolution. Generation happens near one megapixel, so a larger canvas is scaled up afterwards; leave this on and the region the mask protected is not resampled at all. Turn it off for a uniformly soft result, which can hide the seam on a textured background."
    );
    expect(schema.shape.preserve_alpha.description).toBe(
      "Keep the input's transparency. The model works in RGB, so the alpha channel is not generated -- the original's own is extended outwards by replicating its edges, which is what expanding a cutout means. Turn it off to get a flattened RGB result."
    );
    expect(schema.shape.return_model_output.description).toBe(
      "Also return the model's own frame, before the original was pasted back and the seam blended. Diagnostic only -- it does not change the returned image. Use it to tell a bad generation apart from a bad composite: a boundary already broken in that frame came from the model, not from post-processing."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires image_url as a string", () => {
    const missing = schema.safeParse({ aspect_ratio: "16:9" });
    expect(missing.success).toBe(false);
    if (missing.success) throw new Error("expected failure");
    expect(missing.error.issues.some((i) => i.path.includes("image_url"))).toBe(
      true
    );
    expect(accepts({ image_url: 42 })).toBe(false);
    expect(accepts({ image_url: null })).toBe(false);
  });

  it("fills the documented defaults around the one required field", () => {
    expect(schema.parse({ image_url: "https://example.com/in.png" })).toEqual({
      image_url: "https://example.com/in.png",
      sync_mode: false,
      retain_original_quality: true,
      preserve_alpha: true,
      return_model_output: false,
    });
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
    expect(accepts({ aspect_ratio: null })).toBe(true);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(false);
  });

  it.each(["canvas_size", "original_image_size", "original_image_location"])(
    "takes %s as exactly two integers, or null",
    (field) => {
      expect(accepts({ [field]: [1200, 674] })).toBe(true);
      expect(accepts({ [field]: null })).toBe(true);
      expect(accepts({ [field]: [1200] })).toBe(false);
      expect(accepts({ [field]: [1200, 674, 1] })).toBe(false);
      expect(accepts({ [field]: [1200.5, 674] })).toBe(false);
    }
  );

  it("allows a negative original_image_location, which crops the original", () => {
    expect(accepts({ original_image_location: [301, -66] })).toBe(true);
  });

  it("describes the cross-field rules rather than encoding them", () => {
    // aspect_ratio wins over the original's size and location upstream, and
    // the canvas area limit is enforced there, so the schema refuses neither.
    expect(
      accepts({
        aspect_ratio: "16:9",
        original_image_size: [610, 855],
        original_image_location: [301, -66],
      })
    ).toBe(true);
    expect(
      accepts({
        aspect_ratio: null,
        canvas_size: [6000, 6000],
        original_image_location: [0, 0],
      })
    ).toBe(true);
  });

  it("bounds seed to the documented integer range, or null", () => {
    expect(accepts({ seed: 0 })).toBe(true);
    expect(accepts({ seed: 2147483647 })).toBe(true);
    expect(accepts({ seed: null })).toBe(true);
    expect(accepts({ seed: -1 })).toBe(false);
    expect(accepts({ seed: 2147483648 })).toBe(false);
    expect(accepts({ seed: 1.5 })).toBe(false);
  });

  it("accepts a string or null prompt and negative_prompt", () => {
    expect(accepts({ prompt: "more of the same lawn" })).toBe(true);
    expect(accepts({ prompt: null })).toBe(true);
    expect(accepts({ negative_prompt: "blur" })).toBe(true);
    expect(accepts({ negative_prompt: null })).toBe(true);
    expect(accepts({ prompt: 1 })).toBe(false);
  });

  it("refuses non-boolean flags", () => {
    expect(accepts({ sync_mode: "yes" })).toBe(false);
    expect(accepts({ retain_original_quality: 1 })).toBe(false);
    expect(accepts({ preserve_alpha: "true" })).toBe(false);
    expect(accepts({ return_model_output: null })).toBe(false);
  });

  it("prices the recorded payload from the card", () => {
    // The recorded call billed x-fal-billable-units 1 at $0.04 per image.
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.04, 10);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/bria/fibo-edit-1.5/expand",
      asOf: "2026-10-15",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "briafiboedit"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Bria Fibo Edit 1.5 Expand"
    );
  });
});
